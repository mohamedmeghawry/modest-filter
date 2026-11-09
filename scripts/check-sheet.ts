// Contact sheet of front+back pairs for an id prefix, to verify photo picks by eye
// (every batch-2 pick was checked this way).
//   npx tsx scripts/check-sheet.ts <id-prefix> <out.jpg>
import sharp from "sharp";
import { readdirSync, existsSync } from "node:fs";
const [prefix, out] = process.argv.slice(2);
const ids = readdirSync("samples/demo/images").filter((d) => d.startsWith(prefix)).sort();
const W = 150, H = 210, cols = 6;
(async () => {
  const tiles: sharp.OverlayOptions[] = [];
  let i = 0;
  for (const id of ids) for (const f of ["front", "back"]) {
    const p = `samples/demo/images/${id}/${f}.jpg`;
    const x = (i % cols) * W, y = Math.floor(i / cols) * (H + 18);
    tiles.push({ input: Buffer.from(`<svg width="${W}" height="18"><rect width="100%" height="100%" fill="white"/><text x="3" y="13" font-size="11" font-family="Arial">${id.replace(prefix + "-", "")} ${f}</text></svg>`), left: x, top: y });
    if (existsSync(p)) tiles.push({ input: await sharp(p).resize(W, H, { fit: "contain", background: "#eee" }).toBuffer(), left: x, top: y + 18 });
    i++;
  }
  await sharp({ create: { width: cols * W, height: Math.ceil(i / cols) * (H + 18), channels: 3, background: "#fff" } }).composite(tiles).jpeg({ quality: 70 }).toFile(out);
  console.log(ids.length, "products ->", out);
})();
