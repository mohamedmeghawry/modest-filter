# Action board

One line per action. Owner: **M** = Mohamed, **C** = Claude. Done items move to the bottom, then get deleted after a week.

## Now
- [ ] **C** Batch 2 (approved 2026-11-09): 10 brands × 10 products (6 dresses + 4 tops), long-sleeve listings in listing order, front + back photos, browser at human pace. Steps: ~~1 prep~~ ~~2 lab test~~ → 3 terms check (Mango, Dynamite, Old Navy, Gap, Banana Republic) → 4 pilot (2 products, then show Mohamed) → 5 collect → 6 batch-API tagging (Opus 5.5 low on all; Jev on all) → 7 Mohamed judges disagreements + 10 random agreements. Rules fixed before results: 0 immodest shown first, then fewer good hidden, then cost; Jev earns the reject role if ≤2 of 100 confident rejects are wrong
- [ ] **M** Policy: an abaya photo where the hijab hides the neckline. Count the neckline as unknown (hidden) or allow it?
- [ ] **M** Look at the preview on your phone (signed in to Vercel): https://modest-filter-git-demo-images-mohamedmeghawrys-projects.vercel.app/products and say what looks wrong
- [ ] **M** When the group should see it: create the one Hobby share link (Vercel → deployment → Share)
- [ ] **M** Reset the `kashfedit-demo` DB password once more: it showed in a Claude screenshot (Risk Register INC-2026-04). Make it in Bitwarden, paste into Supabase reset, `.env.demo.local` and both Vercel Preview vars

## Next
- [ ] **C** Add `kashfedit-demo` (Supabase, public demo catalogue only) to `Security/Inventory.md`
- [ ] **M** Colour from the brand's colour name as the final tag (proposed, not yet confirmed)
- [ ] **C** Photo picking at scale: per-brand order rule vs a cheap view-labelling pass
- [ ] **C** Wire `findDisagreements` (`lib/vision/text-facts.ts`) into the tagger: when the title or description contradicts vision, mark the product `needs_review`
- [ ] **C** Add the TypeSafe key (`modest-filter`, `.env.local` only) to `Security/Inventory.md`
- [ ] **C** Collect product descriptions and the "details" section (e.g. H&M/Uniqlo state sleeve length) with the next collection batch, run `textGate` + parsers on them, store only the parsed facts, never the brand's text. Do it in the browser at 1 page per second (Simons blocks scripts)
- [ ] **C** Run the eval on the 28-product set with Opus 4.7 as-is (baseline, ~$1)
- [ ] **C** Move the tagger to `claude-opus-5-5`: structured outputs replace the forced tool (`extract.ts:120` would 400), max_tokens 1024→16000, explicit effort, add the price to `cost.ts`. Re-run the eval and compare.

## Waiting
- Sovrn: parked at step 2 until a real product link exists
- Impact / Awin: declined 09-17 / 09-21

## Done
- [x] **C** Lab test on the 28 (Opus 5.5 low/medium vs Jev, $0.88): all show 0 immodest products; Jev hides fewer good ones at ~1/50 the cost; medium effort adds nothing (2026-11-09)
- [x] **C** Tagger on Opus 5.5 (structured outputs, low effort, non-retryable refusals); tagging rules applied (lining from text only, back unknown without a back photo); eval photo fixed (`baab4c9`) (2026-11-09)
- [x] **M+C** Jev pre-screen eval on the 28-product set (`scripts/jev-eval.ts`, $0.008): 0 immodest passed, 16/28 confidently and correctly rejected, back is its weak spot (2026-11-09)
- [x] **C** Modest baseline (ADR-0015) live on the preview (`0467685`): 12 of 25 shown (7 dresses, 5 tops); checks (a) anonymous → 302 login, (b) kashfedit.com CSP unchanged, re-run after the push (2026-11-08)
- [x] **C** Pushed `demo-images` (`445383c`, secret scan clean); private preview live with 25 tagged products and brand photos. ADR-0013 checks passed: (a) anonymous → Vercel login, (b) kashfedit.com CSP unchanged (2026-11-08)
- [x] **C** 25 demo products loaded into the demo DB and AI-tagged from hand-picked local photos ($1.58, Opus 4.7); colour parser; text vs vision tracker `docs/attribute-sources.md` (`f15b8a1`, branch `demo-images`) (2026-11-08)
- [x] **M+C** Demo DB wired: Vercel 2FA on; `DATABASE_URL`/`DIRECT_URL` added for Preview only (Secret; Production vars untouched, checked via Vercel API); `.env.demo.local` connects; migrations applied to `kashfedit-demo`, RLS on all 4 tables (2026-11-08)
- [x] **C+M** Created Supabase project `kashfedit-demo` for the preview (separate from production; us-east-1, Data API off, automatic RLS on). Local template `.env.demo.local` (gitignored) (2026-11-08)
- [x] **C** Preview-only hotlinked brand images on branch `demo-images` (`10e591b`), proven locally with `next start`: production CSP unchanged, preview adds the 5 CDNs (2026-11-08)
- [x] **C** Title/description second opinion `lib/vision/text-facts.ts` (`a921f34`), tests on the 25 real titles (2026-11-08)
- [x] **C** ADR-0013 amendment: demo images hotlinked on a private preview, local copies for tagging (`bf65aa0`) (2026-11-08)
- [x] **C** Saved the 13 missing Simons images via the browser; all 25 products complete (2026-11-07)
- [x] **C** Pushed `5814991`; the cron clock is reset, next cliff ~2027-01-06 (2026-11-07)
- [x] **C** 25 demo products (Uniqlo, H&M, Zara, Simons, Reitmans; 3 dresses + 2 tops each) → `samples/demo/products.csv` (2026-11-07)
- [x] **C** Committed the 09-29 work locally (2026-11-07)
- [x] **C** Terms check for 5 brands → `docs/research/2026-11-07-brand-terms.md` (2026-11-07)
