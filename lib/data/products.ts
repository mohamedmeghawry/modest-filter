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

export async function listProducts(filters: ProductFilters = {}) {
  const where: {
    category?: { slug: { in: string[] } };
    sleeveLength?: { in: SleeveLength[] };
    hemLength?: { in: HemLength[] };
    opacity?: { in: Opacity[] };
    material?: { in: Material[] };
    primaryColor?: { in: PrimaryColor[] };
    topLength?: { in: TopLength[] };
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
  if (filters.material?.length) {
    where.material = { in: filters.material };
  }
  if (filters.primaryColor?.length) {
    where.primaryColor = { in: filters.primaryColor };
  }
  if (filters.topLength?.length) {
    where.topLength = { in: filters.topLength };
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

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
  });
}
