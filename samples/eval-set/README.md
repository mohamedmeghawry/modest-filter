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
