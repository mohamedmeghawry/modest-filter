# Evaluation Set — Coverage Plan

> Prep for the Session N+2 evaluation harness. This document specifies **which
> products to source** so the hand-tagged ground-truth set exercises the *whole*
> schema, not one narrow corner of it. No code; this is a sourcing checklist for
> Mohamed + curation lead.

## Why this exists

Today's only ground truth (`samples/manifest-model-on.json`) is **6 Aritzia
linen dresses** — all `material: linen`, `pattern: solid`, mostly beige/white/navy,
mostly midi, mostly sleeveless/short. That validated one corner of the schema and
called it 93%. It never tested `sheer`, a `top`, an `abaya`, `striped`/`floral`,
`long` sleeves, a slit, or a backless cut. **We cannot claim the AI is accurate
until the test set hits every value at least once.**

## The target

- **~30 products** for v1 coverage (every enum value represented ≥1 time).
- Expandable to ~50 later for *statistical confidence* (each value seen multiple
  times) — but single-coverage first; it's the 80/20.
- Split across all 3 categories: **dresses, tops, abayas.**

### Two rules that are easy to miss

1. **Source immodest pieces on purpose.** Off-shoulder, open-back, sheer, high-slit,
   oversized are all valid *tags*. The product's whole value prop is correctly
   identifying these so the user can **filter them out**. A test set of only-modest
   items can't prove the AI catches the immodest ones.
2. **Capture the BACK photo and the DESCRIPTION, not just the front.**
   - `backStyle` (5 values) is invisible from the front — every back-style value
     needs a back image.
   - `material` and `lined` often can't be seen at all; they come from the product
     **description text**. Capturing the description now (a) lets us ground-truth
     these honestly and (b) feeds the future "image + description" accuracy test.

## Coverage matrix (82 values)

Legend: **[common]** = you'll get it incidentally · **[HUNT]** = deliberately seek
a product for it (these are what the test set usually misses).

### Coverage attributes

| Attribute | Values |
|---|---|
| **SleeveLength** (7) | sleeveless [common], short [common], long [common], cap **[HUNT]**, elbow **[HUNT]**, three_quarter **[HUNT]**, extra_long **[HUNT]** |
| **Neckline** (9) | crew [common], v_neck [common], scoop [common], high_neck **[HUNT]**, collar **[HUNT]**, turtleneck **[HUNT]**, off_shoulder **[HUNT]**, halter **[HUNT]**, square **[HUNT]** |
| **BackStyle** (5) | closed [common], scoop_back **[HUNT]**, v_back **[HUNT]**, low_back **[HUNT]**, open_back **[HUNT]** — *all need a back photo* |
| **HemLength** (5, dresses/skirts) | midi [common], mini **[HUNT]**, knee **[HUNT]**, ankle **[HUNT]**, floor **[HUNT]** |
| **TopLength** (5, tops) | hip [common], cropped **[HUNT]**, waist **[HUNT]**, tunic **[HUNT]**, longline **[HUNT]** |
| **Slit** (4, dresses/skirts) | none [common], low **[HUNT]**, mid **[HUNT]**, high **[HUNT]** |

### Fit & material

| Attribute | Values |
|---|---|
| **Fit** (4) | semi_fitted [common], loose [common], fitted **[HUNT]**, oversized **[HUNT]** |
| **Opacity** (3) | opaque [common], semi_sheer **[HUNT]**, sheer **[HUNT]** |
| **Lined** (3) | unlined [common], lined **[HUNT]**, partially_lined **[HUNT]** — *from description* |
| **Cutouts** (2) | none [common], present **[HUNT]** |
| **Material** (12) | cotton [common], linen [common], knit [common], silk **[HUNT]**, polyester **[HUNT]**, viscose **[HUNT]**, modal **[HUNT]**, wool **[HUNT]**, denim **[HUNT]**, leather **[HUNT]**, blend **[HUNT]**, other **[HUNT]** |

### Visual

| Attribute | Values |
|---|---|
| **PrimaryColor** (14) | black, white, beige, navy, blue, green, pink, red [common-ish]; brown **[HUNT]**, gray **[HUNT]**, yellow **[HUNT]**, orange **[HUNT]**, purple **[HUNT]**, multicolor **[HUNT]** |
| **Pattern** (9) | solid [common], floral [common]; striped **[HUNT]**, plaid **[HUNT]**, geometric **[HUNT]**, animal_print **[HUNT]**, polka_dot **[HUNT]**, abstract **[HUNT]**, other **[HUNT]** |

## The ~30-product shopping list

Each row is an **archetype** chosen to knock out specific rare values. The "kills"
column lists the **[HUNT]** values that product secures. Common values (color,
fit, opaque, solid…) fall out naturally and aren't listed. Adjust freely — the
curation lead knows what's actually sourceable.

### Dresses (13)

