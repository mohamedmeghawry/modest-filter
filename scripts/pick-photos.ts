// Pick each product's front and back photo from its saved gallery
// (samples/demo/images/<id>/gallery/NN.jpg, written by decode-batch.ts),
// after looking at a contact sheet, or drop the product.
//
//   npx tsx scripts/pick-photos.ts sheet <id-prefix> <out.jpg>   # numbered sheet of every gallery
//   npx tsx scripts/pick-photos.ts set <id>:<front>:<back|none> [...]
//   npx tsx scripts/pick-photos.ts drop <id>:<reason> [...]      # e.g. a spare not needed
//
// "set" copies the chosen gallery images to front.jpg/back.jpg and updates the
// CSV row (image links, back_photo_index) and the brand log. "none" = no photo
// shows the back: the product is dropped as "no back photo" (Mohamed's
// front + back rule), like "drop". Dropped products leave the CSV and the
// images folder, and are recorded as skipped in the brand log.
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { parseCsv, toCsv } from "../lib/products/demo-csv";
import { BATCH2_HEADER } from "../lib/products/batch2";

const CSV = "samples/demo/products-batch2.csv";
const LOG = "samples/demo/batch2-log.json";
const IMAGES = "samples/demo/images";

async function sheet(prefix: string, out: string) {
  const ids = readdirSync(IMAGES).filter((d) => d.startsWith(prefix) && existsSync(join(IMAGES, d, "gallery"))).sort();
  const W = 100, H = 150, LABEL = 130;
  const rows: sharp.OverlayOptions[] = [];
  let maxCols = 0;
  for (const [r, id] of ids.entries()) {
    const files = readdirSync(join(IMAGES, id, "gallery")).filter((f) => f.endsWith(".jpg")).sort();
    maxCols = Math.max(maxCols, files.length);
    const y = r * (H + 14);
    rows.push({ input: Buffer.from(`<svg width="${LABEL}" height="${H}"><rect width="100%" height="100%" fill="white"/><text x="2" y="70" font-size="11" font-family="Arial">${id.slice(prefix.length + 1)}</text></svg>`), left: 0, top: y });
    for (const [c, f] of files.entries()) {
      const x = LABEL + c * W;
      rows.push({ input: Buffer.from(`<svg width="${W}" height="14"><text x="2" y="11" font-size="11" font-family="Arial">${Number(f.slice(0, 2))}</text></svg>`), left: x, top: y });
      rows.push({ input: await sharp(join(IMAGES, id, "gallery", f)).resize(W, H - 14, { fit: "contain", background: "#eee" }).toBuffer(), left: x, top: y + 14 });
    }
  }
  await sharp({ create: { width: LABEL + maxCols * W, height: ids.length * (H + 14), channels: 3, background: "#fff" } }).composite(rows).jpeg({ quality: 70 }).toFile(out);
  console.log(`${ids.length} products -> ${out}`);
}

function load() {
  return { rows: parseCsv(readFileSync(CSV, "utf8")), log: JSON.parse(readFileSync(LOG, "utf8")) };
}

function save(rows: Record<string, string>[], log: unknown) {
  writeFileSync(CSV, toCsv(BATCH2_HEADER, rows));
  writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n");
}

function drop(rows: Record<string, string>[], log: Record<string, { products: Record<string, unknown>; skipped: unknown[] }>, id: string, reason: string) {
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`${id}: not in the CSV`);
  const [row] = rows.splice(i, 1);
  const brand = log[row.brand];
  delete brand.products[id];
  brand.skipped.push({ link: row.link, listing_position: Number(row.listing_position), reason });
  rmSync(join(IMAGES, id), { recursive: true, force: true });
  console.log(`• ${id}: dropped (${reason})`);
}

function set(args: string[]) {
  const { rows, log } = load();
  for (const a of args) {
    const [id, f, b] = a.split(":");
    if (b === "none") { drop(rows, log, id, "no back photo in the gallery"); continue; }
    const dir = join(IMAGES, id, "gallery");
    const urls: string[] = JSON.parse(readFileSync(join(dir, "urls.json"), "utf8"));
    const front = Number(f), back = Number(b);
    if (!(front in urls) || !(back in urls) || front === back) throw new Error(`${a}: bad indexes (gallery has ${urls.length})`);
    copyFileSync(join(dir, `${String(front).padStart(2, "0")}.jpg`), join(IMAGES, id, "front.jpg"));
    copyFileSync(join(dir, `${String(back).padStart(2, "0")}.jpg`), join(IMAGES, id, "back.jpg"));
    const row = rows.find((r) => r.id === id);
    if (!row) throw new Error(`${id}: not in the CSV`);
    Object.assign(row, { image_link: urls[front], additional_image_link: urls[back], back_photo_index: String(back), gallery_count: String(urls.length) });
    log[row.brand].products[id] = back;
    console.log(`• ${id}: front ${front}, back ${back}`);
  }
  save(rows, log);
}

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === "sheet") return sheet(args[0], args[1]);
  if (mode === "set") return set(args);
  if (mode === "drop") {
    const { rows, log } = load();
    for (const a of args) { const [id, ...reason] = a.split(":"); drop(rows, log, id, reason.join(":") || "dropped"); }
    return save(rows, log);
  }
  throw new Error("Usage: pick-photos.ts sheet <prefix> <out.jpg> | set <id>:<front>:<back|none> ... | drop <id>:<reason> ...");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
