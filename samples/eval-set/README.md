# Evaluation Set — Gathering Guide

The field guide for sourcing the ~30 test products. The *why* and the full
coverage matrix live in [`docs/eval-coverage-plan.md`](../../docs/eval-coverage-plan.md);
this is the *how* — what to do while shopping.

## The workflow (per product)

1. **Find a product** matching one of the archetypes below.
2. **Capture 4 things:**
   - **Front photo** (save as `Product Name_front.png`)
   - **Back photo** (`Product Name_back.png`) — *required*; `backStyle` is invisible from the front.
   - **Description** — copy the product-page text (fabric, lining, length…).
   - **Source URL.**
3. **Set the correct tags** (`groundTruth`) — you + curation lead, using
   [`docs/tagging-conventions.md`](../../docs/tagging-conventions.md).
4. **Add one entry** to `manifest.json` in this folder.

> There is **no database** here. Testing reads this `manifest.json` only. The
> `description` is a JSON field, not a separate text file. You fill in both the
> `description` and the `groundTruth` tags by hand — the AI gets graded against them.

## A fully-worked example entry

This is what one finished entry looks like (description **and** tags filled in):

```jsonc
{
  "id": "reformation-juliette-silk-slip",
  "category": "dresses",
  "images": ["./Juliette Silk Slip Dress_front.png", "./Juliette Silk Slip Dress_back.png"],
  "description": "100% silk charmeuse. Unlined. Bias-cut midi slip with a scoop neckline, adjustable straps, and a low scoop back. Side slit.",
  "sourceUrl": "https://www.thereformation.com/products/juliette-silk-dress",
  "groundTruth": {
    "sleeveLength": "sleeveless",
    "sleeveOpacity": null,
    "neckline": "scoop",
    "backStyle": "low_back",
    "hemLength": "midi",
    "topLength": null,
    "slit": "high",
    "fit": "semi_fitted",
    "opacity": "opaque",
    "lined": "unlined",
    "cutouts": "none",
    "material": "silk",
    "primaryColor": "black",
    "pattern": "solid"
  }
}
```

Note how `material` (silk), `lined` (unlined), and the slit all came **from the
description**, not the photo — that's exactly why we capture it.

## Filling in the pre-built stubs

`manifest.json` is **pre-populated with 28 stubs** — one per archetype. You don't
create structure; you fill values. For each product you source:

1. **Rename** the stub `id` and the two `images` filenames to the real product
   (e.g. `silk-slip` → `reformation-casette-silk`, and the photos to match).
2. **Save** the front + back photos in this folder under those names.
3. **Paste** the product-page text into `description`, and the link into `sourceUrl`.
4. **Replace every `"TODO: ..."`** in `groundTruth` with one of the options shown.

Conventions in the stubs:

- **`"TODO: a|b|c"` = you must fill this — pick ONE of the listed options.** Each
  unfilled field already shows its valid values, so you don't have to remember the
  enum. Example: `"sleeveLength": "TODO: sleeveless|cap|short|elbow|three_quarter|long|extra_long"`
  → replace the whole string with e.g. `"short"`. Search the file for `TODO`; when
  none remain, the set is complete.
- **`null` (already set) = correct as-is** — it's a category rule, not a blank.
  Dresses/abayas have `topLength: null`; tops have `hemLength: null` + `slit: null`.
  (If a field turns out genuinely N/A — e.g. `sleeveOpacity` on a sleeveless dress —
  replace its `TODO` with `null`.)
- **Some fields are pre-filled** (not `TODO`) on the lead products — those came from
  the product description (material, etc.); just confirm them.
- **`priority`**: do the **17 `core`** stubs first — they carry the rare values.
  The **11 `extra`** stubs are common anchors and gap-fillers; fill them once core
  is done. (Per the start-small advice: even the first ~12 core gives me enough to
  build the scorer and show you real numbers.)
- **`note`** is guidance for sourcing — you can delete it once the entry is filled,
  or leave it; the scorer ignores unknown fields.

## Where to hunt each brand

Different brands are strong for different rare values. Rough routing:

