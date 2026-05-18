import { describe, it, expect } from "vitest";
import { parseProductFilters } from "./parse-product-filters";

describe("parseProductFilters", () => {
  describe("input shapes", () => {
    it("parses a URLSearchParams source", () => {
      const sp = new URLSearchParams("sleeveLength=long&category=dresses");
      expect(parseProductFilters(sp)).toEqual({
        category: ["dresses"],
        sleeveLength: ["long"],
        hemLength: undefined,
        opacity: undefined,
      });
    });

    it("parses a Record source identically to equivalent URLSearchParams", () => {
      const fromRecord = parseProductFilters({
        sleeveLength: "long",
        category: "dresses",
      });
      const fromSP = parseProductFilters(
        new URLSearchParams("sleeveLength=long&category=dresses"),
      );
      expect(fromRecord).toEqual(fromSP);
    });

    it("returns all keys undefined for an empty URLSearchParams", () => {
      const r = parseProductFilters(new URLSearchParams());
      expect(r.category).toBeUndefined();
      expect(r.sleeveLength).toBeUndefined();
      expect(r.hemLength).toBeUndefined();
      expect(r.opacity).toBeUndefined();
    });

    it("returns all keys undefined for an empty Record", () => {
      expect(parseProductFilters({})).toEqual({
        category: undefined,
        sleeveLength: undefined,
        hemLength: undefined,
        opacity: undefined,
      });
    });

    it("treats a Record key with undefined value as absent", () => {
      expect(
        parseProductFilters({ sleeveLength: undefined }).sleeveLength,
      ).toBeUndefined();
    });
  });

  describe("single-value parsing", () => {
    it("?sleeveLength=long", () => {
      expect(
        parseProductFilters({ sleeveLength: "long" }).sleeveLength,
      ).toEqual(["long"]);
    });

    it("hemLength and opacity parse the same way", () => {
      expect(parseProductFilters({ hemLength: "midi" }).hemLength).toEqual([
        "midi",
      ]);
      expect(parseProductFilters({ opacity: "opaque" }).opacity).toEqual([
        "opaque",
      ]);
    });

    it("?category=dresses (free-form, not enum-validated)", () => {
      expect(parseProductFilters({ category: "dresses" }).category).toEqual([
        "dresses",
      ]);
    });
  });

  describe("multi-value parsing", () => {
    it("comma-separated: long,short", () => {
      expect(
        parseProductFilters({ sleeveLength: "long,short" }).sleeveLength,
      ).toEqual(["long", "short"]);
    });

    it("repeated params via URLSearchParams merge", () => {
      const sp = new URLSearchParams();
      sp.append("sleeveLength", "long");
      sp.append("sleeveLength", "short");
      expect(parseProductFilters(sp).sleeveLength).toEqual(["long", "short"]);
    });

    it("repeated params via Record array value merge", () => {
      expect(
        parseProductFilters({ sleeveLength: ["long", "short"] }).sleeveLength,
      ).toEqual(["long", "short"]);
    });

    it("mix of comma + repeated", () => {
      const sp = new URLSearchParams();
      sp.append("sleeveLength", "long,short");
      sp.append("sleeveLength", "elbow");
      expect(parseProductFilters(sp).sleeveLength).toEqual([
        "long",
        "short",
        "elbow",
      ]);
    });
  });

  describe("validation (forgiving)", () => {
    it("drops an unknown enum value entirely", () => {
      expect(
        parseProductFilters({ sleeveLength: "banana" }).sleeveLength,
      ).toBeUndefined();
    });

    it("keeps valid, drops invalid in a mixed list", () => {
      expect(
        parseProductFilters({ sleeveLength: "long,banana" }).sleeveLength,
      ).toEqual(["long"]);
    });

    it("is case-sensitive (enums are lowercase)", () => {
      expect(
        parseProductFilters({ sleeveLength: "LONG" }).sleeveLength,
      ).toBeUndefined();
    });

    it("trims whitespace around values", () => {
      expect(
        parseProductFilters({ sleeveLength: "long , short" }).sleeveLength,
      ).toEqual(["long", "short"]);
    });

    it("empty value → undefined", () => {
      expect(
        parseProductFilters(new URLSearchParams("sleeveLength=")).sleeveLength,
      ).toBeUndefined();
    });

    it("trailing commas keep valid values", () => {
      expect(
        parseProductFilters({ sleeveLength: "long,," }).sleeveLength,
      ).toEqual(["long"]);
    });

    it("only commas → undefined", () => {
      expect(
        parseProductFilters({ sleeveLength: ",,," }).sleeveLength,
      ).toBeUndefined();
    });
  });

  describe("combined filters", () => {
    it("parses all four filter types at once", () => {
      const sp = new URLSearchParams(
        "category=dresses,tops&sleeveLength=long&hemLength=midi&opacity=opaque",
      );
      expect(parseProductFilters(sp)).toEqual({
        category: ["dresses", "tops"],
        sleeveLength: ["long"],
        hemLength: ["midi"],
        opacity: ["opaque"],
      });
    });

    it("ignores unknown keys without erroring", () => {
      const sp = new URLSearchParams("foo=bar&sleeveLength=long");
      const r = parseProductFilters(sp);
      expect(r).toEqual({
        category: undefined,
        sleeveLength: ["long"],
        hemLength: undefined,
        opacity: undefined,
      });
      expect(r).not.toHaveProperty("foo");
    });
  });

  describe("additional filters (material, primaryColor, topLength)", () => {
    it("parses a single valid value for each new key", () => {
      expect(parseProductFilters({ material: "cotton" }).material).toEqual([
        "cotton",
      ]);
      expect(
        parseProductFilters({ primaryColor: "black" }).primaryColor,
      ).toEqual(["black"]);
      expect(parseProductFilters({ topLength: "hip" }).topLength).toEqual([
        "hip",
      ]);
    });

    it("drops an invalid value silently for each new key", () => {
      expect(
        parseProductFilters({ material: "plastic" }).material,
      ).toBeUndefined();
      expect(
        parseProductFilters({ primaryColor: "chartreuse" }).primaryColor,
      ).toBeUndefined();
      // "midi" is a HemLength value, not a TopLength — cross-enum invalid
      expect(
        parseProductFilters({ topLength: "midi" }).topLength,
      ).toBeUndefined();
    });

    it("parses the new keys alongside the original four", () => {
      const sp = new URLSearchParams(
        "category=dresses&sleeveLength=long&hemLength=midi&opacity=opaque&material=cotton&primaryColor=black&topLength=hip",
      );
      expect(parseProductFilters(sp)).toEqual({
        category: ["dresses"],
        sleeveLength: ["long"],
        hemLength: ["midi"],
        opacity: ["opaque"],
        material: ["cotton"],
        primaryColor: ["black"],
        topLength: ["hip"],
      });
    });
  });
});
