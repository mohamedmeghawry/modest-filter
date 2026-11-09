// How many of the 14 attributes can each FREE text source fill, per product?
// Feeds docs/attribute-sources.md (the per-attribute source decision tracker).
// No API calls, no database: reads samples/demo/products.csv only.
//
//   npx tsx scripts/source-coverage.ts
import { readFileSync } from "node:fs";
import { parseCsv } from "../lib/products/demo-csv";
import { parseTextFacts } from "../lib/vision/text-facts";
import { parseFeedFacts } from "../lib/vision/feed-facts";
import { parseColorName } from "../lib/vision/color-facts";

const rows = parseCsv(readFileSync("samples/demo/products.csv", "utf8"));
const hits: Record<string, { source: string; n: number }> = {};
const add = (attr: string, source: string) => {
  hits[attr] ??= { source, n: 0 };
  hits[attr].n++;
};

let slots = 0;
for (const r of rows) {
  for (const [attr, values] of Object.entries(parseTextFacts(r.title))) {
    if (values?.length) { add(attr, "title"); slots++; }
  }
  const feed = parseFeedFacts(r.material_raw);
  if (feed.material) { add("material", "material text"); slots++; }
  if (feed.lined) { add("lined", "material text"); slots++; }
  if (parseColorName(r.color_raw)) { add("primaryColor", "colour name"); slots++; }
}

console.log(`Products: ${rows.length}. Filled slots: ${slots} of ${rows.length * 14} (${Math.round((100 * slots) / (rows.length * 14))}%)`);
for (const [attr, { source, n }] of Object.entries(hits).sort((a, b) => b[1].n - a[1].n)) {
  console.log(`${attr.padEnd(13)} ${String(n).padStart(2)}/${rows.length}  from ${source}`);
}
