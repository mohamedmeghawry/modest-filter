import { describe, it, expect } from "vitest";
import { parseFeedFacts } from "./feed-facts";

// Descriptions below are the real ones from samples/eval-set/manifest.json, so
// these tests double as the parser's eval: a deterministic parser is measured
// by unit tests, not by an LLM run (ADR-0014, amended).

describe("parseFeedFacts — material", () => {
  it("picks the dominant fiber by stated percentage", () => {
    // striped-halter: "95% Cotton 5% Nylon ..."
    expect(parseFeedFacts("95% Cotton 5% Nylon").material).toBe("cotton");
    // anthropologie-loretta: "93% polyester, 7% elastane; viscose/nylon lining"
    expect(
      parseFeedFacts("93% polyester, 7% elastane; viscose/nylon lining")
        .material,
    ).toBe("polyester");
  });

  it("handles a single 100% fiber with filler words", () => {
    expect(parseFeedFacts("made from 100% soft cotton").material).toBe("cotton");
    expect(parseFeedFacts("Made from 100% European linen").material).toBe(
      "linen",
    );
    expect(parseFeedFacts("100% silk (lightweight charmeuse).").material).toBe(
      "silk",
    );
    expect(parseFeedFacts("100% viscose. Color: White Dot.").material).toBe(
      "viscose",
    );
  });

  it("reads fiber names listed without percentages, dominant-first", () => {
    // anthropologie-maeve-plaid: "Cotton, elastane; viscose lining"
    expect(parseFeedFacts("Cotton, elastane; viscose lining").material).toBe(
      "cotton",
    );
    // anthropologie-printed-wrap: "Polyester; viscose lining"
    expect(parseFeedFacts("Polyester; viscose lining").material).toBe(
      "polyester",
    );
    // modal-partlined lead: "modal-cashmere fabric" -> modal wins by position
    expect(parseFeedFacts("incredibly soft modal-cashmere fabric").material).toBe(
      "modal",
    );
    // abstract-cami: "Recycled polyester"
    expect(parseFeedFacts("Made from sustainable materials. Recycled polyester.").material).toBe(
      "polyester",
    );
  });

  it("excludes the lining's fiber from the main material", () => {
    // other-material-metallic: self vs lining both stated
    expect(
      parseFeedFacts(
        "Self: 95% polyester, 5% elastane. Lining: 97% polyester, 3% elastane.",
      ).material,
    ).toBe("polyester");
    // yellow-item: "Main 97% Polyester, 3% Elastane. Lining 100% Polyester."
    expect(
      parseFeedFacts(
        "Main 97% Polyester, 3% Elastane. Lining 100% Polyester.",
      ).material,
    ).toBe("polyester");
  });

  it("treats construction fabrics as authoritative over fiber content", () => {
    // everlane-denim-shirtdress: "denim shirtdress ... 60% organic cotton, 40% TENCEL"
    expect(
      parseFeedFacts(
        "Western-inspired denim shirtdress. 60% organic cotton, 40% TENCEL with REFIBRA.",
      ).material,
    ).toBe("denim");
    // aritzia-cutout-knit-midi: "Ribbed knit midi dress ..."
    expect(parseFeedFacts("Ribbed knit midi dress with a waist cutout.").material).toBe(
      "knit",
    );
  });

  it("lets a stated fiber percentage win over a 'knit' weave", () => {
    // striped-halter (real): "striped knit material" but "95% Cotton" -> cotton,
    // because a knit weave doesn't change the fiber. (Regression: real-manifest run.)
    expect(
      parseFeedFacts(
        "This top features striped knit material and self-tie halter neckline with bead detail. 95% Cotton 5% Nylon",
      ).material,
    ).toBe("cotton");
    // aritzia (real): "Ribbed knit ... Wonder Yarn (wool-free)" -> knit, not wool.
    expect(
      parseFeedFacts(
        "Ribbed knit midi dress with a waist cutout. Made with Aritzia 'Wonder Yarn' (wool-free, all-season).",
      ).material,
    ).toBe("knit");
  });

  it("ignores a fabric named only as a styling suggestion", () => {
    // tunic-highneck (real): "dress it up with ... sleek denim" is a style tip,
    // not the garment's fabric -> no material. (Regression: real-manifest run.)
    expect(
      parseFeedFacts(
        "This Papillon 3/4 sleeve tunic brings effortlessly chic style. Wear it with cropped pants or dress it up with statement jewelry and sleek denim.",
      ).material,
    ).toBeNull();
  });

  it("keeps the fabric when 'style' is a noun, not a styling verb", () => {
    // modal-partlined (real): "chic style keeps you comfortable with ... modal-
    // cashmere fabric" — the real material survives; only a true "Wear with ..."
    // suggestion is dropped. (Regression: real-manifest run.)
    expect(
      parseFeedFacts(
        "This chic style keeps you comfortable with its soft modal-cashmere fabric. Wear with the Sheer Modal Pant to complete the set.",
      ).material,
    ).toBe("modal");
  });

  it("does not mistake a 'ribbed texture' on a stated fiber for knit", () => {
    // knit-turtleneck-mini: "100% soft cotton. Defined with a ribbed texture."
    expect(
      parseFeedFacts(
        "A form-fitting mini dress made from 100% soft cotton. Defined with a ribbed texture.",
      ).material,
    ).toBe("cotton");
  });

  it("returns null when no material is stated", () => {
    expect(parseFeedFacts("").material).toBeNull();
    expect(parseFeedFacts("none").material).toBeNull();
    expect(parseFeedFacts(null).material).toBeNull();
    // wool-sweater-dress: pure marketing copy, no fiber named
    expect(
      parseFeedFacts("Versatile, on-trend, and always chic—the Clifton Dress.").material,
    ).toBeNull();
    // openback-maxi: mentions "crepe", which is not a Material enum value
    expect(parseFeedFacts("Light and fluid crepe. Maxi length.").material).toBeNull();
  });
});

