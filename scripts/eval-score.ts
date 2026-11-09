import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { tagProductWithRetry } from "../lib/vision/tag-product";
import { scoreProduct, aggregate, ATTRIBUTE_KEYS, type ProductScore } from "../lib/vision/score";
import { estimateCost, type Usage } from "../lib/vision/cost";
import type { Effort } from "../lib/vision/extract";
import { passesModestBaseline } from "../lib/products/modest-baseline";
import { prepareImage } from "./prepare-image";

const DEFAULT_MODEL = "claude-opus-4-7";

type ManifestEntry = {
  id: string;
  category?: string;
  description?: string;
  images: string[];
  groundTruth: Record<string, string | null>;
};

type Args = {
  model: string;
  manifest: string;
  limit?: number;
  id?: string;
  detail: boolean;
  withDescription: boolean;
  requireDescription: boolean;
  effort?: Effort;
  /** Per-product results JSON (attributes + modest-baseline pass/fail), for comparing with Jev. */
  out?: string;
  /** Stop before the next product once the spend reaches this many USD. */
  budget: number;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    model: DEFAULT_MODEL,
    manifest: "samples/eval-set/manifest.json",
    detail: false,
    withDescription: false,
    requireDescription: false,
    budget: 2,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--model") args.model = argv[++i];
    else if (a === "--manifest") args.manifest = argv[++i];
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a === "--id") args.id = argv[++i];
    else if (a === "--detail") args.detail = true;
    else if (a === "--with-description") args.withDescription = true;
    else if (a === "--require-description") args.requireDescription = true;
    else if (a === "--effort") args.effort = argv[++i] as Effort;
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--budget") args.budget = Number(argv[++i]);
    else { console.error(`Unknown argument: ${a}`); process.exit(1); }
  }
  return args;
}

// A ground-truth row is ready only if no field is still a "TODO: ..." placeholder.
function isComplete(gt: Record<string, string | null>): boolean {
  return ATTRIBUTE_KEYS.every((k) => {
    const v = gt[k];
    return v === null || (typeof v === "string" && !v.startsWith("TODO"));
  });
}

type Row = {
  id: string; category: string; photos: number; truthPass: boolean; modelPass: boolean;
  attributes: Record<string, string | null>; usage: Usage; costUsd: number;
};

