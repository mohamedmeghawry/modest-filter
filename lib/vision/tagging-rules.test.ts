import { describe, it, expect } from "vitest";
import { applyTaggingRules } from "./tagging-rules";
import type { ProductAttributes } from "./schema";

const VISION: ProductAttributes = {
  sleeveLength: "long", sleeveOpacity: "opaque", neckline: "crew", backStyle: "closed",
  hemLength: "midi", topLength: null, slit: "none", fit: "loose", opacity: "opaque",
  lined: "unlined", cutouts: "none", material: "silk", primaryColor: "black", pattern: "solid",
};

describe("applyTaggingRules", () => {
  it("takes material and lining from the text when it states them", () => {
    const out = applyTaggingRules(VISION, { material: "polyester", lined: "lined" }, { hasBackPhoto: true });
    expect(out.material).toBe("polyester");
    expect(out.lined).toBe("lined");
  });

  it("keeps vision's material but drops its lining guess when the text is silent", () => {
    const out = applyTaggingRules(VISION, { material: null, lined: null }, { hasBackPhoto: true });
    expect(out.material).toBe("silk");
    expect(out.lined).toBeNull(); // vision said "unlined" with no evidence
  });

  it("stores backStyle as unknown when no photo shows the back", () => {
    expect(applyTaggingRules(VISION, { material: null, lined: null }, { hasBackPhoto: false }).backStyle).toBeNull();
    expect(applyTaggingRules(VISION, { material: null, lined: null }, { hasBackPhoto: true }).backStyle).toBe("closed");
  });

  it("leaves every other attribute as vision saw it", () => {
    const out = applyTaggingRules(VISION, { material: null, lined: null }, { hasBackPhoto: true });
    expect({ ...out, lined: VISION.lined }).toEqual(VISION);
  });
});
