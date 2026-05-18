# ADR 0010: Filter UI Scaling

- Status: Accepted
- Date: 2026-05-17
- Implements: cedd8f6 (material / primaryColor / topLength filter extension)
- Cross-reference: ADR-0008 (filter NULL semantics — progressive disclosure ties to it), ADR-0007 (the attribute schema that defines the option space)

## Context

Extending the filter UI with `material`, `primaryColor`, and `topLength` brought the sidebar to 7 filter groups and roughly 50 total checkboxes — Material (12), Primary Color (14), Top Length (5), on top of the original Category (3), Sleeve Length (7), Hem Length (5), and Opacity (3). Verified visually on production after the extension shipped: the filter sidebar now exceeds the height of the product grid on desktop, and the imbalance grows with every attribute added.

This is not a defect in the parser, the data layer, or the URL contract — all of which are tested and correct. It is a product/UX problem that only became visible at scale.

## Problem

Three distinct concerns, named explicitly so they can be addressed independently:

- **Choice paralysis (Hick's Law).** Decision time grows logarithmically with the number of visible options. Fourteen colors presented as a flat checkbox list is decision-debilitating, not empowering — the UI offers control the user cannot efficiently exercise.
- **Cognitive load.** Users scan; they do not read. A wall of unchecked checkboxes communicates "this is going to be work" before any filtering value has been realized. The interface signals effort up front and payoff never.
- **Mobile reality.** On a phone, the current sidebar is a vertical scroll of ~50 checkboxes before the first product is even visible. The sidebar-plus-grid layout does not translate to mobile at all without an explicit mobile-first redesign — and this is a mobile-first product.

## Decision

v1 ships the working-but-overwhelming filter UI as-is. The data path, URL contract, and filter correctness are solid; the UX surface is the gap. Documenting this as UX debt is more honest than rolling back working work or rushing a half-considered UX pass under feature pressure.

## Rationale

A working filter with bad UX is testable, criticizable, and improvable. A rolled-back filter is none of those. The functional layer — parser, data-access `where` builder, URL state, and the 49-test suite — is exactly what would be kept unchanged if the UI were redesigned tomorrow. The debt is isolated to the presentation layer, which is the cheapest layer to change and the one with zero downstream coupling.

## V2 plan

Concrete options to weigh, none preselected:

- **Collapsible filter sections.** Each group click-to-expand, collapsed by default. Native `<details>/<summary>` is the lightest implementation (zero dependencies); a Radix UI Accordion is the more designed, more controllable option.
- **Progressive disclosure by category.** Show only the filter groups relevant to the currently-selected category — directly ties to ADR-0008's NULL-semantics solution (don't offer a filter that can't apply), solving two documented problems with one mechanism.
- **"Show more" affordance.** Display the first N options per group with an expand link for long lists (Material, Primary Color).
- **Visual swatch chips for Primary Color.** Replace 14 checkboxes with a compact color grid built on `getSwatch`. Both more usable and more on-brand than a text list.
- **Mobile-first redesign.** On small viewports, filters live behind a "Filter" button that opens a drawer/modal — never stacked above the product grid.

## Principle

Powerful capabilities do not excuse hostile UX. A filter that respects how humans actually decide — scan first, choose few, iterate — is a stronger product than a filter that exposes every possible attribute at once. Exhaustive is not the same as usable; v2 should optimize for the decision the user is trying to make, not for the completeness of the attribute surface.

## Status update

v2 partially implemented in e85b3cb (2026-05-17): collapsible filter sections via Radix Accordion and a mobile drawer via Radix Sheet now shipped, per the structural redesign options in the original v2 plan (see ADR-0011 for the component-layer adoption). Design polish (restrained styling, substantial mobile button) and interactive browser verification of the redesign remain deferred. The structural debt this ADR documented is repaid; the aesthetic polish debt is now isolated and explicitly scoped for a fresh-eyes session.
