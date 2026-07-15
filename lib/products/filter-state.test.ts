import { describe, it, expect } from "vitest";
import { activeFilterValues, countActiveFilters } from "./filter-state";

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

  it("counts repeated params (server parser accepts them — parse-product-filters.test.ts)", () => {
    expect(
      countActiveFilters(new URLSearchParams("material=cotton&material=linen")),
    ).toBe(2);
  });
});

// Mirrors the server parser's `rawValues` contract (parse-product-filters.test.ts):
// repeated params, comma lists, whitespace trimming, and empty dropping must all
// match so the client filter UI agrees with what the server actually filters on.
describe("activeFilterValues", () => {
  it("reads a single value", () => {
    expect(
      activeFilterValues(new URLSearchParams("material=cotton"), "material"),
    ).toEqual(["cotton"]);
  });

  it("reads comma-separated values within one param", () => {
    expect(
      activeFilterValues(
        new URLSearchParams("material=cotton,linen"),
        "material",
      ),
    ).toEqual(["cotton", "linen"]);
  });

  it("reads repeated params (all occurrences, not just the first)", () => {
    const sp = new URLSearchParams();
    sp.append("material", "cotton");
    sp.append("material", "linen");
    expect(activeFilterValues(sp, "material")).toEqual(["cotton", "linen"]);
  });

  it("reads a mix of comma + repeated params", () => {
    const sp = new URLSearchParams();
    sp.append("material", "cotton,linen");
    sp.append("material", "wool");
    expect(activeFilterValues(sp, "material")).toEqual([
      "cotton",
      "linen",
      "wool",
    ]);
  });

  it("trims whitespace around values", () => {
    expect(
      activeFilterValues(
        new URLSearchParams("material=cotton , linen"),
        "material",
      ),
    ).toEqual(["cotton", "linen"]);
  });

  it("drops empty entries and returns [] for a missing key", () => {
    expect(
      activeFilterValues(new URLSearchParams("material=,,"), "material"),
    ).toEqual([]);
    expect(
      activeFilterValues(new URLSearchParams("material=cotton"), "opacity"),
    ).toEqual([]);
  });
});
