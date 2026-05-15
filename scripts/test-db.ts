import prisma from "../lib/prisma";

async function main() {
  console.log("Testing Prisma connection to Supabase...");

  const brandCount = await prisma.brand.count();
  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log("Connection successful! Current counts:");
  console.log(`  Brands: ${brandCount}`);
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Products: ${productCount}`);
}

main()
  .catch((e) => {
    console.error("Connection failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
