# modest-filter Roadmap

This is the durable record of project direction, market context, and known-but-not-yet-decided next steps. It is updated as the project evolves. Unlike the ADRs (which document *decided* choices) or the README (public-facing demo), this document captures *where the project is going and why*.

_Last updated: 2026-06-03._

## Market context (why this project matters)

- Modest apparel is a **~$96–140B market in 2025** depending on research firm, growing at a **5.5–5.7% CAGR** — outpacing mainstream apparel growth.
- The broader "general modest wear" segment, including non-Muslim consumers, creates a **TAM exceeding $500B**.
- Existing players are mostly retailers (Modanisa, Artizara, Louella). Our positioning as an **aggregator-and-curator over mainstream brands** — not a retailer — is structurally different from the incumbents.
- These figures are based on industry research conducted **2026-05-17** and should be **re-verified before any pitch or launch claim**. Treat them as directional, not citable, until refreshed.

## Where we are (engineering state, May 2026)

ADRs 0001–0013 accepted. The core vertical is complete: catalogue list → URL-based filtering (collapsible Accordion sections on desktop, mobile Sheet drawer) → product detail, all through the `lib/data` seam (ADR-0004). 74 unit tests (filter parser + display helpers + vision schema completeness). Vision tagging viability validated empirically against a first product (ADR-0012). Deployed at [modest-filter.vercel.app](https://modest-filter.vercel.app/products).

See `AGENTS.md` for the authoritative, current ADR list.

## Skill roadmap (gaps mapped to phases)

### Next (current backlog, weeks 1–4)

- **AI prompt engineering for structured extraction** — needed for the ADR-0005 Vision tagging pipeline. Concrete guidance: use Anthropic's structured-output API with an explicit JSON schema (the 14 product attribute fields); downsample images to ~768px before sending (Opus 4.7 uses ~4,800 tokens per image at full resolution, ~60% reduction at 768px with no extraction-quality loss); build an evaluation set of ~50 hand-tagged products as ground truth **before** committing to a prompt. AI engineering is fundamentally evaluation engineering.
- **Mobile-first UX patterns** — needed for the ADR-0010 v2 redesign. Specifically: Tailwind responsive patterns at scale, drawer/modal for filter UI on small viewports, shadcn/ui + Radix UI primitives (production-React standard), accessibility fundamentals (ARIA, keyboard navigation, focus management).

### Mid-term (months 2–4)

- **Affiliate API integration** — first target **Rakuten Advertising** (fashion-strong network including mainstream modest-friendly brands). Note the **Rakuten + impact.com alliance announced April 2026**: one integration increasingly accesses both ecosystems. Sub-skills: HTTP retry/backoff, cross-network data normalization, ingestion idempotency (the upsert pattern in `prisma/seed.ts` already demonstrates this principle).
- **Authentication** — Supabase Auth is the lowest-friction path given the existing Supabase stack; alternatives are Auth.js (Next.js default) and Clerk.
- **Image handling at scale** — CDN strategy (Vercel built-in or Cloudinary), Next.js Image component with responsive srcset, blur placeholders.

### Launch readiness (months 4–6)

- **SEO** — JSON-LD Product schema (required for Google rich results), `sitemap.xml` generation, canonical URLs (ties to ADR-0009's v2 slug plan), OpenGraph tags.
- **Performance** — Lighthouse / Core Web Vitals monitoring. Next.js + server components gives a strong baseline; the work is regression prevention as real images and third-party scripts arrive.
- **Legal/compliance** — Terms of Service, Privacy Policy, GDPR (EU) and PIPEDA (Canada) compliance.

## Standing practices to start now (not deferred)

### User research

The highest-leverage skill not yet in active practice. Five 30-minute conversations with modest-dressing women about how they actually shop today will inform v2 more than any framework choice. The curation lead's domain expertise should be treated as **co-founder-level input on UX direction**, not consultant input. This practice should run in parallel with engineering, not after launch.

### Evaluation discipline (for AI features)

Build the hand-tagged evaluation set **before** the first Vision pipeline prompt. Without ground truth you cannot measure whether a prompt change improves or regresses accuracy — and AI development without measurement is guesswork dressed as engineering.

## Prioritized session-by-session next steps

- **Session N+1** — Vision tagging spike: ✓ shipped 2026-05-20 (commits f2b8524..22157c3); findings documented in ADR-0012; five follow-ups identified (✓ `collar` enum, ✓ tagging conventions doc, prefer model-on photos in ingestion, manifest growth, prompt redesign w/ description).
- **Session N+1.5** — Two tracks, deliberately **decoupled** so the blocked one does not gate the other:
  - **Track A — Tier 1 coverage audit (currently blocked).** Answer ADR-0013's open questions: actual model-on photo % per Rakuten seed brand. Blocked on affiliate-feed access (not yet obtained). This is a *sourcing* problem.
  - **Track B — Vision validation on model-on photos (✓ done 2026-06-03; findings in ADR-0012 "Session N+1.5 addendum").** Reframed in execution from the original paired flat-vs-model design to a direct accuracy read: how well does Opus fill the 14-attribute row from *model-on* front+back photos (the inputs production will actually use)? Ran 5 hand-sourced Aritzia linen dresses + 1 styling-confound case. **Result: 78/84 exact-match (93%), zero clear errors; the slit hypothesis confirmed on N>1 (Barrafina high slit detected from model-on).** Caveats: ground truth was agent-tagged (not curation-lead-validated) and `material` was not genuinely tested (no descriptions). Eyeballed only; automated **scorer stays deferred to Session N+2**. Open follow-ups: curation-lead validation of the 6 disagreements, materials from descriptions, resolve convention gaps in `docs/tagging-conventions.md`.
  - **Rationale:** affiliate access is sourcing; vision accuracy is tech. Letting the blocked sourcing track stall the tech validation would be a false dependency.
- **Session N+2** — Evaluation harness, framed by ADR-0012's open questions: image-only vs image+description A/B, 50-product ground truth (expand from manifest's current 1), per-attribute accuracy table, model-cost tradeoff measurement (Opus 4.7 vs Sonnet 4.6).
- **Session N+3** — Mobile-first filter redesign per ADR-0010: ✓ structural part shipped in e85b3cb (Accordion + Sheet + responsive, documented in ADR-0011). Polish + interactive browser verification deferred to a fresh-eyes session.
- **Session N+4** — First user-research conversations (target: 3 modest-dressing women, 30 min each, open-ended).
- **Beyond** — Rakuten API exploration, then auth, then SEO + image CDN.
