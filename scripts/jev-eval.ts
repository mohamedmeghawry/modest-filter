// Jev (TypeSafe System One) on the 28-product eval set, scored against the
// hand ground truth. Question: can Jev pre-screen the modest baseline
// (ADR-0015) before paying for Opus? Tracked in docs/attribute-sources.md.
//
//   npx tsx --env-file=.env.local scripts/jev-eval.ts [--id <id>] [--limit N]
//
// Questions and decision logic live in lib/vision/jev.ts. Photos go through
// scripts/prepare-image.ts, the same conversion the Opus eval uses.
// Writes samples/eval-set/jev-results.json (answers only, no image bytes).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prepareImage } from "./prepare-image";
import { passesModestBaseline, LONG_SLEEVES, ALLOWED_SLITS, EXCLUDED_NECKLINES } from "../lib/products/modest-baseline";
import { askJev, ruleVerdicts, jevCostUsd, ATTRIBUTE_QUESTIONS, BASELINE_QUESTIONS, JEV_MODEL, YES, NO } from "../lib/vision/jev";

const BUDGET_USD = 0.1; // Mohamed approved ~$0.10 (2026-11-09)
const DIR = "samples/eval-set";
const OUT = join(DIR, "jev-results.json");

type Entry = { id: string; category: string; images: string[]; groundTruth: Record<string, string | null> };

function truthRules(gt: Record<string, string | null>, isTop: boolean) {
  const has = (l: readonly string[], v: string | null) => v != null && l.includes(v);
  return {
    sleeves: has(LONG_SLEEVES, gt.sleeveLength),
    back: gt.backStyle === "closed",
    cutouts: gt.cutouts === "none",
    slit: has(ALLOWED_SLITS, gt.slit) || (isTop && gt.slit == null),
    neckline: gt.neckline != null && !has(EXCLUDED_NECKLINES, gt.neckline),
  };
}

async function main() {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw new Error("TYPESAFE_API_KEY is not set");
  const argv = process.argv.slice(2);
  const onlyId = argv.includes("--id") ? argv[argv.indexOf("--id") + 1] : undefined;
  const limit = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
  const manifest: Entry[] = JSON.parse(readFileSync(join(DIR, "manifest.json"), "utf8"));
  const todo = manifest.filter((e) => !onlyId || e.id === onlyId).slice(0, limit);

  const rows = [];
  let tokens = 0;
  for (const e of todo) {
    if (jevCostUsd(tokens) > BUDGET_USD) throw new Error(`Budget reached ($${jevCostUsd(tokens).toFixed(4)}), stopping`);
    const photos = (await Promise.all(e.images.map((p) => prepareImage(join(DIR, p))))).filter((b): b is Buffer => b != null);
    if (photos.length === 0) { console.log(`• ${e.id}: no usable photo, skipped`); continue; }

    const t0 = Date.now();
    const { request, answers, inputTokens } = await askJev(e.id, e.category, photos, apiKey);
    tokens += inputTokens;
    const isTop = e.category === "tops";
    const gt = e.groundTruth;
    const truthPass = passesModestBaseline({ tagStatus: "tagged", categorySlug: e.category, ...pick(gt) });
    const verdicts = ruleVerdicts(answers, e.category);
    const noulPass = Object.values(verdicts).every((v) => v === "pass");
    const choices = Object.fromEntries(Object.keys(ATTRIBUTE_QUESTIONS).map((k) => [k, answers[k]?.choice ?? null]));
    const choicePass = passesModestBaseline({ tagStatus: "tagged", categorySlug: e.category, ...pick(choices), cutouts: (answers.has_cutout?.noul ?? 0.5) < NO ? "none" : "present" });

    rows.push({
      id: e.id, category: e.category, photos: photos.length, ms: Date.now() - t0, inputTokens,
      truthPass, noulPass, choicePass, truthRules: truthRules(gt, isTop),
      noulRules: Object.fromEntries(Object.entries(verdicts).map(([k, v]) => [k, v === "pass"])),
      nouls: Object.fromEntries(Object.keys(BASELINE_QUESTIONS).filter((k) => answers[k]).map((k) => [k, round(answers[k].noul)])),
      choices, groundTruth: pick(gt),
      questions: Object.keys(request.questions),
    });
    console.log(`• ${e.id.padEnd(40)} truth ${truthPass ? "PASS" : "fail"} | jev ${noulPass ? "PASS" : "fail"} | ${inputTokens} tok, ${Date.now() - t0} ms`);
  }

  writeFileSync(OUT, JSON.stringify({ model: JEV_MODEL, ranAt: new Date().toISOString(), thresholds: { YES, NO }, questions: { BASELINE: BASELINE_QUESTIONS, ATTRIBUTES: ATTRIBUTE_QUESTIONS }, rows }, null, 2) + "\n");
  report(rows, tokens);
}

const round = (n?: number) => (n == null ? null : Math.round(n * 1000) / 1000);
function pick(o: Record<string, string | null>) {
  return { sleeveLength: o.sleeveLength ?? null, backStyle: o.backStyle ?? null, cutouts: o.cutouts ?? null, slit: o.slit ?? null, neckline: o.neckline ?? null };
}

type Row = {
  id: string; truthPass: boolean; noulPass: boolean; choicePass: boolean;
  truthRules: Record<string, boolean>; noulRules: Record<string, boolean>;
  choices: Record<string, string | null>; groundTruth: Record<string, string | null>;
};

function report(rows: Row[], tokens: number) {
  const n = rows.length;
  const count = (f: (r: Row) => boolean) => rows.filter(f).length;
  const ids = (f: (r: Row) => boolean) => rows.filter(f).map((r) => r.id).join(", ");
  console.log(`\n${n} products, ${tokens} input tokens, $${jevCostUsd(tokens).toFixed(5)}`);
  for (const k of ["noulPass", "choicePass"] as const) {
    console.log(`\nBaseline from ${k === "noulPass" ? "yes/no questions" : "choice questions"} vs ground truth:`);
    console.log(`  both pass ${count((r) => r.truthPass && r[k])} | both fail ${count((r) => !r.truthPass && !r[k])}`);
    console.log(`  FALSE PASS (immodest shown) ${count((r) => !r.truthPass && r[k])}: ${ids((r) => !r.truthPass && r[k])}`);
    console.log(`  false reject (good one hidden) ${count((r) => r.truthPass && !r[k])}: ${ids((r) => r.truthPass && !r[k])}`);
  }
  console.log("\nPer rule (yes/no question vs ground truth):");
  for (const rule of ["sleeves", "back", "cutouts", "slit", "neckline"]) {
    console.log(`  ${rule.padEnd(9)} ${count((r) => r.noulRules[rule] === r.truthRules[rule])}/${n}`);
  }
  console.log("\nPer attribute (choice vs ground truth, where ground truth is set):");
  for (const a of Object.keys(ATTRIBUTE_QUESTIONS)) {
    const scored = rows.filter((r) => r.groundTruth[a] != null && r.choices[a] != null);
    console.log(`  ${a.padEnd(13)} ${scored.filter((r) => r.choices[a] === r.groundTruth[a]).length}/${scored.length}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