| Brand | Best for |
|---|---|
| **Anthropologie** | **Patterns** — floral, plaid, geometric, abstract, polka_dot; varied colors. Your #1 stop for pattern coverage. |
| **Reformation** | Slip dresses → **slits + low/open backs**; florals; viscose/linen. |
| **Everlane** | **Material variety** — silk, wool, denim, cotton; clean solids. |
| **Banana Republic** | **Collars, tailored fits, wool**; neutral/work colors (gray, brown, navy). |
| **Aritzia** | Linen, knit, viscose; halters, bodysuits, structured dresses. |
| **Abayas** | Not carried by the above — source from a modest retailer you already use. |

> **Leather** and **animal_print** may not exist at these brands. If you can't
> find them in ~10 min, mark those values "out of scope" (see the plan's open
> questions) rather than forcing a bad source.

## Starter leads (verified live June 2026)

Real products that match the trickiest archetypes, so the curation lead isn't
hunting blind. **Stock changes constantly — treat these as starting points, and
she has final say on modesty fit.** If a link is dead, the search term that found
it still works.

| # | Archetype | Lead | Where |
|---|---|---|---|
| 2 | Floral viscose maxi | Reformation **Lisola** floral-print maxi (100% viscose) | [reformation floral dresses](https://www.thereformation.com/dresses/floral-dresses) |
| 3 | Halter + open back | Aritzia **Cayenne Halter Dress** / **Talula Halter Midi** | [Cayenne](https://www.aritzia.com/us/en/product/cayenne-halter-dress/95675.html) |
| 4 | Denim shirtdress, collar, long sleeve | Everlane **The Denim Shirtdress** (Indigo) | [Everlane](https://www.everlane.com/products/womens-denim-shirtdress-indigo) |
| 5 | Silk slip, open/low back, slit | Reformation **Casette** (open back) or **Alli** (halter, back slit) | [Casette](https://www.thereformation.com/products/casette-silk-dress/1311240.html) · [Alli](https://www.thereformation.com/products/alli-silk-dress/1310701.html) |
| 6 | Sheer off-shoulder | Anthropologie **Off-Shoulder Mesh Slim Midi** (~$148) | [Anthropologie](https://www.anthropologie.com/shop/by-anthropologie-off-shoulder-mesh-slim-midi-dress) |
| 8 | Cutout midi (knit) | Aritzia **Cutout Knit Midi Dress** | [Aritzia](https://www.aritzia.com/us/en/product/cutout-knit-midi-dress/104560.html) |
| 9 | Wool sweater dress, gray, 3/4 | Banana Republic merino **sweater dress** (browse category) | [BR sweater dresses](https://bananarepublic.gap.com/shop/sweater-dress-0zaz06d) |
| 10 | Plaid, square neck | Anthropologie **Maeve Belted Square-Neck Plaid Dress** | [Anthropologie](https://www.anthropologie.com/shop/maeve-belted-square-neck-plaid-dress) |
| 11 | Animal-print wrap | Anthropologie **By Anthropologie Printed Wrap** / **Maeve Long-Sleeve Printed Wrap** | [By Anthro](https://www.anthropologie.com/shop/by-anthropologie-printed-wrap-dress) |
| 17 | Polka-dot top | Anthropologie **Maeve Short-Sleeve Polka Dot Blouse** | [Anthropologie](https://www.anthropologie.com/shop/maeve-short-sleeve-polka-dot-blouse) |
| 19 | Geometric/abstract top | Anthropologie **Thales Geometric Blouse** / **Geometric Dolman-Sleeved Blouse** | [Dolman](https://www.anthropologie.com/shop/geometric-dolman-sleeved-blouse) |
| 20 | Leather top | Anthropologie **faux-leather** clothing (reads as `leather` to the camera) | [faux leather](https://www.anthropologie.com/faux-leather-clothing-and-accessories) |

> **Leather caveat:** the target brands carry *faux* leather, not real. For
> image-based tagging that's fine — the AI tags what the photo looks like
> (`leather`). If you'd rather not include it, it's a fair value to drop.

## Gather checklist

Tick each box as you capture it. "Find this" is the short version — full detail
per number is in the coverage plan's shopping list.

### Dresses

| # | id (suggestion) | Find this | front | back | desc | tags |
|---|---|---|---|---|---|---|
| 1 | `*-black-ls-midi` | Black long-sleeve crew midi (baseline) | ☐ | ☐ | ☐ | ☐ |
| 2 | `*-floral-viscose-maxi` | Floral V-neck viscose floor-length | ☐ | ☐ | ☐ | ☐ |
| 3 | `*-striped-halter-midi` | Striped halter, sleeveless | ☐ | ☐ | ☐ | ☐ |
| 4 | `*-denim-shirtdress` | Denim shirt-dress, collar, knee, long sleeve | ☐ | ☐ | ☐ | ☐ |
| 5 | `*-silk-slip` | Silk slip, scoop, high slit, low back | ☐ | ☐ | ☐ | ☐ |
| 6 | `*-sheer-offshoulder` | Sheer chiffon, off-shoulder | ☐ | ☐ | ☐ | ☐ |
| 7 | `*-knit-turtleneck-mini` | Knit bodycon, fitted, turtleneck, mini | ☐ | ☐ | ☐ | ☐ |
| 8 | `*-cutout-midi` | Cutout midi (waist cutouts) | ☐ | ☐ | ☐ | ☐ |
| 9 | `*-wool-sweater-dress` | Wool sweater dress, gray, 3/4 sleeve | ☐ | ☐ | ☐ | ☐ |
| 10 | `*-plaid-square` | Plaid, elbow sleeve, square neck | ☐ | ☐ | ☐ | ☐ |
| 11 | `*-animalprint-wrap` | Animal-print wrap, cap sleeve, v-back | ☐ | ☐ | ☐ | ☐ |
| 12 | `*-lined-floral-midi` | Floral midi, "fully lined" in desc | ☐ | ☐ | ☐ | ☐ |
| 13 | `*-openback-maxi` | Open-back maxi, ankle hem, low slit | ☐ | ☐ | ☐ | ☐ |

### Tops

| # | id (suggestion) | Find this | front | back | desc | tags |
|---|---|---|---|---|---|---|
| 14 | `*-cropped-tank` | Cropped tank, scoop, sleeveless | ☐ | ☐ | ☐ | ☐ |
| 15 | `*-oversized-buttondown` | Oversized button-down, collar, longline | ☐ | ☐ | ☐ | ☐ |
| 16 | `*-tunic-highneck` | Tunic blouse, high-neck, 3/4 sleeve | ☐ | ☐ | ☐ | ☐ |
| 17 | `*-polkadot-tee` | Waist-length tee, polka-dot, short sleeve | ☐ | ☐ | ☐ | ☐ |
| 18 | `*-semisheer-scoopback` | Semi-sheer blouse, brown, scoop-back | ☐ | ☐ | ☐ | ☐ |
| 19 | `*-geometric-top` | Geometric print, purple | ☐ | ☐ | ☐ | ☐ |
| 20 | `*-leather-top` | Leather top, black | ☐ | ☐ | ☐ | ☐ |
| 21 | `*-abstract-cami` | Abstract-print cami, orange | ☐ | ☐ | ☐ | ☐ |
| 22 | `*-modal-partlined` | Modal top, "partially lined" in desc | ☐ | ☐ | ☐ | ☐ |

### Abayas

| # | id (suggestion) | Find this | front | back | desc | tags |
|---|---|---|---|---|---|---|
| 23 | `*-black-classic-abaya` | Black classic abaya (baseline) | ☐ | ☐ | ☐ | ☐ |
| 24 | `*-openfront-abaya` | Open-front, extra-long sleeve, beige | ☐ | ☐ | ☐ | ☐ |
| 25 | `*-multicolor-abaya` | Multicolor embroidered, "other" pattern | ☐ | ☐ | ☐ | ☐ |
| 26 | `*-blend-abaya` | Cotton/poly blend in desc, mid slit | ☐ | ☐ | ☐ | ☐ |

### Gap-fillers (only if not already covered above)

| # | id (suggestion) | Find this | front | back | desc | tags |
|---|---|---|---|---|---|---|
| 27 | `*-other-material` | "Other" material (metallic/tencel per desc) | ☐ | ☐ | ☐ | ☐ |
| 28 | `*-yellow-item` | Anything yellow (if still missing) | ☐ | ☐ | ☐ | ☐ |
| 29 | `*-extra-backstyle` | Second v-back/scoop-back if #11/#18 fall through | ☐ | ☐ | ☐ | ☐ |
| 30 | — | Keep the existing PowerLinen pant as the styling-confound case | ☐ | ☐ | ☐ | ☐ |

When all [HUNT] values in the coverage matrix have at least one ☑, the set is complete.
