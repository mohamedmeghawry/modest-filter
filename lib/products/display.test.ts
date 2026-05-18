import { describe, it, expect } from "vitest";
import {
  COLOR_HEX,
  formatPrice,
  getSwatch,
  humanize,
  notNull,
} from "./display";
import { PrimaryColor } from "@/lib/generated/prisma/enums";

describe("formatPrice", () => {
  it("formats an integer with a leading $", () => {
    expect(formatPrice(98)).toBe("$98");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0");
  });

  it("accepts a string input (Prisma Decimal serialized form)", () => {
    expect(formatPrice("98")).toBe("$98");
  });

  it("inserts locale comma separators for large numbers", () => {
    expect(formatPrice(1234)).toBe("$1,234");
    expect(formatPrice("1234567")).toBe("$1,234,567");
  });

  describe("maximumFractionDigits: 0 rounding (ties round up / halfExpand)", () => {
    it("rounds a half-cent value up", () => {
      expect(formatPrice(98.5)).toBe("$99");
    });

    it("rounds a sub-half value down", () => {
      expect(formatPrice(98.49)).toBe("$98");
    });

    it("rounds an exact .5 tie upward", () => {
      expect(formatPrice(97.5)).toBe("$98");
    });

    it("rounds a large .5 tie upward with separators", () => {
      expect(formatPrice(1234.5)).toBe("$1,235");
    });
  });
});

describe("humanize", () => {
  it("leaves a single word with no underscore unchanged", () => {
    expect(humanize("long")).toBe("long");
  });

  it("replaces a single underscore with a space", () => {
    expect(humanize("three_quarter")).toBe("three quarter");
  });

  it("replaces every underscore (global) — extra_long", () => {
    expect(humanize("extra_long")).toBe("extra long");
  });

  it("replaces all underscores in a multi-underscore string", () => {
    expect(humanize("a_b_c")).toBe("a b c");
  });

  it("returns an empty string for empty input", () => {
    expect(humanize("")).toBe("");
  });

  it("leaves a string with no underscores unchanged", () => {
    expect(humanize("plain text here")).toBe("plain text here");
  });
});

describe("notNull", () => {
  it("passes truthy defined values", () => {
    expect(notNull(5)).toBe(true);
    expect(notNull("hello")).toBe(true);
    expect(notNull(true)).toBe(true);
  });

  it("passes falsy-but-defined values (0, '', false)", () => {
    expect(notNull(0)).toBe(true);
    expect(notNull("")).toBe(true);
    expect(notNull(false)).toBe(true);
  });

  it("fails null", () => {
    expect(notNull(null)).toBe(false);
  });

  it("fails undefined", () => {
    expect(notNull(undefined)).toBe(false);
  });

  it("narrows (string | null)[] to string[] when used as a filter predicate", () => {
    const mixed: (string | null)[] = ["a", null, "b", null, "c"];
    // Compile-time proof: this assignment only type-checks if notNull
    // narrows the element type from `string | null` to `string`.
    const narrowed: string[] = mixed.filter(notNull);
    expect(narrowed).toEqual(["a", "b", "c"]);
  });
});

describe("COLOR_HEX", () => {
  const primaryColors = Object.values(PrimaryColor);

  it("has a hex entry for every PrimaryColor except the intentional 'multicolor' fallback", () => {
    for (const color of primaryColors) {
      if (color === "multicolor") {
        // Now compile-time enforced via Record<Exclude<PrimaryColor,
        // "multicolor">, string> in display.ts. This runtime check is kept
        // as belt-and-suspenders documentation of the intentional exclusion.
        expect(COLOR_HEX).not.toHaveProperty(color);
      } else {
        expect(COLOR_HEX).toHaveProperty(color);
      }
    }
  });

  it("maps every key to a valid #RRGGBB hex string", () => {
    for (const hex of Object.values(COLOR_HEX)) {
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("has no duplicate hex values across keys", () => {
    const values = Object.values(COLOR_HEX);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("getSwatch", () => {
  // Dual fallback: getSwatch returns gray (#9ca3af) for BOTH a null color
  // (attribute unset) and "multicolor" (no honest single hex). Every other
  // PrimaryColor returns its mapped COLOR_HEX entry.
  it("returns the mapped hex for every handled PrimaryColor", () => {
    for (const color of Object.values(PrimaryColor)) {
      if (color === "multicolor") continue;
      expect(getSwatch(color)).toBe(COLOR_HEX[color]);
    }
  });

  it("returns gray for null (color attribute unset)", () => {
    expect(getSwatch(null)).toBe("#9ca3af");
  });

  it("returns gray for 'multicolor' (no honest single hex)", () => {
    expect(getSwatch("multicolor")).toBe("#9ca3af");
  });
});
