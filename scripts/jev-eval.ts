// Jev (TypeSafe System One) on the 28-product eval set, scored against the
// hand ground truth. Question: can Jev pre-screen the modest baseline
// (ADR-0015) before paying for Opus? Tracked in docs/attribute-sources.md.
//
//   npx tsx --env-file=.env.local scripts/jev-eval.ts [--id <id>] [--limit N]
//
// Jev makes the judgments (one yes/no per baseline rule, plus a choice per
// attribute so we can compare with ground truth); code makes the decision.
// Photos are converted locally to JPEG <= 1568 px (Jev takes PNG/JPEG only,
// 280-1568 px per side) with sharp, which ships with Next.js.
// Writes samples/eval-set/jev-results.json (answers only, no image bytes).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { passesModestBaseline, LONG_SLEEVES, ALLOWED_SLITS, EXCLUDED_NECKLINES } from "../lib/products/modest-baseline";

const API = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const USD_PER_M_INPUT = 0.042; // docs.typesafe.ai/go/models (2026-11-09); output is free
const BUDGET_USD = 0.1; // Mohamed approved ~$0.10 (2026-11-09)
const YES = 0.7;
const NO = 0.3; // between NO and YES = unsure → hidden (unknown fails, ADR-0015)
const DIR = "samples/eval-set";
const OUT = join(DIR, "jev-results.json");

// ---- All question wording lives here -------------------------------------
const PHOTOS = "`front_photo` and `back_photo`";
type Noul = { type: "noul"; instructions: string; criteria: { true: string; false: string } };
type Choice = { type: "choice"; instructions: string; criteria: Record<string, string> };

const BASELINE: Record<string, Noul> = {
  sleeves_reach_wrist: {
    type: "noul",
    instructions: `Do the sleeves of the garment in ${PHOTOS} reach the wrist?`,
    criteria: {
      true: "Each sleeve covers the arm all the way to the wrist or past it",
      false: "The arms are bare or partly bare: the garment is sleeveless, or the sleeves end at the shoulder, upper arm, elbow or forearm",
    },
  },
  back_closed: {
    type: "noul",
    instructions: `Is the back of the garment in ${PHOTOS} closed?`,
    criteria: {
      true: "Fabric covers the back from the base of the neck downwards, with no opening or dip",
      false: "The back has an opening or dips low: a scoop, a V, a keyhole, a low back or an open back",
    },
  },
  has_cutout: {
    type: "noul",
    instructions: `Does the garment in ${PHOTOS} have a cut-out?`,
    criteria: {
      true: "A hole or opening is cut into the fabric and shows skin, for example at the waist, side, chest or shoulder",
      false: "The fabric is continuous apart from the neckline, armholes and hem",
    },
  },
  slit_to_knee: {
    type: "noul",
    instructions: `Does the skirt of the garment in ${PHOTOS} have a slit that reaches the knee or higher?`,
    criteria: {
      true: "A slit opens up to the knee, the thigh or higher, at the side, front or back",
      false: "There is no slit, or only a short slit near the hem that stays well below the knee",
    },
  },
  off_shoulder: {
    type: "noul",
    instructions: `Is the garment in ${PHOTOS} off-the-shoulder?`,
    criteria: {
      true: "The neckline sits below the shoulders and leaves both shoulders bare",
      false: "The garment covers the tops of the shoulders",
    },
  },
  halter: {
    type: "noul",
    instructions: `Is the neckline of the garment in ${PHOTOS} a halter?`,
    criteria: {
      true: "Straps or fabric go around the back of the neck, leaving the shoulders bare",
      false: "The garment hangs from both shoulders",
    },
  },
};

