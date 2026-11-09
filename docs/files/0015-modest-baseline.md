# ADR 0015: A Modest Baseline Every Product Must Pass

- Status: Accepted
- Date: 2026-11-08
- Decided by: Mohamed (product owner), after seeing the first tagged demo catalogue on the private preview
- Changes: the project brief's "users define their own modesty thresholds via filters" (now: the site sets a minimum, and filters work within it). Builds on ADR-0007 (schema), ADR-0008 (filter semantics), ADR-0012 (tagging conventions)

## Context

The original idea was a neutral catalogue: show mainstream products and let each shopper filter to her own threshold. Seeing 25 real tagged products on the preview made the trade-off concrete. Half of them (sleeveless dresses, open backs, cut-outs) would never suit the target user, and making every visitor filter them out works against the site's promise. The site should reach modest shoppers by showing only items that are already modest-friendly.

## Decision

Every product the site shows must pass a **modest baseline**. Shoppers can't turn it off; filters only narrow within it.

| Rule | Passes | Fails |
|---|---|---|
| Sleeves | `long`, `extra_long` (wrist or longer) | everything shorter, including `three_quarter` |
| Back | `closed` | `scoop_back`, `v_back`, `low_back`, `open_back` |
| Cut-outs | `none` | `present` |
| Slit | `none`, `low` | `mid`, `high` |
| Neckline | any other | `off_shoulder`, `halter` |
| Tag status | `tagged` | `pending`, `failed`, `needs_review` |

**Unknown fails.** If a baseline attribute is null (the AI couldn't judge it, for example `backStyle` with no back photo), the product stays hidden until a human checks it. The only exception is `slit` on tops, where null means "not applicable".

**Amended 2026-11-09 (Mohamed):** a second exception, `neckline` on abayas. Abaya photos show the model in a hijab that covers the neck and chest, so the neckline can't be seen (the lab test hid 2 clearly modest abayas for this). The neckline rule only blocks off-shoulder and halter, which a long-sleeve abaya worn with a hijab can't realistically be. A neckline the AI does see must still pass. Dresses and tops keep the strict rule.

**Deliberately left to shoppers (filters, not baseline):** hem length and see-through (`opacity`, `sleeveOpacity`). People layer: a short dress over trousers, a sheer blouse over a camisole. Mohamed chose this explicitly on 2026-11-08.

## Implementation

- `lib/products/modest-baseline.ts`: `passesModestBaseline` (pure, tested) and `modestBaselineWhere` (the same rule as a Prisma filter).
- `lib/data/products.ts`: every list, facet count and product-by-id query is ANDed with the baseline. A product outside it returns 404 even by direct link.
- Test: on the 25 tagged demo products, exactly 12 pass (7 dresses, 5 tops), checked against the live demo database.

## Consequences

- **Catalogue yield:** about half of mainstream items fail. Collection should pre-screen by title ("sleeveless", "cami", "halter", "open back") before paying for AI tagging.
- **Tagging accuracy now decides visibility.** A wrong `backStyle` or `sleeveLength` either hides a good product or shows an immodest one. The second is worse, so the baseline attributes need the strictest checks: front and back photos (Mohamed's rule), and title/description disagreements routed to `needs_review` (`findDisagreements`).
- **The sleeve-length filter** now only distinguishes long from extra long. Keep or drop it in the next UI pass.
- **Production:** this ships on branch `demo-images` first. When it merges to `main`, kashfedit.com's made-up sample items will also be filtered by the baseline; check what remains before merging.

## Alternatives considered

- **Neutral catalogue with filters only** (the brief's original model). Rejected: shoppers see items that will never suit them, and the site's promise is weaker.
- **Baseline on sleeves and back only.** Rejected: it lets through cut-outs, high slits and halter necks.
- **Hem length and see-through in the baseline.** Rejected by Mohamed: layering makes them personal choices.