| # | Archetype | Rare values it secures |
|---|---|---|
| 1 | Black long-sleeve crew midi (baseline) | — (anchors common) |
| 2 | Floral V-neck **viscose** maxi, **floor** hem | material viscose, hem floor |
| 3 | **Striped** **halter** midi, sleeveless | pattern striped, neckline halter |
| 4 | **Denim** shirt-dress, **collar**, **knee** hem, long sleeve | material denim, neckline collar, hem knee |
| 5 | **Silk** slip dress, scoop, **high slit**, **low_back** | material silk, slit high, backStyle low_back |
| 6 | **Sheer** chiffon **polyester** dress, **off_shoulder** | opacity sheer, material polyester, neckline off_shoulder |
| 7 | Knit bodycon, **fitted**, **turtleneck**, **mini** | fit fitted, neckline turtleneck, hem mini |
| 8 | **Cutout** midi dress (waist cutouts) | cutouts present |
| 9 | **Wool** sweater dress, **gray**, **three_quarter** sleeve | material wool, color gray, sleeve three_quarter |
| 10 | **Plaid** dress, **elbow** sleeve, **square** neck | pattern plaid, sleeve elbow, neckline square |
| 11 | **Animal_print** wrap dress, **cap** sleeve, **v_back** | pattern animal_print, sleeve cap, backStyle v_back |
| 12 | **Lined** floral midi (desc: "fully lined") | lined |
| 13 | **Open_back** maxi, **ankle** hem, **low slit** | backStyle open_back, hem ankle, slit low |

### Tops (9)

| # | Archetype | Rare values it secures |
|---|---|---|
| 14 | **Cropped** tank, scoop, sleeveless | topLength cropped |
| 15 | **Oversized** button-down, collar, **longline**, long sleeve | fit oversized, topLength longline |
| 16 | **Tunic** blouse, **high_neck**, three_quarter | topLength tunic, neckline high_neck |
| 17 | **Waist**-length tee, **polka_dot**, short sleeve | topLength waist, pattern polka_dot |
| 18 | **Semi_sheer** blouse, **brown**, **scoop_back** | opacity semi_sheer, color brown, backStyle scoop_back |
| 19 | **Geometric**-print top, **purple** | pattern geometric, color purple |
| 20 | **Leather** top, black | material leather |
| 21 | **Abstract**-print cami, **orange** | pattern abstract, color orange |
| 22 | **Modal** lounge top, **partially_lined** (desc) | material modal, lined partially_lined |

### Abayas (4)

| # | Archetype | Rare values it secures |
|---|---|---|
| 23 | Black classic abaya, long sleeve, floor, crew (baseline) | — |
| 24 | Open-front abaya, **extra_long** sleeve, beige | sleeve extra_long |
| 25 | **Multicolor** embroidered abaya, **other** pattern | color multicolor, pattern other |
| 26 | Abaya in a **blend** (desc: "cotton/poly blend"), **mid slit** | material blend, slit mid |

### Gap-fillers (4) — confirm nothing above already covers these

| # | Archetype | Rare values it secures |
|---|---|---|
| 27 | **"Other"** material item (e.g. metallic/tencel per desc) | material other |
| 28 | **Yellow** item (if not yet hit) | color yellow |
| 29 | A second back-photo item for **v_back**/**scoop_back** if #11/#18 fall through | backStyle redundancy |
| 30 | **Styling-confound** case (already have the PowerLinen pant) — keep 1 | edge-case robustness |

> After sourcing, walk the coverage matrix top to bottom and confirm **every
> [HUNT] value has at least one product**. Anything still uncovered → add a
> targeted #31, #32…

## What to capture per product

Record these into a manifest entry (same shape as `samples/manifest-model-on.json`,
plus `description`):

```jsonc
{
  "id": "brand-product-slug",
  "category": "dresses",                 // dresses | tops | abayas
  "images": ["./Name_front.png", "./Name_back.png"],  // front AND back
  "description": "100% linen. Fully lined. Midi length with a side slit.",
  "sourceUrl": "https://www.brand.com/...",
  "groundTruth": {                       // curation-lead-validated tags
    "sleeveLength": "...", "sleeveOpacity": "...", "neckline": "...",
    "backStyle": "...", "hemLength": "...", "topLength": null,
    "slit": "...", "fit": "...", "opacity": "...", "lined": "...",
    "cutouts": "...", "material": "...", "primaryColor": "...", "pattern": "..."
  }
}
```

- **`description`** is new and important: it's how we ground-truth `material`/`lined`
  honestly, and it's the input for the future "image + description" accuracy test.
- **`groundTruth`** must be set by the curation lead (the domain expert), not
  guessed — that's the whole point of ground truth. Follow `docs/tagging-conventions.md`.
- Use the category's null rules: dresses → `topLength: null`; tops → `hemLength`/`slit: null`.

## Division of labor

- **Mohamed + curation lead:** source the ~30 products (front + back photos +
  description text), set the validated `groundTruth`. This is the manual,
  domain-expert part — async, over several sittings.
- **Claude (Session N+2):** build the scorer that runs a model over this manifest
  and prints a per-attribute accuracy table; then the image-vs-image+description
  and Opus-vs-Haiku comparisons.

## Open questions for the curation lead

1. Are all 3 categories worth equal weight, or is the real v1 audience mostly
   **dresses**? If dresses dominate real usage, weight the set toward dresses
   (e.g. 18 dresses / 8 tops / 4 abayas) so accuracy numbers reflect reality.
2. Which **[HUNT]** materials/patterns are genuinely findable at the target brands
   (Aritzia/Everlane/etc.)? Leather and animal-print may not exist there — if so,
   mark those values "out of realistic scope" rather than forcing a bad source.
