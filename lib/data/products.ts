import prisma from "@/lib/prisma";
import type {
  SleeveLength,
  HemLength,
  Opacity,
  Material,
  PrimaryColor,
  TopLength,
} from "@/lib/generated/prisma/client";

export type ProductFilters = {
  category?: string[];
  sleeveLength?: SleeveLength[];
  hemLength?: HemLength[];
  opacity?: Opacity[];
  material?: Material[];
  primaryColor?: PrimaryColor[];
  topLength?: TopLength[];
};

type ProductWhere = {
  category?: { slug: { in: string[] } };
  sleeveLength?: { in: SleeveLength[] };
  hemLength?: { in: HemLength[] };
  opacity?: { in: Opacity[] };
  material?: { in: Material[] };
  primaryColor?: { in: PrimaryColor[] };
  topLength?: { in: TopLength[] };
};

// Build the Prisma `where` from active filters. `omit` skips one group, which is
// how faceted counts are computed: each facet's option counts reflect the OTHER
// active filters, not the facet's own selection (standard drill-down semantics).
function buildWhere(
  filters: ProductFilters,
  omit?: keyof ProductFilters,
): ProductWhere {
  const where: ProductWhere = {};

  if (omit !== "category" && filters.category?.length) {
    where.category = { slug: { in: filters.category } };
  }
  if (omit !== "sleeveLength" && filters.sleeveLength?.length) {
    where.sleeveLength = { in: filters.sleeveLength };
  }
  if (omit !== "hemLength" && filters.hemLength?.length) {
    where.hemLength = { in: filters.hemLength };
  }
  if (omit !== "opacity" && filters.opacity?.length) {
    where.opacity = { in: filters.opacity };
  }
  if (omit !== "material" && filters.material?.length) {
    where.material = { in: filters.material };
  }
  if (omit !== "primaryColor" && filters.primaryColor?.length) {
    where.primaryColor = { in: filters.primaryColor };
  }
  if (omit !== "topLength" && filters.topLength?.length) {
    where.topLength = { in: filters.topLength };
  }

  return where;
}

export async function listProducts(filters: ProductFilters = {}) {
  return prisma.product.findMany({
    where: buildWhere(filters),
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Per-option product counts for each filter group, e.g. counts.material.cotton.
// Keyed by group then option value so the filter UI can render "Cotton (12)".
export type FacetCounts = Record<string, Record<string, number>>;

function tally<K extends string>(
  rows: ({ _count: { _all: number } } & Record<K, string | null>)[],
  key: K,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const value = row[key];
    if (value != null) out[value] = row._count._all;
  }
  return out;
}

export async function getFacetCounts(
  filters: ProductFilters = {},
): Promise<FacetCounts> {
  const [categories, sleeveLength, hemLength, opacity, material, primaryColor, topLength] =
    await Promise.all([
      prisma.category.findMany({
        select: {
          slug: true,
          _count: {
            select: { products: { where: buildWhere(filters, "category") } },
          },
        },
      }),
      prisma.product.groupBy({
        by: ["sleeveLength"],
        where: buildWhere(filters, "sleeveLength"),
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ["hemLength"],
        where: buildWhere(filters, "hemLength"),
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ["opacity"],
        where: buildWhere(filters, "opacity"),
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ["material"],
        where: buildWhere(filters, "material"),
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ["primaryColor"],
        where: buildWhere(filters, "primaryColor"),
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ["topLength"],
        where: buildWhere(filters, "topLength"),
        _count: { _all: true },
      }),
    ]);

  return {
    category: Object.fromEntries(
      categories.map((c) => [c.slug, c._count.products]),
    ),
    sleeveLength: tally(sleeveLength, "sleeveLength"),
    hemLength: tally(hemLength, "hemLength"),
    opacity: tally(opacity, "opacity"),
    material: tally(material, "material"),
    primaryColor: tally(primaryColor, "primaryColor"),
    topLength: tally(topLength, "topLength"),
  };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
  });
}
