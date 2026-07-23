# Wargamed battle plans

Pointer record for the pre-execution battle plans that target this repo. The plans
themselves live **outside** this repo, in a sibling folder, so a session working inside
`modest-filter` still knows they exist, what they do, and which have run.

## What these are

On **2026-07-06/07** a bulk planning run (Fable 5, banked before the model left the
subscription) produced 8 wargamed battle plans across Mohamed's projects. Three target
this project. Each plan was self-graded PASS 8/8 against a success rubric and hardened
by a red-team pass (attacks staged against the draft, holes patched before any execution).

A "wargame" is a battle plan, not a decision: it front-loads the recon, sequences the
moves, and records fork/abort conditions so any capable model can execute it move by move.
Decisions still live in the ADRs; direction still lives in [`ROADMAP.md`](ROADMAP.md).

**Plans location:** `..\..\wargames\wargames\` (i.e. `projects\wargames\wargames\`).
Per-mission grades and red-team records: `projects\wargames\LEDGER.md`. Run order and
the cross-project findings: `projects\wargames\BRIEFING.md`.

## The three modest-filter missions

| # | Plan file | What it does | Status |
|---|-----------|-------------|--------|
| 06 | `06-mf-bugs.md` | Evidence-gated bug hunt across catalogue / API / vision flows | ✅ **Executed 2026-07-14** |
| 07 | `07-mf-tagging.md` | The AI tagging pipeline (batch Claude Vision over the real catalogue) | ⏳ Pending — gated on Phase 2 ingestion |
| 08 | `08-mf-future.md` | The v1 roadmap (stabilize → Reddit-first launch → retention verdict → monetization-or-freeze) | ⏳ Pending — runs after 07 |

### 06 — bug hunt (done)

Executed 2026-07-14; see the devlog entry "An evidence-gated bug hunt across the core
flows" and the status note for the same date. Five findings shipped in three commits
(test suite 105 → 112):

- **F1** — a dead `"failed"` state meant a transient API blip permanently ejected products
  to `needs_review`. Fixed with a required `retryable` flag derived from the actual error.
- **F2** — the vision prompt returned `null` for slitless garments, conflating *"none"*
  with *"unknown"* against `tagging-conventions.md` and the strict-`in` filter (ADR-0008).
  This was the **sequencing gate**: it had to land before any tagging run (07), or every
  slitless garment would be tagged wrong permanently. ✅ Landed.
- **F3/F4/F5** — client filter components read only the first of a repeated URL param,
  silently dropping active filters on edit. Fixed with a shared `activeFilterValues()` helper.

RECON that needed Mohamed (R4 — verify Supabase RLS still enabled live) was resolved when
the Supabase project was restored the same session.

### 07 — tagging pipeline (pending, gated)

The next mission in sequence, but it opens with a **hard gate (fork F0)**: it assumes the
Phase 2 catalogue ingestion has landed and **stops cleanly if not**. Do not start 07 until
there is a real catalogue to tag. Key parameters baked into the plan: eval gate ≥80% overall
exact-match on the 28-product ground truth (every vision attribute ≥65%); ~$0.012/product via
the batch API (~$12.50 per 1,000); $40/month in-script budget ceiling under the $60 org cap;
1092px downscale; 100-product chunks halving on 413. Builds on the decided 14-attribute schema
(ADR-0007), the `lib/vision/` toolchain, and ADR-0012's model choice (Opus; Sonnet as a
budget-rescue fork). RECON needing Mohamed: catalogue size after ingestion, model-on photo
coverage audit, CDN fetchability, live-pricing check, sharp-on-Windows check.

### 08 — roadmap (pending)

Runs after 07 ships. A 4-phase v1 roadmap: stabilize/beta → Reddit-first launch → retention
verdict + freshness ops → trigger-gated monetization or a *graceful freeze* (scripted success
path, not failure). Retention pass = ≥10 returning searchers/week for 4 straight weeks; effort
budget 3–4 h/week. RECON only Mohamed (or his wife) can settle: her ranked brand list, her
inventory of women-only community groups, an r/Hijabis rules check.

## How to execute one

From `projects\wargames\`:

> Execute the battle plan in `wargames/NN-name.md` move by move. Follow fork triggers, stop
> at abort conditions, resolve RECON NEEDED items before the moves that depend on them.

Sequencing constraint already satisfied: 06's F2 fix precedes 07 (done). Remaining order
per `BRIEFING.md`: 07 (after Phase 2 ingestion) → 08.
