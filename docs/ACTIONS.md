# Action board

One line per action. Owner: **M** = Mohamed, **C** = Claude. Done items move to the bottom, then get deleted after a week.

## Now
- [ ] **M** Approve ~$3 API spend: tag the 25 demo products (~$1) + 2 eval runs (~$2)
- [ ] **M** Give preview deployments a database. Vercel's Preview env has no `DATABASE_URL`/`DIRECT_URL` (Production only), so preview product pages can't load. Pick: a separate free Supabase project for the demo (recommended: demo rows never touch kashfedit.com) or the same DB. Then add both vars to Vercel → Preview
- [ ] **M** Approve pushing branch `demo-images` (`10e591b`). Pushing creates the private preview deployment

## Next
- [ ] **C** Load the demo products into the preview DB. On the preview, check images show; on kashfedit.com, check the CSP is still `img-src 'self' blob: data:` (ADR-0013 amendment checks a/b). Then **M** creates the one Hobby share link
- [ ] **C** Tag the demo samples with vision (~$1) → tags for the demo rows
- [ ] **C** Wire `findDisagreements` (`lib/vision/text-facts.ts`) into the tagger: when the title or description contradicts vision, mark the product `needs_review`
- [ ] **C** Collect product descriptions during collection, but store only the parsed facts (`parseFeedFacts` + `parseTextFacts`), never the brand's text
- [ ] **C** Run the eval on the 28-product set with Opus 4.7 as-is (baseline, ~$1)
- [ ] **C** Move the tagger to `claude-opus-5-5`: structured outputs replace the forced tool (`extract.ts:120` would 400), max_tokens 1024→16000, explicit effort, add the price to `cost.ts`. Re-run the eval and compare.

## Waiting
- Sovrn: parked at step 2 until a real product link exists
- Impact / Awin: declined 09-17 / 09-21

## Done
- [x] **C** Preview-only hotlinked brand images on branch `demo-images` (`10e591b`), proven locally with `next start`: production CSP unchanged, preview adds the 5 CDNs (2026-11-08)
- [x] **C** Title/description second opinion `lib/vision/text-facts.ts` (`a921f34`), tests on the 25 real titles (2026-11-08)
- [x] **C** ADR-0013 amendment: demo images hotlinked on a private preview, local copies for tagging (`bf65aa0`) (2026-11-08)
- [x] **C** Saved the 13 missing Simons images via the browser; all 25 products complete (2026-11-07)
- [x] **C** Pushed `5814991`; the cron clock is reset, next cliff ~2027-01-06 (2026-11-07)
- [x] **C** 25 demo products (Uniqlo, H&M, Zara, Simons, Reitmans; 3 dresses + 2 tops each) → `samples/demo/products.csv` (2026-11-07)
- [x] **C** Committed the 09-29 work locally (2026-11-07)
- [x] **C** Terms check for 5 brands → `docs/research/2026-11-07-brand-terms.md` (2026-11-07)
