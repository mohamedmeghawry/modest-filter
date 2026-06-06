import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { tagProductWithRetry } from "../lib/vision/tag-product";
import { scoreProduct, aggregate, ATTRIBUTE_KEYS, type ProductScore } from "../lib/vision/score";
import { estimateCost, type Usage } from "../lib/vision/cost";

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
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    model: DEFAULT_MODEL,
    manifest: "samples/eval-set/manifest.json",
    detail: false,
    withDescription: false,
    requireDescription: false,
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
    else { console.error(`Unknown argument: ${a}`); process.exit(1); }
  }
  return args;
}

// Magic-byte check: returns the format, or null for anything the vision API
// can't accept (notably AVIF, or a non-image like a saved HTML page).
function imageKind(b: Buffer): "jpeg" | "png" | "webp" | "gif" | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return "webp";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  return null;
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

  console.log(`=== Eval scorer: ${args.model}${args.withDescription ? " +description" : ""} ===`);

  const scores: ProductScore[] = [];
  const skipped: string[] = [];
  const errored: string[] = [];
  const totals: Usage = { inputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 };

  for (const e of entries) {
    if (!isComplete(e.groundTruth)) { skipped.push(`${e.id} (incomplete tags)`); continue; }
    if (args.requireDescription && !e.description?.trim()) { skipped.push(`${e.id} (no description)`); continue; }
    const buffers: Buffer[] = [];
    let badReason = "";
    for (const img of e.images) {
      const rel = img.replace(/^\.\//, "").trim();
      const p = resolve(manifestDir, rel);
      if (!rel || !existsSync(p)) { badReason = `missing image "${img}"`; break; }
      let buf: Buffer;
      try { buf = readFileSync(p); } catch (err) {
        badReason = `unreadable "${img}" (${(err as { code?: string }).code ?? "error"})`;
        break;
      }
      const kind = imageKind(buf);
      if (!kind) { badReason = `unsupported format "${img}" (not jpeg/png/webp/gif — likely avif or a saved web page)`; break; }
      buffers.push(buf);
    }
    if (badReason || buffers.length === 0) { skipped.push(`${e.id}: ${badReason || "no images"}`); continue; }

    process.stdout.write(`. ${e.id} ... `);
    const outcome = await tagProductWithRetry(
      buffers,
      { vendor: "anthropic", model: args.model },
      { description: args.withDescription ? e.description : undefined },
    );
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

  console.log(`\nCost: $${estimateCost(totals).toFixed(4)}  (input=${totals.inputTokens} output=${totals.outputTokens})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
