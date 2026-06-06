import { describe, it, expect } from "vitest";
import { scoreProduct, aggregate, ATTRIBUTE_KEYS, type ProductScore } from "./score";

// A complete, all-correct truth row to mutate per test.
const TRUTH = {
  sleeveLength: "short", sleeveOpacity: null, neckline: "scoop", backStyle: "closed",
  hemLength: "midi", topLength: null, slit: "none", fit: "loose", opacity: "opaque",
  lined: "unlined", cutouts: "none", material: "linen", primaryColor: "beige", pattern: "solid",
};

describe("scoreProduct", () => {
  it("matches every attribute when predicted equals truth", () => {
    const cmp = scoreProduct({ ...TRUTH }, TRUTH);
    expect(cmp).toHaveLength(14);
    expect(cmp.every((c) => c.match)).toBe(true);
  });

  it("treats null vs null as a match and null vs value as a mismatch", () => {
    const pred = { ...TRUTH, sleeveOpacity: "opaque" }; // truth is null here
    const cmp = scoreProduct(pred, TRUTH);
    const sleeveOp = cmp.find((c) => c.key === "sleeveOpacity")!;
    expect(sleeveOp.match).toBe(false);
    expect(sleeveOp.predicted).toBe("opaque");
    expect(sleeveOp.truth).toBe(null);
    // topLength is null on both sides -> still a match
    expect(cmp.find((c) => c.key === "topLength")!.match).toBe(true);
  });

  it("counts a wrong value as a mismatch", () => {
    const pred = { ...TRUTH, neckline: "crew" };
    const cmp = scoreProduct(pred, TRUTH);
    expect(cmp.find((c) => c.key === "neckline")!.match).toBe(false);
  });

  it("scores all 14 keys in schema order", () => {
    const cmp = scoreProduct({ ...TRUTH }, TRUTH);
    expect(cmp.map((c) => c.key)).toEqual(ATTRIBUTE_KEYS);
  });
});

describe("aggregate", () => {
  it("computes per-attribute and overall accuracy with disagreements listed", () => {
    const perfect: ProductScore = { id: "p1", comparisons: scoreProduct({ ...TRUTH }, TRUTH) };
    const oneWrong: ProductScore = {
      id: "p2",
      comparisons: scoreProduct({ ...TRUTH, neckline: "crew" }, TRUTH),
    };
    const agg = aggregate([perfect, oneWrong]);

    expect(agg.overall.total).toBe(28); // 2 products x 14
    expect(agg.overall.correct).toBe(27); // one neckline miss
    expect(agg.perAttribute.neckline).toEqual({ correct: 1, total: 2, pct: 50 });
    expect(agg.perAttribute.material).toEqual({ correct: 2, total: 2, pct: 100 });
    expect(agg.disagreements).toEqual([
      { id: "p2", key: "neckline", predicted: "crew", truth: "scoop" },
    ]);
  });

  it("returns zeroes for an empty set without dividing by zero", () => {
    const agg = aggregate([]);
    expect(agg.overall).toEqual({ correct: 0, total: 0, pct: 0 });
    expect(agg.perAttribute.fit).toEqual({ correct: 0, total: 0, pct: 0 });
  });
});
