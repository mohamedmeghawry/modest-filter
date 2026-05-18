# ADR 0009: Product URL Design

- Status: Accepted
- Date: 2026-05-17
- Implements: app/products/[id]/page.tsx (product detail route)
- Cross-reference: ADR-0007 (Product.id is a cuid), ADR-0004 (API-first via lib/data seam)

## Context

The product detail route (`/products/[id]`) needs a URL identifier for each product. `Product.id` is a cuid (per ADR-0007), already unique and stable. The alternative is a human-readable slug derived from the product name.

## Decision

v1 uses the cuid `id` directly in product URLs (e.g. `/products/seed-aritzia-effortless-midi`). Slugs are deferred to v2.

## Rationale

- The cuid is already unique and stable — it requires no schema change, no migration, no population logic, and no collision handling.
- A slug would require all four: a new `Product.slug @unique` column, a migration, a name-to-slug helper to populate it (including for all future ingested products), and collision handling for duplicate names across brands.
- v1 has no public traffic and no SEO goals, so the slug's main benefits do not yet apply.

## Trade-off acknowledged

- URLs are ugly and opaque (`/products/clx9a...`), with no human readability.
- No SEO benefit: search engines cannot derive product context from the URL.
- These costs are acceptable for v1 (portfolio/hobby stage, no organic traffic).

## V2 plan

- Add `Product.slug @unique` to the schema (migration).
- Populate via a deterministic name-to-slug helper, with brand-scoped collision handling (e.g., append a short suffix on conflict).
- Serve canonical slug URLs; 301-redirect old `/products/[id]` URLs to the slug URL so existing links and any indexed pages do not break.
