# Build Journal (devlog)

The story of how modest-filter got built: what we set out to do, what we shipped, and the challenges we hit and how we solved them. Newest entries first.

This is the **narrative layer**, distinct from the other records in this repo:

- **ADRs** (`docs/files/`) record *decisions* and the alternatives we rejected.
- **Commit messages** record the *why* of each individual change.
- **This devlog** is the human-readable *story* — written to be mined for job interviews, articles, and social posts.

Every entry follows the same shape. The **Challenges & how we solved them** section is the reusable core: it maps straight onto the "tell me about a hard problem you solved" interview question, and each bullet is a self-contained anecdote.

---

### 2026-06-06 — Measuring the model: the eval scorer and the description A/B

**Goal:** Build the scorer that turns "the AI is ~93% accurate" into a measured per-attribute number, run it against the ground-truth set, and test the one experiment the data points to.

**What shipped:** A pure scorer (`score.ts`, 6 tests) plus a runner (`npm run vision:eval`) that grades each product against ground truth and prints a per-attribute table, disagreements, and cost; a `--detail` your-tag-vs-model view; and `--with-description` to fold the product description into extraction (ADR-0014). First real numbers: Opus 4.7 at ~80% exact-match, with `lined` and `material` the clear worst.

**Challenges & how we solved them:**
- *The first run graded our answer key, not just the model.* Several "model errors" were our ground truth being wrong (a back slit tagged `none`, a sleeveless dress tagged long-sleeve, a cropped top mis-filed as a dress). We treated the eval as a ground-truth audit, hand-checked each conflict, and corrected the key. The model was more accurate than the raw score showed.
- *One bad image crashed the entire run.* A manifest image path that pointed at a directory threw mid-run and took everything down. We made the runner read each image in a try/catch and magic-byte-check the format, skipping bad products with a specific reason instead of dying. The check also caught AVIF files and a saved HTML page masquerading as images, which surfaced a real production requirement: ingestion must validate image formats, since the vision API rejects AVIF.
- *The description A/B had a twist.* Feeding the description lifted exactly the two target attributes (`lined` +17, `material` +11) but distracted the model from the photo, regressing `backStyle` −12. So we refined the design: parse `material`/`lined` from the feed text directly, and run vision image-only on the visual attributes, rather than routing the description through the model.

**Takeaway:** An evaluation's first job is to harden the ground truth; its second is to point precisely at the highest-leverage fix. Both showed up in the first run.

---

### 2026-06-06 — A vision spike becomes a tagging engine

**Goal:** Turn the one-product vision proof-of-concept into a production tagging engine, and stand up a trustworthy ground-truth set to measure it against.

**What shipped:** `tagProductWithRetry` now wraps the extractor with 3x exponential backoff, retrying transient errors (429/5xx/network) and failing fast on deterministic 4xx, returning a `tagged|failed` discriminated union so callers can never read attributes off a failed run. A `tag-catalogue.ts` runner drives the tagStatus state machine over the DB and flags permanent failures for review. We also pre-populated a 28-product eval manifest, validated it down to complete tags, and wrote ADR-0014 for hybrid extraction.

**Challenges & how we solved them:**
- *Brand sites returned HTTP 403 and hid their image URLs* — WebFetch was blocked outright by Aritzia and Anthropologie, so we drove a real browser with Playwright and read each page's JSON-LD structured data to pull descriptions and the exact gallery URLs.
- *The ground-truth answer key could quietly grade the AI against guesses* — we refused to auto-fill it from product names; instead descriptions fill objective facts (material, lining) and humans judge the visual attributes, keeping the key honest.
- *Hand-tagging introduced silent data-entry errors* — an audit script caught 10, including the string `"null"` masquerading as real null and an invalid `slit="present"`.

**Takeaway:** A benchmark you seed from guesses measures nothing; keep the answer key human-judged where judgment is required, and write a script to audit it.

---

### 2026-06-03 — Catching silent category drift with a spec audit

**Goal:** Run a multi-dimension audit of the codebase against the project brief, and fix any divergence between what we shipped and what v1 actually requires.

**What shipped:** The audit caught that our seed data had silently dropped "abayas," a category the brief explicitly lists as in-scope for v1, and added an undocumented "bottoms" category in its place. We restored abayas across the seed data, the filter UI, and the live Supabase database, replaced the stray trouser sample with an abaya, and removed bottoms. We also fixed stale docs the audit surfaced along the way: the README filter list (4 to 7) and test count (21 to 74), and an outdated path reference in AGENTS.md.

