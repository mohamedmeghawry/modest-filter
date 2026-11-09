// AI-tag demo products through the Message Batches API: same request as the
// direct tagger (buildTaggingParams), half the price, results within ~1 hour.
//
//   set -a; . ./.env.demo.local; set +a
//   npx tsx --env-file=.env.local scripts/tag-batch.ts submit [--csv <path>] [--effort low] [--all]
//   npx tsx --env-file=.env.local scripts/tag-batch.ts collect
//
// submit: every product in the CSV that is pending/failed in the demo DB and
//   passes the free text gate is sent once; photos are batch 1's hand picks
//   (photo-picks.json) or batch 2's front.jpg/back.jpg. Saves the batch id.
// collect: if the batch has ended, applies the tagging rules
//   (lib/vision/tagging-rules.ts), writes the DB and a results file, and logs
//   text-vs-vision disagreements. Refusals and bad output go to needs_review.
// Refuses any database other than the demo project.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { parseCsv } from "../lib/products/demo-csv";
import { rowFeedFacts } from "../lib/products/batch2";
import { parseColorName } from "../lib/vision/color-facts";
import { findDisagreements, parseTextFacts, type TextFacts } from "../lib/vision/text-facts";
import { textGate } from "../lib/vision/text-gate";
import { buildTaggingParams, parseTaggingResponse, type Effort } from "../lib/vision/extract";
import { applyTaggingRules } from "../lib/vision/tagging-rules";
import { estimateCost } from "../lib/vision/cost";
import { prepareImage } from "./prepare-image";

const DEMO_DB_USER = "postgres.cliojljksykfzbdynsra";
const MODEL = "claude-opus-5-5";
const STATE = "samples/demo/batch-state.json";
const PICKS = "samples/demo/photo-picks.json";
const IMAGES = "samples/demo/images";

type State = {
  batchId: string; csv: string; model: string; effort: Effort; submittedAt: string;
  products: Record<string, { photos: string[]; back: boolean }>;
};

const arg = (name: string, fallback: string) => {
  const argv = process.argv;
  return argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback;
};

function photosFor(id: string, picks: Record<string, { photos: string[]; back: boolean }>) {
  if (picks[id]) return picks[id];
  const dir = join(IMAGES, id);
  if (!existsSync(join(dir, "front.jpg"))) return null;
  const back = existsSync(join(dir, "back.jpg"));
  return { photos: ["front.jpg", ...(back ? ["back.jpg"] : [])], back };
}

/** Batch 2 stores parsed title+description facts; batch 1 parses the title. */
function textFactsFor(row: Record<string, string>): TextFacts {
  if (!row.text_facts) return parseTextFacts(row.title);
  const { material: _m, lined: _l, ...facts } = JSON.parse(row.text_facts);
  void _m; void _l;
  return facts as TextFacts;
}

async function submit(prisma: (typeof import("../lib/prisma"))["default"], client: Anthropic) {
  if (existsSync(STATE)) throw new Error(`${STATE} exists: collect that batch first`);
  const csv = arg("--csv", "samples/demo/products-batch2.csv");
  const effort = arg("--effort", "low") as Effort; // lab test 2026-11-09: medium adds cost, no accuracy
  const rows = parseCsv(readFileSync(csv, "utf8"));
  const picks = existsSync(PICKS) ? JSON.parse(readFileSync(PICKS, "utf8")) : {};
  // --all re-tags products that are already tagged (e.g. batch 1 after the
  // model move); they keep their old tags, and stay visible, until collect.
  const all = process.argv.includes("--all");
  const todo = await prisma.product.findMany({
    where: { id: { in: rows.map((r) => r.id) }, ...(all ? {} : { tagStatus: { in: ["pending", "failed"] } }) },
    select: { id: true },
  });
  const pending = new Set(todo.map((p) => p.id));

  const requests: Anthropic.Messages.Batches.BatchCreateParams.Request[] = [];
  const products: State["products"] = {};
  for (const row of rows) {
    if (!pending.has(row.id)) continue;
    const reasons = "gate_reasons" in row ? row.gate_reasons.split("|").filter(Boolean) : textGate(row.title).reasons;
    if (reasons.length) { console.log(`• ${row.id}: rejected by text (${reasons.join(", ")}), $0`); continue; }
    const pick = photosFor(row.id, picks);
    if (!pick) { console.log(`• ${row.id}: no photos, skipped`); continue; }
    const buffers = await Promise.all(pick.photos.map((f) => prepareImage(join(IMAGES, row.id, f))));
    if (buffers.some((b) => b == null)) { console.log(`• ${row.id}: unreadable photo, skipped`); continue; }
    requests.push({ custom_id: row.id, params: buildTaggingParams(buffers as Buffer[], { vendor: "anthropic", model: MODEL, effort }) });
    products[row.id] = pick;
  }
  if (requests.length === 0) { console.log("Nothing to submit."); return; }

  const batch = await client.messages.batches.create({ requests });
  const state: State = { batchId: batch.id, csv, model: MODEL, effort, submittedAt: new Date().toISOString(), products };
  writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
  console.log(`Submitted ${requests.length} products as batch ${batch.id} (${MODEL}, effort ${effort}). Run "collect" in ~1 hour.`);
}

