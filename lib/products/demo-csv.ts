// Parse samples/demo/products.csv (feed-shaped demo catalogue, ADR-0013
// amendment) into rows the demo loader can upsert. Pure: no I/O, no Prisma.

/** RFC 4180-style CSV: quoted fields may hold commas, newlines and "" escapes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((f) => f !== ""));
  if (!header) return [];
  return body.map((r) =>
    Object.fromEntries(header.map((key, i) => [key, r[i] ?? ""])),
  );
}

export type DemoProduct = {
  id: string;
  brandName: string;
  brandSlug: string;
  brandWebsite: string;
  categorySlug: "dresses" | "tops";
  name: string;
  imageUrl: string;
  price: string;
  currency: string;
  affiliateUrl: string;
  inStock: boolean;
  lastVerifiedAt: Date;
};

const CATEGORY_SLUGS: Record<string, DemoProduct["categorySlug"]> = {
  dress: "dresses",
  top: "tops",
};

/** Map one CSV row to a product. Throws on anything the loader can't store. */
export function toDemoProduct(row: Record<string, string>): DemoProduct {
  const categorySlug = CATEGORY_SLUGS[row.category];
  if (!categorySlug) throw new Error(`${row.id}: unknown category "${row.category}"`);
  if (!/^\d+(\.\d{1,2})?$/.test(row.price)) throw new Error(`${row.id}: bad price "${row.price}"`);
  const lastVerifiedAt = new Date(`${row.collected_on}T00:00:00Z`);
  if (Number.isNaN(lastVerifiedAt.getTime())) throw new Error(`${row.id}: bad collected_on`);
  const link = new URL(row.link);

  return {
    id: row.id,
    brandName: row.brand,
    brandSlug: row.brand.toLowerCase().replace(/[^a-z0-9]+/g, ""),
    brandWebsite: link.origin,
    categorySlug,
    name: row.title,
    imageUrl: row.image_link,
    price: row.price,
    currency: row.currency,
    affiliateUrl: row.link,
    inStock: row.availability === "in_stock",
    lastVerifiedAt,
  };
}
