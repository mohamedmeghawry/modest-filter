# Action board

One line per action. Owner: **M** = Mohamed, **C** = Claude. Done items move to the bottom, then get deleted after a week.

## Now
- [ ] **M** Approve: commit the 09-29 work and push. **Due 2026-11-13** (the GitHub cron shuts off ~11-14)
- [ ] **M** Decide how to collect samples, given the terms check (`docs/research/2026-11-07-brand-terms.md`)
- [ ] **C** Collect demo samples: 25 products in feed shape → `samples/demo/products.csv`

## Next
- [ ] **C** Tag the demo samples with vision (~$1) and load them into the DB → real products live on kashfedit.com
- [ ] **C** Run the eval on the 28-product set with Opus 4.7 as-is (baseline, ~$1)
- [ ] **C** Move the tagger to `claude-opus-5-5`: structured outputs replace the forced tool (`extract.ts:120` would 400), max_tokens 1024→16000, explicit effort, add the price to `cost.ts`. Re-run the eval and compare.

## Waiting
- Sovrn: parked at step 2 until a real product link exists
- Impact / Awin: declined 09-17 / 09-21

## Done
- [x] **C** Terms check for 5 brands → `docs/research/2026-11-07-brand-terms.md` (2026-11-07)
