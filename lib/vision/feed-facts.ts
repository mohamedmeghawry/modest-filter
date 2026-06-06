import { Material, Lined } from "@/lib/generated/prisma/enums";

export type FeedFacts = {
  material: Material | null;
  lined: Lined | null;
};

/**
 * Deterministically extract `material` and `lined` from product feed text.
 *
 * Per ADR-0014 (amended 2026-06-06): these two attributes are parsed directly
 * from the feed description rather than routed through the vision model. Vision
 * is unreliable on both (ADR-0012), and the N+2 A/B showed that folding the
 * description into the vision prompt to recover them *distracts* the model from
 * the photo, regressing visual attributes (`backStyle` -12). A deterministic
 * parser keeps the +17/+11 on `lined`/`material` with zero visual cost.
 *
 * The parser reports only what the text states. Anything unstated returns null,
 * and the caller falls back to other sources (or vision). It is tuned for high
 * precision on stated fields, not recall on silent ones.
 */
export function parseFeedFacts(
  description: string | null | undefined,
): FeedFacts {
  const text = (description ?? "").trim();
  // Feeds use a literal "none"/"n/a" as an empty-description sentinel.
  if (!text || /^(none|n\/?a)$/i.test(text)) {
    return { material: null, lined: null };
  }
  return { material: parseMaterial(text), lined: parseLined(text) };
}

// --- material ---------------------------------------------------------------

// Fiber words that map onto the Material enum. Construction fabrics
// (denim/leather/knit) are matched separately: feeds name them in prose, not as
// fiber percentages, and they take precedence over fiber content.
const FIBER_TO_MATERIAL: ReadonlyArray<readonly [RegExp, Material]> = [
  [/\bcotton\b/i, Material.cotton],
  [/\blinen\b/i, Material.linen],
  [/\bsilk\b/i, Material.silk],
  [/\bpolyester\b/i, Material.polyester],
  [/\b(?:viscose|rayon)\b/i, Material.viscose],
  [/\bmodal\b/i, Material.modal],
  [/\b(?:wool|merino|cashmere)\b/i, Material.wool],
];

// Drop clauses describing a lining so its fiber isn't mistaken for the
// garment's main material ("93% polyester ... viscose lining" -> polyester).
function selfFabricText(text: string): string {
  return text
    .split(/[.;]/)
    .filter((seg) => !/lining/i.test(seg))
    .join(". ");
}

function parseMaterial(text: string): Material | null {
  const self = selfFabricText(text);

  // Construction fabrics are asserted by name and beat fiber content: a "denim
  // shirtdress" is `denim` even though its fibers are cotton/Tencel (ADR-0014).
  if (/\bdenim\b/i.test(self)) return Material.denim;
  if (/\bleather\b/i.test(self)) return Material.leather; // incl. "faux leather"
  if (/\bknit(?:ted)?\b/i.test(self)) return Material.knit;

  return dominantFiberByPercent(self) ?? firstFiberByPosition(self);
}

// Find each "<n>% <phrase>" and map the phrase to a fiber; return the fiber with
// the highest stated percentage (first wins ties). Minor stretch fibers
// (elastane, nylon) aren't in the enum, so they're ignored and never dominate.
function dominantFiberByPercent(text: string): Material | null {
  const re = /(\d{1,3})\s*%\s*([A-Za-z][A-Za-z ]*)/g;
  let best: { pct: number; material: Material } | null = null;
  for (const m of text.matchAll(re)) {
    const pct = Number(m[1]);
    const material = matchFiber(m[2]);
    if (material && (best === null || pct > best.pct)) {
      best = { pct, material };
    }
  }
  return best?.material ?? null;
}

// No percentages stated (e.g. "Cotton, elastane", "100% viscose" already
// handled): return the fiber named earliest, since copy lists the dominant
// fiber first ("modal-cashmere" -> modal).
function firstFiberByPosition(text: string): Material | null {
  let best: { index: number; material: Material } | null = null;
  for (const [re, material] of FIBER_TO_MATERIAL) {
    const m = re.exec(text);
    if (m && (best === null || m.index < best.index)) {
      best = { index: m.index, material };
    }
  }
  return best?.material ?? null;
}

// First fiber keyword found anywhere in a phrase (one fiber per phrase in
// practice, e.g. "organic cotton", "European linen").
function matchFiber(phrase: string): Material | null {
  for (const [re, material] of FIBER_TO_MATERIAL) {
    if (re.test(phrase)) return material;
  }
  return null;
}

// --- lined ------------------------------------------------------------------

function parseLined(text: string): Lined | null {
  // Order matters: "partially lined" and "unlined" both contain "lined".
  if (/\b(?:partially|partly|part)[\s-]?lined\b/i.test(text)) {
    return Lined.partially_lined;
  }
  if (/\b(?:un-?lined|not lined|no lining|without lining)\b/i.test(text)) {
    return Lined.unlined;
  }
  if (/\b(?:fully\s+)?lined\b/i.test(text)) return Lined.lined;
  // A stated lining fabric ("viscose lining", "Lining: 97% polyester") means a
  // lining exists -> lined.
  if (/\blining\b/i.test(text)) return Lined.lined;
  return null;
}
