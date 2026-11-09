// Build a batch-2 bundle (lib/products/batch2.ts) from facts records read in
// the browser plus each product's gallery image links, fetching the photos
// here at a human pace (one every 2.5 s) instead of in the page.
//
//   npx tsx scripts/build-bundle.ts <records.json> <bundle-out.json>
//
// Why: Chrome allows one automatic download per site (oldnavy.gapcanada.ca and
// www.gapcanada.ca count as one), and only a person can lift that block. When a
// brand's image server answers scripts, the browser only needs to hand over
// text, and the photos come straight from the image server.
//
// records.json: { brand, collected_on, skipped: [...], products: [ BundleProduct
// without images/gallery/back_index, plus gallery_urls: string[] ] }.
// It holds the brand's description text: it is deleted once the bundle is
// written (the bundle itself is deleted by decode-batch after decoding).
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import type { Bundle, BundleImage, BundleProduct } from "../lib/products/batch2";

type RecordIn = Omit<BundleProduct, "images" | "gallery" | "back_index" | "gallery_count"> & { gallery_urls: string[] };
type RecordsFile = Omit<Bundle, "products"> & { products: RecordIn[] };

const GAP_MS = 2500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchImage(url: string): Promise<BundleImage> {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; kashfedit-demo/1.0)", Accept: "image/webp,image/jpeg,image/*;q=0.8" },
  });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  if (!(r.headers.get("content-type") ?? "").startsWith("image/")) throw new Error(`not an image: ${url}`);
  return { url, b64: Buffer.from(await r.arrayBuffer()).toString("base64") };
}

async function main() {
  const [inPath, outPath] = process.argv.slice(2);
  if (!inPath || !outPath) throw new Error("Usage: build-bundle.ts <records.json> <bundle-out.json>");
  const recs: RecordsFile = JSON.parse(readFileSync(inPath, "utf8"));
  const products: BundleProduct[] = [];
  for (const { gallery_urls, ...p } of recs.products) {
    if (!gallery_urls.length) throw new Error(`${p.id}: no gallery images`);
    const gallery: BundleImage[] = [];
    for (const u of gallery_urls) {
      await sleep(GAP_MS);
      gallery.push(await fetchImage(u));
    }
    products.push({ ...p, gallery_count: gallery.length, back_index: null, images: { front: gallery[0], back: null }, gallery });
    console.log(`• ${p.id}: ${gallery.length} photos`);
  }
  const bundle: Bundle = { brand: recs.brand, collected_on: recs.collected_on, skipped: recs.skipped, products };
  writeFileSync(outPath, JSON.stringify(bundle));
  rmSync(inPath);
  console.log(`${recs.brand}: bundle of ${products.length} -> ${outPath} (records file deleted)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
