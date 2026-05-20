# ADR 0012: Phase 1 Vision Tagging Spike Findings

- Status: Accepted
- Date: 2026-05-20
- Implements: 22157c3 (strict-mode schema fix), with chronology in f2b8524 (schema + spike script) → fe1f741 (multi-image support) → 7ec7056 (manifest alignment + gitignore) → 22157c3
- Cross-reference: ADR-0005 (Claude Vision tagging decision — this validates it empirically), ADR-0007 (v1 schema — this reveals a gap), ADR-0008 (NULL semantics — spike data exercises the null vs "none" distinction)

## Context

ADR-0005 specified Claude Vision as the tagging strategy without empirical validation. Session N+1 spikes whether it actually works on real product images, with a feasibility goal (does vision tagging produce usable attributes?) and a discovery goal (find unknowns before committing to Session N+2's evaluation harness against the full N=50+ ground-truth set).

## Spike scope

- **1 product**: Aritzia Airplush Cotton Vestige Dress (long-sleeve maxi)
- **2 images**: front + back views (`.png` after AVIF→PNG conversion; Anthropic's Vision API does not accept AVIF)
- **Model**: Claude Opus 4.7
- **Schema**: `anyOf`-form nullable enums (post-22157c3); 14 attributes, all nullable
- **Prompt**: zero-shot system + user prompts (`lib/vision/prompt.ts`), with explicit NULL-vs-"none" distinction per ADR-0008
- **Cost**: $0.0366 for the call

## Findings

### Accuracy: 10/14 attributes matched ground truth on first product

| Attribute | Ground truth | Claude | Verdict |
|---|---|---|---|
| sleeveLength | long | long | ✓ |
| sleeveOpacity | opaque | opaque | ✓ |
| neckline | high_neck | v_neck | ✗ schema gap |
| backStyle | closed | closed | ✓ |
| hemLength | floor | ankle | ✗ image ambiguity |
| topLength | null | null | ✓ |
| slit | none | none | ✓ |
| fit | loose | loose | ✓ |
| opacity | opaque | opaque | ✓ |
| lined | unlined | unlined | ✓ |
| cutouts | none | none | ✓ |
| material | cotton | viscose | ✗ image-only limit |
| primaryColor | blue | navy | ✗ granularity convention |
| pattern | solid | solid | ✓ |

### The four mismatches each surface different categories of issue

**1. Schema gap (`neckline`).** Ground truth `high_neck`, Claude `v_neck`. The actual answer is `collar`, which doesn't exist in the Prisma `Neckline` enum. Both the ground-truth tagger and the model independently picked the closest-existing-value to a missing concept.

> *Recommendation: add `collar` to the Prisma `Neckline` enum in a focused follow-up commit. The vision JSON schema is derived from `Object.values(NecklineEnum)` at module load — re-running `prisma generate` propagates the new value, and the completeness test (`lib/vision/schema.test.ts`) continues passing.*

**2. Image ambiguity (`hemLength`).** Ground truth `floor`, Claude `ankle`. Without the model's feet visible in the product photo, "maxi" is genuinely ambiguous between `floor` and `ankle`.

> *Recommendation: defer judgment until N≥10 products show whether this is systematic or one-off. Document explicit tagging conventions (e.g., "floor = grazes the floor; ankle = stops above the foot") before scaling ground-truth tagging.*

**3. Image-only material extraction unreliable (`material`).** Ground truth `cotton` (per Aritzia's "Airplush Cotton™" product name), Claude `viscose`. The product's actual material is visible in the brand's description text, not from the image alone — drapey cotton can visually resemble viscose.

> *Recommendation: the production prompt MUST include product description text alongside the image. Brand-supplied descriptions reliably include material; relying on image alone for this attribute is a known weakness.*

**4. Granularity convention (`primaryColor`).** Ground truth `blue` (generic), Claude `navy` (specific). Both are valid `PrimaryColor` enum values. The dress is unambiguously navy.

> *Recommendation: document a preferred-granularity convention before building the eval set. When both general and specific values exist (`blue`/`navy`, `red`/`burgundy`), tagger and model must align on which to prefer; otherwise apparent disagreement is convention drift, not extraction error.*

### Image source inadequacy surfaced (post-spike addendum)

After completing the spike against the Aritzia product-only photos, the same dress's model-on photo was reviewed and revealed that two of the four mismatches above were not what the original categorization implied:

- **`hemLength` "floor vs ankle" was not image ambiguity** — both ground truth and Claude were wrong. The dress is `midi` when measured against a human body. Product-only photos lose scale reference for length entirely.
- **`slit` "none vs none" was a shared blind spot** — both ground truth and Claude missed a clearly visible high slit because slits only manifest visually when the garment is worn.

This reframes the spike's central learning: image-only extraction is insufficient not just because text descriptions add context (the `material` finding), but because **product-only photography hides modesty-critical attributes that only appear on bodies**. For a modesty-filtering product specifically, this is the single most important production-design implication of the spike.

> *Updated recommendation: production extraction MUST prefer model-on photos when available. Product-only photos should be treated as supplementary (good for color/pattern/material/silhouette) rather than primary (insufficient for length/slit/neckline-on-body/sleeve-fall/fit).*

### Multi-image support validated

Phase B's extension to `ImageInput | ImageInput[]` was load-bearing. `backStyle` correctly extracted as `closed` from image B (the back view). Single-image-only would have returned `null` per the prompt's "honest about uncertainty" rule.

### Cost analysis

- This call: **$0.0366** (input 5,482 tokens, output 366 tokens at Opus 4.7's $5 / $25 per MTok)
- 1,000-product extrapolation: **~$37** — production-viable
- 10,000-product extrapolation: **~$370** — still tractable; revisit model choice (Sonnet 4.6) only if scale meaningfully exceeds this

### Cache behavior

- `cache_write=0`, `cache_read=0` — system + tools currently below Opus 4.7's 4,096-token minimum cacheable prefix
- Spike-volume cache miss is expected and irrelevant
- Production-scale optimization (revisit in Session N+2): can we push system+tools above 4,096 tokens (e.g., enriched NULL-semantics guidance, few-shot examples) such that prompt caching pays off in ~90% cost reduction on the cached prefix?

## Constraints surfaced

### Strict-mode 16-union-type-parameter ceiling

Anthropic's strict schemas cap total nullable/`anyOf` parameters at 16 across all tools in a request. The current schema uses 14 (all 14 product attributes nullable). **Headroom: 2.**

If future schema work adds nullable enum fields (e.g., `materialPrimary` + `materialSecondary`, `secondaryColor`), this cap applies. Workarounds if exceeded: non-nullable + required with a sentinel string (`"none"`/`"unknown"`); or drop nullability for attributes where `null` is unlikely in practice.

### Anthropic strict validator vs documented JSON Schema dialects

The type-array form (`type: ["string", "null"]`) is documented as supported but rejected at runtime by the strict validator (request_id `req_011CbDB3vzgZsfakKDVwKXSc`). The `anyOf` form is the production-safe pattern. Documented for future contributors who would naturally reach for the type-array form first.

## Decision

Continue with Claude Opus 4.7 for vision tagging in production, per ADR-0005. Baseline accuracy (10/14 on the first product with image-only context) validates the approach; the four mismatch categories are all addressable through scoped follow-ups — schema fixes (`collar`), prompt design (include product description), tagging-convention documentation (granularity), and accumulated data (hem ambiguity).

Defer model alternatives (Sonnet 4.6, Gemini 3.1 Pro) to Session N+2's evaluation harness, where per-attribute accuracy and cost across N=50 products can be measured empirically.

The 10/14 accuracy figure is measured against ground truth that was itself derived from insufficient (product-only) images. True accuracy against correctly-tagged ground truth may be higher — Claude's `ankle` reading is arguably as defensible as the hand-tagged `floor`, given both worked from the same inadequate photos. The eval harness's ground truth must be derived from model-on photos to be a reliable measurement substrate.

## Alternatives considered

- **Skip the spike, build the eval harness directly.** Rejected. The spike surfaced the strict-mode schema bug, the multi-image architecture need, the AVIF format incompatibility, and four distinct mismatch categories — all before sinking effort into a 50-product ground-truth set. Spike cost was ~$0.04; deferred discovery cost would have been a 50× rework.
- **Use image + description (current prompt is image-only).** Deferred to production prompt redesign. Spike scope explicitly tested image-alone as the floor; production will layer descriptions on top once the eval harness can measure the lift.
- **Multi-vendor (Gemini + Claude) spike.** Rejected per pre-spike decision; preserved as a model-agnostic function signature (`ModelConfig` discriminated union in `lib/vision/extract.ts`) for Session N+2 measurement.

## Recommended follow-up commits (priority order)

1. **Add `collar` to the Prisma `Neckline` enum** + migration + Prisma client regen. The JSON schema regenerates from Prisma; the completeness test continues to pass after regeneration. **✓ shipped 2026-05-20** in commit `feat(schema): add \`collar\` to Neckline enum per ADR-0012 finding`.
2. **Document tagging conventions** in `docs/tagging-conventions.md`: color granularity (prefer specific when applicable), hem ambiguity (operational definition of `floor` vs `ankle`), material attribution (always cross-check with brand description before tagging).
3. **Production prompt and image-selection logic should prefer model-on photos.** Brand product pages typically include both; the ingestion pipeline should detect and prioritize model-on shots. Product-only shots become supplementary input for attributes that are scale-invariant (color, pattern, material, basic shape).
4. **Expand sample manifest to N≥5 products** before Session N+2's eval harness build — manifest growth is operational; the harness is architectural. Ground-truth tagging must use model-on photos.
5. **Production prompt redesign incorporating product description text** — deferred to N+2's evaluation context where the lift can be measured.
