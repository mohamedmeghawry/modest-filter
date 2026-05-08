# ADR 0006: Prisma 7 Connection Architecture

- Status: Accepted
- Date: 2026-05-07
- Decision makers: Mohamed Meghawry

## Context

Prisma 7 changed how database connection URLs are configured. In Prisma 5 and 6, both the runtime URL and the migration URL lived in `schema.prisma` under the `datasource` block (`url` and `directUrl`). Starting in Prisma 7, the schema no longer accepts either field. Instead:

- CLI commands (migrate, db push, db pull, generate, etc.) read the connection URL from `prisma.config.ts` under `datasource.url`.
- The runtime `PrismaClient` is configured via a driver adapter (`@prisma/adapter-pg` for raw Postgres, `@prisma/adapter-pg-pool` for pooled, etc.) passed to the constructor at instantiation time.

This shift was discovered the hard way. Vendor documentation, including Supabase's own Prisma integration guide, still demonstrated the Prisma 5/6 pattern (URLs in `schema.prisma`). Following that guidance produced a `P1012` schema validation error on the first `prisma migrate status` attempt:

> The datasource property `url` is no longer supported in schema files. Move connection URLs for Migrate to `prisma.config.ts` and pass either `adapter` for a direct database connection or `accelerateUrl` for Accelerate to the `PrismaClient` constructor.

Diagnosing this required reading the type definitions in `node_modules/@prisma/config/dist/index.d.ts` directly to find the supported config shape — a meaningful detour for a first-time setup.

## Decision

Adopt Prisma 7's architecture as-is. Specifically:

- **`schema.prisma` datasource block contains only `provider = "postgresql"`.** No URLs.
- **`prisma.config.ts` datasource.url = `process.env["DIRECT_URL"]`.** All Prisma CLI commands (migrate, db pull, generate) use this URL. We point it at Supabase's direct connection on port 5432 (the session pooler in Supabase's terminology) because migrations require direct database access — the transaction-mode pooler at port 6543 cannot run DDL or prepared-statement-heavy migration logic.
- **Runtime `PrismaClient` will use a driver adapter** configured with `DATABASE_URL` (Supabase's transaction-mode pooler at port 6543). This setup is deferred until Prisma is wired into Next.js application code; see the implementation notes below.

## Consequences

### Positive

- Aligned with the current Prisma major version. No technical debt accrued from staying on a deprecated config shape.
- Clear separation between CLI concerns (migration tooling, schema introspection) and runtime concerns (application queries, connection pooling). Each path has a single, dedicated configuration surface.
- Driver adapters give finer control over runtime connection behavior — choice of pooler, connection limits, retry policy — than the prior "URL in schema" approach allowed.

### Negative

- Vendor documentation lags significantly. Supabase, in particular, still demonstrates the Prisma 5/6 pattern at the time of this decision. Anyone setting up a Prisma 7 + Supabase project by following vendor docs will hit `P1012` on first run.
- The runtime adapter is a distinct setup step that does not happen automatically when Prisma is installed. Until it is wired in, the `PrismaClient` constructor cannot be called with a working configuration.
- Two URLs (`DATABASE_URL` for the runtime pooler, `DIRECT_URL` for CLI/migrations) must be kept in sync in `.env.local` and in any deployment environment. Forgetting either produces a non-obvious failure mode (CLI works but app fails, or vice versa).

## Alternatives considered

- **Pin to Prisma 6.** Would let us follow the vendor docs verbatim and skip the diagnosis detour. Rejected — freezes the project on a deprecated major version, and Supabase's docs will eventually update to Prisma 7 anyway. Avoiding short-term pain by accepting permanent technical debt is the wrong trade.
- **Hybrid: URLs in both `schema.prisma` and `prisma.config.ts`.** Rejected — Prisma 7 actively rejects URLs in `schema.prisma` with a validation error, so this configuration is not legal regardless of intent.

## Implementation notes

- Connection verified via `npx prisma migrate status` (commit `69c78bb`). Output confirmed Prisma reaches the database at `aws-1-us-east-1.pooler.supabase.com:5432` and reports baseline state ("No migration found in prisma/migrations") as expected.
- Runtime driver adapter setup is outstanding. Will be addressed when Prisma is first wired into Next.js application code (likely the first API route that reads from the database). At that point, `@prisma/adapter-pg` (or `@prisma/adapter-pg-pool`) will be added as a dependency and used in the `PrismaClient` constructor.
- The `DATABASE_URL` / `DIRECT_URL` split must be replicated in production. When the Vercel deployment is configured, both environment variables must be set there with values from Supabase's connection-string panel.
- The lesson from the discovery process — vendor docs can lag major versions, read type definitions when stuck — is a general one and may be worth surfacing in `AGENTS.md` for future sessions.
