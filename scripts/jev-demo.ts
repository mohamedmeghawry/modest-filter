// Jev pre-screen on demo products (batch 1 or 2), for the Jev vs Opus field
// test. No ground truth here: the comparison with Opus, and Mohamed's review
// of the disagreements, decide (docs/attribute-sources.md).
//
//   npx tsx --env-file=.env.local scripts/jev-demo.ts [--csv <path>]
//
// Same photos as the Opus batch (hand picks or front.jpg/back.jpg, through
// scripts/prepare-image.ts). Products the free text gate rejects are skipped,
// as in the Opus batch. Writes samples/demo/jev-<csv name>.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseCsv } from "../lib/products/demo-csv";
import { textGate } from "../lib/vision/text-gate";
import { askJev, prescreen, ruleVerdicts, jevCostUsd, ATTRIBUTE_QUESTIONS, BASELINE_QUESTIONS, JEV_MODEL } from "../lib/vision/jev";
import { prepareImage } from "./prepare-image";

const BUDGET_USD = 0.05; // under what is left of the $0.10 Jev approval (~$0.055 on 2026-11-10)
const PICKS = "samples/demo/photo-picks.json";
const IMAGES = "samples/demo/images";
const CATEGORY: Record<string, string> = { dress: "dresses", top: "tops" };

async function main() {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw new Error("TYPESAFE_API_KEY is not set");
  const argv = process.argv.slice(2);
  const csv = argv.includes("--csv") ? argv[argv.indexOf("--csv") + 1] : "samples/demo/products-batch2.csv";
  const picks: Record<string, { photos: string[] }> = existsSync(PICKS) ? JSON.parse(readFileSync(PICKS, "utf8")) : {};
  const out = `samples/demo/jev-${basename(csv, ".csv")}.json`;

  const rows: { id: string; category: string; photos: string[]; inputTokens: number; decision: string; rules: object; nouls: object; choices: object }[] = [];
  let tokens = 0;
  for (const row of parseCsv(readFileSync(csv, "utf8"))) {
    if (jevCostUsd(tokens) > BUDGET_USD) throw new Error(`Budget reached ($${jevCostUsd(tokens).toFixed(4)}), stopping`);
    const reasons = "gate_reasons" in row ? row.gate_reasons.split("|").filter(Boolean) : textGate(row.title).reasons;
    if (reasons.length) continue;
    const files = picks[row.id]?.photos ?? ["front.jpg", ...(existsSync(join(IMAGES, row.id, "back.jpg")) ? ["back.jpg"] : [])];
    const photos = await Promise.all(files.map((f) => prepareImage(join(IMAGES, row.id, f))));
    if (photos.some((p) => p == null)) { console.log(`• ${row.id}: unreadable photo, skipped`); continue; }

    const category = CATEGORY[row.category] ?? row.category;
    const { answers, inputTokens } = await askJev(row.id, category, photos as Buffer[], apiKey);
    tokens += inputTokens;
    const decision = prescreen(answers, category);
    rows.push({
      id: row.id, category, photos: files, inputTokens, decision,
      rules: ruleVerdicts(answers, category),
      nouls: Object.fromEntries(Object.keys(BASELINE_QUESTIONS).filter((k) => answers[k]).map((k) => [k, answers[k].noul])),
      choices: Object.fromEntries(Object.keys(ATTRIBUTE_QUESTIONS).map((k) => [k, answers[k]?.choice ?? null])),
    });
    console.log(`• ${row.id.padEnd(30)} ${decision}`);
  }

  writeFileSync(out, JSON.stringify({ model: JEV_MODEL, ranAt: new Date().toISOString(), csv, costUsd: Number(jevCostUsd(tokens).toFixed(5)), rows }, null, 2) + "\n");
  const by = (d: string) => rows.filter((r) => r.decision === d).length;
  console.log(`\n${rows.length} products: reject ${by("reject")}, unsure ${by("unsure")}, pass ${by("pass")}. $${jevCostUsd(tokens).toFixed(5)}. Wrote ${out}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
