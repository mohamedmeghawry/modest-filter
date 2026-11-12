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

## Jev (TypeSafe) as a cheap baseline pre-screen

`scripts/jev-eval.ts` asks Jev (`jev-latest`, images are experimental) one yes/no question per baseline rule (sleeves reach the wrist, back closed, cut-out, slit to the knee, off-shoulder, halter) plus a choice per attribute, and code decides. Yes above 0.7, no below 0.3, in between = unsure. Run on the 28-product eval set against hand ground truth (2026-11-09), results in `samples/eval-set/jev-results.json`:

| | Result |
|---|---|
| Cost / speed | 193,895 input tokens = **$0.008 for 28 products** (~$0.0003 each, vs ~$0.06 for Opus with 2 photos); 100–300 ms each |
| Baseline from yes/no answers | 25/28 right. **0 immodest products passed.** 3 good ones hidden, all on "unsure" answers (oversized-buttondown sleeves 0.56; semisheer-scoopback back 0.64, which had no back photo; black-ls-midi halter 0.32) |
| Baseline from choice answers | 28/28 right, 0 immodest passed (choices always pick something, so they can't say "unsure") |
| As a pre-screen | 16/28 **confidently rejected, all correctly**; 5 unsure and 7 confident passes would go on to Opus (Opus runs on 12 of 28, so its spend drops by ~57%) |
| Per rule | sleeves 27/28, back 22/28, cut-outs 25/28, slit 28/28, neckline 25/28 |
| Per attribute (choice) | sleeveLength 24/28, backStyle 20/28, neckline 17/28, slit 17/17 |
| Run-to-run noise | Same photos twice: 79 of 157 yes/no probabilities moved, by at most 0.09; 2 of 112 choices changed; no product verdict changed |

**Read:** good enough to reject, not to accept. The back is its weak spot: it was confidently wrong 3 times (said "closed" on modal-partlined's scoop back, "open" on floral-viscose-maxi and yellow-item, which are marked closed). Other rules happened to fail those products anyway, so the product-level result held, but on a bigger set a wrong back read could hide a good product. Neckline choices are loose (crew vs v_neck vs turtleneck), so the yes/no questions are the ones to use. **Ground truth fixed (Mohamed, 2026-11-09):** black-ls-midi was marked `sleeveless`; it has long mesh sleeves, as Jev said (0.92). `sleeveOpacity` is still unset. 28 products is a small sample; not yet compared with Opus on the same set (that eval needs approval).

## Lab test: Jev vs Opus 5.5 on the 28-product eval set (2026-11-09)

Same photos for both (JPEG at most 1568 px, `scripts/prepare-image.ts`), scored against Mohamed's hand answers. Judging rules fixed before the run: (1) immodest products shown must be 0, (2) then fewer good products hidden, (3) then cost. Results: `samples/eval-set/jev-results.json`, `opus55-low-results.json`, `opus55-medium-results.json`.

| | Jev yes/no | Jev choices | Opus 5.5 low | Opus 5.5 medium |
|---|---|---|---|---|
| Immodest shown | **0** | **0** | **0** | **0** |
| Good products hidden (of 10) | 3 | 0 | 6 | 6 |
| Baseline right | 25/28 | 28/28 | 22/28 | 22/28 |
| sleeveLength / backStyle / neckline | 24 / 20 / 17 | (same call) | 22 / 17 / 18 | 23 / 18 / 17 |
| Overall, all 14 attributes | n/a | n/a | 73.7% | 73.5% |
| Cost for 28 | $0.008 | (same call) | $0.42 | $0.44 |

**Read:** on the lab set Jev wins by the agreed rules: both show no immodest product, Jev hides fewer good ones, and it costs about 50× less. But Opus's 6 hidden products are all "can't tell" answers, not wrong ones: back style left empty where no clear back photo exists (4) and the neckline left empty on abayas, where the hijab covers it (2). Jev's choice questions always pick an answer, so they guessed right where Opus declined. On 3 of those products there is only one photo, so under the "no back photo = unknown" rule every model would hide them. 28 products is small; batch 2 (100 products, Mohamed judges the disagreements) is the deciding test. **Medium effort adds cost and no accuracy, so the tagger runs at low.** **Decided 2026-11-09 (ADR-0015 amendment):** an unknown neckline is allowed on abayas, because the hijab covers it. With that rule Opus hides 4 good products instead of 6; the remaining 4 have no clear back photo.

## Photo selection for AI tagging

Findings from looking at all 98 demo photos (2026-11-08):

- **Front + back on a model is the target pair** (Mohamed's call). It shows most modesty attributes and costs about half of 4 photos: one product with 4 photos cost $0.12, so 2 photos ≈ $0.06.
- **A back photo on a model exists for about 16 of 25 products.** Reitmans 5/5 (always photos 0 and 1), Simons 5/5 (order varies), H&M 3/5, Zara 3/5 (one is a flat product shot of the back), Uniqlo 0/5 (flat product shots of the back only). Without one, the second pick is a side view, a close-up, or a flat back shot.
- **Photos can show the wrong colour.** Uniqlo 479073's photos show the blouse in white, pink, yellow and black (the product is white). Uniqlo 487635's model wears a red sweater over the olive dress. Picking the wrong photo can corrupt `primaryColor`.
- **Close-ups carry specific attributes.** Zara 05919247's leg close-up shows the slit best.
- **Photo order is not consistent across brands**, so "first N photos" is a poor rule. For 25 products the picks are by hand (`samples/demo/photo-picks.json`). **Open question at scale:** a per-brand order rule, or a cheap model pass that labels each photo's view (front, back, side, close-up, flat, other colour).
- **Lining can't be seen in photos** (ADR-0012). The first product came back "unlined" with no text support. Check whether vision should leave `lined` empty when the text is silent.

**Per-brand photo order (batch 2, from the collection log `samples/demo/batch2-log.json`):**

| Brand | Front on model | Back on model | Seen on, and how it was collected |
|---|---|---|---|
| Mango | image `-001` | image `-003` | 10 of 10. No structured product data: facts from the visible page and the "Details, composition and care" drawer. Size via `?wid=` |
| Dynamite | position 0 | `alt1` on only 5 of 10; the rest at positions 2–3 | All 10 had a back. Product pages refuse scripts (403); the image server (`dam.dynamiteclothing.com`) serves them |
| Old Navy | 0 | 1 (one product at 2) | 10 of 11; 1 had flat shots only. Gallery in `.pdp-photo-brick-wrapper` |
| Gap | 0 | 1 on dresses, 2 on tops | 12 of 12. Same platform as Old Navy (one site to Chrome) |
| Banana Republic | 0 | 1 | 12 of 12; later photos show other colourways. Gallery in `.pdp-photo-single-column-wrapper` |
| Uniqlo | 0 | **none** | **0 of 12**: fronts, flat shots, colour sets and fabric only. Brand replaced by Anthropologie (the agreed backup) |
| Anthropologie | varies | varies | 10 of 12. Studio, street and editorial shots mixed: picked by eye |
| H&M | varies (0 or 1) | varies (2–4) | 11 of 12 (1 flat-only). Gallery = the "View larger image" photos |
| Zara | varies | varies | 10 of 16. Mostly editorial; 1 had only a flat back. Its long-sleeve tops category held short-sleeved tops |
| Simons | 0 (`A1`) | `A2` or `A3` | 12 of 12, 2–3 studio photos each. The image server refuses scripts (Cloudflare 403), so the browser fetched them |
| Reitmans | 0 (`B`) | position 2 or 3 (`D`/`E`) | 12 of 12. Shopify: product data from the public `/products/<handle>.js` |

**What this means at scale:** a fixed per-brand rule works for 5 of 11 brands (Mango, Old Navy, Gap, Banana Republic, Simons); the other 6 need a view-labelling pass (front, back, side, flat, close-up, other colour) or a person. A brand's own "long sleeve" filter can't be trusted on its own: Banana Republic's listed a sleeveless dress and Zara's listed short-sleeved tops; the text gate and vision caught them.

**Experiment:** hm-1343091003 tagged with 4 photos (`samples/demo/tag-results-4photos.json`), then re-tagged with its 2 picks. Compare the two to see what 2 photos lose.

## Batch 2: Jev vs Opus 5.5 on 100 new products (2026-11-10)

100 products, 10 brands × (6 dresses + 4 tops), front + back on a model for all. Comparison: `scripts/compare-batch2.ts` → `samples/demo/compare-batch2.json`.

| Step | Result | Cost |
|---|---|---|
| Free text gate (title + description) | 11 rejected, 89 go on | $0 |
| Opus 5.5 low, Message Batches | 75 shown, 14 hidden | $0.89 (batch price) |
| Jev pre-screen | 14 reject, 12 unsure, 63 pass | $0.034 |

- **Agreement:** 74 of 77 where Jev was confident (11 both hide, 63 both show). Jev never passed a product Opus hides.
- **The 3 disagreements are all Jev rejecting what Opus shows:** H&M knit mock-neck dress (back; H&M's own text says "small V-shaped opening at back"), Reitmans fit-and-flare dress (back; a sheer yoke across the back), Zara velvet sash dress (slit). Who is right decides Jev's reject role (≤2 wrong of its confident rejects), so they lead Mohamed's review.
- **Every immodest product spotted by eye during collection was hidden by Opus and rejected by Jev:** the sleeveless organza dress in Banana Republic's long-sleeve filter, Simons' sleeveless pinafore and sleeveless high-slit maxi, Anthropologie's deep scoop back, Zara's bow dress with an open keyhole back.
- **Unknown still fails:** 2 dresses are hidden only because Opus left `slit` empty (Zara maxi, H&M lace dress); Jev was unsure on one of them.
- **Shown by brand:** Gap 10, Dynamite 9, Banana Republic 9, Mango 8, Old Navy 8, Reitmans 8, H&M 7, Simons 7, Anthropologie 6, Zara 3 (Zara's "long-sleeve tops" were short-sleeved).
- **Mohamed's blind review (2026-11-11, `samples/demo/review-batch2-answers.json`): Opus matched him on all 13.** He would show all 3 disagreements (no slit, back fine), so all 3 of Jev's disagreeing rejects were wrong. That's more than the ≤2 allowed (rules fixed 2026-11-09): **Jev does not earn the reject role.** Opus stays the only judge; Jev is not used in the pipeline. The 10 random agreements matched too (3 hidden, 7 shown). "0 immodest shown" holds on the 10 shown products he checked, not proven for all 75.
- **His notes raise two open points:** a Gap dress shown by both has a "low cut in the top front neckline" (the baseline has no neckline-depth rule: only off-shoulder and halter fail); and for Reitmans 499183 other gallery photos show the dress better than the front/back pair picked.

## Log

- 2026-11-08: first coverage run on the 25 demo products; colour parser added (`lib/vision/color-facts.ts`); 55 → 78 slots.
- 2026-11-08: first AI tagging of the 25 demo products (Opus 4.7, local photos, hand-picked 2 per product; Uniqlo 479073 had 1). Cost $1.58 in total, including the 4-photo test. Results: `samples/demo/tag-results.json`. Agreement numbers are in the table above. Vision left empty: topLength 15 (dresses, expected), hemLength and slit 10 (tops, expected), sleeveOpacity 7, backStyle 3. Disagreements are recorded only; they are not yet routed to `needs_review`.
- 2026-11-09: tagger moved to Opus 5.5 (structured outputs, low effort). Lab test on the 28: Jev and Opus both show 0 immodest products; Jev hides fewer good ones (0–3 vs 6) at about 1/50 of the cost ($0.008 vs $0.42). Medium effort gave no gain. Details in the lab-test section.
- 2026-11-09: Jev pre-screen on the 28-product eval set ($0.008): 0 false passes, 16/28 confidently and correctly rejected. Details in the Jev section above.
- 2026-11-08: **4 photos vs 2 on hm-1343091003:** 4 of 14 tags changed (neckline high_neck → turtleneck, topLength tunic → hip, fit semi_fitted → fitted, material polyester → viscose). One product can't separate the photo effect from run-to-run noise. **Next:** re-run a few products twice with the same photos to measure the noise first.
- 2026-11-10: batch 1 re-tagged through the Message Batches API (Opus 5.5 low, new rules): 19 tagged ($0.17 at batch price), 6 rejected free by the text gate. 8 of 25 now pass the baseline (was 12): the back-photo rule hides the 8 products whose photos don't show the back. First field check of Jev on the same 19: all 7 of Jev's confident rejects were also hidden by Opus (0 wrong); its 2 "pass" answers that Opus's result hides are both no-back-photo products, hidden by the rule rather than by vision.
- 2026-11-10: batch 2 collected and tagged: 100 products from 10 brands (Uniqlo swapped for Anthropologie: 0 of 12 Uniqlo galleries had a back photo). Text gate rejected 11 for free; Opus 5.5 showed 75 of 89 ($0.89); Jev agreed on 74 of 77 confident answers ($0.034); 3 disagreements (all Jev rejecting) go to Mohamed's blind review with 10 random agreements. Details in the batch-2 section.
- 2026-11-11: Mohamed's blind review of 13 batch-2 products: Opus matched him on all 13; Jev's 3 disagreeing rejects were all wrong, so Jev does not get the reject role (needed ≤2 wrong). Opus stays the only judge.
