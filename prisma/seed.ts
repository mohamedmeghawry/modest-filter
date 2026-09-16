import prisma from "../lib/prisma";

const now = new Date();

// Sample catalogue: illustrative placeholders used to build and test the
// filters until affiliate feeds supply real products. Deliberately NOT
// attributed to real brands (audit 2026-09-01 §B). `imageUrl` is empty because
// nothing renders it yet and there is no product photography for sample data.

const LEGACY_PRODUCT_IDS = [
  "seed-aritzia-effortless-midi",
  "seed-everlane-cotton-tee",
  "seed-aritzia-flowing-abaya",
  "seed-everlane-linen-maxi",
];
const LEGACY_BRAND_SLUGS = ["aritzia", "everlane"];

async function main() {
  console.log("Seeding database...");

  // --- Remove the pre-2026-09-15 seed rows that misattributed sample
  //     products to real brands. Products first (Brand.onDelete: Restrict).
  //     No-op on subsequent runs.
  const removedProducts = await prisma.product.deleteMany({
    where: { id: { in: LEGACY_PRODUCT_IDS } },
  });
  const removedBrands = await prisma.brand.deleteMany({
    where: { slug: { in: LEGACY_BRAND_SLUGS } },
  });
  if (removedProducts.count > 0 || removedBrands.count > 0) {
    console.log(
      `  Removed legacy rows: ${removedProducts.count} products, ${removedBrands.count} brands`,
    );
  }

  // --- Brands (upsert on unique slug) ---
  const sampleOne = await prisma.brand.upsert({
    where: { slug: "sample-brand-one" },
    update: {
      name: "Sample Brand One",
      websiteUrl: "https://kashfedit.com/about",
      affiliateProgram: "none",
    },
    create: {
      name: "Sample Brand One",
      slug: "sample-brand-one",
      websiteUrl: "https://kashfedit.com/about",
      affiliateProgram: "none",
    },
  });

  const sampleTwo = await prisma.brand.upsert({
    where: { slug: "sample-brand-two" },
    update: {
      name: "Sample Brand Two",
      websiteUrl: "https://kashfedit.com/about",
      affiliateProgram: "none",
    },
    create: {
      name: "Sample Brand Two",
      slug: "sample-brand-two",
      websiteUrl: "https://kashfedit.com/about",
      affiliateProgram: "none",
    },
  });

  // --- Categories (upsert on unique slug) ---
  const dresses = await prisma.category.upsert({
    where: { slug: "dresses" },
    update: { name: "Dresses" },
    create: { name: "Dresses", slug: "dresses" },
  });

  const tops = await prisma.category.upsert({
    where: { slug: "tops" },
    update: { name: "Tops" },
    create: { name: "Tops", slug: "tops" },
  });

  const abayas = await prisma.category.upsert({
    where: { slug: "abayas" },
    update: { name: "Abayas" },
    create: { name: "Abayas", slug: "abayas" },
  });

  // --- Products (upsert on deterministic explicit id) ---
  const products = [
    {
      id: "sample-midi-dress",
      name: "Long-Sleeve Midi Dress",
      brandId: sampleOne.id,
      categoryId: dresses.id,
      imageUrl: "",
      price: "128.00",
      affiliateUrl: "https://kashfedit.com/about",
      tagConfidence: "0.95",
      sleeveLength: "long",
      sleeveOpacity: "opaque",
      neckline: "crew",
      backStyle: "closed",
      hemLength: "midi",
      slit: "none",
      fit: "loose",
      opacity: "opaque",
      lined: "unlined",
      cutouts: "none",
      material: "cotton",
      primaryColor: "black",
      pattern: "solid",
    },
    {
      id: "sample-cotton-tee",
      name: "Organic Cotton Long-Sleeve Tee",
      brandId: sampleTwo.id,
      categoryId: tops.id,
      imageUrl: "",
      price: "38.00",
      affiliateUrl: "https://kashfedit.com/about",
      tagConfidence: "0.91",
      sleeveLength: "long",
      sleeveOpacity: "opaque",
      neckline: "crew",
      backStyle: "closed",
      topLength: "hip",
      fit: "semi_fitted",
      opacity: "opaque",
      cutouts: "none",
      material: "cotton",
      primaryColor: "white",
      pattern: "solid",
    },
    {
      id: "sample-maxi-abaya",
      name: "Long-Sleeve Maxi Abaya",
      brandId: sampleOne.id,
      categoryId: abayas.id,
      imageUrl: "",
      price: "168.00",
      affiliateUrl: "https://kashfedit.com/about",
      tagConfidence: "0.90",
      sleeveLength: "long",
      sleeveOpacity: "opaque",
      neckline: "crew",
      backStyle: "closed",
      hemLength: "floor",
      slit: "none",
      fit: "loose",
      opacity: "opaque",
      lined: "unlined",
      cutouts: "none",
      material: "polyester",
      primaryColor: "black",
      pattern: "solid",
    },
    {
      id: "sample-linen-maxi",
      name: "Linen Maxi Dress",
      brandId: sampleTwo.id,
      categoryId: dresses.id,
      imageUrl: "",
      price: "98.00",
      affiliateUrl: "https://kashfedit.com/about",
      tagConfidence: "0.93",
      sleeveLength: "short",
      sleeveOpacity: "opaque",
      neckline: "v_neck",
      backStyle: "closed",
      hemLength: "floor",
      slit: "low",
      fit: "semi_fitted",
      opacity: "opaque",
      lined: "lined",
      cutouts: "none",
      material: "linen",
      primaryColor: "beige",
      pattern: "solid",
    },
  ] as const;

  for (const p of products) {
    const { id, ...rest } = p;
    const data = {
      ...rest,
      currency: "USD",
      inStock: true,
      lastVerifiedAt: now,
      tagStatus: "tagged" as const,
      taggedAt: now,
    };
    await prisma.product.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  console.log("Seed complete:");
  console.log(`  Brands: ${await prisma.brand.count()}`);
  console.log(`  Categories: ${await prisma.category.count()}`);
  console.log(`  Products: ${await prisma.product.count()}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
