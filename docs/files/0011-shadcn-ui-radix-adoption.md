# ADR 0011: shadcn/ui + Radix UI Adoption

- Status: Accepted
- Date: 2026-05-17
- Implements: e85b3cb (collapsible filter sections + mobile drawer per ADR-0010 v2)
- Cross-reference: ADR-0010 (filter UI scaling — this is its v2 component layer), ADR-0001 (Next.js App Router), Tailwind v4 (already in stack)

## Context

ADR-0010 v2 required accessible interactive components: a drawer for mobile filters and collapsible sections for the desktop sidebar. The options space: build from scratch, use a styled component library (MUI, Chakra, Mantine), use headless primitives directly (Radix, Base UI), or use shadcn/ui as a thin styled wrapper over Radix.

## Decision

Adopted shadcn/ui with the **New York** style (Radix-based primitives). Three commitments:

1. Components live as **owned source** in `components/ui/` — not a runtime dependency.
2. **Radix UI** is the underlying accessibility/behavior layer (keyboard nav, focus management, ARIA).
3. **Tailwind v4 with CSS variables** drives theming.

## Rationale

- The "you own the code" model fits this project's documentation discipline — architecture stays in the repo, not abstracted into a dependency.
- Radix is the most established accessible-primitives library in React: keyboard navigation, focus management, and ARIA out of the box.
- New York style was chosen over the v4 default `base-nova`: portfolio recognizability (Radix has broader ecosystem vocabulary than Base UI), and `base-nova` adds `@import "shadcn/tailwind.css"` which makes shadcn a *runtime* dependency — directly walking back the "I own the code" model the choice was made for.
- Tailwind v4 was already in the stack; CSS variables enable theming without per-component edits.

## Reconciliation work

Making shadcn coexist with the project's prior decisions required:

- **globals.css overwrite:** shadcn's `.dark` class strategy was migrated into the project's existing `@media (prefers-color-scheme: dark)` block, preserving auto-dark-mode behavior. This deviates from shadcn's standard pattern but avoids a visible regression on the live demo.
- **Geist font fix:** shadcn's `--font-sans: var(--font-sans)` circular reference (broken under Tailwind v4's parse-time `@theme inline`) replaced with literal font names.
- **Removed `@import "shadcn/tailwind.css"`** — a `base-nova` default that would have made shadcn a runtime dependency.
- **Cleaned up `@base-ui/react` and the `shadcn` npm packages** — `base-nova` leftovers after switching to New York.

## Trade-offs acknowledged

- Adds ~6 dependencies: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`.
- Owned source surface expanded: `components/ui/{accordion,sheet,button}.tsx` now live in the repo as project code, not a library.
- Dark-mode strategy is non-standard for the shadcn ecosystem (media query, not `.dark` class); shadcn tutorials assuming the class strategy must be adapted.
- shadcn CLI v4 removed flags (`--style`, `--base-color`, `--css-variables`); future updates may require manual `components.json` edits.

## Alternatives considered

- **Build accessible primitives from scratch** — rejected. Accessibility is hard to get right; established libraries solve this.
- **Use Radix UI directly without shadcn** — rejected. Loses the styled-with-Tailwind defaults; more setup per component.
- **Material-UI / Chakra / Mantine** — rejected. Full component libraries impose design constraints; shadcn's "unstyled defaults you override" is more flexible.
- **`base-nova` style** — a defensible alternative, not strictly inferior. New York was chosen for the reasons above, but this was closer to a 51/49 call than the surrounding deliberation might suggest; both would have worked.

## Future direction

- Phase 5 design polish (deferred from e85b3cb): restrained accordion styling, a substantial mobile Filter button, ideally with the `frontend-design` plugin active.
- As more components are needed (Dialog, Toast, Select, etc.), continue the `shadcn add` pattern.
- When shadcn CLI v5+ ships, evaluate breaking changes and migrate consciously.
