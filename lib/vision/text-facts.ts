import {
  SleeveLength,
  Neckline,
  HemLength,
  Fit,
  Pattern,
  Cutouts,
} from "@/lib/generated/prisma/enums";
import { STYLING_RE } from "@/lib/vision/feed-facts";

/**
 * Read the attributes a product's own title (and optionally its description)
 * states outright, as a free second opinion on the vision tags.
 *
 * Why not feed this text to the vision model: ADR-0014's A/B showed that text
 * in the vision prompt distracts the model from the photo (`backStyle` -12).
 * So vision stays image-only, and this runs beside it: when the title says
 * "Long-Sleeve" and vision says `short`, the product is flagged for review.
 *
 * Each fact is a list of *acceptable* enum values, not one value, because
 * brand words are coarser than our enum ("maxi" is `ankle` or `floor`). The
 * lists are deliberately generous: the job is to catch clear contradictions,
 * not to argue about adjacent values. Anything the text doesn't state is
 * absent. Only the facts come back; callers need not keep the text.
 */
export type TextFacts = {
  sleeveLength?: SleeveLength[];
  neckline?: Neckline[];
  hemLength?: HemLength[];
  fit?: Fit[];
  pattern?: Pattern[];
  cutouts?: Cutouts[];
};

export type TextFactAttribute = keyof TextFacts;

type Rule<T> = [RegExp, T[]];

const SLEEVE_RULES: Rule<SleeveLength>[] = [
  [/\bsleeveless\b/i, [SleeveLength.sleeveless]],
  // A camisole or tank is strap-only by definition.
  [/\b(?:cami(?:sole)?|tank)\b/i, [SleeveLength.sleeveless]],
  [/\bcap[\s-]sleeves?\b/i, [SleeveLength.cap]],
  [/\bshort[\s-]sleeve(?:s|d)?\b/i, [SleeveLength.short, SleeveLength.cap]],
  [/\belbow[\s-](?:length[\s-])?sleeves?\b/i, [SleeveLength.elbow]],
  // Uniqlo writes a bare "3/4" in the title for a 3/4-sleeve top.
  [
    /(?:\b3\/4\b|\bthree[\s-]quarter\b)/i,
    [SleeveLength.three_quarter, SleeveLength.elbow],
  ],
  [/\blong[\s-]sleeve(?:s|d)?\b/i, [SleeveLength.long, SleeveLength.extra_long]],
];

const NECKLINE_RULES: Rule<Neckline>[] = [
  [/\bcrew[\s-]?neck\b/i, [Neckline.crew]],
  [/\bv[\s-]neck\b/i, [Neckline.v_neck]],
  [/\bscoop[\s-]neck\b/i, [Neckline.scoop]],
  [/\bsquare[\s-]neck\b/i, [Neckline.square]],
  [/\bhalter(?:[\s-]?neck)?\b/i, [Neckline.halter]],
  [/\boff[\s-](?:the[\s-])?shoulder\b/i, [Neckline.off_shoulder]],
  [
    /\b(?:mock|funnel|high)[\s-]neck\b/i,
    [Neckline.high_neck, Neckline.turtleneck],
  ],
  [/\b(?:turtle|roll)[\s-]?neck\b/i, [Neckline.turtleneck, Neckline.high_neck]],
  [/\bcollar\b|\bpolo\b/i, [Neckline.collar]],
];

const HEM_RULES: Rule<HemLength>[] = [
  [/\bmini\b/i, [HemLength.mini]],
  [/\bknee[\s-]length\b/i, [HemLength.knee]],
  [/\bmidi\b/i, [HemLength.midi]],
  [/\bmaxi\b/i, [HemLength.ankle, HemLength.floor]],
  [/\bankle[\s-]length\b/i, [HemLength.ankle]],
  [/\bfloor[\s-]length\b/i, [HemLength.floor]],
];

