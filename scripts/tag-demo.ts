// AI-tag the demo products from their LOCAL photos (samples/demo/images/<id>/),
// never from brand URLs: zero requests to brand servers, works for Simons
// (its CDN 403s non-browsers), same pixels every run (docs/attribute-sources.md).
//
//   set -a; . ./.env.demo.local; set +a; npx tsx --env-file=.env.local scripts/tag-demo.ts [--id <id>] [--limit N]
//
// Writes, per product: vision tags to the demo DB, except material/lined where
// the text states them (final per ADR-0014); and one row in
// samples/demo/tag-results.json with text facts, vision tags and disagreements,
// which feeds the agreement column of docs/attribute-sources.md.
// Refuses any database other than the demo project.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "../lib/products/demo-csv";
import { parseFeedFacts } from "../lib/vision/feed-facts";
import { parseColorName } from "../lib/vision/color-facts";
import { findDisagreements, parseTextFacts } from "../lib/vision/text-facts";
import { tagProductWithRetry } from "../lib/vision/tag-product";
import { estimateCost } from "../lib/vision/cost";

const DEMO_DB_USER = "postgres.cliojljksykfzbdynsra";
const MODEL = "claude-opus-4-7"; // validated default (ADR-0012); 5.5 move is on the board
const MAX_IMAGES = 4;
const RESULTS = "samples/demo/tag-results.json";
const PICKS = "samples/demo/photo-picks.json";

type Result = {
  id: string;
  title: string;
  images: number;
  photos: string[];
  model: string;
  taggedAt: string;
  costUsd: number;
  text: Record<string, unknown>;
  vision: Record<string, unknown>;
  disagreements: { attribute: string; text: unknown; vision: unknown }[];
};

async function main() {
  const argv = process.argv.slice(2);
  const onlyId = argv.includes("--id") ? argv[argv.indexOf("--id") + 1] : undefined;
  const limit = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;

  const user = new URL(process.env.DATABASE_URL ?? "postgresql://x").username;
  if (user !== DEMO_DB_USER) throw new Error(`Refusing: DATABASE_URL is not the demo database (user "${user}")`);
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  const { default: prisma } = await import("../lib/prisma");

  const csv = new Map(parseCsv(readFileSync("samples/demo/products.csv", "utf8")).map((r) => [r.id, r]));
  const results: Result[] = existsSync(RESULTS) ? JSON.parse(readFileSync(RESULTS, "utf8")) : [];
  // Hand-picked [front, back-or-substitute] per product; falls back to the first
  // MAX_IMAGES photos when a product has no pick (docs/attribute-sources.md).
  const picks: Record<string, string[]> = existsSync(PICKS) ? JSON.parse(readFileSync(PICKS, "utf8")) : {};

  const products = await prisma.product.findMany({
    where: onlyId ? { id: onlyId } : { tagStatus: { in: ["pending", "failed"] } },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
  const todo = products.slice(0, limit);
  console.log(`Tagging ${todo.length} product(s) with ${MODEL} from local photos`);

  let total = 0;
  for (const p of todo) {
    const row = csv.get(p.id);
    const dir = join("samples/demo/images", p.id);
    if (!row || !existsSync(dir)) {
      console.log(`• ${p.id}: no CSV row or no local images, skipped`);
      continue;
    }
    const files = picks[p.id] ?? readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort().slice(0, MAX_IMAGES);
    const outcome = await tagProductWithRetry(
      files.map((f) => readFileSync(join(dir, f))),
      { vendor: "anthropic", model: MODEL },
    );

    if (outcome.status !== "tagged") {
      const next = outcome.retryable ? "failed" : "needs_review";
      console.log(`• ${p.id}: FAILED (${outcome.error}) → ${next}`);
      await prisma.product.update({ where: { id: p.id }, data: { tagStatus: next } });
      continue;
    }

    const feed = parseFeedFacts(row.material_raw);
    const titleFacts = parseTextFacts(row.title);
    const textColor = parseColorName(row.color_raw);
    const v = outcome.attributes as Record<string, string | null>;

    const disagreements: Result["disagreements"] = findDisagreements(titleFacts, v).map((d) => ({
      attribute: d.attribute, text: d.stated, vision: d.vision,
    }));
    for (const [attribute, text] of [["primaryColor", textColor], ["material", feed.material], ["lined", feed.lined]] as const) {
      if (text && v[attribute] && v[attribute] !== text) disagreements.push({ attribute, text, vision: v[attribute] });
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        ...outcome.attributes,
        material: feed.material ?? outcome.attributes.material,
        lined: feed.lined ?? outcome.attributes.lined,
        tagStatus: "tagged",
        taggedAt: new Date(),
      },
    });

    const cost = estimateCost(outcome.usage);
    total += cost;
    const entry: Result = {
      id: p.id, title: row.title, images: files.length, photos: files, model: MODEL, taggedAt: new Date().toISOString(),
      costUsd: Number(cost.toFixed(4)),
      text: { ...titleFacts, primaryColor: textColor, material: feed.material, lined: feed.lined },
      vision: outcome.attributes, disagreements,
    };
    const i = results.findIndex((r) => r.id === p.id);
    if (i >= 0) results[i] = entry; else results.push(entry);
    writeFileSync(RESULTS, JSON.stringify(results, null, 2) + "\n");

    console.log(`• ${p.id}: tagged (${files.length} photos, $${cost.toFixed(3)})` +
      (disagreements.length ? ` disagreements: ${disagreements.map((d) => d.attribute).join(", ")}` : ""));
  }
  console.log(`Done. Cost ≈ $${total.toFixed(2)}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
