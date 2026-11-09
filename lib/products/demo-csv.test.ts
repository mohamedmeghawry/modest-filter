import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCsv, toDemoProduct } from "./demo-csv";

describe("parseCsv", () => {
  it("handles quoted commas, escaped quotes and CRLF", () => {
    const rows = parseCsv('a,b\r\n"1, 2","say ""hi"""\r\n');
    expect(rows).toEqual([{ a: "1, 2", b: 'say "hi"' }]);
  });

  it("keeps empty fields and skips blank lines", () => {
    expect(parseCsv("a,b,c\nx,,z\n\n")).toEqual([{ a: "x", b: "", c: "z" }]);
  });
});

describe("toDemoProduct", () => {
  const base = {
    id: "hm-1",
    brand: "H&M",
    title: "Dress",
    link: "https://www2.hm.com/en_ca/productpage.1.html",
    image_link: "https://image.hm.com/a.jpg",
    price: "39.99",
    currency: "CAD",
    availability: "in_stock",
    category: "dress",
    collected_on: "2026-11-07",
  };

  it("maps a row", () => {
    const p = toDemoProduct(base);
    expect(p.brandSlug).toBe("hm");
    expect(p.brandWebsite).toBe("https://www2.hm.com");
    expect(p.categorySlug).toBe("dresses");
    expect(p.inStock).toBe(true);
    expect(p.lastVerifiedAt.toISOString()).toBe("2026-11-07T00:00:00.000Z");
  });

  it("rejects an unknown category and a bad price", () => {
    expect(() => toDemoProduct({ ...base, category: "shoe" })).toThrow(/category/);
    expect(() => toDemoProduct({ ...base, price: "$39" })).toThrow(/price/);
  });

  it("parses all 25 real demo rows", () => {
    const rows = parseCsv(readFileSync("samples/demo/products.csv", "utf8"));
    const products = rows.map(toDemoProduct);
    expect(products).toHaveLength(25);
    expect(new Set(products.map((p) => p.brandSlug))).toEqual(
      new Set(["uniqlo", "hm", "zara", "simons", "reitmans"]),
    );
    expect(products.every((p) => p.imageUrl.startsWith("https://"))).toBe(true);
  });
});
