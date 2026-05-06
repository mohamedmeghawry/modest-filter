# ADR 0001: Use Next.js as the Web Framework

- Status: Accepted
- Date: 2026-04-29
- Decision makers: Mohamed Meghawry

## Context

The project needs a web framework that supports a mobile-first responsive site, server-side rendering for future SEO, and a backend API consumable by both the website and a future React Native mobile app. The developer is a solo builder with prior JavaScript experience but limited React experience.

## Decision

Use Next.js (App Router) with TypeScript.

## Consequences

### Positive

- React under the hood; large training corpus for Claude Code, large community, abundant documentation.
- Built-in API routes and server-side execution mean the entire application (frontend pages and the backend API) can live in one project and one repository, reducing operational overhead for a solo developer.
- Server-side rendering supported out of the box for future SEO, even though SEO is not a v1 goal.
- Native pairing with Vercel for zero-config deployment.
- TypeScript support is first-class and improves Claude Code accuracy.

### Negative

- Learning curve for App Router conventions (server vs client components) is real for a developer new to React.
- Tighter coupling to Vercel's hosting model. Migration to a different host is possible but not trivial.

## Alternatives considered

- **Plain React + separate backend (Express, Fastify):** More flexible but doubles the operational surface for a solo developer. Rejected.
- **Remix, Astro, SvelteKit:** Good frameworks but smaller communities and less Claude Code training data. Rejected.
- **Plain HTML/CSS/JS:** Insufficient for the dynamic filtering UX required. Rejected.
