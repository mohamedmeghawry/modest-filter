import type { ProductAttributes } from "./schema";

// The 14 attributes, in schema order. Scoring iterates these so a missing or
// extra key in either side is treated as a mismatch, not skipped.
export const ATTRIBUTE_KEYS: (keyof ProductAttributes)[] = [
  "sleeveLength",
  "sleeveOpacity",
  "neckline",
  "backStyle",
  "hemLength",
  "topLength",
  "slit",
  "fit",
  "opacity",
  "lined",
  "cutouts",
  "material",
  "primaryColor",
  "pattern",
];

// Loose shape: ground truth comes from JSON, predictions from the API. Both are
// string-or-null per attribute.
export type AttributeRecord = Record<string, string | null>;

export type AttributeComparison = {
  key: string;
  predicted: string | null;
  truth: string | null;
  match: boolean;
};

/**
 * Compare one predicted attribute row against ground truth, attribute by
 * attribute. `null` is a first-class value (e.g. topLength on a dress): null vs
 * null is a match, null vs a value is a mismatch.
 */
export function scoreProduct(
  predicted: AttributeRecord,
  truth: AttributeRecord,
): AttributeComparison[] {
  return ATTRIBUTE_KEYS.map((key) => {
    const p = predicted[key] ?? null;
    const t = truth[key] ?? null;
    return { key, predicted: p, truth: t, match: p === t };
  });
}

export type ProductScore = { id: string; comparisons: AttributeComparison[] };

export type Aggregate = {
  perAttribute: Record<string, { correct: number; total: number; pct: number }>;
  overall: { correct: number; total: number; pct: number };
  disagreements: { id: string; key: string; predicted: string | null; truth: string | null }[];
};

/** Roll up per-product comparisons into a per-attribute and overall accuracy table. */
export function aggregate(scores: ProductScore[]): Aggregate {
  const perAttribute: Aggregate["perAttribute"] = {};
  for (const key of ATTRIBUTE_KEYS) perAttribute[key] = { correct: 0, total: 0, pct: 0 };
  const disagreements: Aggregate["disagreements"] = [];
  let correct = 0;
  let total = 0;

  for (const { id, comparisons } of scores) {
    for (const c of comparisons) {
      const bucket = perAttribute[c.key];
      bucket.total += 1;
      total += 1;
      if (c.match) {
        bucket.correct += 1;
        correct += 1;
      } else {
        disagreements.push({ id, key: c.key, predicted: c.predicted, truth: c.truth });
      }
    }
  }

  for (const key of ATTRIBUTE_KEYS) {
    const b = perAttribute[key];
    b.pct = b.total === 0 ? 0 : (b.correct / b.total) * 100;
  }

  return {
    perAttribute,
    overall: { correct, total, pct: total === 0 ? 0 : (correct / total) * 100 },
    disagreements,
  };
}
