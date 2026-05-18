# ADR 0008: v1 Filter NULL Semantics

- Status: Accepted
- Date: 2026-05-17
- Implements: f436413 (interactive filter UI commit)
- Cross-reference: ADR-0007 (the schema that creates the NULL attribute reality)

## Context

ADR-0007 defines product attributes that are category-specific by design: `hemLength` applies to dresses, `topLength` to tops, and `sleeveLength` is NULL for bottoms. Not every attribute is populated for every product — NULL is the expected, correct state for an attribute that does not apply to a garment category.

`Filters.tsx` (introduced in f436413) exposes every enum value of every filter group as an independent checkbox. The UI presents the full attribute space regardless of which categories actually carry that attribute.

## Problem

When a user selects all checkboxes within a filter group, the intuitive expectation is "no constraint" — i.e., show everything. The actual behavior is the opposite: strict "the product must have one of these values." Products whose attribute is NULL are excluded, because the filter is applied via Prisma's `in` operator, and `NULL IN (...)` is never true in SQL.

Selecting every checkbox in a group therefore does not mean "no filter" — it means "exclude every product where this attribute is unspecified."

## Concrete impact

- Filtering by **any** `hemLength` value implicitly narrows results to dresses, because tops and bottoms have NULL `hemLength`.
- Filtering by **any** `sleeveLength` value excludes bottoms, because bottoms have NULL `sleeveLength`.
- A user who checks every `hemLength` box expecting "all products" instead sees only dresses — and if they combine it with a tops-only category selection, they get zero results.

## Decision

v1 ships with strict `in` semantics.

Rationale: it is the simplest implementation, consistent with SQL semantics, matches Prisma's default `in` behavior, and introduces no special-case code paths. The accepted trade-off is the unintuitive "select all = empty results" UX when filtering across attribute-specific categories.

## Alternatives considered (and why deferred)

- **NULL-inclusive filtering** — rejected. Making `?hemLength=midi` return both midi-hemmed *and* no-hem products would weaken every individual filter: a filter that also returns rows where the attribute is unknown is barely a filter. This degrades the core value proposition (precise modesty filtering), so it is not deferred — it is rejected outright.
- **Conditional filter UI by selected category** — deferred to v2. Showing only the filter groups relevant to the selected category (e.g., hide `hemLength` unless a hem-bearing category is in scope) removes the surprise entirely, but requires a DB query for "available filters per category" and meaningful UI-state complexity.
- **"Include unspecified" toggle per filter group** — deferred to v2. A per-group opt-in that widens a filter to also match NULL is explicit and powerful, but adds UI surface and additional client state to manage.

## Future direction

v2 should adopt one of the deferred alternatives above. The conditional-UI-by-category approach is most likely the correct long-term direction: it eliminates the mismatch at its source (don't offer a filter that can't apply) rather than papering over it with NULL-inclusion or extra toggles.
