// Turn one browser "bundle" download (one brand of batch 2) into local photos
// and rows of samples/demo/products-batch2.csv. See lib/products/batch2.ts.
//
//   npx tsx scripts/decode-batch.ts <bundle.json> [--keep]
//
// Writes samples/demo/images/<id>/front.jpg and back.jpg (gitignored, never
// served: ADR-0013 amendment), upserts CSV rows by id, and records the brand's
// skipped listing items in samples/demo/batch2-log.json (the per-brand
// back-photo finding). Deletes the bundle afterwards unless --keep: it holds
// the brand's description text, which we parse but never keep.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { BATCH2_HEADER, toBatch2Row, validateBundleProduct, type Bundle } from "../lib/products/batch2";
import { parseCsv, toCsv } from "../lib/products/demo-csv";

const CSV = "samples/demo/products-batch2.csv";
const LOG = "samples/demo/batch2-log.json";
const IMAGES = "samples/demo/images";

async function savePhoto(b64: string, file: string): Promise<string> {
  const img = sharp(Buffer.from(b64, "base64")).rotate();
  const { width = 0, height = 0 } = await img.metadata();
  await img.jpeg({ quality: 92 }).toFile(file); // always JPEG: .jpg is gitignored, HEIF isn't usable
  return `${width}x${height}${Math.min(width, height) < 280 ? " (TOO SMALL for Jev)" : ""}`;
}

async function main() {
  const [path, ...flags] = process.argv.slice(2);
  if (!path || !existsSync(path)) throw new Error(`Usage: decode-batch.ts <bundle.json> [--keep]  (not found: ${path})`);
  const bundle: Bundle = JSON.parse(readFileSync(path, "utf8"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bundle.collected_on)) throw new Error(`bad collected_on "${bundle.collected_on}"`);

  const existing = existsSync(CSV) ? parseCsv(readFileSync(CSV, "utf8")) : [];
  const byId = new Map(existing.map((r) => [r.id, r]));
  let saved = 0;
  const rejected: string[] = [];

  for (const p of bundle.products) {
    const errs = validateBundleProduct(p);
    if (errs.length) {
      rejected.push(`${p.id}: ${errs.join("; ")}`);
      continue;
    }
    const dir = join(IMAGES, p.id);
    mkdirSync(dir, { recursive: true });
    const front = await savePhoto(p.images.front.b64, join(dir, "front.jpg"));
    const back = p.images.back ? await savePhoto(p.images.back.b64, join(dir, "back.jpg")) : "none";
    const row = toBatch2Row(p, bundle.collected_on);
    byId.set(p.id, row);
    saved++;
    console.log(`• ${p.id}: front ${front}, back ${back}${row.gate_reasons ? `, text gate: ${row.gate_reasons}` : ""}`);
  }

  writeFileSync(CSV, toCsv(BATCH2_HEADER, [...byId.values()]));

  const log: Record<string, unknown> = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : {};
  log[bundle.brand] = {
    collected_on: bundle.collected_on,
    products: bundle.products.length,
    with_back_photo: bundle.products.filter((p) => p.back_index != null).length,
    back_photo_positions: bundle.products.map((p) => p.back_index),
    skipped: bundle.skipped,
  };
  writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n");

  console.log(`\n${bundle.brand}: saved ${saved}, rejected ${rejected.length}, skipped on the listing ${bundle.skipped.length}. CSV now ${byId.size} rows.`);
  rejected.forEach((r) => console.log(`  REJECTED ${r}`));
  if (!flags.includes("--keep") && rejected.length === 0) {
    rmSync(path);
    console.log(`Deleted ${path} (it held the brand's description text).`);
  } else if (rejected.length) {
    console.log(`Kept ${path} because some products were rejected; fix and re-run.`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