// Same enums as prisma/schema.prisma, so answers compare with ground truth.
const ATTRIBUTES: Record<string, Choice> = {
  sleeveLength: {
    type: "choice",
    instructions: `How long are the sleeves of the garment in ${PHOTOS}?`,
    criteria: {
      sleeveless: "No sleeves; the arm is bare from the shoulder",
      cap: "A tiny sleeve covering only the top of the shoulder",
      short: "Ends on the upper arm",
      elbow: "Ends at the elbow",
      three_quarter: "Ends on the forearm, between elbow and wrist",
      long: "Ends at the wrist",
      extra_long: "Goes past the wrist, over part of the hand",
    },
  },
  backStyle: {
    type: "choice",
    instructions: `What is the back of the garment in ${PHOTOS} like?`,
    criteria: {
      closed: "Covered from the base of the neck down",
      scoop_back: "A rounded dip below the base of the neck",
      v_back: "A V-shaped dip",
      low_back: "Cut down to the middle of the back",
      open_back: "Mostly bare back",
    },
  },
  neckline: {
    type: "choice",
    instructions: `What is the neckline of the garment in ${PHOTOS}?`,
    criteria: {
      crew: "Round, close to the base of the neck",
      v_neck: "V-shaped at the front",
      scoop: "Round and lower than a crew neck",
      high_neck: "Rises up the neck without folding over",
      collar: "A shirt or polo collar",
      turtleneck: "A high neck that folds over",
      off_shoulder: "Sits below both shoulders",
      halter: "Fastens around the back of the neck",
      square: "Straight across with corners",
    },
  },
  slit: {
    type: "choice",
    instructions: `How high does the slit in the skirt of the garment in ${PHOTOS} go?`,
    criteria: {
      none: "No slit",
      low: "Short, stays below the knee",
      mid: "Reaches about the knee",
      high: "Reaches the thigh or higher",
    },
  },
};
// ---------------------------------------------------------------------------

type Entry = { id: string; category: string; images: string[]; groundTruth: Record<string, string | null> };
type Answer = { type: string; noul?: number; choice?: string; confidence?: number; probabilities?: Record<string, number> };

async function toJpeg(file: string): Promise<Buffer | null> {
  try {
    return await sharp(file).rotate().resize(1568, 1568, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  } catch {
    return null; // not an image (one "png" in the set is a saved HTML page)
  }
}

async function ask(entry: Entry, photos: Buffer[]) {
  const isTop = entry.category === "tops";
  const questions: Record<string, Noul | Choice> = {};
  for (const [k, q] of Object.entries(BASELINE)) if (!(isTop && k === "slit_to_knee")) questions[k] = structuredClone(q);
  for (const [k, q] of Object.entries(ATTRIBUTES)) if (!(isTop && k === "slit")) questions[k] = structuredClone(q);

  // Only one usable photo: the state has no back photo, and the questions
  // mention only the front.
  if (photos.length < 2) {
    for (const q of Object.values(questions)) q.instructions = q.instructions.replace(PHOTOS, "`front_photo`");
  }
  const refs = photos.map((_, i) => `img-${entry.id}-${i}`);
  const state: Record<string, string> = { garment_category: entry.category.replace(/s$/, ""), front_photo: refs[0] };
  if (refs[1]) state.back_photo = refs[1];

  const assets = Object.fromEntries(refs.map((r, i) => [r, { type: "image", part: `photo${i}` }]));
  const request = { model: MODEL, state, questions, assets };
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  photos.forEach((b, i) => form.append(`photo${i}`, new Blob([new Uint8Array(b)], { type: "image/jpeg" }), `photo${i}.jpg`));

  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, "TypeSafe-Danger-Zone-Images": "true" },
    body: form,
  });
  const body = await res.json();
  // A failed call is an error, never a "no" (skill guidance).
  if (!res.ok) throw new Error(`${entry.id}: HTTP ${res.status} ${JSON.stringify(body.detail ?? body).slice(0, 300)}`);
  return { request, answers: body.answers as Record<string, Answer>, inputTokens: body.usage?.input_tokens as number };
}

