# Security Review — 2026-06-06

First security pass over modest-filter, run with the third-party `vibe-security` skill
(Chris Raroque, MIT — auditing patterns AI assistants commonly get wrong) applied against
the actual code: the public API route, the Prisma client, the vision/Anthropic code,
env handling, migrations, and config. Findings verified by hand, not taken on the skill's word.

**Headline:** no exploitable vulnerabilities in the code. Secrets are server-side only,
DB queries are parameterized through Prisma, filter inputs are allowlisted against enums,
and `.env*` is gitignored (only `.env.local.example` with placeholders is tracked). The
findings below are pre-launch hardening plus one verification — not an active exposure.

Categories N/A by design (correctly skipped): authentication/JWT/sessions (no user accounts
in v1), payments (affiliate click-through only, no checkout), mobile (no app yet).

## Medium — verify, low effort

### RLS is claimed in docs but unproven in the repo
- **Where:** `AGENTS.md` / ADR-0003 state "Row Level Security enabled from day one."
  Prisma migrations (`prisma/migrations/*`) contain **no** RLS statements — confirmed.
  Prisma does not manage RLS, so it is only on if the SQL was run manually in the Supabase dashboard.
- **Why it matters:** Supabase auto-exposes a PostgREST REST API at
  `https://<project>.supabase.co/rest/v1/` reachable with the public anon key. The app never
  uses that path (it reaches Postgres via Prisma with a privileged server-side connection
  string, which is correct). But if RLS is off, the anon key could read the tables through
  that side door, bypassing the app.
- **Actual impact: low.** The data is a public product catalogue — no user accounts, no PII,
  no payments. Worst case is catalogue scraping, already an accepted low-priority threat in
  AGENTS.md. This item is about closing the gap between a documented claim and verifiable reality.
- **Action (Supabase SQL editor, ~5 min):**
  ```sql
  -- check
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
  -- enable on all public tables if any show false
  DO $$ DECLARE r RECORD; BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public'
    LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename); END LOOP;
  END $$;
  ```
  With RLS on and no policies, PostgREST denies all access — which is the desired state, since
  the app does not use PostgREST. **Status: ✅ verified 2026-06-08 — `rowsecurity = true` on all
  four public tables (`_prisma_migrations`, `brands`, `categories`, `products`). RLS was already
  on; no change needed. The documented claim is now proven.**

## Low — acknowledged pre-launch items

1. **No rate limiting on `/api/products`** (`app/api/products/route.ts`). Already listed in
   AGENTS.md as "mandatory before production." Pre-launch impact: mild scraping. Note the
   skill's "attacker drains your Anthropic budget" worry does **not** apply — vision calls are
   not behind any public route; they run only from local CLI scripts (`vision:spike`/`vision:tag`).
2. **Confirm a hard spending cap on the Anthropic console** (not just a billing alert).
   Not verifiable from code — a dashboard setting. Cheap insurance for the AI budget.
3. **Security headers** — ✅ shipped 2026-06-08. `next.config.ts` sets
   `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy`, and `Permissions-Policy` on every route (verified live via curl on
   `/` and `/api/products`).
   - **Content-Security-Policy** — ✅ shipped 2026-06-08 via `proxy.ts` (Next 16's renamed
     Middleware) with a per-request nonce. `script-src` is strict (`'nonce-…' 'strict-dynamic'`,
     no `unsafe-inline`; `unsafe-eval` dev-only); verified in a production build that every
     `<script>` carries the matching nonce (0 un-nonced) on `/`, `/products`, and
     `/products/[id]`. Deliberate trade-offs: `style-src 'self' 'unsafe-inline'` (the color
     swatches use dynamic inline `style`, which strict style-src would block; style injection
     runs no script), and `img-src 'self' blob: data:` (correct while images are same-origin —
     **revisit when real product images are wired**, or route them through `next/image`). The
     home page was forced dynamic (`await connection()`) so the nonce applies.

## Note on the tool

`vibe-security` matched the stack precisely, produced no false alarms, and correctly skipped
N/A categories. Its single most valuable output was "verify the claim your own docs make,"
not a code bug — three of four findings were already known/accepted in AGENTS.md. Treat its
output as a checklist to verify, never a to-do list to auto-apply. Installed per-project at
`.agents/skills/vibe-security/` (not global).
