import prisma from "@/lib/prisma";
import type {
  SleeveLength,
  HemLength,
  Opacity,
} from "@/lib/generated/prisma/client";

export type ProductFilters = {
  category?: string[];
  sleeveLength?: SleeveLength[];
  hemLength?: HemLength[];
  opacity?: Opacity[];
};

export async function listProducts(filters: ProductFilters = {}) {
  const where: {
    category?: { slug: { in: string[] } };
    sleeveLength?: { in: SleeveLength[] };
    hemLength?: { in: HemLength[] };
    opacity?: { in: Opacity[] };
  } = {};

  if (filters.category?.length) {
    where.category = { slug: { in: filters.category } };
  }
  if (filters.sleeveLength?.length) {
    where.sleeveLength = { in: filters.sleeveLength };
  }
  if (filters.hemLength?.length) {
    where.hemLength = { in: filters.hemLength };
  }
  if (filters.opacity?.length) {
    where.opacity = { in: filters.opacity };
  }

  return prisma.product.findMany({
    where,
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
