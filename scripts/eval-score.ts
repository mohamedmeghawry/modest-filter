import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { tagProductWithRetry } from "../lib/vision/tag-product";
import { scoreProduct, aggregate, ATTRIBUTE_KEYS, type ProductScore } from "../lib/vision/score";
import { estimateCost, type Usage } from "../lib/vision/cost";

const DEFAULT_MODEL = "claude-opus-4-7";

type ManifestEntry = {
  id: string;
  images: string[];
  groundTruth: Record<string, string | null>;
};

type Args = { model: string; manifest: string; limit?: number; id?: string };

function parseArgs(argv: string[]): Args {
  const args: Args = { model: DEFAULT_MODEL, manifest: "samples/eval-set/manifest.json" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--model") args.model = argv[++i];
    else if (a === "--manifest") args.manifest = argv[++i];
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a === "--id") args.id = argv[++i];
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

  console.log(`=== Eval scorer: ${args.model} ===`);

  const scores: ProductScore[] = [];
  const skipped: string[] = [];
  const errored: string[] = [];
  const totals: Usage = { inputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 };

  for (const e of entries) {
    if (!isComplete(e.groundTruth)) { skipped.push(`${e.id} (incomplete tags)`); continue; }
    const buffers: Buffer[] = [];
    let missing = false;
    for (const img of e.images) {
      const p = resolve(manifestDir, img);
      if (!existsSync(p)) { missing = true; break; }
      buffers.push(readFileSync(p));
    }
    if (missing) { skipped.push(`${e.id} (missing image)`); continue; }

    process.stdout.write(`. ${e.id} ... `);
    const outcome = await tagProductWithRetry(buffers, { vendor: "anthropic", model: args.model });
    if (outcome.status === "failed") { console.log(`ERROR: ${outcome.error}`); errored.push(e.id); continue; }

    const comparisons = scoreProduct(outcome.attributes as Record<string, string | null>, e.groundTruth);
    const hits = comparisons.filter((c) => c.match).length;
    console.log(`${hits}/14`);
    scores.push({ id: e.id, comparisons });
    totals.inputTokens += outcome.usage.inputTokens;
    totals.cacheCreationInputTokens += outcome.usage.cacheCreationInputTokens;
    totals.cacheReadInputTokens += outcome.usage.cacheReadInputTokens;
    totals.outputTokens += outcome.usage.outputTokens;
  }

  const agg = aggregate(scores);

  console.log(`\nScored ${scores.length} products` +
    (skipped.length ? ` (skipped ${skipped.length}: ${skipped.join(", ")})` : "") +
    (errored.length ? ` (errored ${errored.length}: ${errored.join(", ")})` : ""));

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

  console.log(`\nCost: $${estimateCost(totals).toFixed(4)}  (input=${totals.inputTokens} output=${totals.outputTokens})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
