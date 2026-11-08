import { describe, it, expect } from "vitest";
import { parseTextFacts, findDisagreements } from "./text-facts";

// Titles below are the real ones from samples/demo/products.csv (2026-11-07),
// so these tests double as the parser's eval on the demo catalogue.

describe("parseTextFacts — real demo titles", () => {
  it("reads sleeve length, neckline, hem, fit and cut-outs from a rich title", () => {
    expect(
      parseTextFacts("Long-Sleeve Fitted Maxi Dress with Cut-Out Details"),
    ).toEqual({
      sleeveLength: ["long", "extra_long"],
      hemLength: ["ankle", "floor"],
      fit: ["fitted", "semi_fitted"],
      cutouts: ["present"],
    });
    expect(parseTextFacts("Short-Sleeve Crew-Neck Satin Maxi Dress")).toEqual({
      sleeveLength: ["short", "cap"],
      neckline: ["crew"],
      hemLength: ["ankle", "floor"],
    });
  });

  it("maps brand neckline words onto the enum", () => {
    expect(parseTextFacts("Glittery Halterneck Dress").neckline).toEqual([
      "halter",
    ]);
    expect(parseTextFacts("Asymmetric Mock Turtleneck Top").neckline).toEqual([
      "turtleneck",
      "high_neck",
    ]);
    expect(
      parseTextFacts("Long-Sleeve Mock-Neck Blouse with Metallic Fibres")
        .neckline,
    ).toEqual(["high_neck", "turtleneck"]);
    // Polo and stand/skipper collars are all `collar` (tagging conventions).
    expect(parseTextFacts("Knitted Polo Dress").neckline).toEqual(["collar"]);
    expect(parseTextFacts("Cotton Stand Collar Dress").neckline).toEqual([
      "collar",
    ]);
  });

  it("reads Uniqlo's '| 3/4 Sleeve' and a camisole as sleeve facts", () => {
    expect(
      parseTextFacts("Rayon Skipper Collar Blouse | 3/4 Sleeve").sleeveLength,
    ).toEqual(["three_quarter", "elbow"]);
    expect(parseTextFacts("LACE AND BEAD CAMISOLE").sleeveLength).toEqual([
      "sleeveless",
    ]);
  });

  it("is case-insensitive (Zara titles are all caps)", () => {
    expect(parseTextFacts("MINI BLAZER DRESS WITH JEWEL BUTTONS")).toEqual({
      hemLength: ["mini"],
    });
    expect(parseTextFacts("ZW COLLECTION LACE SATIN MIDI DRESS")).toEqual({
      hemLength: ["midi"],
    });
  });

  it("keeps semi-fitted apart from fitted", () => {
    expect(parseTextFacts("Semi-Fitted Blouse with Scarf at Waist").fit).toEqual(
      ["semi_fitted"],
    );
  });

  it("treats a bare 'print' or 'pattern' as 'not solid'", () => {
    const facts = parseTextFacts("Blooming print shirt Made with Liberty Fabric");
    expect(facts.pattern).not.toContain("solid");
    expect(facts.pattern).toContain("floral");
    expect(parseTextFacts("Flocked-Pattern Mesh Dress").pattern).not.toContain(
      "solid",
    );
    expect(parseTextFacts("Rayon Blouse | Striped").pattern).toEqual([
      "striped",
    ]);
  });

  it("states nothing when the title is silent or ambiguous", () => {
    expect(parseTextFacts("Shirt Dress")).toEqual({});
    expect(parseTextFacts("Velvet garden dress")).toEqual({});
    // "long" alone could be sleeves or hem, so it must not match either.
    expect(parseTextFacts("ZW COLLECTION LONG VELVET DRESS")).toEqual({});
    // "Fit-and-flare" is a silhouette, not a fit value.
    expect(parseTextFacts("Fit-and-flare knit dress")).toEqual({});
    // "minimal" must not read as "mini".
    expect(parseTextFacts("Minimal shift dress").hemLength).toBeUndefined();
  });
});

describe("parseTextFacts — description", () => {
  it("adds facts the description states", () => {
    expect(
      parseTextFacts("Velvet garden dress", "A maxi silhouette with long sleeves.")
        .hemLength,
    ).toEqual(["ankle", "floor"]);
  });

  it("ignores styling advice that names other garments", () => {
    const facts = parseTextFacts(
      "Rayon Blouse",
      "Relaxed rayon blouse. Pair it with a midi skirt for the office.",
    );
    expect(facts.hemLength).toBeUndefined();
    expect(facts.fit).toEqual(["loose", "oversized"]);
  });

  it("accepts a null description", () => {
    expect(parseTextFacts("Glittery Halterneck Dress", null)).toEqual({
      neckline: ["halter"],
    });
  });
});

describe("findDisagreements", () => {
  const stated = parseTextFacts(
    "Long-Sleeve Fitted Maxi Dress with Cut-Out Details",
  );

  it("flags a vision value outside what the title states", () => {
    expect(
      findDisagreements(stated, {
        sleeveLength: "short",
        hemLength: "floor",
        cutouts: "none",
      }),
    ).toEqual([
      { attribute: "sleeveLength", stated: ["long", "extra_long"], vision: "short" },
      { attribute: "cutouts", stated: ["present"], vision: "none" },
    ]);
  });

  it("accepts any of the stated values", () => {
    expect(
      findDisagreements(stated, {
        sleeveLength: "extra_long",
        hemLength: "ankle",
        fit: "semi_fitted",
        cutouts: "present",
      }),
    ).toEqual([]);
  });

  it("does not flag a null vision tag or an attribute the title is silent on", () => {
    expect(
      findDisagreements(stated, { sleeveLength: null, neckline: "v_neck" }),
    ).toEqual([]);
  });
});