**Challenges & how we solved them:**
- *The drift was invisible in day-to-day work* — Nothing was broken, so nothing flagged it; the app ran fine with the wrong categories. We solved it by auditing the code against the source-of-truth spec rather than against itself, which is the only way a "valid but wrong" state shows up.
- *The fix spanned three places that could fall out of sync* — Abayas had to match across seed data, the filter UI, and the deployed database. We changed all three in one commit and aligned the filter order to the brief so there was a single canonical ordering to check against.

**Takeaway:** Code that runs cleanly can still be wrong against the spec; periodic audits against the source of truth are the only thing that catches the drift normal work introduces invisibly.

---

### 2026-06-03 — Validating the AI on real model-on photos, around a blocker

**Goal:** Prove out the vision tagging accuracy on realistic data without waiting on the affiliate-feed access that was blocking our product sourcing.

**What shipped:** We hand-sourced about five dresses from brands' public product pages, hand-tagged ground-truth attributes for each, and ran the model against them. The result was 78 of 84 attributes matched exactly, 93 percent. We also confirmed, on more than one product, an earlier hypothesis that a dress's slit is only readable when the garment is shown on a model.

**Challenges & how we solved them:**
- *A blocker on sourcing looked like it blocked everything* — we noticed the affiliate feed was a false dependency for validation. Model-on photos live on brands' public pages and need no feed, so we decoupled accuracy testing from the blocked sourcing track and ran it on hand-sourced images instead.
- *No trustworthy ground truth to measure against* — we hand-tagged each garment ourselves before running the model, so the 93 percent was measured against a known-correct baseline rather than a guess.
- *Validating an earlier hunch with one example is weak* — we deliberately checked the "slit only shows on a model" hypothesis across several products, not just one, so the finding holds up.

**Takeaway:** When a blocker stops one track, check whether the things downstream of it are truly dependent; often you can decouple a parallel track and keep moving.

---

### 2026-05-20 — Vision tagging spike: the photo is the bottleneck

**Goal:** Validate whether Claude Vision could extract the 14 modesty-relevant garment attributes from a real product image well enough to build the tagging pipeline on, using one product as a first test.

**What shipped:** We ran one real product through Claude Opus vision against hand-derived ground truth and landed about 10 of 14 attributes correct on surface read. We logged the misses, found a schema gap, fixed a strict-mode JSON issue, and wrote it all up as ADR-0012 so the findings drive the production design instead of living in chat.

**Challenges & how we solved them:**
- *The most valuable miss was not the model, it was the photo.* The attributes we most need for modesty, hem length, side slit, and how the neckline sits on a body, were the ones a flat product-only shot simply cannot show. We solved it by changing the input, not the prompt: production will prefer photos shot on a model, and ground truth gets rebuilt against model-on imagery.
- *A schema gap hid in plain sight.* Our Neckline enum had no value for "collar," so a collared piece had nowhere correct to land. We caught it only by tagging a real garment and noting the forced wrong answer.
- *Strict-mode JSON rejected our nullable enums.* Attributes that can legitimately be null broke schema validation. We wrapped each nullable enum in an `anyOf` (the enum plus null), which satisfied strict mode without loosening the types.

**Takeaway:** When an AI extraction step underperforms, check the input before you blame the model; here the data the photo could physically show was the real ceiling.

---

### 2026-04-29 — Architectural foundation on bleeding-edge tooling

**Goal:** Lay down the framework, data-flow, and database foundations for a modest-fashion aggregator, on a stack new enough that most references (and an AI's training data) describe an older version.

**What shipped:** We committed to Next.js 16 (App Router) with TypeScript and an API-first architecture: page components never touch the database; all dynamic data flows through API routes under `app/api/`, backed by shared `lib/data/` functions. We stood up Postgres on Supabase via Prisma 7 and verified the connection with `prisma migrate status`. Three ADRs record the decisions and the reasoning behind them.

**Challenges & how we solved them:**
- *Prisma 7 moved connection URLs out of `schema.prisma`, and even Supabase's own docs still showed the old Prisma 5/6 pattern* — Following the vendor guide produced a `P1012` validation error on first run. We stopped trusting memory and the docs, read the type definitions in `node_modules/@prisma/config` directly, and found the real shape: URLs go in `prisma.config.ts`, runtime uses a driver adapter. We also split `DIRECT_URL` (port 5432, migrations) from `DATABASE_URL` (port 6543, pooled runtime).
- *Tempting to let pages query the database directly to ship faster* — We chose the API-first layer instead, costing roughly 5% more code now. The payoff is that a future React Native app reuses the exact same backend with no data-layer rewrite.

**Takeaway:** On bleeding-edge stacks, verify against the shipped docs and type definitions, not memory; a small architectural cost paid upfront buys you out of a large rewrite later.
