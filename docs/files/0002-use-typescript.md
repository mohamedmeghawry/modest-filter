# ADR 0002: Use TypeScript Across the Codebase

- Status: Accepted
- Date: 2026-04-29
- Decision makers: Mohamed Meghawry

## Context

The project is built primarily with Claude Code, which produces materially more accurate output when working in a typed language. The codebase will span frontend, API routes, and database access with shared data shapes (Product, Tag, Filter). The developer is learning the stack as the project progresses.

## Decision

Use TypeScript across the entire project: frontend components, API routes, database access via Prisma, and any utility scripts.

## Consequences

### Positive

- Compile-time errors catch a category of bugs that would otherwise surface in production.
- Claude Code generates more accurate code with type signatures available as context.
- Prisma generates fully typed database clients, eliminating manual type definitions for data models.
- Refactoring is safer; changing a Product schema field surfaces every affected location at compile time.
- Skill is highly transferable and demonstrates engineering maturity in a portfolio.

### Negative

- Slightly slower initial coding for someone new to TypeScript.
- Some ecosystem libraries have weak type definitions, requiring occasional `any` escapes or type assertions.

## Alternatives considered

- **Plain JavaScript:** Faster to start, but loses Claude Code accuracy benefits and creates technical debt as the codebase grows. Rejected.
- **JSDoc-typed JavaScript:** Halfway solution; gets some IDE benefits without full type safety. Rejected as a half-measure.
