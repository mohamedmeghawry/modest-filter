// Jev vs Opus on batch 2, and the set Mohamed reviews by hand (judging rules
// fixed 2026-11-09, before results: 0 immodest shown first, then fewer good
// products hidden, then cost; Jev earns the reject role if <=2 of 100
// confident rejects are wrong; Mohamed judges all disagreements plus 10
// random agreements). Pure: no I/O.

export type JevDecision = "reject" | "unsure" | "pass";

export type Agreement =
  | "agree-hidden" // Opus hides, Jev confidently rejects
  | "agree-shown" // Opus shows, Jev passes
  | "jev-rejects-opus-shows" // the case that decides Jev's reject role
  | "jev-passes-opus-hides"
  | "jev-unsure"; // Jev defers to Opus by design: not a disagreement

export function classify(opusShown: boolean, jev: JevDecision): Agreement {
  if (jev === "unsure") return "jev-unsure";
  if (jev === "reject") return opusShown ? "jev-rejects-opus-shows" : "agree-hidden";
  return opusShown ? "agree-shown" : "jev-passes-opus-hides";
}

export const isDisagreement = (a: Agreement) => a === "jev-rejects-opus-shows" || a === "jev-passes-opus-hides";
export const isAgreement = (a: Agreement) => a === "agree-hidden" || a === "agree-shown";

// mulberry32: a small seeded generator, so the random pick is repeatable.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every disagreement, then `agreements` agreements picked at random (seeded). */
export function pickReviewSet<T extends { id: string; agreement: Agreement }>(items: T[], agreements = 10, seed = 20261110): T[] {
  const dis = items.filter((i) => isDisagreement(i.agreement));
  const pool = items.filter((i) => isAgreement(i.agreement)).sort((a, b) => a.id.localeCompare(b.id));
  const next = rng(seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [...dis, ...pool.slice(0, agreements)];
}
