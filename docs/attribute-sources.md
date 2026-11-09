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
| material | material text | 24/25 | pending eval | pending | **final** (ADR-0014) |
| primaryColor | brand colour name | 23/25 | pending eval | pending | 2nd opinion (new; promote to final if agreement is high) |
| lined | material text | 6/25 | pending eval | pending | **final** (ADR-0014) |
| neckline | title | 7/25 | pending eval | pending | 2nd opinion |
| sleeveLength | title | 6/25 | pending eval | pending | 2nd opinion |
| hemLength | title | 5/25 | pending eval | pending | 2nd opinion |
| pattern | title | 3/25 | pending eval | pending | 2nd opinion |
| fit | title | 3/25 | pending eval | pending | 2nd opinion |
| cutouts | title | 1/25 | pending eval | pending | 2nd opinion |
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

## Log

- 2026-11-08: first coverage run on the 25 demo products; colour parser added (`lib/vision/color-facts.ts`); 55 → 78 slots.
