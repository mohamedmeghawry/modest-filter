import prisma from "../lib/prisma";

const now = new Date();

async function main() {
  console.log("Seeding database...");

  // --- Brands (upsert on unique slug) ---
  const aritzia = await prisma.brand.upsert({
    where: { slug: "aritzia" },
    update: {
      name: "Aritzia",
      websiteUrl: "https://www.aritzia.com",
      affiliateProgram: "rakuten",
    },
    create: {
      name: "Aritzia",
      slug: "aritzia",
      websiteUrl: "https://www.aritzia.com",
      affiliateProgram: "rakuten",
    },
  });

  const everlane = await prisma.brand.upsert({
    where: { slug: "everlane" },
    update: {
      name: "Everlane",
      websiteUrl: "https://www.everlane.com",
      affiliateProgram: "impact",
    },
    create: {
      name: "Everlane",
      slug: "everlane",
      websiteUrl: "https://www.everlane.com",
      affiliateProgram: "impact",
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
      id: "seed-aritzia-effortless-midi",
      name: "Effortless Long-Sleeve Midi Dress",
      brandId: aritzia.id,
      categoryId: dresses.id,
      imageUrl: "https://via.placeholder.com/600x800?text=Effortless+Midi",
      price: "128.00",
      affiliateUrl: "https://www.aritzia.com/product/effortless-midi/1001.html",
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
      id: "seed-everlane-cotton-tee",
      name: "The Organic Cotton Long-Sleeve Tee",
      brandId: everlane.id,
      categoryId: tops.id,
      imageUrl: "https://via.placeholder.com/600x800?text=Cotton+Tee",
      price: "38.00",
      affiliateUrl: "https://www.everlane.com/products/womens-cotton-ls-tee-white",
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
      id: "seed-aritzia-flowing-abaya",
      name: "Flowing Long-Sleeve Maxi Abaya",
      brandId: aritzia.id,
      categoryId: abayas.id,
      imageUrl: "https://via.placeholder.com/600x800?text=Maxi+Abaya",
      price: "168.00",
      affiliateUrl: "https://www.aritzia.com/product/maxi-abaya/2002.html",
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
      id: "seed-everlane-linen-maxi",
      name: "The Linen Maxi Dress",
      brandId: everlane.id,
      categoryId: dresses.id,
      imageUrl: "https://via.placeholder.com/600x800?text=Linen+Maxi",
      price: "98.00",
      affiliateUrl: "https://www.everlane.com/products/womens-linen-maxi-beige",
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
