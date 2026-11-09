import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * The modest baseline (ADR-0015): every product the site shows must pass it.
 * Shoppers can't switch it off; filters only narrow WITHIN it.
 *
 * Unknown (null) fails: a product the AI couldn't judge stays hidden until a
 * human checks it. Two exceptions: `slit` on tops, where null means "not
 * applicable" (vision leaves slit empty for tops, ADR-0012 conventions), and
 * `neckline` on abayas, where the hijab in the photo usually covers it
 * (Mohamed, 2026-11-09; a long-sleeve abaya can't be off-shoulder or halter).
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
    ((p.neckline != null && !has(EXCLUDED_NECKLINES, p.neckline)) || (p.neckline == null && p.categorySlug === "abayas")) &&
    (has(ALLOWED_SLITS, p.slit) || (p.slit == null && p.categorySlug === "tops"))
  );
}

/**
 * Which baseline rules a product fails, named like Jev's rules (lib/vision/jev.ts)
 * so the two can be compared rule by rule; "untagged" when it isn't tagged.
 * Empty exactly when passesModestBaseline is true.
 */
export function baselineFailures(p: BaselineFields): string[] {
  if (p.tagStatus !== "tagged") return ["untagged"];
  const fails: string[] = [];
  if (!has(LONG_SLEEVES, p.sleeveLength)) fails.push("sleeves");
  if (p.backStyle !== "closed") fails.push("back");
  if (p.cutouts !== "none") fails.push("cutouts");
  if (!(has(ALLOWED_SLITS, p.slit) || (p.slit == null && p.categorySlug === "tops"))) fails.push("slit");
  if (!((p.neckline != null && !has(EXCLUDED_NECKLINES, p.neckline)) || (p.neckline == null && p.categorySlug === "abayas"))) fails.push("neckline");
  return fails;
}

/** The same rule as a Prisma filter. Keep in step with passesModestBaseline. */
export const modestBaselineWhere: Prisma.ProductWhereInput = {
  tagStatus: "tagged",
  sleeveLength: { in: [...LONG_SLEEVES] },
  backStyle: "closed",
  cutouts: "none",
  AND: [
    {
      OR: [
        { neckline: { not: null, notIn: [...EXCLUDED_NECKLINES] } },
        { neckline: null, category: { slug: "abayas" } },
      ],
    },
    {
      OR: [
        { slit: { in: [...ALLOWED_SLITS] } },
        { slit: null, category: { slug: "tops" } },
      ],
    },
  ],
};
