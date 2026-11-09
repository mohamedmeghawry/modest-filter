// Jev (TypeSafe System One) as a cheap pre-screen for the modest baseline
// (ADR-0015). Jev makes small judgments (one yes/no per baseline rule, plus a
// choice per attribute for comparison); code makes the decision. All question
// wording lives in this file so it can be reviewed in one place.
// Evidence: docs/attribute-sources.md ("Jev" and "Lab test" sections).
// Photos must be JPEG/PNG at 280-1568 px per side (scripts/prepare-image.ts).

export const JEV_API = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";
export const JEV_USD_PER_M_INPUT = 0.042; // docs.typesafe.ai/go/models (2026-11-09); output is free
/** Yes above YES, no below NO; in between = unsure (unknown fails, ADR-0015). */
export const YES = 0.7;
export const NO = 0.3;

const PHOTOS = "`front_photo` and `back_photo`";
export type Noul = { type: "noul"; instructions: string; criteria: { true: string; false: string } };
export type Choice = { type: "choice"; instructions: string; criteria: Record<string, string> };
export type JevAnswer = { type: string; noul?: number; choice?: string; confidence?: number; probabilities?: Record<string, number> };

export const BASELINE_QUESTIONS: Record<string, Noul> = {
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

// Same enums as prisma/schema.prisma, so answers compare with Opus and ground truth.
export const ATTRIBUTE_QUESTIONS: Record<string, Choice> = {
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

/** Questions for one product: tops skip the slit; one photo means no `back_photo`. */
export function buildJevQuestions(category: string, photoCount: number): Record<string, Noul | Choice> {
  const isTop = category === "tops";
  const out: Record<string, Noul | Choice> = {};
  for (const [k, q] of Object.entries({ ...BASELINE_QUESTIONS, ...ATTRIBUTE_QUESTIONS })) {
    if (isTop && (k === "slit_to_knee" || k === "slit")) continue;
    const copy = structuredClone(q);
    if (photoCount < 2) copy.instructions = copy.instructions.replace(PHOTOS, "`front_photo`");
    out[k] = copy;
  }
  return out;
}

/** The JSON part of a multipart request; images go in parts photo0, photo1. */
export function buildJevRequest(id: string, category: string, photoCount: number) {
  const refs = Array.from({ length: photoCount }, (_, i) => `img-${id}-${i}`);
  const state: Record<string, string> = { garment_category: category.replace(/s$/, ""), front_photo: refs[0] };
  if (refs[1]) state.back_photo = refs[1];
  const assets = Object.fromEntries(refs.map((r, i) => [r, { type: "image", part: `photo${i}` }]));
  return { model: JEV_MODEL, state, questions: buildJevQuestions(category, photoCount), assets };
}

/** One request per product. A failed call throws: it must never read as a "no". */
export async function askJev(id: string, category: string, photos: Buffer[], apiKey: string) {
  const request = buildJevRequest(id, category, photos.length);
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  photos.forEach((b, i) => form.append(`photo${i}`, new Blob([new Uint8Array(b)], { type: "image/jpeg" }), `photo${i}.jpg`));
  const res = await fetch(JEV_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "TypeSafe-Danger-Zone-Images": "true" },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${id}: Jev HTTP ${res.status} ${JSON.stringify(body.detail ?? body).slice(0, 300)}`);
  return { request, answers: body.answers as Record<string, JevAnswer>, inputTokens: (body.usage?.input_tokens ?? 0) as number };
}

export type RuleName = "sleeves" | "back" | "cutouts" | "slit" | "neckline";
type Verdict = "pass" | "fail" | "unsure";

/** Per baseline rule: pass, fail, or unsure (the probability sits between NO and YES). */
export function ruleVerdicts(a: Record<string, JevAnswer>, category: string): Record<RuleName, Verdict> {
  const p = (k: string) => a[k]?.noul ?? 0.5; // a missing answer is unsure, never a pass
  const wantYes = (k: string): Verdict => (p(k) > YES ? "pass" : p(k) < NO ? "fail" : "unsure");
  const wantNo = (k: string): Verdict => (p(k) < NO ? "pass" : p(k) > YES ? "fail" : "unsure");
  const both = (x: Verdict, y: Verdict): Verdict => (x === "fail" || y === "fail" ? "fail" : x === "unsure" || y === "unsure" ? "unsure" : "pass");
  return {
    sleeves: wantYes("sleeves_reach_wrist"),
    back: wantYes("back_closed"),
    cutouts: wantNo("has_cutout"),
    slit: category === "tops" ? "pass" : wantNo("slit_to_knee"),
    neckline: both(wantNo("off_shoulder"), wantNo("halter")),
  };
}

/**
 * The pre-screen decision. "reject" = some rule clearly fails, so skip Opus.
 * "pass" = every rule clearly passes. "unsure" = no clear fail, but at least
 * one rule is unsettled. Only "reject" is trusted on its own (lab test).
 */
export function prescreen(a: Record<string, JevAnswer>, category: string): "reject" | "unsure" | "pass" {
  const v = Object.values(ruleVerdicts(a, category));
  if (v.includes("fail")) return "reject";
  return v.includes("unsure") ? "unsure" : "pass";
}

export const jevCostUsd = (inputTokens: number) => (inputTokens * JEV_USD_PER_M_INPUT) / 1e6;