const FIT_RULES: Rule<Fit>[] = [
  [/\bsemi[\s-]fitted\b/i, [Fit.semi_fitted]],
  // "fitted" not preceded by "semi-" (that case is the rule above).
  [/(?<!semi[\s-])\bfitted\b/i, [Fit.fitted, Fit.semi_fitted]],
  [/\b(?:loose|relaxed)\b/i, [Fit.loose, Fit.oversized]],
  [/\boversized?\b/i, [Fit.oversized, Fit.loose]],
];

const NOT_SOLID = Object.values(Pattern).filter((p) => p !== Pattern.solid);

const PATTERN_RULES: Rule<Pattern>[] = [
  [/\bstriped?s?\b/i, [Pattern.striped]],
  [/\bfloral\b/i, [Pattern.floral]],
  [/\b(?:plaid|tartan|gingham)\b/i, [Pattern.plaid]],
  [/\bpolka[\s-]dots?\b/i, [Pattern.polka_dot]],
  [/\b(?:leopard|zebra|snake|animal)[\s-]?(?:print)?\b/i, [Pattern.animal_print]],
  // A bare "print" or "pattern" says only that it is not solid.
  [/\bprint(?:ed)?\b|\bpattern(?:ed)?\b/i, NOT_SOLID],
];

// Only "present" is stated by text; nobody titles a dress "no cut-outs".
const CUTOUT_RULES: Rule<Cutouts>[] = [
  [/\bcut[\s-]?outs?\b/i, [Cutouts.present]],
];

// Keep only the description sentences about this garment: drop styling advice
// ("pair it with a midi skirt" names another item), reusing feed-facts' filter.
function garmentSentences(description: string): string {
  return description
    .split(/[.;!?\n]/)
    .filter((seg) => !STYLING_RE.test(seg))
    .join(". ");
}

// Union of every rule that fires: if the text names two compatible values,
// both are acceptable, which keeps false flags down.
function match<T>(text: string, rules: Rule<T>[]): T[] | undefined {
  const hits = new Set<T>();
  for (const [re, values] of rules) {
    if (re.test(text)) values.forEach((v) => hits.add(v));
  }
  return hits.size > 0 ? [...hits] : undefined;
}

export function parseTextFacts(
  title: string,
  description?: string | null,
): TextFacts {
  const text = [title, description ? garmentSentences(description) : ""]
    .filter(Boolean)
    .join(". ");

  const facts: TextFacts = {};
  const sleeveLength = match(text, SLEEVE_RULES);
  const neckline = match(text, NECKLINE_RULES);
  const hemLength = match(text, HEM_RULES);
  const fit = match(text, FIT_RULES);
  const pattern = match(text, PATTERN_RULES);
  const cutouts = match(text, CUTOUT_RULES);
  if (sleeveLength) facts.sleeveLength = sleeveLength;
  if (neckline) facts.neckline = neckline;
  if (hemLength) facts.hemLength = hemLength;
  if (fit) facts.fit = fit;
  if (pattern) facts.pattern = pattern;
  if (cutouts) facts.cutouts = cutouts;
  return facts;
}

export type Disagreement = {
  attribute: TextFactAttribute;
  stated: readonly string[];
  vision: string;
};

/**
 * Attributes where the text states something and vision chose a value outside
 * it. A missing value on either side is not a disagreement: silence in the
 * title is not evidence, and a null vision tag is already handled elsewhere.
 */
export function findDisagreements(
  stated: TextFacts,
  vision: Partial<Record<TextFactAttribute, string | null>>,
): Disagreement[] {
  const out: Disagreement[] = [];
  for (const attribute of Object.keys(stated) as TextFactAttribute[]) {
    const acceptable = stated[attribute] as readonly string[];
    const value = vision[attribute];
    if (value != null && !acceptable.includes(value)) {
      out.push({ attribute, stated: acceptable, vision: value });
    }
  }
  return out;
}
