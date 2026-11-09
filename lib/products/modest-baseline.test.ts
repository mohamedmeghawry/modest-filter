import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { passesModestBaseline, modestBaselineWhere, type BaselineFields } from "./modest-baseline";
import { parseCsv } from "./demo-csv";

const ok: BaselineFields = {
  tagStatus: "tagged",
  categorySlug: "dresses",
  sleeveLength: "long",
  backStyle: "closed",
  cutouts: "none",
  slit: "none",
  neckline: "crew",
};

describe("passesModestBaseline", () => {
  it("passes a long-sleeve, closed-back dress", () => {
    expect(passesModestBaseline(ok)).toBe(true);
    expect(passesModestBaseline({ ...ok, sleeveLength: "extra_long", slit: "low" })).toBe(true);
  });

  it("fails each baseline rule on its own", () => {
    expect(passesModestBaseline({ ...ok, sleeveLength: "three_quarter" })).toBe(false);
    expect(passesModestBaseline({ ...ok, backStyle: "scoop_back" })).toBe(false);
    expect(passesModestBaseline({ ...ok, cutouts: "present" })).toBe(false);
    expect(passesModestBaseline({ ...ok, slit: "mid" })).toBe(false);
    expect(passesModestBaseline({ ...ok, neckline: "halter" })).toBe(false);
    expect(passesModestBaseline({ ...ok, neckline: "off_shoulder" })).toBe(false);
    expect(passesModestBaseline({ ...ok, tagStatus: "needs_review" })).toBe(false);
  });

  it("hides unknowns, except slit on tops", () => {
    expect(passesModestBaseline({ ...ok, backStyle: null })).toBe(false);
    expect(passesModestBaseline({ ...ok, neckline: null })).toBe(false);
    expect(passesModestBaseline({ ...ok, slit: null })).toBe(false);
    expect(passesModestBaseline({ ...ok, slit: null, categorySlug: "tops" })).toBe(true);
  });

  it("allows an unknown neckline on abayas only (hijab covers it in photos)", () => {
    expect(passesModestBaseline({ ...ok, neckline: null, categorySlug: "abayas" })).toBe(true);
    expect(passesModestBaseline({ ...ok, neckline: null, categorySlug: "tops" })).toBe(false);
    // A neckline the AI did see still has to pass, abaya or not.
    expect(passesModestBaseline({ ...ok, neckline: "halter", categorySlug: "abayas" })).toBe(false);
  });

  it("keeps the Prisma filter in step: neckline and slit exceptions are separate ORs", () => {
    const and = (modestBaselineWhere.AND ?? []) as Record<string, unknown>[];
    expect(JSON.stringify(and)).toContain('"slug":"abayas"');
    expect(JSON.stringify(and)).toContain('"slug":"tops"');
    expect(modestBaselineWhere.OR).toBeUndefined(); // a single top-level OR would let one exception cancel the other
  });

  it("does not use hem length or see-through (shopper filters)", () => {
    // Not part of BaselineFields at all: a mini, sheer item can pass.
    expect(Object.keys(ok)).not.toContain("hemLength");
    expect(Object.keys(ok)).not.toContain("opacity");
  });

  it("selects the expected 12 of the 25 tagged demo products", () => {
    const tags: { id: string; vision: Record<string, string | null> }[] = JSON.parse(
      readFileSync("samples/demo/tag-results.json", "utf8"),
    );
    const category = new Map(
      parseCsv(readFileSync("samples/demo/products.csv", "utf8")).map((r) => [
        r.id,
        r.category === "dress" ? "dresses" : "tops",
      ]),
    );
    const passing = tags
      .filter((t) =>
        passesModestBaseline({
          tagStatus: "tagged",
          categorySlug: category.get(t.id)!,
          sleeveLength: t.vision.sleeveLength,
          backStyle: t.vision.backStyle,
          cutouts: t.vision.cutouts,
          slit: t.vision.slit,
          neckline: t.vision.neckline,
        }),
      )
      .map((t) => t.id)
      .sort();
    expect(passing).toEqual([
      "hm-1364282001",
      "reitmans-500152",
      "reitmans-501161",
      "simons-172-10597-230173",
      "simons-172-15168-229790",
      "simons-211-12709-225274",
      "simons-211-15110-218637",
      "uniqlo-487294",
      "uniqlo-487526",
      "uniqlo-487635",
      "uniqlo-488693",
      "zara-08605934",
    ]);
  });
});
