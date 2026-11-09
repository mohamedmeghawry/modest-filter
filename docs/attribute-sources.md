# Attribute sources: decision tracker

Where should each of the 14 attributes come from: free text (title, description, colour name, material text), AI vision on the photo, or both? This file collects the evidence so the choice is made per attribute on numbers, not guesses. Update it after every coverage run, eval run, or tagging run. When an attribute's decision is final, record it in an ADR (ADR-0014 already covers `material` and `lined`).

## How to measure

- **Text coverage** (free, no API): `npx tsx scripts/source-coverage.ts` on `samples/demo/products.csv`.
- **Vision accuracy** (costs API money): the eval set (`npm run vision:eval`) against hand-tagged ground truth.
- **Agreement** (after AI tagging): `findDisagreements` (`lib/vision/text-facts.ts`) flags products where text and vision disagree. Count disagreements per attribute, then check by hand which side was right.

## Per attribute

Roles: **final** = the text value is the tag. **2nd opinion** = text only checks vision; a disagreement sends the product to `needs_review`. **vision** = the photo is the only source.

| Attribute | Text source | Text coverage (25 demo, 2026-11-08) | Vision accuracy | Text vs vision agree | Role now |
|---|---|---|---|---|---|
| material | material text | 24/25 | pending eval | **7/24** | **final** (ADR-0014). Vision reads the fabric's look (satin → "silk", knit → "blend"), not the label: confirmed |
| primaryColor | brand colour name | 23/25 | pending eval | **21/23** | 2nd opinion. Candidate for final. The 2 misses need a human look: Reitmans "BRONZE BROWN" → vision yellow (the dress looks mustard, so vision may be right); Uniqlo "09 BLACK" → vision gray |
| lined | material text | 6/25 | pending eval | **2/6** | **final** (ADR-0014). Vision can't see lining. When the text is silent, vision said "unlined" 17 times with no evidence: **open: store null instead** |
| neckline | title | 7/25 | pending eval | **6/7** | 2nd opinion. Miss: Uniqlo "Stand Collar" → high_neck (a conventions gap: is a stand collar `collar` or `high_neck`?) |
| sleeveLength | title | 6/25 | pending eval | **6/6** | 2nd opinion |
| hemLength | title | 5/25 | pending eval | **4/5** | 2nd opinion. Miss: Reitmans 499371 "Maxi" → midi (check by hand) |
| pattern | title | 3/25 | pending eval | **3/3** | 2nd opinion |
| fit | title | 3/25 | pending eval | **1/3** | 2nd opinion. Fit words are subjective on both sides |
| cutouts | title | 1/25 | pending eval | **1/1** | 2nd opinion |
| backStyle | none | 0/25 | pending eval | n/a | vision |
| slit | none (descriptions may help) | 0/25 | pending eval | n/a | vision |
| topLength | none | 0/25 | pending eval | n/a | vision |
| opacity | none (descriptions may help) | 0/25 | pending eval | n/a | vision |
| sleeveOpacity | none | 0/25 | pending eval | n/a | vision |

**Totals (2026-11-08):** text fills 78 of 350 slots (22%). 55 of the 78 were there before the colour parser.

**What would move the numbers:** product descriptions (not collected yet; store parsed facts only) should add `lined`, `slit`, `opacity` and `fit`.

## Image input for AI tagging: local copy or hotlinked URL

| | Local copy (base64) | Brand URL (Claude fetches it) |
|---|---|---|
| Requests to the brand | One download at collection, then zero on re-runs | One per tagging or eval run |
| Works for all 5 brands | Yes | No: Simons' CDN returns 403 to non-browser clients |
| Same image every run | Yes (stable eval) | No: the brand can change or remove it |
| Cost | Same image tokens either way | Same |

**Decision (2026-11-08): local copies for tagging.** This matches ADR-0013 amendment condition 3. Hotlinking is for display on the private preview only. Revisit if licensed feeds supply stable image URLs.

## Free text gate before AI tagging (ADR-0015)

`lib/vision/text-gate.ts` rejects a product when its own words already fail the modest baseline: a stated sleeve that can't be long ("short sleeve", "camisole", "3/4", "strapless"), "halter" or "one-shoulder", "cut-out", "open back" or "backless", "high slit". It only rejects; silence goes to vision. On the 25 demo products it rejected 6, saving 6 AI calls, and all 6 also failed the baseline on vision. No good product was wrongly rejected. Text that states long sleeves is reliable (6/6 agreement), but vision still runs for the other baseline attributes in the same call, so stating long sleeves saves no money.

## Photo selection for AI tagging

Findings from looking at all 98 demo photos (2026-11-08):

- **Front + back on a model is the target pair** (Mohamed's call). It shows most modesty attributes and costs about half of 4 photos: one product with 4 photos cost $0.12, so 2 photos ≈ $0.06.
- **A back photo on a model exists for about 16 of 25 products.** Reitmans 5/5 (always photos 0 and 1), Simons 5/5 (order varies), H&M 3/5, Zara 3/5 (one is a flat product shot of the back), Uniqlo 0/5 (flat product shots of the back only). Without one, the second pick is a side view, a close-up, or a flat back shot.
- **Photos can show the wrong colour.** Uniqlo 479073's photos show the blouse in white, pink, yellow and black (the product is white). Uniqlo 487635's model wears a red sweater over the olive dress. Picking the wrong photo can corrupt `primaryColor`.
- **Close-ups carry specific attributes.** Zara 05919247's leg close-up shows the slit best.
- **Photo order is not consistent across brands**, so "first N photos" is a poor rule. For 25 products the picks are by hand (`samples/demo/photo-picks.json`). **Open question at scale:** a per-brand order rule, or a cheap model pass that labels each photo's view (front, back, side, close-up, flat, other colour).
- **Lining can't be seen in photos** (ADR-0012). The first product came back "unlined" with no text support. Check whether vision should leave `lined` empty when the text is silent.

**Experiment:** hm-1343091003 tagged with 4 photos (`samples/demo/tag-results-4photos.json`), then re-tagged with its 2 picks. Compare the two to see what 2 photos lose.

## Log

- 2026-11-08: first coverage run on the 25 demo products; colour parser added (`lib/vision/color-facts.ts`); 55 → 78 slots.
- 2026-11-08: first AI tagging of the 25 demo products (Opus 4.7, local photos, hand-picked 2 per product; Uniqlo 479073 had 1). Cost $1.58 in total, including the 4-photo test. Results: `samples/demo/tag-results.json`. Agreement numbers are in the table above. Vision left empty: topLength 15 (dresses, expected), hemLength and slit 10 (tops, expected), sleeveOpacity 7, backStyle 3. Disagreements are recorded only; they are not yet routed to `needs_review`.
- 2026-11-08: **4 photos vs 2 on hm-1343091003:** 4 of 14 tags changed (neckline high_neck → turtleneck, topLength tunic → hip, fit semi_fitted → fitted, material polyester → viscose). One product can't separate the photo effect from run-to-run noise. **Next:** re-run a few products twice with the same photos to measure the noise first.
