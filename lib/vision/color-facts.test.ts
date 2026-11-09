import { describe, expect, it } from "vitest";
import { parseColorName } from "./color-facts";

describe("parseColorName", () => {
  it("maps the 25 demo colour names", () => {
    const cases: [string, string | null][] = [
      ["09 BLACK", "black"],
      ["69 NAVY", "navy"],
      ["57 OLIVE", "green"],
      ["62 BLUE", "blue"],
      ["00 WHITE", "white"],
      ["Navy blue", "navy"],
      ["Dark purple", "purple"],
      ["Greenish", "green"],
      ["Baby Blue", "blue"],
      ["Navy/Midnight Blue", "navy"],
      ["Sand", "beige"],
      ["BRONZE BROWN", "brown"],
      ["Pearly", null],
      ["TAWNY PORT", null],
    ];
    for (const [raw, want] of cases) expect(parseColorName(raw), raw).toBe(want);
  });

  it("returns null for two colour families, empty input and unknown words", () => {
    expect(parseColorName("Black/White")).toBeNull();
    expect(parseColorName("")).toBeNull();
    expect(parseColorName(null)).toBeNull();
    expect(parseColorName("Ecru")).toBeNull();
  });

  it("does not match colour words inside other words", () => {
    expect(parseColorName("Redwood")).toBeNull(); // not "red"
    expect(parseColorName("Tangerine")).toBeNull(); // not "tan"
  });
});
