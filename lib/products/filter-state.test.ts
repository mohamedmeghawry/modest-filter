import { describe, it, expect } from "vitest";
import { countActiveFilters } from "./filter-state";

describe("countActiveFilters", () => {
  it("returns 0 for empty searchParams", () => {
    expect(countActiveFilters(new URLSearchParams())).toBe(0);
  });

  it("counts a single value", () => {
    expect(countActiveFilters(new URLSearchParams("material=cotton"))).toBe(1);
  });

  it("counts comma-separated multi-values within one group", () => {
    expect(
      countActiveFilters(new URLSearchParams("material=cotton,linen")),
    ).toBe(2);
  });

  it("sums across multiple filter groups", () => {
    expect(
      countActiveFilters(
        new URLSearchParams("material=cotton&primaryColor=black"),
      ),
    ).toBe(2);
  });

  it("counts one per group across all 7 groups", () => {
    const sp = new URLSearchParams(
      "category=dresses&sleeveLength=long&hemLength=midi&opacity=opaque&material=cotton&primaryColor=black&topLength=hip",
    );
    expect(countActiveFilters(sp)).toBe(7);
  });

  it("ignores unknown keys", () => {
    expect(countActiveFilters(new URLSearchParams("foo=bar"))).toBe(0);
  });

  it("does not count an empty value", () => {
    expect(countActiveFilters(new URLSearchParams("material="))).toBe(0);
  });
});
