import { describe, it, expect } from "vitest";
import { validateBundleProduct, toBatch2Row, rowFeedFacts, BATCH2_HEADER, type BundleProduct } from "./batch2";
import { parseCsv, toCsv, toDemoProduct } from "./demo-csv";

const P: BundleProduct = {
  id: "mango-87012345",
  brand: "Mango",
  title: "Long-sleeve satin midi dress",
  link: "https://shop.mango.com/ca/en/p/women/dresses/midi/87012345",
  price: "89.99",
  currency: "CAD",
  availability: "in_stock",
  color_raw: "Black",
  material_raw: "100% polyester",
  description: "Flowing satin dress. Lined. Wear it with a strapless bra for a clean look.",
  category: "dress",
  listing_url: "https://shop.mango.com/ca/en/c/women/dresses/long-sleeve",
  listing_position: 3,
  gallery_count: 6,
  back_index: 2,
  images: {
    front: { url: "https://shop.mango.com/assets/a.jpg", b64: "AAAA" },
    back: { url: "https://shop.mango.com/assets/c.jpg", b64: "BBBB" },
  },
};

describe("validateBundleProduct", () => {
  it("accepts a complete product", () => {
    expect(validateBundleProduct(P)).toEqual([]);
  });

  it("flags an id the Batches API would reject, a bad price and a non-https link", () => {
    const errs = validateBundleProduct({ ...P, id: "Mango 870/12", price: "$89", link: "http://x.com/p" });
    expect(errs.join(" ")).toMatch(/bad id/);
    expect(errs.join(" ")).toMatch(/bad price/);
    expect(errs.join(" ")).toMatch(/link is not https/);
  });

  it("requires back_index and back photo bytes to agree", () => {
    expect(validateBundleProduct({ ...P, images: { ...P.images, back: null } }).join(" ")).toMatch(/back_index set/);
    expect(validateBundleProduct({ ...P, back_index: null }).join(" ")).toMatch(/without back_index/);
    expect(validateBundleProduct({ ...P, back_index: null, images: { ...P.images, back: null } })).toEqual([]);
  });
});

describe("toBatch2Row", () => {
  const row = toBatch2Row(P, "2026-11-10");

  it("stores parsed facts, never the description text", () => {
    expect(Object.values(row).join(" ")).not.toContain("Flowing satin");
    const facts = JSON.parse(row.text_facts);
    expect(facts.lined).toBe("lined");
    expect(facts.material).toBe("polyester");
    expect(facts.sleeveLength).toContain("long"); // "long-sleeve" = long or extra_long (text-facts)
  });

  it("ignores styling advice in the gate (strapless bra is another item)", () => {
    expect(row.gate_reasons).toBe("");
    expect(toBatch2Row({ ...P, description: "Open back with a tie." }, "2026-11-10").gate_reasons).toBe("back");
  });

  it("records where the photos came from", () => {
    expect(row.image_link).toBe(P.images.front.url);
    expect(row.additional_image_link).toBe(P.images.back!.url);
    expect(row.back_photo_index).toBe("2");
    expect(row.listing_position).toBe("3");
  });

  it("round-trips through the CSV writer and the batch-1 loader", () => {
    const parsed = parseCsv(toCsv(BATCH2_HEADER, [row]));
    expect(parsed[0]).toEqual(row);
    expect(toDemoProduct(parsed[0])).toMatchObject({ id: P.id, brandSlug: "mango", categorySlug: "dresses", price: "89.99" });
  });
});

describe("rowFeedFacts", () => {
  it("prefers batch-2 text_facts (which include the description)", () => {
    expect(rowFeedFacts({ material_raw: "", text_facts: '{"material":"viscose","lined":"lined"}' })).toEqual({ material: "viscose", lined: "lined" });
  });

  it("falls back to batch 1's material text", () => {
    expect(rowFeedFacts({ material_raw: "100% Cotton" })).toEqual({ material: "cotton", lined: null });
  });
});
