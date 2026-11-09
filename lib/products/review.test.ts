import { describe, expect, it } from "vitest";
import { classify, isDisagreement, pickReviewSet, type Agreement } from "./review";

describe("classify", () => {
  it("covers every Opus x Jev combination", () => {
    expect(classify(false, "reject")).toBe("agree-hidden");
    expect(classify(true, "pass")).toBe("agree-shown");
    expect(classify(true, "reject")).toBe("jev-rejects-opus-shows");
    expect(classify(false, "pass")).toBe("jev-passes-opus-hides");
    expect(classify(true, "unsure")).toBe("jev-unsure");
    expect(classify(false, "unsure")).toBe("jev-unsure");
  });

  it("does not count Jev's unsure as a disagreement", () => {
    expect(isDisagreement("jev-unsure")).toBe(false);
  });
});

describe("pickReviewSet", () => {
  const mk = (id: string, agreement: Agreement) => ({ id, agreement });
  const items = [
    mk("a", "jev-rejects-opus-shows"),
    mk("b", "jev-passes-opus-hides"),
    mk("u", "jev-unsure"),
    ...Array.from({ length: 30 }, (_, i) => mk(`g${String(i).padStart(2, "0")}`, i % 2 ? "agree-shown" : "agree-hidden")),
  ];

  it("takes all disagreements plus the asked number of agreements, never unsure", () => {
    const set = pickReviewSet(items, 10);
    expect(set.slice(0, 2).map((s) => s.id)).toEqual(["a", "b"]);
    expect(set).toHaveLength(12);
    expect(set.some((s) => s.agreement === "jev-unsure")).toBe(false);
    expect(new Set(set.map((s) => s.id)).size).toBe(12);
  });

  it("is repeatable for a seed and independent of input order", () => {
    const one = pickReviewSet(items, 10, 7).map((s) => s.id);
    expect(pickReviewSet([...items].reverse(), 10, 7).map((s) => s.id).sort()).toEqual([...one].sort());
    expect(pickReviewSet(items, 10, 7).map((s) => s.id)).toEqual(one);
  });
});
