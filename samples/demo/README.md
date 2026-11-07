# Demo samples

Real products for the demo catalogue, stored the way an affiliate feed would provide them (Google Shopping product-spec columns). When a licensed feed arrives, it replaces these rows and the schema stays the same.

**Rules (see `docs/research/2026-11-07-brand-terms.md`):** store facts, links and image *URLs* only. Never save image files or page copies. Tagging sends the image URL straight to the vision API (ADR-0013, extraction-only).

## `products.csv` columns

| Column | Meaning |
|---|---|
| `id` | `<brand-slug>-<brand product id>`, which stays stable across re-collection |
| `brand`, `title`, `link` | Brand name, product name as shown, canonical product URL (no query string) |
| `image_link` | Main product image URL, model-on preferred |
| `additional_image_link` | Up to 4 more image URLs (back view first), `|`-separated |
| `price`, `currency`, `availability` | As shown on the day of collection (`in_stock` / `out_of_stock`) |
| `color_raw`, `material_raw` | Colour and fabric text exactly as the brand states them |
| `category` | `dress` or `top` (matches the Category seed) |
| `collected_on` | Date the row was collected |
| `sleeveLength` … `pattern` | The 14 modesty attributes, using the Prisma enum values. Blank until tagged. |
| `tag_status` | `untagged` → `tagged` → `reviewed` |

## Adding more

1. Append rows to the end; never reorder or reuse an `id`.
2. Fill in everything up to `collected_on`, leave the attributes blank and set `tag_status` to `untagged`.
3. Run the tagger on the untagged rows (script to come), then review.
