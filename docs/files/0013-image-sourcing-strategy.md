# ADR 0013: Three-Tier Image Sourcing Strategy

- Status: Accepted
- Date: 2026-05-20
- Implements: planned for Session N+1.5 (Rakuten Tier 1 coverage audit) before Session N+2's eval harness
- Cross-reference: ADR-0005 (Claude Vision tagging — relies on image input), ADR-0012 (image-source-inadequacy finding — this ADR is the systemic response)

## Context

ADR-0012 surfaced that image-only product photography hides modesty-critical attributes (length, slit, neckline-on-body); production must prefer model-on photos. This ADR documents the sourcing strategy that responds to that finding, scoped to the project's planned Rakuten-first affiliate integration but architected for future networks.

## Decision

Three-tier image sourcing with **extraction-only image handling**:

- **Tier 1 (primary)**: Affiliate network feeds
- **Tier 2 (supplementary)**: Brand-website scraping for missing model-on photos
- **Tier 3 (fallback)**: Product-only photos + text description

Coverage estimates throughout this document are **working hypotheses based on industry knowledge and brand-site inspection** — they are explicitly *not* measurements, and must be verified empirically in Session N+1.5 before this architecture is committed beyond the seed brands.

## Image lifecycle: extraction-only, not republication

This is the legal and architectural cornerstone of the strategy. Scraped images and affiliate-feed images are used **only as input to Claude Vision**; the extracted attributes are stored in the database. Original images are never stored, served, or republished by modest-filter. User-facing product images load directly from the brand's affiliate page at click-through time.

This eliminates the copyright and licensing risk that would attach to any republication model. The legal posture of Tier 2 scraping depends critically on this lifecycle — extraction-only is what makes the strategy defensible.

## Tier specifications

### Tier 1 — Affiliate network feeds (primary)

- **Sources**: Rakuten Advertising, impact.com, ShareASale
- **Includes**: Product metadata + available images (typically a mix of product-only and model-on shots; ratio varies by brand)
- **Cost**: Commission-based; no upfront cost
- **Legal status**: Fully licensed (affiliate agreement covers data use for extraction)
- **Estimated coverage**: **40–60% model-on photos** (*working hypothesis based on industry knowledge + brand-site inspection; to be verified in Session N+1.5*)

### Tier 2 — Brand-website scraping (supplementary)

- **Sources**: Public product pages on brand websites
- **Includes**: Model-on images for items where Tier 1 supplies only product-only photos
- **Cost**: Server/bandwidth (minimal); operational monitoring of the scraper
- **Legal status**: Defensible under current public-data-scraping precedent — extraction-only handling (above) is what keeps it defensible (see Legal posture below)
- **Estimated coverage with Tier 1 + 2**: **90–95% model-on photos** (*working hypothesis; dependent on Tier 1 audit findings*)

### Tier 3 — Product-only + description (fallback)

- **Sources**: Affiliate feeds (product-only images + brand-supplied text descriptions)
- **Includes**: Items where Tier 1 + 2 do not provide model-on photos
- **Cost**: None (affiliate data already paid for in Tier 1)
- **Legal status**: Fully licensed
- **Accuracy implication**: Lower per ADR-0012 — product-only photos lose scale reference (length, slit visibility) and on-body attributes (neckline-on-body, sleeve fall, fit). The brand description partially compensates (especially for material and high-level garment type) but cannot fully substitute. Quality gradient is acceptable for **<10% of catalog**.

### Re-evaluation trigger

If Session N+1.5's audit yields **<30% Tier 1 model-on coverage** across the Rakuten seed brands, Tier 2 promotes from supplementary to primary, and this ADR is amended accordingly (with the audit data inline). The 30% threshold is the point at which Tier 1 alone cannot carry the strategy — Tier 2 infrastructure becomes critical-path rather than supplementary, which changes operational priorities and risk tolerance.

## Legal posture

As of **2026-05-20**, U.S. case law (most relevantly *Bright Data v. Meta*, 2024) supports the following operating principles for public-web scraping:

