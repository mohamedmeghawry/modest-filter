import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * The modest baseline (ADR-0015): every product the site shows must pass it.
 * Shoppers can't switch it off; filters only narrow WITHIN it.
 *
 * Unknown (null) fails: a product the AI couldn't judge stays hidden until a
 * human checks it. The one exception is `slit` on tops, where null means
 * "not applicable" (vision leaves slit empty for tops, ADR-0012 conventions).
 *
 * Deliberately NOT in the baseline (Mohamed, 2026-11-08): hem length and
 * see-through. People layer, so those stay shopper filters.
 */
export const LONG_SLEEVES = ["long", "extra_long"] as const;
export const ALLOWED_SLITS = ["none", "low"] as const;
export const EXCLUDED_NECKLINES = ["off_shoulder", "halter"] as const;

export type BaselineFields = {
  tagStatus: string;
  categorySlug: string;
  sleeveLength: string | null;
  backStyle: string | null;
  cutouts: string | null;
  slit: string | null;
  neckline: string | null;
};

const has = (list: readonly string[], v: string | null) => v != null && list.includes(v);

/** Pure check, mirrored by `modestBaselineWhere` for the database. */
export function passesModestBaseline(p: BaselineFields): boolean {
  return (
    p.tagStatus === "tagged" &&
    has(LONG_SLEEVES, p.sleeveLength) &&
    p.backStyle === "closed" &&
    p.cutouts === "none" &&
    p.neckline != null &&
    !has(EXCLUDED_NECKLINES, p.neckline) &&
    (has(ALLOWED_SLITS, p.slit) || (p.slit == null && p.categorySlug === "tops"))
  );
}

/** The same rule as a Prisma filter. Keep in step with passesModestBaseline. */
export const modestBaselineWhere: Prisma.ProductWhereInput = {
  tagStatus: "tagged",
  sleeveLength: { in: [...LONG_SLEEVES] },
  backStyle: "closed",
  cutouts: "none",
  neckline: { not: null, notIn: [...EXCLUDED_NECKLINES] },
  OR: [
    { slit: { in: [...ALLOWED_SLITS] } },
    { slit: null, category: { slug: "tops" } },
  ],
};
