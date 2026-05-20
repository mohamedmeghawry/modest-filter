import { describe, it, expect } from "vitest";
import { TAG_PRODUCT_TOOL } from "./schema";
import {
  SleeveLength,
  Opacity,
  Neckline,
  BackStyle,
  HemLength,
  TopLength,
  Slit,
  Fit,
  Lined,
  Cutouts,
  Material,
  PrimaryColor,
  Pattern,
} from "@/lib/generated/prisma/enums";

// Per-attribute mapping: field name in the tool's input_schema → Prisma enum object.
// Single source of truth — schema is derived from these enums at module load;
// this test asserts that derivation didn't drift.
const ATTRIBUTE_TO_ENUM: ReadonlyArray<[string, Record<string, string>]> = [
  // Coverage (7)
  ["sleeveLength", SleeveLength],
  ["sleeveOpacity", Opacity],
  ["neckline", Neckline],
  ["backStyle", BackStyle],
  ["hemLength", HemLength],
  ["topLength", TopLength],
  ["slit", Slit],
  // Fit & material (5)
  ["fit", Fit],
  ["opacity", Opacity],
  ["lined", Lined],
  ["cutouts", Cutouts],
  ["material", Material],
  // Visual (2)
  ["primaryColor", PrimaryColor],
  ["pattern", Pattern],
];

describe("TAG_PRODUCT_TOOL completeness", () => {
  const properties = TAG_PRODUCT_TOOL.input_schema.properties as Record<
    string,
    {
      description: string;
      anyOf: [
        { type: string; enum: string[] },
        { type: string },
      ];
    }
  >;

  it("covers all 14 product attribute fields, no more, no less", () => {
    const expectedFields = ATTRIBUTE_TO_ENUM.map(([name]) => name).sort();
    expect(Object.keys(properties).sort()).toEqual(expectedFields);
    expect(expectedFields.length).toBe(14);
  });

  it.each(ATTRIBUTE_TO_ENUM)(
    "%s schema includes every Prisma enum value plus an explicit null branch",
    (field, enumObj) => {
      const property = properties[field];
      expect(property, `missing property: ${field}`).toBeDefined();
      expect(
        property.anyOf,
        `${field} must use anyOf for strict-mode nullable enums`,
      ).toBeDefined();
      expect(
        property.anyOf.length,
        `${field} anyOf must have exactly 2 branches`,
      ).toBe(2);

      const [stringBranch, nullBranch] = property.anyOf;

      // String branch carries the enum of all valid Prisma values.
      expect(stringBranch.type).toBe("string");
      for (const value of Object.values(enumObj)) {
        expect(
          stringBranch.enum,
          `${field} string branch is missing Prisma enum value '${value}' — Prisma migration likely added a value without updating the vision schema`,
        ).toContain(value);
      }

      // Null branch is the explicit type:"null" form (required by strict mode).
      expect(nullBranch.type).toBe("null");
    },
  );

  it("declares all 14 attributes as required (strict-mode requirement)", () => {
    const required = TAG_PRODUCT_TOOL.input_schema.required;
    const expected = ATTRIBUTE_TO_ENUM.map(([name]) => name).sort();
    expect([...required].sort()).toEqual(expected);
  });

  it("has additionalProperties: false (strict-mode requirement)", () => {
    expect(TAG_PRODUCT_TOOL.input_schema.additionalProperties).toBe(false);
  });

  it("opts into strict tool-use enforcement", () => {
    expect(TAG_PRODUCT_TOOL.strict).toBe(true);
  });
});
