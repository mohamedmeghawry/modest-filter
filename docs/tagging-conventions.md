# Tagging Conventions

_Last updated: 2026-06-03._

## Purpose & scope

This document is the operational guide for hand-tagging products with the 14 modesty-relevant attributes defined in ADR-0007. It serves a dual audience:

- **Human taggers** — the curation lead, contributors, and future contractors who hand-tag products for the ground-truth dataset that feeds Session N+2's evaluation harness.
- **Prompt design reference** — these conventions inform iterations of the Claude Vision system prompt (`lib/vision/prompt.ts`). When the prompt is tightened, it should align with the conventions documented here, so the model and the human taggers are working from the same rule set.

### Relationship to existing ADRs

- **ADR-0008 (NULL semantics)** — referenced throughout, not re-explained here. The `null` vs `"none"` distinction is the foundation; this doc applies it per-attribute.
- **ADR-0012 (vision tagging spike findings)** — most of the conventions below were surfaced by the spike's mismatch analysis. Every convention with an ADR-0012 reference traces back to a specific finding.
- **ADR-0013 (three-tier image sourcing)** — determines which image source to tag from. Conventions below specify which attributes require model-on photos.

## General principles

**NULL vs "none" (per ADR-0008).** Use `null` when an attribute does not *apply* to the garment (e.g., `topLength` is `null` for a dress — tops have lengths, dresses don't). Use `"none"` when the attribute applies and the value is the absence of the feature (e.g., `slit: "none"` for a dress that could have had a slit but doesn't).

**Honest uncertainty.** If the attribute is not clearly visible in the available images, return `null`. Tagging discipline mirrors what the AI system prompt instructs the model to do — both humans and Claude should be honest about uncertainty rather than guessing.

**Image source priority (per ADR-0013).** Always prefer model-on photos when available. Product-only photos can be used for scale-invariant attributes (color, pattern, material, basic shape) but should not be used as primary source for length, slit, fit, neckline-on-body, or sleeve-fall. The per-attribute guides below name the cases where this matters.

## Per-attribute conventions

### Coverage attributes (7)

**`sleeveLength`** — Use the enum value matching the visible sleeve length. `null` for bottoms or any item with no upper-body coverage.

**`sleeveOpacity`** — Use the enum value matching how transparent the sleeves are specifically. `null` if there are no sleeves.

**`neckline`** — Use the enum value matching the visible neckline. The `collar` value was added in commit `feat(schema): add \`collar\` to Neckline enum per ADR-0012 finding` for collared shapes (polo, button-up). `null` for bottoms or no-upper-body items.

**`backStyle`** — Use the enum value matching the visible back. `null` if the back is not visible in the available images. Per ADR-0013, model-on photos are strongly preferred when back coverage is a meaningful filter dimension — product-only photos commonly omit back views.

**`hemLength`** — operational definitions:

- `mini`: above the knee
- `knee`: at the knee
- `midi`: mid-calf to just below the knee
- `ankle`: covers the ankle bone, visible foot
- `floor`: grazes the floor, foot barely or not visible

Always tag from a model-on photo. Product-only photos lack scale reference (ADR-0012 finding — both the spike's ground truth and Claude's extraction were wrong because both worked from product-only photos).

**`topLength`** — Use the enum value matching the visible top length. `null` for dresses and bottoms (per ADR-0008 NULL semantics).

**`slit`** — Use the enum value matching the visible slit height. **Only reliably tagged from model-on photos** (ADR-0012 finding — slits manifest visually only when the garment is worn; product-only photos consistently hide them). If only product-only photos are available and the brand description doesn't confirm slit presence, prefer `null` over `"none"` — the spike's slit "none vs none" mismatch was a shared blind spot precisely because both ground-truth and model defaulted to "none" without on-body evidence.

### Fit & material (5)

**`fit`** — Use the enum value matching the overall fit (`fitted`, `semi_fitted`, `loose`, `oversized`). Prefer model-on photos per ADR-0013 — product-only photos can mislead because hanger drape differs from body drape.

**`opacity`** — Use the enum value matching the overall opacity of the main fabric.

**`lined`** — Use the enum value matching whether the garment is lined. Lining is usually invisible in product photos, so the **fiber-content breakdown is the primary signal**: if the composition lists a separate lining component (e.g. "Shell: 100% linen; Lining: 100% cotton", or "…; viscose lining"), tag `lined`; if it says "partially lined", tag `partially_lined`. Use `null` only when the images don't show it **and** the description is silent on both lining and fabric composition.

**`cutouts`** — Use the enum value matching cutout presence (`none` or `present`). A **keyhole** — the small teardrop / water-drop opening at the front neckline or upper back, often closed at the top with a button or tie — counts as `present`. A keyhole does **not** change the `neckline` (a crew neck with a front keyhole is still `crew`, plus `cutouts: present`), and a small back keyhole is `backStyle: closed` + `cutouts: present` — reserve `open_back` for a substantially open back. Known limitation: `present` is binary and does not distinguish a minor neck keyhole from a midriff or side cutout; location-based granularity is a pending schema decision (tracked alongside the `cowl` neckline gap).

**`material`** — **Always cross-check the brand product description before tagging.** Image-only material extraction is unreliable (ADR-0012 finding — Claude tagged `viscose` for an "Airplush Cotton™" dress because drapey cotton resembles viscose in product-only images). If the description names a material, tag it regardless of how the fabric appears in the image. If the description is silent on material, tag based on visual best-guess and note the uncertainty.

### Visual (2)

**`primaryColor`** — **Granularity convention: prefer the specific value when both general and specific exist.** A navy dress is tagged `navy`, not `blue`. Currently the only specific/general pair in the enum is `navy`/`blue`; the convention pattern applies to any future pairs added to `PrimaryColor`. Rationale: finer-grained filtering for users, denser data for future model training.

**`pattern`** — Use the enum value matching the visible pattern. For complex multicolor patterns or prints that don't fit a specific category, prefer `other` over forcing an inexact match (`floral`, `geometric`, etc.).

## Open conventions (TBD)

Conventions that future tagging will surface, to be documented as they arise:

- **Compound attributes** — how to handle a garment that is, e.g., `lined` and `unlined` in different regions (the bodice is lined, the skirt is not). Current default: tag the dominant region's state; flag for review in tagger notes if ambiguous.
- **`scoop` vs `square` for straight necklines** — a near-horizontal neckline with slightly rounded corners sits between the two (surfaced by Barrafina, model-on validation 2026-06-03). Need an operational threshold.
- **`low_back` vs `open_back` vs `scoop_back`** — no operational definition for how far down the back must be exposed to cross each boundary (surfaced by Mural/Seacoast halters, where agent and model disagreed). Define in terms of exposure relative to a landmark (e.g., below the bra line = `open_back`).
- **`fit` when a belt is involved** — a loose garment cinched by a belt reads as `loose` (construction) or `semi_fitted` (as worn). Surfaced by Eleta (belted shirtdress). Decide whether `fit` describes the garment or the styled silhouette.
- **`slit` for bottoms** — `null` (not applicable) vs `none` (applicable, absent). The model returned `none` for trousers where the agent tagged `null` (Effortless Pant). Align with ADR-0008 NULL semantics: prefer `null` for garments where a slit is not a meaningful attribute.
- _(Add as encountered.)_

## Update process

This document is intentionally mutable — conventions evolve as the catalogue grows. Each substantive convention change should be committed alongside the tagging work that surfaced it, following the same "test-as-we-go" discipline AGENTS.md applies to pure-function logic. When adding or amending a convention, reference the commit (by message, not SHA) that prompted it.
