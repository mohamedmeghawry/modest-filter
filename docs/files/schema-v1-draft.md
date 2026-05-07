# Schema v1 (draft)

**Status:** v1 draft — pending wife review before migration is applied.

## Overview

This document captures the database schema for modest-filter v1, designed in conversation with Claude on May 7, 2026. The schema covers three entities (Brand, Category, Product) and a set of 14 product attributes grouped by purpose (Coverage, Fit & material, Visual).

This file exists so the schema design survives chat history. Once reviewed and finalized, it will be translated into `prisma/schema.prisma` and applied as the first database migration.

## Entities

### Brand

| Column | Type | Notes |
|---|---|---|
| id | int / cuid | primary key |
| name | string | "Aritzia", "Everlane", etc. |
| slug | string | URL-friendly: "aritzia" |
| website_url | string | "https://www.aritzia.com" |
| affiliate_program | string | "shareasale", "rakuten", etc. |
| logo_url | string? | nullable |

### Category

| Column | Type | Notes |
|---|---|---|
| id | int / cuid | primary key |
| name | string | "Dresses", "Abayas", "Tops" |
| slug | string | "dresses", "abayas", "tops" |

Three rows for v1. Adding more categories later is trivial.

### Product

#### Core columns

| Column | Type | Notes |
|---|---|---|
| id | int / cuid | primary key |
| name | string | "Pleated Midi Dress" |
| brand_id | foreign key → Brand | |
| category_id | foreign key → Category | |
| image_url | string | primary product image |
| price | decimal | e.g. 89.99 |
| currency | string | default 'USD' for v1 |
| affiliate_url | string | click-through destination |
| in_stock | boolean | currently available |
| last_verified_at | timestamp | when we last confirmed product still exists on brand site |

#### Tagging metadata (per ADR 0005)

| Column | Type | Notes |
|---|---|---|
| tag_status | enum | pending / tagged / failed / needs_review |
| tag_confidence | decimal | 0–1, overall AI confidence |
| tagged_at | timestamp | when AI last tagged this product |

#### Timestamps

| Column | Type | Notes |
|---|---|---|
| created_at | timestamp | |
| updated_at | timestamp | |

#### Plus the 14 attributes below

## Product attributes (14 total)

### Coverage (7 attributes)

| Attribute | Values |
|---|---|
| sleeve_length | sleeveless, cap, short, elbow, three_quarter, long, extra_long |
| sleeve_opacity | sheer, semi_sheer, opaque |
| neckline | crew, v_neck, scoop, high_neck, turtleneck, off_shoulder, halter, square |
| back_style | closed, scoop_back, v_back, low_back, open_back |
| hem_length | mini, knee, midi, ankle, floor (for dresses) |
| top_length | cropped, waist, hip, tunic, longline (for tops) |
| slit | none, low (calf), mid (knee), high (thigh) |

`top_length` values are mapped to body landmarks: `tunic` and `longline` cover the buttocks; `hip` and shorter do not. Filter UI translates user-facing labels (e.g. "covers butt") into the underlying enum check rather than storing a redundant boolean.

### Fit & material (5 attributes)

| Attribute | Values |
|---|---|
| fit | fitted, semi_fitted, loose, oversized |
| opacity | sheer, semi_sheer, opaque (torso) |
| lined | lined, partially_lined, unlined |
| cutouts | none, present (consider adding location enum if granularity needed) |
| material | cotton, linen, silk, polyester, viscose, modal, wool, denim, leather, knit, blend, other |

### Visual (2 attributes)

| Attribute | Values |
|---|---|
| primary_color | black, white, beige, brown, gray, navy, blue, green, yellow, orange, red, pink, purple, multicolor |
| pattern | solid, striped, floral, plaid, geometric, animal_print, polka_dot, abstract, other |

## Data sources by attribute

The 14 attributes do not all come from the same place. Two pipelines populate them:

**From affiliate feed (parsed and normalized):**
- `material` — feeds give "60% cotton, 40% polyester" etc.; we extract dominant fiber and map to the enum
- `primary_color` — feeds give brand-specific names ("Onyx", "Charcoal Heather"); we normalize to color family

**Hybrid (feed if available, otherwise AI vision):**
- `pattern` — sometimes named in product title ("Floral Print Dress"); otherwise AI vision determines it

**From AI vision (Claude Vision API, per ADR 0005):**
- `sleeve_length`, `sleeve_opacity`, `neckline`, `back_style`, `hem_length`, `top_length`, `slit`, `fit`, `opacity`, `lined`, `cutouts`

The single `tag_status` column on Product tracks overall product readiness — a product is "tagged" only once both pipelines have completed.

This split is meaningful: 2 of 14 attributes (~14%) skip vision API calls entirely, which is a real recurring cost saving across a 1,000–3,000 product catalogue.

## Open questions for wife review

1. Are there modesty attributes missing from this list? Things you wish you could filter on at Aritzia / Anthropologie / Reformation that you currently can't?
2. Are any enum values too coarse or too fine? (E.g., neckline shapes, slit positions, color families.)
3. Is `cutouts` useful as a binary (present / none), or do we need to specify location (waist, ribs, shoulder, back)?
4. For `top_length`, does the cropped / waist / hip / tunic / longline split match how you actually shop?
5. Is `back_style` complete, or are there back configurations missing?
6. Is `lined` (lined / partially_lined / unlined) the right granularity, or do we need finer detail?

## Notes

- The schema is **locked as a v1 draft** in this document. Wife review is the next step before any migration is generated or applied.
- After wife review and any adjustments, this gets translated into `prisma/schema.prisma` and applied as the first Prisma migration.
- Architectural decisions about Postgres on Supabase, the API-first pattern, and AI vision tagging are documented in the corresponding ADRs (`0003-postgres-supabase-prisma.md`, `0004-api-first-architecture.md`, `0005-claude-vision-tagging.md`).
- This file should NOT be considered final until ADR-0006 (or equivalent) elevates the agreed schema into a proper architectural decision record.
