import { describe, it, expect } from "vitest";
import { buildJevQuestions, buildJevRequest, prescreen, ruleVerdicts, type JevAnswer } from "./jev";

const n = (p: number): JevAnswer => ({ type: "noul", noul: p });
const GOOD: Record<string, JevAnswer> = {
  sleeves_reach_wrist: n(0.9), back_closed: n(0.9), has_cutout: n(0.05),
  slit_to_knee: n(0.05), off_shoulder: n(0.03), halter: n(0.03),
};

describe("buildJevQuestions", () => {
  it("drops slit questions for tops only", () => {
    expect(Object.keys(buildJevQuestions("tops", 2))).not.toContain("slit_to_knee");
    expect(Object.keys(buildJevQuestions("tops", 2))).not.toContain("slit");
    expect(Object.keys(buildJevQuestions("dresses", 2))).toContain("slit_to_knee");
  });

  it("mentions only the front photo when there is one photo", () => {
    expect(buildJevQuestions("dresses", 1).back_closed.instructions).toBe("Is the back of the garment in `front_photo` closed?");
    expect(buildJevQuestions("dresses", 2).back_closed.instructions).toContain("`back_photo`");
  });

  it("does not change the shared question set between calls", () => {
    buildJevQuestions("dresses", 1);
    expect(buildJevQuestions("dresses", 2).back_closed.instructions).toContain("`back_photo`");
  });
});

describe("buildJevRequest", () => {
  it("puts each photo in the state once, with a matching asset part", () => {
    const r = buildJevRequest("x-1", "dresses", 2);
    expect(r.state).toEqual({ garment_category: "dresse", front_photo: "img-x-1-0", back_photo: "img-x-1-1" });
    expect(r.assets).toEqual({ "img-x-1-0": { type: "image", part: "photo0" }, "img-x-1-1": { type: "image", part: "photo1" } });
  });
});

describe("prescreen", () => {
  it("passes only when every rule clearly passes", () => {
    expect(prescreen(GOOD, "dresses")).toBe("pass");
  });

  it("rejects on any clear fail, even when other rules are unsure", () => {
    expect(prescreen({ ...GOOD, sleeves_reach_wrist: n(0.05), back_closed: n(0.5) }, "dresses")).toBe("reject");
    expect(prescreen({ ...GOOD, halter: n(0.9) }, "dresses")).toBe("reject");
  });

  it("is unsure when a probability sits between 0.3 and 0.7", () => {
    expect(prescreen({ ...GOOD, back_closed: n(0.64) }, "dresses")).toBe("unsure");
  });

  it("treats a missing answer as unsure, never as a pass", () => {
    const { back_closed: _omit, ...rest } = GOOD;
    void _omit;
    expect(prescreen(rest, "dresses")).toBe("unsure");
  });

  it("ignores the slit on tops", () => {
    expect(ruleVerdicts({ ...GOOD, slit_to_knee: n(0.95) }, "tops").slit).toBe("pass");
    expect(ruleVerdicts({ ...GOOD, slit_to_knee: n(0.95) }, "dresses").slit).toBe("fail");
  });
});
