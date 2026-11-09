import { PrimaryColor } from "@/lib/generated/prisma/enums";

/**
 * Map a brand's colour name ("09 BLACK", "Navy blue", "Sand") to `primaryColor`.
 *
 * Same stance as parseFeedFacts / parseTextFacts: precision over recall. Brand
 * colour names are marketing words, so anything vague ("Pearly", "Tawny Port")
 * or naming two colour families ("Black/White") returns null and is left to
 * vision. Whether this becomes the final tag or only a second opinion is tracked
 * in docs/attribute-sources.md.
 */
const COLOR_WORDS: ReadonlyArray<readonly [RegExp, PrimaryColor]> = [
  [/\bnavy\b/, PrimaryColor.navy], // before blue: "Navy blue" is navy (tagging-conventions)
  [/\bblack\b/, PrimaryColor.black],
  [/\b(?:white|off[\s-]?white)\b/, PrimaryColor.white],
  [/\b(?:beige|sand|camel|tan|khaki|taupe)\b/, PrimaryColor.beige],
  [/\b(?:brown|chocolate|mocha|espresso)\b/, PrimaryColor.brown],
  [/\b(?:gr[ae]y|charcoal)\b/, PrimaryColor.gray],
  [/\bblue\b/, PrimaryColor.blue],
  [/\b(?:green(?:ish)?|olive|khaki green|sage|emerald)\b/, PrimaryColor.green],
  [/\b(?:yellow|mustard)\b/, PrimaryColor.yellow],
  [/\b(?:orange|rust)\b/, PrimaryColor.orange],
  [/\b(?:red|burgundy)\b/, PrimaryColor.red],
  [/\b(?:pink|blush|fuchsia)\b/, PrimaryColor.pink],
  [/\b(?:purple|plum|lilac|lavender|violet)\b/, PrimaryColor.purple],
  [/\b(?:multi|multicolou?r(?:ed)?)\b/, PrimaryColor.multicolor],
];

export function parseColorName(raw: string | null | undefined): PrimaryColor | null {
  // Drop a leading colour code ("09 BLACK" -> "black").
  const text = (raw ?? "").toLowerCase().replace(/^\s*\d+\s+/, "").trim();
  if (!text) return null;

  const found = new Set<PrimaryColor>();
  for (const [re, color] of COLOR_WORDS) if (re.test(text)) found.add(color);
  // "Navy blue" / "Navy/Midnight Blue": navy wins over its general form.
  if (found.has(PrimaryColor.navy)) found.delete(PrimaryColor.blue);

  return found.size === 1 ? [...found][0] : null;
}
