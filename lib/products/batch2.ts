// Batch 2 of the demo catalogue (approved 2026-11-09): 10 brands × 10
// products, collected in the browser at human pace. The browser saves one
// "bundle" download per brand; scripts/decode-batch.ts turns it into photos
// and rows of samples/demo/products-batch2.csv. Pure: no I/O.
//
// The brand's description text is used ONLY to parse facts here; the CSV
// stores the parsed facts, never the text (docs/ACTIONS.md, ADR-0013).
import { parseTextFacts } from "@/lib/vision/text-facts";
import { parseFeedFacts, type FeedFacts } from "@/lib/vision/feed-facts";
import { textGate } from "@/lib/vision/text-gate";

export type BundleImage = { url: string; b64: string };

export type BundleProduct = {
  id: string; // <brand>-<product code>, also the Batches API custom_id
  brand: string;
  title: string;
  link: string;
  price: string;
  currency: string;
  availability: "in_stock" | "out_of_stock";
  color_raw: string;
  material_raw: string;
  description: string; // transient: parsed below, never written to the CSV
  category: "dress" | "top";
  listing_url: string;
  listing_position: number; // 1-based position on the long-sleeve listing
  gallery_count: number;
  back_index: number | null; // 0-based gallery position of the back photo; null = none
  images: { front: BundleImage; back: BundleImage | null };
  /**
   * The whole product gallery, when the front/back are picked locally after
   * decoding (scripts/pick-photos.ts) rather than in the browser: Chrome allows
   * one automatic download per site, so a wrong pick can't be re-fetched.
   */
  gallery?: BundleImage[];
};

export type Bundle = {
  brand: string;
  collected_on: string; // YYYY-MM-DD
  products: BundleProduct[];
  /** Listing items passed over, e.g. "no back photo": the per-brand photo finding (T3). */
  skipped: { link: string; listing_position: number; reason: string }[];
};

/** Batch-1 columns first (so parseCsv/toDemoProduct keep working), then batch-2 extras. */
export const BATCH2_HEADER = [
  "id", "brand", "title", "link", "image_link", "additional_image_link", "price", "currency",
  "availability", "color_raw", "material_raw", "category", "collected_on",
  "listing_url", "listing_position", "gallery_count", "back_photo_index", "text_facts", "gate_reasons",
] as const;

const ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/; // Batches API custom_id: [a-zA-Z0-9_-]{1,64}

/** Problems that make a bundle product unusable; empty when it's fine. */
export function validateBundleProduct(p: BundleProduct): string[] {
  const errs: string[] = [];
  if (!ID_RE.test(p.id)) errs.push(`bad id "${p.id}"`);
  if (!p.title?.trim()) errs.push("no title");
  if (!/^\d+(\.\d{1,2})?$/.test(p.price)) errs.push(`bad price "${p.price}"`);
  if (p.category !== "dress" && p.category !== "top") errs.push(`bad category "${p.category}"`);
  for (const [name, u] of [["link", p.link], ["listing_url", p.listing_url], ["front image", p.images?.front?.url]] as const) {
    try {
      if (new URL(u ?? "").protocol !== "https:") errs.push(`${name} is not https`);
    } catch {
      errs.push(`${name} is not a URL`);
    }
  }
  if (!p.images?.front?.b64) errs.push("no front photo bytes");
  if (p.back_index != null && !p.images.back?.b64) errs.push("back_index set but no back photo bytes");
  if (p.back_index == null && p.images.back) errs.push("back photo without back_index");
  return errs;
}

/** Facts parsed from the brand's own words: title + description + material text. */
export function parseProductText(p: Pick<BundleProduct, "title" | "description" | "material_raw">) {
  const feed = parseFeedFacts([p.material_raw, p.description].filter(Boolean).join(". "));
  return {
    facts: { ...parseTextFacts(p.title, p.description), material: feed.material, lined: feed.lined },
    gate: textGate(p.title, p.description),
  };
}

/** One CSV row for a bundle product (call validateBundleProduct first). */
export function toBatch2Row(p: BundleProduct, collectedOn: string): Record<(typeof BATCH2_HEADER)[number], string> {
  const { facts, gate } = parseProductText(p);
  return {
    id: p.id, brand: p.brand, title: p.title, link: p.link,
    image_link: p.images.front.url, additional_image_link: p.images.back?.url ?? "",
    price: p.price, currency: p.currency, availability: p.availability,
    color_raw: p.color_raw, material_raw: p.material_raw, category: p.category, collected_on: collectedOn,
    listing_url: p.listing_url, listing_position: String(p.listing_position),
    gallery_count: String(p.gallery_count), back_photo_index: p.back_index == null ? "" : String(p.back_index),
    text_facts: JSON.stringify(facts), gate_reasons: gate.reasons.join("|"),
  };
}

/**
 * Material and lining for a CSV row: the batch-2 `text_facts` column when
 * present (it includes the description), else batch 1's material text.
 */
export function rowFeedFacts(row: Record<string, string>): FeedFacts {
  if (row.text_facts) {
    const f = JSON.parse(row.text_facts) as Partial<FeedFacts>;
    return { material: f.material ?? null, lined: f.lined ?? null };
  }
  return parseFeedFacts(row.material_raw);
}
