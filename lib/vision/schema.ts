import type {
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
} from "@/lib/generated/prisma/client";
import {
  SleeveLength as SleeveLengthEnum,
  Opacity as OpacityEnum,
  Neckline as NecklineEnum,
  BackStyle as BackStyleEnum,
  HemLength as HemLengthEnum,
  TopLength as TopLengthEnum,
  Slit as SlitEnum,
  Fit as FitEnum,
  Lined as LinedEnum,
  Cutouts as CutoutsEnum,
  Material as MaterialEnum,
  PrimaryColor as PrimaryColorEnum,
  Pattern as PatternEnum,
} from "@/lib/generated/prisma/enums";

export type ProductAttributes = {
  // Coverage (7)
  sleeveLength: SleeveLength | null;
  sleeveOpacity: Opacity | null;
  neckline: Neckline | null;
  backStyle: BackStyle | null;
  hemLength: HemLength | null;
  topLength: TopLength | null;
  slit: Slit | null;
  // Fit & material (5)
  fit: Fit | null;
  opacity: Opacity | null;
  lined: Lined | null;
  cutouts: Cutouts | null;
  material: Material | null;
  // Visual (2)
  primaryColor: PrimaryColor | null;
  pattern: Pattern | null;
};

// Derive each property from the Prisma enum object so additions propagate.
// The completeness test (schema.test.ts) guards against drift between Prisma
// and this schema.
function nullableEnum(
  enumObj: Record<string, string>,
  description: string,
): {
  type: ["string", "null"];
  enum: (string | null)[];
  description: string;
} {
  const values = Object.values(enumObj);
  return {
    type: ["string", "null"],
    enum: [...values, null],
    description,
  };
}

export const TAG_PRODUCT_TOOL = {
  name: "tag_product",
  description:
    "Record the modesty-relevant attributes of the garment shown in the product image. Use null for any attribute that does not apply to the garment's category (e.g., topLength is null for a dress).",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: [
      "sleeveLength",
      "sleeveOpacity",
      "neckline",
      "backStyle",
      "hemLength",
      "topLength",
      "slit",
      "fit",
      "opacity",
      "lined",
      "cutouts",
      "material",
      "primaryColor",
      "pattern",
    ],
    properties: {
      // — Coverage (7) —
      sleeveLength: nullableEnum(
        SleeveLengthEnum,
        "Sleeve length. Null for sleeveless bottoms or any item with no upper-body coverage.",
      ),
      sleeveOpacity: nullableEnum(
        OpacityEnum,
        "Opacity of the sleeves specifically. Null if there are no sleeves.",
      ),
      neckline: nullableEnum(
        NecklineEnum,
        "Neckline shape. Null for bottoms or any item with no upper-body coverage.",
      ),
      backStyle: nullableEnum(
        BackStyleEnum,
        "Back style. Null if the back is not visible or doesn't apply.",
      ),
      hemLength: nullableEnum(
        HemLengthEnum,
        "Hem length of dresses, skirts, or bottoms with a hem. Null for tops (use topLength instead).",
      ),
      topLength: nullableEnum(
        TopLengthEnum,
        "Length of a top, measured from the shoulder. Null for dresses and bottoms.",
      ),
      slit: nullableEnum(
        SlitEnum,
        "Presence and height of a slit in the hem. Typically applies to dresses and skirts only.",
      ),
      // — Fit & material (5) —
      fit: nullableEnum(FitEnum, "Overall fit of the garment."),
      opacity: nullableEnum(
        OpacityEnum,
        "Overall opacity of the main fabric.",
      ),
      lined: nullableEnum(LinedEnum, "Whether the garment is lined."),
      cutouts: nullableEnum(CutoutsEnum, "Whether the garment has cutouts."),
      material: nullableEnum(MaterialEnum, "Primary material."),
      // — Visual (2) —
      primaryColor: nullableEnum(
        PrimaryColorEnum,
        "Dominant color of the garment.",
      ),
      pattern: nullableEnum(PatternEnum, "Pattern type."),
    },
  },
};