/** Modest baseline (ADR-0015) on a set of tags, as if the product were tagged. */
function baseline(o: Record<string, string | null>, category = ""): boolean {
  return passesModestBaseline({
    tagStatus: "tagged", categorySlug: category,
    sleeveLength: o.sleeveLength, backStyle: o.backStyle, cutouts: o.cutouts, slit: o.slit, neckline: o.neckline,
  });
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = resolve(args.manifest);
  if (!existsSync(manifestPath)) { console.error(`Manifest not found: ${manifestPath}`); process.exit(1); }
  const manifestDir = dirname(manifestPath);
  let entries = JSON.parse(readFileSync(manifestPath, "utf8")) as ManifestEntry[];
  if (args.id) entries = entries.filter((e) => e.id === args.id);
  if (args.limit) entries = entries.slice(0, args.limit);

  console.log(`=== Eval scorer: ${args.model}${args.effort ? ` effort=${args.effort}` : ""}${args.withDescription ? " +description" : ""} ===`);

  const scores: ProductScore[] = [];
  const rows: Row[] = [];
  const skipped: string[] = [];
  const errored: string[] = [];
  const totals: Usage = { inputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 };

  for (const e of entries) {
    if (!isComplete(e.groundTruth)) { skipped.push(`${e.id} (incomplete tags)`); continue; }
    if (args.requireDescription && !e.description?.trim()) { skipped.push(`${e.id} (no description)`); continue; }
    // Same conversion as scripts/jev-eval.ts, so both models see the same
    // pixels (and HEIF files work). A file that isn't a decodable image is
    // dropped; the product is skipped only when no photo is left.
    const buffers: Buffer[] = [];
    const dropped: string[] = [];
    for (const img of e.images) {
      const p = resolve(manifestDir, img.replace(/^\.\//, "").trim());
      const buf = existsSync(p) ? await prepareImage(p) : null;
      if (buf) buffers.push(buf); else dropped.push(img);
    }
    if (buffers.length === 0) { skipped.push(`${e.id}: no usable image (${dropped.join(", ")})`); continue; }
    const spent = estimateCost(totals, args.model);
    if (spent >= args.budget) { console.log(`Budget reached ($${spent.toFixed(3)} of $${args.budget}), stopping`); break; }

    process.stdout.write(`. ${e.id}${dropped.length ? ` (dropped ${dropped.join(", ")})` : ""} ... `);
    const outcome = await tagProductWithRetry(
      buffers,
      { vendor: "anthropic", model: args.model, effort: args.effort },
      { description: args.withDescription ? e.description : undefined },
    );
    if (outcome.status === "failed") { console.log(`ERROR: ${outcome.error}`); errored.push(e.id); continue; }

    const comparisons = scoreProduct(outcome.attributes as Record<string, string | null>, e.groundTruth);
    const hits = comparisons.filter((c) => c.match).length;
    console.log(`${hits}/14`);
    scores.push({ id: e.id, comparisons });
    const attributes = outcome.attributes as Record<string, string | null>;
    rows.push({
      id: e.id, category: e.category ?? "", photos: buffers.length,
      truthPass: baseline(e.groundTruth, e.category), modelPass: baseline(attributes, e.category),
      attributes, usage: outcome.usage, costUsd: Number(estimateCost(outcome.usage, args.model).toFixed(5)),
    });
    totals.inputTokens += outcome.usage.inputTokens;
    totals.cacheCreationInputTokens += outcome.usage.cacheCreationInputTokens;
    totals.cacheReadInputTokens += outcome.usage.cacheReadInputTokens;
    totals.outputTokens += outcome.usage.outputTokens;
  }

  const agg = aggregate(scores);

  console.log(`\nScored ${scores.length} products.`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} (fix these):`);
    skipped.forEach((s) => console.log(`  - ${s}`));
  }
  if (errored.length) console.log(`Errored ${errored.length}: ${errored.join(", ")}`);

  console.log("\nPer-attribute accuracy (worst first):");
  [...ATTRIBUTE_KEYS]
    .sort((a, b) => agg.perAttribute[a].pct - agg.perAttribute[b].pct)
    .forEach((k) => {
      const b = agg.perAttribute[k];
      console.log(`  ${pad(k, 15)} ${pad(`${b.correct}/${b.total}`, 7)} ${b.pct.toFixed(0)}%`);
    });

  console.log(`\nOverall exact-match: ${agg.overall.correct}/${agg.overall.total}  ${agg.overall.pct.toFixed(1)}%`);

  if (agg.disagreements.length) {
    console.log(`\nDisagreements (${agg.disagreements.length}):`);
    console.log(`  ${pad("product", 38)} ${pad("attr", 15)} predicted -> truth`);
    for (const d of agg.disagreements) {
      console.log(`  ${pad(d.id, 38)} ${pad(d.key, 15)} ${String(d.predicted)} -> ${String(d.truth)}`);
    }
  }

  if (args.detail) {
    const catOf = (id: string) => entries.find((e) => e.id === id)?.category ?? "";
    console.log(`\n=== Per-product detail (yours vs model) ===`);
    for (const s of scores) {
      const hits = s.comparisons.filter((c) => c.match).length;
      console.log(`\n--- ${s.id} [${catOf(s.id)}] (${hits}/14) ---`);
      console.log(`  ${pad("attr", 15)} ${pad("yours", 16)} model`);
      for (const c of s.comparisons) {
        const mark = c.match ? "" : "   <- diff";
        console.log(`  ${pad(c.key, 15)} ${pad(String(c.truth), 16)} ${String(c.predicted)}${mark}`);
      }
    }
  }

  const ids = (f: (r: Row) => boolean) => rows.filter(f).map((r) => r.id);
  console.log(`\nModest baseline vs ground truth: both pass ${ids((r) => r.truthPass && r.modelPass).length}, both fail ${ids((r) => !r.truthPass && !r.modelPass).length}`);
  console.log(`  FALSE PASS (immodest shown): ${ids((r) => !r.truthPass && r.modelPass).join(", ") || "none"}`);
  console.log(`  false reject (good one hidden): ${ids((r) => r.truthPass && !r.modelPass).join(", ") || "none"}`);

  const cost = estimateCost(totals, args.model);
  console.log(`\nCost: $${cost.toFixed(4)}  (input=${totals.inputTokens} cache_read=${totals.cacheReadInputTokens} output=${totals.outputTokens})`);
  if (args.out) {
    const out = { model: args.model, effort: args.effort ?? null, ranAt: new Date().toISOString(), costUsd: Number(cost.toFixed(4)), skipped, errored, rows };
    writeFileSync(args.out, JSON.stringify(out, null, 2) + "\n");
    console.log(`Wrote ${args.out}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
