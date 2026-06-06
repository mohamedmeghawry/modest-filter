<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# modest-filter

A mobile-first web app helping Muslim women find modest dresses, abayas, and tops from mainstream brands (Aritzia, Everlane, Anthropologie, Reformation, Banana Republic — pending affiliate availability). Products are tagged by AI on objective attributes (sleeve length, neckline, hem length, fit, opacity); users define their own modesty thresholds via filters and click through to the brand site to purchase.

Hobby/portfolio project. Build quality target: "documented, tested, well-architected." Solo developer with limited evening/weekend hours; budget is minimal (free tiers + ~$50 one-time for AI tagging).

See `docs/files/project-brief.md` for full scope, target users, success criteria, and explicit out-of-scope items.

## Source of truth

Architectural decisions live in `docs/files/`. Read the relevant ADR before proposing changes to the stack, data flow, or security model.

**Accepted ADRs:**

- `0001-use-nextjs.md` — Next.js (App Router) + React
- `0002-use-typescript.md` — TypeScript everywhere
- `0003-postgres-supabase-prisma.md` — Postgres on Supabase, Prisma ORM
- `0004-api-first-architecture.md` — all dynamic data flows through API routes
- `0005-claude-vision-tagging.md` — Claude Vision for product tagging
- `0006-prisma-7-connection-architecture.md` — Prisma 7 config model: URLs in prisma.config.ts and driver adapters
- `0007-v1-schema.md` — v1 schema (3 entities, 14 product attributes)
- `0008-filter-null-semantics.md` — v1 filter NULL semantics (strict `in`; "select all ≠ no filter")
- `0009-product-url-design.md` — product URLs use cuid id for v1; slugs deferred to v2
- `0010-filter-ui-scaling.md` — v1 filter UI scales poorly past ~30 options; UX debt acknowledged, v2 mobile-first redesign planned
- `0011-shadcn-ui-radix-adoption.md` — adopt shadcn/ui New York (Radix primitives) for component layer; owned source in components/ui/, dark mode preserved via media query (non-standard for shadcn ecosystem)
- `0012-vision-tagging-spike-findings.md` — first-product spike validates Claude Opus 4.7 vision tagging at 10/14 surface accuracy (measured against ground truth derived from product-only photos); deepest finding is that image-only product photography hides modesty-critical attributes (length, slit, neckline-on-body), so production must prefer model-on photos; also surfaces schema gap (collar missing from Neckline), image-only material extraction unreliable, 16-union strict-mode ceiling at 14/16; recommended follow-ups: add collar enum, document tagging conventions, prefer model-on photos in ingestion, manifest growth with model-on ground truth, prompt redesign w/ description
- `0013-image-sourcing-strategy.md` — three-tier image sourcing (affiliate feeds → brand-website scraping → product-only fallback) with extraction-only image handling (no republication); responds to ADR-0012's image-inadequacy finding; coverage estimates are hypotheses pending Session N+1.5 audit
- `0014-hybrid-attribute-extraction.md` — description-confirmed objective facts (`material`, `lined`) are passed to the vision model as known inputs; vision is scoped to visual-only attributes; facts are passed-as-context (not silently pre-filled) because they sharpen adjacent judgments and preserve an eval signal; no real/faux `leather` split (modesty is authenticity-agnostic); eval (N+2) runs vision-alone vs vision+facts to measure the lift

**In-flight design drafts:**

_(none currently)_

**Project direction:** see [`docs/ROADMAP.md`](docs/ROADMAP.md) — the durable record of where the project is going (market context, skill-gap phases, prioritized session-by-session backlog). ADRs are *decided*; the roadmap is *intended*.

**Operational docs:** see [`docs/tagging-conventions.md`](docs/tagging-conventions.md) — hand-tagging guide for the 14 modesty-relevant product attributes (dual audience: human taggers and Claude Vision prompt design).

**Build journal:** see [`docs/devlog.md`](docs/devlog.md) — narrative log of what was built, the challenges hit, and how they were solved (newest first). The story layer that sits above ADRs (*decisions*) and commit messages (*per-change why*); written to be mined for interviews, articles, and social posts. Add an entry at session end when meaningful work shipped.

