# ADR 0004: API-First Architecture

- Status: Accepted
- Date: 2026-04-29
- Decision makers: Mohamed Meghawry

## Context

The v1 deliverable is a website. A future React Native mobile app is planned but out of scope for v1. The decision must be made now whether to build the website with direct database access (simpler, faster, but couples the website to the database) or with an API layer (slightly more work but reusable across surfaces).

## Decision

All dynamic data access in the application happens through Next.js API routes. Page components never access the database directly. The website calls these API routes for product data, filter results, and any other dynamic content. A future mobile app will consume the same API routes.

Server components are used for static or rarely-changing content (page shells, metadata). Dynamic data goes through the API.

## Consequences

### Positive

- A future React Native app can reuse the same backend with no rewrite of data access logic.
- Clean separation between presentation and data; codebase is easier to reason about.
- API endpoints are independently testable.
- Demonstrates architectural maturity in portfolio reviews.
- Aligns with how serious engineering teams structure modern applications.

### Negative

- Approximately 5% additional code volume vs. direct database access from page components.
- Slight performance overhead per page (additional HTTP roundtrip), measured in tens of milliseconds; not user-perceptible at v1 scale.

## Alternatives considered

- **Direct database access from page components (no API):** Faster to build, but a future mobile app would require significant rewrite. Rejected on long-term grounds.
- **Wrap the website in WebView/Capacitor instead of building a native app:** Avoids the API requirement but produces a degraded mobile experience that does not match modern user expectations for a clothing browsing app. Rejected.

## Implementation notes

- All API routes live under `app/api/`.
- Shared data-access functions live in a `lib/data/` directory and are called from both API routes and (where appropriate) server components, so business logic is written once.
- API responses use a consistent JSON shape; error responses follow a documented schema.
