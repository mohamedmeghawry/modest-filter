import prisma from "@/lib/prisma";

export async function listProducts() {
  return prisma.product.findMany({
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
