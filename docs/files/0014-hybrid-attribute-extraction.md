# ADR 0014: Hybrid Attribute Extraction

- Status: Accepted
- Date: 2026-06-05
- Implements: planned for Session N+2 (eval harness measures the lift); production wiring in the Phase 5 affiliate-ingestion pipeline
- Cross-reference: ADR-0005 (Claude Vision tagging — this refines how it's invoked), ADR-0012 (material/image-inadequacy findings — this is the response), ADR-0013 (three-tier image sourcing — Tier 3 already pairs product-only photos with descriptions)

## Context

ADR-0012 found two things vision does poorly from images: **`material`** (fabric is unreliable to identify from a photo) and **`lined`** (an inner layer is often invisible). Both are reliably stated in the **product description** that affiliate feeds supply. The question this ADR settles: when we have *both* a description and an image for a product, how do the two sources combine to produce the 14-attribute row?

The naive answer ("send the image, let vision tag everything") wastes the description and inherits vision's weaknesses. The opposite ("parse everything from the description") fails because descriptions omit most visual attributes. The right answer is a split — and the split needs to be written down because it shapes both the prompt and the Phase 5 ingestion pipeline.

## Decision

**Hybrid extraction.** Each attribute is owned by the source that knows it best:

- **Description-confirmed facts** (objective, stated in the product text) are passed to the vision model as **known inputs** — given, not to be re-derived.
- **Vision is scoped to the visual-only attributes** — the things only the image can settle.

Confirmed facts are *communicated to the model as context*, not silently filled in behind it (see "Why pass, not pre-fill").

## Source-of-truth split

| Source | Attributes | Rationale |
|---|---|---|
| **Description (authoritative)** | `material`, `lined` | Fiber content and lining are stated as label facts; vision is unreliable on both (ADR-0012). |
| **Description when explicitly stated** | `hemLength`, `topLength`, sometimes `neckline`/`sleeveLength` | "midi", "long-sleeve", "halter" in the copy are trustworthy when present; absent otherwise. |
| **Vision (image authoritative)** | `backStyle`, `slit`, `opacity`, `sleeveOpacity`, `fit`, `cutouts`, `pattern`, on-body `neckline`/`sleeveLength` | Only the photo settles these; descriptions rarely mention them and a model-on photo shows how they actually fall. |
| **Hint, not gospel** | `primaryColor` and vague style language | Marketing color names ("oatmeal", "sage", "ecru") don't map cleanly to our 14-color enum; the photo is usually the better arbiter. Treat description color as a tiebreaker, not a fact. |

The boundary is **"objective stated fact" vs "marketing copy."** We trust the description for what it factually asserts (fiber content, lining), not for its adjectives.

## Why pass, not pre-fill

A confirmed fact could be (a) silently written into the row without telling the model, or (b) passed to the model as stated context. We choose **(b)**.

A confirmed fact doesn't only fix *its own* field — it **sharpens the model's neighboring judgments.** Telling it *"this is 100% silk"* improves its read on `opacity`, drape, and `fit`, because silk behaves a known way. *"Faux leather"* primes `opaque` and a structured fit. Passing the fact pays off twice (the field itself, plus adjacent inferences); silently pre-filling pays off once and throws away the context. Pass-as-context also preserves an eval signal: we can compare the model's independent guess against the known fact to measure where vision fails.

Mechanically: the known facts are folded into the prompt, e.g. *"Known from the product description: material = leather (faux), lined = lined. Take these as given; focus your analysis on the visual attributes."*

## Schema implication: no real/faux leather split

The `material` enum keeps a single `leather` value covering both real and faux. **Modesty filtering is authenticity-agnostic** — coverage, opacity, and fit are identical whether leather is genuine. Vision tags `leather` from how the photo looks; the description carries the real/faux distinction *if we ever need it* (e.g. a vegan/ethical filter — explicitly out of scope for v1). No schema change.

Material parsing rule for the feed: map fiber content to the enum by dominant fiber; mixed fibers with no clear majority → `blend`.

## Testing vs production differ deliberately

- **Production (Phase 5):** feed fields → mapped to known facts → passed to vision → vision fills only the visual gaps. Material/lined come from the feed and are never guessed.
- **Eval (Session N+2):** run each product **both ways** — vision-alone *and* vision+facts — and score against ground truth. This measures *how much* the facts help and, critically, *which attributes vision cannot be trusted on without them*. That measurement is what justifies depending on specific feed fields in production. Running vision+facts only would hide vision's standalone weaknesses.

## Code implications

- `lib/vision/extract.ts` (`extractAttributes`) gains an **optional known-facts input** (description text and/or a partial attribute map) that the prompt folds in. When absent, behaviour is unchanged (pure vision) — so the eval harness can toggle it per run.
- The eval manifest already carries a `description` field (added in `samples/eval-set/`), which is the input for the vision+facts arm.
- The Phase 5 ingestion pipeline owns the feed-field → known-facts mapping (including the material parsing rule above) before it calls the tagging worker (`tagProductWithRetry`).

## Alternatives considered

- **Pure vision (tag everything from the image).** Rejected — inherits ADR-0012's `material`/`lined` unreliability for no benefit when the description states them.
- **Parse everything from the description, vision as backup.** Rejected — descriptions omit most visual attributes (slit, back style, opacity, fit, on-body neckline); they cannot carry the row.
- **Silently pre-fill known fields without telling the model.** Rejected — forfeits the adjacent-judgment benefit and the eval signal (see "Why pass, not pre-fill").
- **Trust the entire description, including color and style adjectives.** Rejected — marketing copy is unreliable for color-enum mapping and vague on style; trusting it would inject errors the photo would have avoided.

## Open questions

- Which feed fields are *reliably present* across Rakuten / impact.com / ShareASale? The split assumes `material` and `lined` are consistently supplied — verify per network in Phase 5.
- Does passing `material` *measurably* improve `opacity`/`fit` accuracy, or is the adjacent-judgment benefit theoretical? Measure in the Session N+2 vision-alone vs vision+facts comparison.
- What is the right `primaryColor` strategy when description color and photo disagree? Default here is "photo wins"; revisit if the eval shows description color is the better arbiter for any color.
