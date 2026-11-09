import { LONG_SLEEVES, EXCLUDED_NECKLINES } from "@/lib/products/modest-baseline";
import { parseTextFacts } from "./text-facts";
import { STYLING_RE } from "./feed-facts";

/**
 * Free pre-screen against the modest baseline (ADR-0015), run on the brand's
 * own words BEFORE paying for AI tagging. It only ever REJECTS: text that says
 * "sleeveless" or "open back" is reliable, but silence proves nothing, so a
 * product that passes still goes to vision for the attributes text didn't
 * cover. Tracked in docs/attribute-sources.md.
 */
export type GateResult = { pass: boolean; reasons: string[] };

// Baseline rules parseTextFacts doesn't cover.
const EXTRA_REJECTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:open|low|scoop|v)[\s-]?back(?:ed)?\b|\bbackless\b/i, "back"],
  [/\bstrapless\b|\bspaghetti[\s-]straps?\b|\bbandeau\b/i, "sleeves"],
  [/\b(?:high|thigh[\s-]high|deep)[\s-]slit\b/i, "slit"],
  [/\bone[\s-]shoulder\b/i, "neckline"],
];

export function textGate(title: string, description?: string | null): GateResult {
  const facts = parseTextFacts(title, description);
  const reasons = new Set<string>();

  // A stated sleeve that can't be long fails ("Short-Sleeve", "Camisole", "3/4").
  if (facts.sleeveLength && !facts.sleeveLength.some((v) => (LONG_SLEEVES as readonly string[]).includes(v))) {
    reasons.add("sleeves");
  }
  if (facts.neckline && facts.neckline.every((v) => (EXCLUDED_NECKLINES as readonly string[]).includes(v))) {
    reasons.add("neckline");
  }
  if (facts.cutouts?.includes("present")) reasons.add("cutouts");

  // Same styling-advice filter as the parsers: "wear it with a strapless bra"
  // describes another item, not this one.
  const text = [title, ...(description ?? "").split(/(?<=[.!?])\s+/).filter((s) => !STYLING_RE.test(s))].join(" ");
  // Straps next to stated long sleeves belong to an inner slip or lining
  // (e.g. a sheer long-sleeve dress over a strappy slip, Dynamite 2026-11-10),
  // so they don't make the garment sleeveless.
  const statesLongSleeves = facts.sleeveLength?.some((v) => (LONG_SLEEVES as readonly string[]).includes(v)) ?? false;
  for (const [re, reason] of EXTRA_REJECTS) {
    if (reason === "sleeves" && statesLongSleeves) continue;
    if (re.test(text)) reasons.add(reason);
  }

  return { pass: reasons.size === 0, reasons: [...reasons] };
}