describe("parseFeedFacts — lined", () => {
  it("detects an explicit lining state", () => {
    expect(parseFeedFacts("This dress is fully lined.").lined).toBe("lined");
    expect(parseFeedFacts("Unlined for a breezy feel.").lined).toBe("unlined");
    expect(parseFeedFacts("Partially lined bodice.").lined).toBe(
      "partially_lined",
    );
    expect(parseFeedFacts("Part-lined.").lined).toBe("partially_lined");
  });

  it("infers lined from a stated lining fabric", () => {
    // anthropologie-loretta / maeve-plaid / printed-wrap all list a lining fabric
    expect(parseFeedFacts("93% polyester; viscose/nylon lining").lined).toBe(
      "lined",
    );
    expect(parseFeedFacts("Cotton, elastane; viscose lining").lined).toBe(
      "lined",
    );
    // yellow-item: "Lining 100% Polyester"
    expect(parseFeedFacts("Main 97% Polyester. Lining 100% Polyester.").lined).toBe(
      "lined",
    );
  });

  it("returns null when lining is not mentioned", () => {
    expect(parseFeedFacts("100% silk midi dress with a high cowl neckline.").lined).toBeNull();
    expect(parseFeedFacts("").lined).toBeNull();
    expect(parseFeedFacts("none").lined).toBeNull();
  });

  // KNOWN TENSION (schema-gap, not a parser bug): other-material-metallic lists
  // "Lining: 97% polyester" yet its hand-tagged ground truth is `unlined` — the
  // tagger judged a bonded stretch lining as "not a lining" for modesty. The
  // parser reports what the text states (a lining exists -> lined); whether a
  // bonded/partial lining counts as `lined` is a schema-semantics question to
  // resolve in the schema-evolution ADR, not by weakening this signal.
  it("reports lined when a lining fabric is listed (see schema-gap note above)", () => {
    expect(
      parseFeedFacts("Self: 95% polyester. Lining: 97% polyester, 3% elastane.").lined,
    ).toBe("lined");
  });
});
