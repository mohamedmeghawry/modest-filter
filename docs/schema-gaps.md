# Schema Gaps (parked)

Objective-attribute gaps surfaced while sourcing and tagging the evaluation set. These are **parked, not decided** — the plan is to resolve them together in a single "schema evolution from eval sourcing" ADR rather than bolt fields on one at a time (which would strain the filter UI, see ADR-0010, and the launch timeline).

**Guiding principle for any fix:** refine by *objective* dimensions, never subjective severity. The product thesis (`docs/files/project-brief.md`) is "do not have AI judge modesty — extract objective attributes and let the user decide." So cutouts and slits gain *location* (objective), not a "revealing" score (subjective).

| # | Gap | What's missing | Surfaced by | Proposed shape | Status |
|---|-----|----------------|-------------|----------------|--------|
| 1 | **`cowl` neckline** | The `Neckline` enum has no value for a cowl (draped) neckline. | Reformation Casette silk dress ("high cowl neckline") during eval sourcing. | Add `cowl` to `Neckline`. Highest-confidence gap — a clearly missing value, like `collar` was before ADR-0012 added it. | Parked |
| 2 | **`cutouts` location** | `cutouts` is binary (`none`/`present`); it can't separate a modest neck keyhole from a bare-midriff cutout, yet location is what drives the modesty decision. | Keyhole discussion during eval tagging. | Refine to location, e.g. `none \| keyhole \| shoulder \| waist \| side \| back \| other`. Objective, not severity. | Parked |
| 3 | **`slit` location** | `slit` captures height (`low`/`mid`/`high`) but not *where*. At the revealing end a high *back* slit and a high *side/front* slit differ sharply in modesty. | Back-slit case in eval review (a back walking-slit). For v1, height-only is acceptable; convention now says location does not change the height tag. | Add a slit-location dimension, mirroring the cutouts fix. | Parked |
| 4 | **`stretch` attribute** | No attribute captures whether the fabric stretches/clings. A clingy stretch fabric reveals shape independent of cut, which `fit` alone can miss (e.g. a loose-cut stretchy knit). | "Stretch jersey fabric" descriptions during sourcing. | Add `Stretch { non_stretch, stretch }`, description-derived (elastane/spandex/jersey). Add only if users genuinely filter on it (curation-lead call). | Parked |
| 5 | **`backStyle` granularity** | No value for a very-low / extreme open back (open down to under the armpit). `low_back` undersells it; `open_back` is overloaded for everything from a moderate to an extreme opening. | The striped-halter top in eval review (back open to under the armpit). Tagging convention says use `open_back` as the closest value meanwhile. | Either add a more extreme value or re-scale back-openness; resolve together with the openings work above. | Parked |

## How these were found

Items 1 and 4 came from **sourcing** (reading real product descriptions); items 2, 3, and 5 came from **tagging and eval review** (hand-tagging real garments and comparing against the model). That split is itself the lesson: building a real evaluation set is what surfaces schema gaps that a synthetic or assumed catalogue never would.