/** Code decides from Jev's yes/no judgments; unsure counts as fail (ADR-0015). */
function decideFromNouls(a: Record<string, Answer>, isTop: boolean) {
  const yes = (k: string) => (a[k]?.noul ?? 0.5) > YES;
  const no = (k: string) => (a[k]?.noul ?? 0.5) < NO;
  const rules = {
    sleeves: yes("sleeves_reach_wrist"),
    back: yes("back_closed"),
    cutouts: no("has_cutout"),
    slit: isTop || no("slit_to_knee"),
    neckline: no("off_shoulder") && no("halter"),
  };
  return { pass: Object.values(rules).every(Boolean), rules };
}

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
  if (!process.env.TYPESAFE_API_KEY) throw new Error("TYPESAFE_API_KEY is not set");
  const argv = process.argv.slice(2);
  const onlyId = argv.includes("--id") ? argv[argv.indexOf("--id") + 1] : undefined;
  const limit = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
  const manifest: Entry[] = JSON.parse(readFileSync(join(DIR, "manifest.json"), "utf8"));
  const todo = manifest.filter((e) => !onlyId || e.id === onlyId).slice(0, limit);

  const rows = [];
  let tokens = 0;
  for (const e of todo) {
    const cost = (tokens * USD_PER_M_INPUT) / 1e6;
    if (cost > BUDGET_USD) throw new Error(`Budget reached ($${cost.toFixed(4)}), stopping`);
    const photos = (await Promise.all(e.images.map((p) => toJpeg(join(DIR, p))))).filter((b): b is Buffer => b != null);
    if (photos.length === 0) { console.log(`• ${e.id}: no usable photo, skipped`); continue; }

    const t0 = Date.now();
    const { request, answers, inputTokens } = await ask(e, photos);
    tokens += inputTokens ?? 0;
    const isTop = e.category === "tops";
    const gt = e.groundTruth;
    const truth = truthRules(gt, isTop);
    const truthPass = passesModestBaseline({ tagStatus: "tagged", categorySlug: e.category, ...pick(gt) });
    const nouls = decideFromNouls(answers, isTop);
    const choices = Object.fromEntries(Object.keys(ATTRIBUTES).map((k) => [k, answers[k]?.choice ?? null]));
    const choicePass = passesModestBaseline({ tagStatus: "tagged", categorySlug: e.category, ...pick(choices) , cutouts: (answers.has_cutout?.noul ?? 0.5) < NO ? "none" : "present" });

    rows.push({
      id: e.id, category: e.category, photos: photos.length, ms: Date.now() - t0, inputTokens,
      truthPass, noulPass: nouls.pass, choicePass, truthRules: truth, noulRules: nouls.rules,
      nouls: Object.fromEntries(Object.keys(BASELINE).filter((k) => answers[k]).map((k) => [k, round(answers[k].noul)])),
      choices, groundTruth: pick(gt),
      questions: Object.keys(request.questions),
    });
    console.log(`• ${e.id.padEnd(40)} truth ${truthPass ? "PASS" : "fail"} | jev ${nouls.pass ? "PASS" : "fail"} | ${inputTokens} tok, ${Date.now() - t0} ms`);
  }

  writeFileSync(OUT, JSON.stringify({ model: MODEL, ranAt: new Date().toISOString(), thresholds: { YES, NO }, questions: { BASELINE, ATTRIBUTES }, rows }, null, 2) + "\n");
  report(rows, tokens);
}

const round = (n?: number) => (n == null ? null : Math.round(n * 1000) / 1000);
function pick(o: Record<string, string | null>) {
  return { sleeveLength: o.sleeveLength ?? null, backStyle: o.backStyle ?? null, cutouts: o.cutouts ?? null, slit: o.slit ?? null, neckline: o.neckline ?? null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- local report over the rows built above
function report(rows: any[], tokens: number) {
  const n = rows.length;
  const count = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).length;
  console.log(`\n${n} products, ${tokens} input tokens, $${((tokens * USD_PER_M_INPUT) / 1e6).toFixed(5)}`);
  for (const k of ["noulPass", "choicePass"] as const) {
    console.log(`\nBaseline from ${k === "noulPass" ? "yes/no questions" : "choice questions"} vs ground truth:`);
    console.log(`  both pass ${count((r) => r.truthPass && r[k])} | both fail ${count((r) => !r.truthPass && !r[k])}`);
    console.log(`  FALSE PASS (immodest shown) ${count((r) => !r.truthPass && r[k])}: ${rows.filter((r) => !r.truthPass && r[k]).map((r) => r.id).join(", ")}`);
    console.log(`  false reject (good one hidden) ${count((r) => r.truthPass && !r[k])}: ${rows.filter((r) => r.truthPass && !r[k]).map((r) => r.id).join(", ")}`);
  }
  console.log("\nPer rule (yes/no question vs ground truth):");
  for (const rule of ["sleeves", "back", "cutouts", "slit", "neckline"]) {
    console.log(`  ${rule.padEnd(9)} ${count((r) => r.noulRules[rule] === r.truthRules[rule])}/${n}`);
  }
  console.log("\nPer attribute (choice vs ground truth, where ground truth is set):");
  for (const a of Object.keys(ATTRIBUTES)) {
    const scored = rows.filter((r) => r.groundTruth[a] != null && r.choices[a] != null);
    console.log(`  ${a.padEnd(13)} ${scored.filter((r) => r.choices[a] === r.groundTruth[a]).length}/${scored.length}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