async function collect(prisma: (typeof import("../lib/prisma"))["default"], client: Anthropic) {
  if (!existsSync(STATE)) throw new Error(`No ${STATE}: nothing submitted`);
  const state: State = JSON.parse(readFileSync(STATE, "utf8"));
  const batch = await client.messages.batches.retrieve(state.batchId);
  if (batch.processing_status !== "ended") {
    const c = batch.request_counts;
    console.log(`Batch ${batch.id}: ${batch.processing_status} (processing ${c.processing}, done ${c.succeeded + c.errored + c.canceled + c.expired}). Try again later.`);
    return;
  }

  const rows = new Map(parseCsv(readFileSync(state.csv, "utf8")).map((r) => [r.id, r]));
  const out = `samples/demo/tag-results-${basename(state.csv, ".csv")}.json`;
  const results: Record<string, unknown>[] = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : [];
  let total = 0;
  const counts = { tagged: 0, needs_review: 0, failed: 0 };

  for await (const r of await client.messages.batches.results(state.batchId)) {
    const id = r.custom_id;
    const row = rows.get(id);
    const pick = state.products[id];
    if (!row || !pick) { console.log(`• ${id}: not in this batch's CSV, ignored`); continue; }

    if (r.result.type !== "succeeded") {
      // errored/expired/canceled: retry on the next submit, unless the request itself was invalid.
      const invalid = r.result.type === "errored" && r.result.error.error.type === "invalid_request_error";
      const status = invalid ? "needs_review" : "failed";
      await prisma.product.update({ where: { id }, data: { tagStatus: status } });
      counts[status]++;
      console.log(`• ${id}: ${r.result.type} → ${status}`);
      continue;
    }

    const message = r.result.message;
    const usage = {
      inputTokens: message.usage.input_tokens,
      cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: message.usage.cache_read_input_tokens ?? 0,
      outputTokens: message.usage.output_tokens,
    };
    const cost = estimateCost(usage, state.model, { batch: true });
    total += cost;

    let vision;
    try {
      vision = parseTaggingResponse(message);
    } catch (e) {
      await prisma.product.update({ where: { id }, data: { tagStatus: "needs_review" } });
      counts.needs_review++;
      console.log(`• ${id}: ${(e as Error).message} → needs_review`);
      continue;
    }

    const feed = rowFeedFacts(row);
    const finalTags = applyTaggingRules(vision, { material: feed.material, lined: feed.lined }, { hasBackPhoto: pick.back });
    await prisma.product.update({ where: { id }, data: { ...finalTags, tagStatus: "tagged", taggedAt: new Date() } });
    counts.tagged++;

    const textFacts = textFactsFor(row);
    const textColor = parseColorName(row.color_raw);
    const disagreements: { attribute: string; text: unknown; vision: unknown }[] = findDisagreements(textFacts, vision as Record<string, string | null>).map((d) => ({ attribute: d.attribute, text: d.stated, vision: d.vision }));
    for (const [attribute, text] of [["primaryColor", textColor], ["material", feed.material], ["lined", feed.lined]] as const) {
      const v = (vision as Record<string, string | null>)[attribute];
      if (text && v && v !== text) disagreements.push({ attribute, text, vision: v });
    }
    const entry = {
      id, title: row.title, photos: pick.photos, backPhoto: pick.back, model: state.model, effort: state.effort,
      batchId: state.batchId, taggedAt: new Date().toISOString(), costUsd: Number(cost.toFixed(5)),
      text: { ...textFacts, primaryColor: textColor, material: feed.material, lined: feed.lined },
      vision, final: finalTags, disagreements,
    };
    const i = results.findIndex((x) => x.id === id);
    if (i >= 0) results[i] = entry; else results.push(entry);
  }

  writeFileSync(out, JSON.stringify(results, null, 2) + "\n");
  renameSync(STATE, STATE.replace(".json", `-${state.batchId}.done.json`));
  console.log(`Collected batch ${state.batchId}: tagged ${counts.tagged}, needs_review ${counts.needs_review}, failed ${counts.failed}. Cost ≈ $${total.toFixed(3)} (batch price). Results: ${out}`);
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "submit" && mode !== "collect") throw new Error("Usage: tag-batch.ts submit|collect");
  const user = new URL(process.env.DATABASE_URL ?? "postgresql://x").username;
  if (user !== DEMO_DB_USER) throw new Error(`Refusing: DATABASE_URL is not the demo database (user "${user}")`);
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  const { default: prisma } = await import("../lib/prisma");
  const client = new Anthropic();
  try {
    if (mode === "submit") await submit(prisma, client);
    else await collect(prisma, client);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
