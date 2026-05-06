# ADR 0003: PostgreSQL on Supabase with Prisma ORM

- Status: Accepted
- Date: 2026-04-29
- Decision makers: Mohamed Meghawry

## Context

The project needs a database that supports relational queries (Product belongs to Brand, has many Tags, etc.), is free at v1 scale, and integrates cleanly with TypeScript. The developer has limited prior database experience and benefits from a managed service rather than self-hosting.

## Decision

Use PostgreSQL hosted on Supabase as the database. Use Prisma as the ORM for all database access.

## Consequences

### Positive

- PostgreSQL is the most widely deployed relational database in modern engineering, including IT and SOC environments. Skill transfers directly to career goals.
- Supabase provides a managed Postgres instance with a generous free tier (500MB storage, sufficient for v1 catalogue at 5 brands × ~500 products).
- Supabase includes Row Level Security (RLS) which lets fine-grained access policies be enforced at the database level rather than application level.
- Prisma generates fully typed clients from the schema; TypeScript and Prisma together catch a wide class of bugs at compile time.
- Prisma's migration system is well-documented and beginner-friendly.

### Negative

- Vendor lock-in to Supabase, though Postgres itself is portable.
- Prisma adds a small runtime overhead vs. raw SQL queries; not a concern at v1 scale.

## Alternatives considered

- **MongoDB:** Document store; modeling many-to-many tag relationships is awkward. Rejected.
- **Self-hosted Postgres:** Adds operational burden for a solo developer. Rejected.
- **SQLite:** Simple for v1, but does not survive deployment to Vercel cleanly. Rejected.
- **Drizzle ORM:** Modern and lighter than Prisma, but less mature documentation and ecosystem. Reconsider in v2 if Prisma proves limiting.

## Operational notes

- Row Level Security (RLS) is enabled from day one with default-deny policies.
- Database credentials are stored in environment variables only; never committed to source control.
- Public access to the database is disabled; only the application backend connects.