## Tech stack

- **Language:** TypeScript (frontend, backend, scripts)
- **Framework:** Next.js (App Router) with React, mobile-first
- **Styling:** Tailwind CSS; shadcn/ui for components
- **Backend:** Next.js API routes (same repo)
- **Database:** PostgreSQL on Supabase (free tier); Row Level Security enabled from day one
- **ORM:** Prisma
- **AI tagging:** Claude Vision API (Anthropic), abstracted behind `lib/vision/`
- **Hosting:** Vercel (free tier)
- **Version control + CI:** GitHub + GitHub Actions
- **Future mobile (post-v1):** React Native + Expo, consuming the same API

## Architecture

API-first (ADR 0004). Page components never query the database directly. All dynamic data — products, filters, search results — flows through Next.js API routes under `app/api/`. Server components are reserved for static or rarely-changing content (page shells, layout, metadata).

Shared data-access functions live in `lib/data/` and are called from both API routes and (where appropriate) server components, so business logic is written once.

Product tagging (ADR 0005) runs server-side and asynchronously when a product is ingested. Tags are persisted, not recomputed, unless the source image changes. Failed tag attempts retry up to 3 times with exponential backoff; permanent failures flag the product for manual review.

## Security constraints

Threat model: hobby project, low-value target. Realistic threats in order: accidental secret leaks, automated vulnerability scans, casual catalogue scraping.

Mandatory controls before production:

- All secrets in environment variables — never in source code
- `.gitignore` covers all `.env*` files; verified before first commit
- Database is never exposed to the public internet; access only through backend API routes
- All Anthropic API calls happen server-side; the API key never reaches the browser
- Supabase Row Level Security enabled with explicit read/write/delete policies
- Rate limiting on all public API routes (default: 100 req/min per IP)
- Billing alerts configured on Anthropic and Vercel
- Bot protection enabled (Vercel built-in or Cloudflare)

**Environment variables** (stored in Bitwarden and the project's local `.env.local`; template in `.env.local.example`):

- `DATABASE_URL` — Supabase transaction pooler (port 6543); runtime queries via Prisma (ADR-0006)
- `DIRECT_URL` — Supabase session pooler (port 5432); migrations (ADR-0006)
- `ANTHROPIC_API_KEY` — Claude Vision API; used for product attribute extraction (ADR-0005; implementation strategy in forthcoming ADR-0012). Server-side only.

Out of scope for v1: custom auth (no user accounts), CAPTCHAs, custom WAF, DDoS mitigation beyond hosting defaults.

## Conventions

- **Commits:** Conventional Commits format for every commit.
- **Dependencies:** No new dependencies without asking first.
- **TypeScript:** Strict mode. No `any` without an inline comment justifying why.
- **API layer:** Never bypass it (ADR 0004). Page components must not query the database directly.
- **Secrets:** Never commit `.env*` files.
- **Definition of done:** Run `npm run lint` and `npm run build` and confirm both pass before declaring a task done.

## Working principles

- **Document decisions as they're made.** Every meaningful decision gets documented before or as it's made. Architectural decisions become ADRs in `docs/files/`. In-flight design work goes as draft documents in the same folder. Working notes go in commit messages. Nothing important should live only in chat.
- **Repo over conversation.** Documents live in the repo, not in conversations. Chat sessions can be lost; the repo persists.
- **End every session with a commit.** Each session ends with a commit, even mostly conversational ones. Anything we landed on goes into a doc and is committed before stopping.
- **Keep this file current.** AGENTS.md is updated whenever a new doc category is added, so future sessions know it exists.
- **Always run `npm run build` before pushing app code changes.** `npm run dev` uses lazy per-route transpilation that's more permissive than the production build's strict TypeScript check. A green dev doesn't guarantee a green Vercel deploy. (Lesson from commit 58d860c, May 17.)
- **Test new pure-function logic in the same commit, not a follow-up.** When adding or extending a parser, validator, display helper, or other pure function, write the tests alongside the implementation. UI components and server components remain out of scope for the current testing infrastructure (Tier 2 backlog per ROADMAP). The bar is: if it's pure logic and reachable via a unit test, it ships with one.
