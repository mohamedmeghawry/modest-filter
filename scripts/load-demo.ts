// Load the 25 demo products (samples/demo/products.csv) into the DEMO database
// only (Supabase `kashfedit-demo`, ADR-0013 amendment). Untagged: tagStatus
// stays `pending` and every attribute is null until vision tagging runs.
//
//   npx tsx --env-file=.env.demo.local scripts/load-demo.ts
//
// Refuses to run against any database other than the demo project.
import { readFileSync } from "node:fs";
import { parseCsv, toDemoProduct } from "../lib/products/demo-csv";

const DEMO_DB_USER = "postgres.cliojljksykfzbdynsra";

async function main() {
  const user = new URL(process.env.DATABASE_URL ?? "postgresql://x").username;
  if (user !== DEMO_DB_USER) {
    throw new Error(`Refusing to load: DATABASE_URL is not the demo database (user "${user}")`);
  }
  // Import after the guard so no client is created for the wrong database.
  const { default: prisma } = await import("../lib/prisma");

  const products = parseCsv(readFileSync("samples/demo/products.csv", "utf8")).map(toDemoProduct);

  const categories = new Map<string, string>();
  for (const [slug, name] of [["dresses", "Dresses"], ["tops", "Tops"]] as const) {
    const c = await prisma.category.upsert({ where: { slug }, update: { name }, create: { slug, name } });
    categories.set(slug, c.id);
  }

  const brands = new Map<string, string>();
  for (const p of products) {
    if (brands.has(p.brandSlug)) continue;
    const data = { name: p.brandName, websiteUrl: p.brandWebsite, affiliateProgram: "none" };
    const b = await prisma.brand.upsert({
      where: { slug: p.brandSlug },
      update: data,
      create: { slug: p.brandSlug, ...data },
    });
    brands.set(p.brandSlug, b.id);
  }

  for (const p of products) {
    const data = {
      name: p.name,
      brandId: brands.get(p.brandSlug)!,
      categoryId: categories.get(p.categorySlug)!,
      imageUrl: p.imageUrl,
      price: p.price,
      currency: p.currency,
      affiliateUrl: p.affiliateUrl,
      inStock: p.inStock,
      lastVerifiedAt: p.lastVerifiedAt,
    };
    await prisma.product.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } });
  }

  const count = await prisma.product.count();
  console.log(`Loaded ${products.length} products, ${brands.size} brands. Products in demo DB: ${count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