- Violating a website's Terms of Service alone is not illegal.
- Scraping publicly accessible data is protected.
- Bypassing authentication or republishing copyrighted content is not protected.

The image-extraction-only handling (above) keeps modest-filter clearly on the protected side: no authentication is bypassed, and no copyrighted images are republished. The extracted attributes (sleeve length, hem length, etc.) are factual descriptors of garments, not creative works subject to copyright.

**This is not legal advice.** The doctrine is still in flux and outcomes vary brand-by-brand. The reading above must be re-verified before scaling Tier 2 beyond the initial seed-brand set, and individual cease-and-desist letters must be respected immediately. Tier 2 is **defensible, not bulletproof** — it depends on continuing precedent and on the operational discipline below.

## Risk mitigations for Tier 2 scraping (when implemented)

**Technical:**

- Respect `robots.txt` directives
- Rate-limit requests (deliberately slow, well below site capacity)
- Identifying `User-Agent` header (named modest-filter bot, contact email)
- No authentication bypass, no anti-bot circumvention (no CAPTCHA solvers, no rotating proxies)

**Operational:**

- Start with the 5–10 seed brands; do not fan out to broader scraping until Tier 1 audit results inform the strategy
- Monitor Tier 3 fallback rate as a signal of Tier 2 effectiveness
- Respond to any cease-and-desist letter **immediately** — stop scraping that brand and remove cached attributes if requested

**Legal/positioning:**

- Document intent in the User-Agent and any brand-facing communication: modest-filter drives traffic to brands via affiliate click-through; it does not compete with their catalogues
- Track Tier 2 brand list in version-controlled config so the scraping scope is itself auditable

## Alternatives considered

- **Tier 1 only (affiliate feeds, no scraping).** Rejected. ADR-0012 surfaced that image-only inputs hide modesty-critical attributes; affiliate feeds alone (typically 40–60% model-on, per the hypothesis above) leave too large a fraction of the catalogue in the Tier 3 quality band. The whole product proposition is precise modesty filtering; degrading half the catalogue to "image-only fallback" undermines that.
- **Direct brand partnerships from day 1.** Rejected. Requires negotiating leverage that modest-filter does not have pre-launch. Revisit once the product is profitable and brands have measurable affiliate revenue at stake (see Upgrade path).
- **AI image synthesis (generate model-on shots from product-only).** Rejected. Speculative for current generative capability, adds verification burden (was the synthetic photo accurate? how do we ground-truth that?), and the synthesized photo would itself be a "creative work" raising copyright questions distinct from the originals.
- **Republishing brand images on modest-filter.** Rejected per the image-lifecycle decision. Adds copyright and licensing risk for no UX benefit — affiliate click-through already shows the user the brand's own images on the brand's own page. Republication would buy nothing operationally and would meaningfully shift the legal posture.

## Upgrade path

As the project grows toward profitability:

- **Direct brand partnerships supersede Tier 2 scraping** — brands provide model-on photos and descriptions directly, on negotiated terms. This is a strictly better posture (more reliable feeds, clear licensing, partner relationships).
- **Tier 2 infrastructure can be deprecated** once direct-partnership coverage exceeds Tier 2's contribution. The order to drop scraping per-brand is governed by partnership uptake.
- This ADR is **expected to be superseded** by a future ADR documenting the direct-partnership architecture. The Tier 1/2/3 structure is a v1/pre-profit decision, not a permanent one.

## Open questions for the Session N+1.5 audit

- What is the actual Tier 1 model-on coverage % for each of the 5 seed brands?
- Are there brands where Tier 1 is already ≥90% model-on (Tier 2 not needed)?
- Are there brands where Tier 1 is <30% model-on (Tier 2 becomes primary — re-evaluation trigger fires)?
- What % of products will fall to Tier 3 (target: <10%)?
- Is the brand-product-page image set materially richer than the affiliate feed for any brand (i.e., does Tier 2 actually have something to add)?
