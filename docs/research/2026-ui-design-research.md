# 2026 UI/UX Design Research — mapped to modest-filter

**Date:** 2026-06-06
**Author:** design research pass (Claude)
**Scope:** Research-and-recommend only. No code, components, styles, or config were changed in this pass. This document is the single artifact.
**Grounding:** Recommendations are tied to the *actual* current UI read from the repo (browse `app/products/page.tsx`, filters `app/products/Filters.tsx` + `MobileFilters.tsx`, product view `app/products/[id]/page.tsx`, tokens `app/globals.css`), not generic web advice.

> **How to read the tags.** Industry-standard / safe vs. experimental / bet are kept separate so you can choose. Recommendations carry **confidence** (high/med/low), **effort** (S/M/L), and a **risk** note. Anything that pushes against our minimalist preference is flagged ⚠️. Nothing judged "minor" is silently dropped — low-value ideas are still listed so *you* filter them, not me.

---

## 1. Summary — highest-value takeaways

1. **Our biggest design lever isn't a trend — it's images.** For a *fashion/modesty* product, the garment photo is the product, yet the catalogue currently ships color-swatch placeholders (`h-44` colored `div`, no `<img>`). ADR-0012/0013 already concluded model-on photos are modesty-critical. Every 2026 source agrees: content-first, photography-led minimalism. The single highest-impact design move is shipping real images in fixed-aspect-ratio cards (and reserving that space *now* to avoid layout shift later). [Figma, DigitalSilk]

2. **We already own the 2026 stack; we're under-using it.** OKLCH tokens, Tailwind v4 `@theme`, variable fonts (Geist) via `next/font`, `prefers-color-scheme` dark mode — these *are* the current-and-credible baseline. The gap is execution: screens dim text with `opacity-60`/`opacity-80` and `border-black/10` instead of the semantic tokens (`--muted-foreground`, `--border`) already defined in `globals.css`. Switching to the tokens is the cheapest premium-up there is. [Lounge Lizard, Anctech]

3. **"Calm, content-first, anti-theatrics" is the mainstream direction — and it's exactly our taste.** 2026's dominant narrative is the *end of visual theatrics*: calmer micro-interactions, reduced cognitive load, accessibility-as-infrastructure. Minimalism is no longer a risk; it's the safe, credible default. We don't need to chase maximalism/gamification to look current. [Envato, Lollypop, Sanjay Dey]

4. **The filter is our known UX debt and the highest-ROI screen to polish.** Baymard: 78% of mobile e-commerce sites have poor/mediocre filtering, and 61% of users abandon if they can't find an item in ~5s. Three cheap, evidence-backed wins map straight onto ADR-0010/0008: **per-option result counts** ("Long (12)"), **active-filter chips above the grid**, and **color swatches instead of 14 color checkboxes**. Result counts also quietly defuse the ADR-0008 NULL-semantics gotcha. [Baymard, WisePIM, BTNG]

5. **Accessibility has hard 2026 floors we may currently miss.** WCAG 2.2 requires **24×24px minimum target size** (our checkboxes are `h-4 w-4` = 16px) and a **visible, contrast-compliant focus indicator**. EN 301 549 / the European Accessibility Act now lean on WCAG 2.2. These are checklist items, not taste calls. [W3C WAI, Level Access]

6. **Typography is the cheapest way to look intentional.** 2026's type story is fluid scaling via `clamp()`, stronger editorial hierarchy, and *one* confident display treatment. We can get most of the benefit with a fluid heading scale and tightened heading tracking — no new fonts required. Whether to add a distinctive (e.g. editorial serif) display face is a taste call, flagged in §6. [DesignMonks, The Inkorporated, Wix]

7. **Performance is a design constraint, not a cleanup step.** "Performance by design" is the 2026 framing: LCP < 2.5s, INP < 200ms, CLS < 0.1. For us this means *reserving image space to keep CLS ~0* and keeping the filter's URL-driven re-render snappy (INP) — both decided at design time, not retrofitted. [Core Web Vitals guide, Hyperspeed]

---

## 2. 2026 industry standards (safe / credible baseline)

### 2.1 Layout & composition
- **Content-first minimalism with generous whitespace** is the consensus. "Every element earns its place; nothing is there by accident." 84.6% of users prefer clean over cluttered layouts. [[DigitalSilk](https://www.digitalsilk.com/digital-trends/minimalist-web-design-trends/)] [[Figma](https://www.figma.com/resource-library/web-design-trends/)]
- **Whitespace is treated as an active element**, split into *micro* (line/paragraph/component gaps) and *macro* (section separation). Research cited: sparse, structured layouts raise *perceived* value by up to ~300%. [[Flux Academy](https://www.flux-academy.com/blog/the-importance-of-whitespace-in-design-with-examples)]
- **Bento grids** (modular, self-contained tiles) are now a mainstream, not experimental, layout for marketing/landing surfaces. [[WriterDock](https://writerdock.in/blog/bento-grids-and-beyond-7-ui-trends-dominating-web-design-2026)]

*Fit for modest-filter:* Strong. Our restraint is already on-trend. Our product grid is conventional and correct; bento is relevant only for a future home/landing surface, not the catalogue.

### 2.2 Typography
- **Fluid type via `clamp()`** — smooth scaling between breakpoints in one declaration (e.g. 48px→96px headline) instead of stepped jumps. Now standard. [[DesignMonks](https://www.designmonks.co/blog/typography-trends-2026)] [[Naturaily](https://naturaily.com/blog/web-design-trends)]
- **Variable fonts** as the default — one file, many weights/widths, optionally animated. (We already load Geist, a variable family.) [[The Inkorporated](https://www.theinkorporated.com/insights/future-of-typography/)]
- **Stronger editorial hierarchy / expressive headlines** — type as the hero, "moving beyond legibility into storytelling." [[Wix](https://www.wix.com/wixel/resources/typography-trends)] [[Figma](https://www.figma.com/resource-library/web-design-trends/)]
- **Microtypography discipline** separates premium from generic: body line-height ~1.4–1.6, slightly *tightened* tracking on headings, comfortable default tracking on body. [[Immehedy](https://immehedy.com/minimalism-and-typography/)] [[Re-Thinking The Future](https://www.re-thinkingthefuture.com/architectural-community/a10891-minimalist-typography-exploring-the-effectiveness-of-simplicity-in-communication/)]

*Fit:* Strong and cheap. We currently lean on a flat scale (`text-xs/sm/base/lg/2xl/3xl`) with little intentional rhythm. Fluid headings + deliberate tracking is high-leverage, low-risk.

### 2.3 Color
- **Earthy, muted, nature-derived palettes** dominate: terracotta, sage, ochre, clay, stone, with sharp digital accents (e.g. muted olive + electric coral CTA). [[Lounge Lizard](https://www.loungelizard.com/blog/web-design-color-trends/)] [[Wix](https://www.wix.com/blog/website-color-trends)]
- **Pantone 2026:** *Cloud Dancer* (soft airy white — "reset/clarity/calm") and *Mocha Mousse* (earthy brown, "quiet sophistication"). [[VistaPrint](https://www.vistaprint.com/hub/color-trends)] [[ColorPsychology](https://www.colorpsychology.org/blog/color-trends-for-2026/)]
- **Tonal design** (multiple shades/tints of one hue, post-Material-3) is "everywhere" in 2026. [[Lounge Lizard](https://www.loungelizard.com/blog/web-design-color-trends/)]
- **Color as a system, not a palette** — adapts across light/dark, supports accessibility, renders well on OLED. OKLCH is the implementation people reach for. (We already use OKLCH.) [[Lounge Lizard](https://www.loungelizard.com/blog/web-design-color-trends/)]

*Fit:* Mixed / taste-dependent. We are currently *fully achromatic* (neutral OKLCH grays only — no brand hue, no accent). That reads clean but also slightly generic/unfinished. A single restrained earthy accent would be both on-trend *and* thematically apt for modest fashion — but it's a taste call (see §6).

### 2.4 Motion
- **Purpose over decoration:** "If it doesn't clarify, guide, or confirm — skip it." Micro-interactions 200–500ms. [[Primotech](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/)] [[CourseUX](https://courseux.com/ui-animations/)]
- **`prefers-reduced-motion` is mandatory**, with motion never the *only* channel for critical info. [[Medium / Rythm](https://medium.com/@Rythmuxdesigner/motion-microinteraction-trends-from-subtle-to-delightful-262f6ed360a7)]
- **Calm micro-interactions are replacing gamification** in the minimalist camp. [[Envato](https://elements.envato.com/learn/ux-ui-design-trends)]

*Fit:* Strong. Our motion is already minimal (Radix + `tw-animate-css`, opacity/transform transitions, no framer-motion). The gap is that we don't yet honor `prefers-reduced-motion` explicitly, and a couple of small confirmations (filter applied, image load fade) would *add* clarity without betraying restraint.

### 2.5 Accessibility (hard requirements, not trends)
- **Target size ≥ 24×24 CSS px** (WCAG 2.2 SC 2.5.8); undersized targets need 24px non-overlapping spacing. [[W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)]
- **Focus visible + not obscured + sufficient appearance** (SC 2.4.11 / 2.4.13): focus indicator ≥ a 2px perimeter, ≥ 3:1 contrast against the unfocused state, and never fully hidden. [[Deque](https://dequeuniversity.com/resources/wcag-2.2/)] [[Level Access](https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/)]
- **Accessibility-as-infrastructure:** high-contrast, keyboard nav, reduced motion, clear language built in from the start. EN 301 549 / EAA lean on WCAG 2.2; WCAG 3.0 is in working draft (March 2026) with ~174 outcomes — *direction*, not yet required. [[W3C WAI](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)] [[AdaQuickScan](https://adaquickscan.com/blog/wcag-3-working-draft-march-2026-174-outcomes)]

*Fit:* Mandatory. Two concrete gaps today: checkbox targets are 16px (`h-4 w-4`), and our pervasive `opacity-60` text risks falling below 4.5:1 contrast (and *will* on top of images later). Radix gives us a baseline focus ring; we should confirm it meets 2.4.13.

### 2.6 Mobile-first patterns (e-commerce filtering)
- **78% of mobile e-commerce filtering is poor/mediocre** (Baymard); 61% abandon if they can't find an item in ~5s. [[BTNG](https://www.btng.studio/articles/top-ecommerce-ux-filter-design-patterns-practical-tips-for-2025/)]
- **Mobile filters live in a drawer/modal** (we do this — `Sheet`), but should use an **explicit "Show X Results" apply button** because live updates mid-selection feel like disorienting refreshes. [[Baymard](https://baymard.com/learn/ecommerce-filter-ui)] [[WisePIM](https://wisepim.com/blog/ecommerce-product-filters-ux-best-practices)]
- **Active-filter chips above the grid** (removable pills), visible without opening the panel — "20% of sites fail" to keep applied filters visible. [[Baymard](https://baymard.com/learn/ecommerce-filter-ui)]
- **Per-option result counts** ("Blue (34)") — "one of the single highest-impact improvements"; prevents dead-ends. [[Baymard](https://baymard.com/learn/ecommerce-filter-ui)]
- **Plain customer language for labels**; 40% of mobile stores use unclear labels and users skip them. [[Baymard](https://baymard.com/learn/ecommerce-filter-ui)]
- **OR within a facet, AND across facets** is the expected logic (red OR blue) AND medium. [[BTNG](https://www.btng.studio/articles/top-ecommerce-ux-filter-design-patterns-practical-tips-for-2025/)]
- **44px tap target for the close/X**, sticky filter button while scrolling. [[BTNG](https://www.btng.studio/articles/top-ecommerce-ux-filter-design-patterns-practical-tips-for-2025/)]
- **Avoid choice overload:** surface the 5–10 most relevant attributes per category; collapse the rest. [[Baymard](https://baymard.com/learn/ecommerce-filter-ui)]

*Fit:* This is the bullseye for us — it's literally ADR-0010's open debt and ADR-0008's gotcha. Note our current filter logic already matches the OR-within/AND-across expectation (Prisma `in` per group, ANDed across groups). The misses are: no apply button on mobile (we update instantly via `router.replace`), no chips, no counts, 14 color checkboxes.

### 2.7 Performance-as-design
- **"Performance by design"** — make speed decisions up front, not after. [[SEO-Marketing Köln](https://seo-marketing.koeln/en/core-web-vitals-and-conversion-optimized-web-design-best-practices-for-2026/)]
- **Thresholds:** LCP < 2.5s, INP < 200ms, CLS < 0.1. INP is now the most-failed vital (43% of sites fail). Any main-thread task > 50ms hurts INP. [[Core Web Vitals guide](https://innovisionbiz.com/core-web-vitals-guide/)] [[corewebvitals.io](https://www.corewebvitals.io/core-web-vitals)]

*Fit:* Strong and forward-looking. The design decision that matters *now*: lock card/image aspect ratios so that when real images replace swatches, CLS stays ~0. Minimalism is itself a performance asset (less to paint, fewer scripts) — the Anctech/DigitalSilk sources explicitly tie clean UI to speed. [[Anctech](https://www.anctech.in/blog/explore-how-minimalist-ui-design-in-2026-focuses-on-performance-accessibility-and-content-clarity-learn-how-clean-interfaces-subtle-interactions-and-data-driven-layouts-create-better-user-experie/)]

---

## 3. Experimental / creative directions (each tagged for us)

> These are bets, not baselines. Tag = our verdict, not the industry's.

| Direction | What it is | Verdict for modest-filter | Why |
|---|---|---|---|
| **Per-option result counts** | "Long (12)" beside each filter value | **adopt** | Technically a "standard" (§2.6) but novel *for us*; highest-ROI, defuses ADR-0008. High confidence. |
| **Color swatch grid** (replace 14 color checkboxes) | Tappable color chips using existing `COLOR_HEX` | **adopt** | On-brand, on-trend (tonal/visual), already half-built (`lib/products/display.ts`). ADR-0010 explicitly suggests it. |
| **Earthy single accent color** | One restrained warm/clay accent on CTAs, active states | **watch** ⚠️ | On-trend & thematically apt, but pushes against our achromatic restraint. Taste call (§6). |
| **Fluid type (`clamp()`) + editorial heading** | Smooth-scaling headline scale | **adopt** | Cheap, low-risk, makes us look intentional. |
| **Distinctive display/serif heading face** | A characterful face for H1/product names | **watch** ⚠️ | Could give a fashion-editorial signature, but Geist-only is safe and fast. Taste call (§6). |
| **Scroll-driven animation** (CSS or GSAP) | Animate on scroll for storytelling | **skip** (catalogue), **watch** (future landing) | Wrong for a utilitarian browse/filter flow; fine for a future marketing page. [[Line25](https://line25.com/articles/web-design-trends-2026/)] |
| **Bento grid** | Modular tile layout | **watch** (home only) | Not for the product grid; could shape a future home/about surface. [[WriterDock](https://writerdock.in/blog/bento-grids-and-beyond-7-ui-trends-dominating-web-design-2026)] |
| **Glassmorphism** (blur/opacity surfaces) | Frosted cards/nav | **skip** ⚠️ | Adds visual noise + contrast risk; contradicts our calm restraint. [[ScenicIT](https://www.scenicitsolutions.com/blogs/minimalist-web-design.html)] |
| **Brutalism / anti-grid** | Raw, harsh, monospace, clashing | **skip** | Off-brand for a calm, trust-signaling modesty product. [[Fireart](https://fireart.studio/blog/the-best-web-design-trends/)] |
| **Maximalism / gamification** | Dense, saturated, points/badges | **skip** | Directly opposes our minimalism; Figma lists it but as a *counter*-trend. [[Figma](https://www.figma.com/resource-library/web-design-trends/)] |
| **Spatial depth / layering** | Subtle z-depth, soft shadows, parallax | **watch** | A *whisper* of depth (one soft shadow tier on cards/sheet) can lift perceived quality without breaking flat minimalism. [[Tenet](https://www.wearetenet.com/blog/ui-ux-design-trends)] |
| **Kinetic typography / type collage** | Animated/collaged letterforms | **skip** | Decorative; wrong for a functional catalogue. [[Kittl](https://www.kittl.com/blogs/type-collage-design-stl/)] |
| **3D / WebGL / AR preview** | Interactive models, AR try-on | **skip** (v1), **watch** (far future) | Heavy, off-scope, perf-hostile for a hobby budget. [[Figma](https://www.figma.com/resource-library/web-design-trends/)] |
| **AI-assisted / conversational filtering** | Natural-language "show me long-sleeve floor-length opaque" | **watch** | 2026 e-commerce is moving to vector/RAG search; aligns with our Claude usage but is a v2+ bet. [[BrokenRubik](https://www.brokenrubik.com/blog/faceted-search-best-practices)] |
| **"Show more" truncation on long facets** | Collapse long value lists | **adopt** (small) | ADR-0010 option #3; pairs with swatches & counts. |

---

## 4. What makes minimalist design *stand out* (concrete techniques)

Generic minimalism = defaults left untouched. Premium minimalism = every micro-decision is deliberate. [[Immehedy](https://immehedy.com/minimalism-and-typography/)] The following are specific, named techniques with a place to put them on our screens.

1. **Intentional muted tokens instead of opacity-dimming.** Replace `opacity-60`/`opacity-80` text with `text-muted-foreground` (already defined). Opacity dimming is uncontrolled — it varies with whatever's behind it and *will* fail contrast over future product images; a token is a single, testable value. *Where:* brand label, price-secondary text, filter labels, the `<dl>` term labels on the product page. **This is the #1 generic→premium move available to us, and it's nearly free.**

2. **Optical spacing rhythm, not a flat gap.** We use `gap-2/4/8` somewhat interchangeably. Premium feel comes from a consistent vertical rhythm and *macro* whitespace between sections vs. *micro* gaps within a card. [[Flux Academy](https://www.flux-academy.com/blog/the-importance-of-whitespace-in-design-with-examples)] *Where:* increase breathing room between the product grid and the page heading; tighten intra-card gaps so name/price/badges read as one unit.

3. **Tightened heading tracking + fluid scale.** Slightly negative letter-spacing on H1/H2 and a `clamp()` scale reads as designed, not default. [[Re-Thinking The Future](https://www.re-thinkingthefuture.com/architectural-community/a10891-minimalist-typography-exploring-the-effectiveness-of-simplicity-in-communication/)] *Where:* "Products" H1, product name on the detail page.

4. **Tabular/aligned numerals for price.** Use `font-variant-numeric: tabular-nums` so prices align in the grid. A tiny detail that signals craft. *Where:* price in card + detail.

5. **One confident accent used sparingly, or none at all — but decide it.** The standout isn't *having* an accent; it's the *discipline* of where it appears (active filter, focus ring, primary CTA) vs. everywhere. Right now we have *no* accent and *no* explicit decision — which reads as unfinished rather than restrained. *Where:* active-filter chip, "View on [brand]" CTA, focus state. (Taste call — §6.)

6. **Color chips as content, not controls.** Turning the 14-color checkbox list into a swatch grid is the rare move that is *simultaneously* more minimal (less text, less height), more on-trend, and more usable. [[Baymard](https://baymard.com/learn/ecommerce-filter-ui)] *Where:* Primary Color filter group.

7. **A single soft elevation tier.** One restrained shadow on cards-on-hover and the mobile `Sheet` adds the 2026 "whisper of depth" without abandoning flatness. [[Tenet](https://www.wearetenet.com/blog/ui-ux-design-trends)] *Where:* product card hover (currently only `opacity-90`), filter drawer.

8. **Empty/zero-result states with a way forward.** Our empty state is a single muted sentence. Premium minimalism turns dead-ends into next steps ("No matches — clear *Material* to see 23 more"). Pairs perfectly with result counts. *Where:* products grid empty state.

9. **Image-load grace.** When real images land: lock aspect ratio (no CLS), fade in on load, use a low-key neutral placeholder (the swatch color is actually a *great* blur-up placeholder — keep it as the backdrop). *Where:* card + detail image.

10. **Consistent iconography restraint.** We currently use only chevron + X. Keep it that way; if icons grow, one stroke weight and one set. Inconsistent icons are a classic generic tell.

---

## 5. Recommendations for modest-filter (prioritized)

Ordered by value ÷ effort. Each maps to a real screen and is checked against our minimalist taste.

| # | Recommendation | Screen / file | Confidence | Effort | Risk | Minimalist check |
|---|---|---|---|---|---|---|
| 1 | **Swap `opacity-60/80` text for `text-muted-foreground`; audit contrast to 4.5:1** | All three (`page.tsx`, `Filters.tsx`, `[id]/page.tsx`) | **High** | **S** | Very low | ✅ Pure refinement, removes a code smell |
| 2 | **Bump checkbox/label targets to ≥24px; verify focus indicator meets WCAG 2.2 (2.4.13)** | `Filters.tsx` | **High** | **S** | Low | ✅ Invisible, compliance-driven |
| 3 | **Per-option result counts** ("Long (12)") | `Filters.tsx` + `lib/data/products.ts` (needs facet counts) | **High** | **M** | Med (extra query/aggregation) | ✅ Adds clarity, not clutter; defuses ADR-0008 |
| 4 | **Active-filter chips above the grid** (removable) | `app/products/page.tsx` (new region) | **High** | **M** | Low | ✅ Replaces "where did my filters go?" with one tidy row |
| 5 | **Color filter → swatch grid** (reuse `COLOR_HEX`) | `Filters.tsx` + `lib/products/display.ts` | **High** | **M** | Low | ✅ *More* minimal (less text/height) + on-trend |
| 6 | **Reserve image aspect ratio in cards now** (e.g. `aspect-[3/4]`), keep swatch as placeholder backdrop | `page.tsx`, `[id]/page.tsx` | **High** | **S** | Low | ✅ Prevents future CLS; design decision made early |
| 7 | **Fluid type scale (`clamp()`) + tightened heading tracking + tabular price** | tokens in `globals.css`, used on headings/price | **Med-High** | **S–M** | Low | ✅ Looks intentional, adds nothing visible-but-noisy |
| 8 | **Honor `prefers-reduced-motion`** explicitly; add a quiet "filter applied" confirmation | `globals.css` + filter components | **Med** | **S** | Low | ✅ Calm-motion aligned |
| 9 | **Mobile "Show X results" apply button** (instead of live `router.replace` per tap) | `MobileFilters.tsx` | **Med** | **M** | Med ⚠️ — only worth it if catalogue/latency grows; live updates may be fine at small scale | ⚠️ Slightly more chrome; judgment call on scale |
| 10 | **Better empty/zero-result state** with a "clear X to see N more" path | `page.tsx` | **Med** | **S** | Low | ✅ |
| 11 | **One soft elevation tier** on card hover + `Sheet` | `page.tsx`, `sheet.tsx` usage | **Med** | **S** | Low | ✅ Whisper of depth |
| 12 | **"Show more" truncation on long facets** (Material, Color before swatch) | `Filters.tsx` | **Med** | **S** | Low | ✅ ADR-0010 option |
| 13 | **Single earthy accent color** (active state / CTA / focus) | `globals.css` tokens | **Low–Med** | **S** | Med ⚠️ pushes against achromatic restraint | ⚠️ Taste call — §6 |
| 14 | **Distinctive display/serif heading face** | `layout.tsx` + tokens | **Low** | **M** | Med ⚠️ adds a font, perf + taste cost | ⚠️ Taste call — §6 |
| 15 | **Progressive disclosure: show only category-relevant filters** (hide `hemLength` when not viewing dresses) | `Filters.tsx` + filter config | **Low–Med** | **L** | Med (logic complexity) | ✅ Reduces overload, but more code; ADR-0010 option #2 |

**Sequencing suggestion (fits 60–90 min sessions):** Session A = #1, #2, #6 (pure refinement + compliance, all S). Session B = #5 + #4 (swatches + chips, visible win). Session C = #3 (result counts, the one with a data-layer change). Everything after is optional polish gated on your taste calls in §6.

---

## 6. Open questions for Mohamed (taste calls)

1. **Accent color: stay achromatic, or introduce one earthy accent?** 2026 trend + modesty theme both favor a single warm/clay accent (e.g. a Mocha-Mousse-adjacent token) on active states/CTAs/focus. The counter-argument is that pure neutral is the cleaner, safer signature. *I won't decide this for you — it's the central identity call.* (Affects #5, #11, #13.)

2. **Headings: keep Geist everywhere, or add a display face?** A fashion-editorial serif for H1/product names could give a memorable signature; Geist-only is faster and safer. (Affects #7, #14.)

3. **Mobile filter: live updates vs. explicit "Apply"?** Baymard recommends an apply button on mobile, but that assumes large catalogues / slow updates. At our current scale live `router.replace` may feel better. Pick based on how big the catalogue will realistically get. (Affects #9.)

4. **Result counts: worth the extra query cost?** Per-option counts are high-impact UX but require facet aggregation in `lib/data/products.ts` (an extra grouped query or count-per-option). Fine for our scale, but it's a real data-layer addition — confirm you want it before #3. (Affects #3.)

5. **Progressive disclosure of filters by category** (#15) is the most "correct" fix for choice overload but also the most code. Worth it, or do counts + swatches + accordion already get us "good enough" for v1? (ADR-0010 left this open.)

6. **Dark mode: keep auto-only, or add a toggle?** We use `prefers-color-scheme` with no toggle (ADR-0011). 2026 sources treat user-controllable dark mode as increasingly expected, but a toggle is extra chrome + state. Leave as-is, or add later?

7. **Do any of these merit ADRs?** Result counts and progressive disclosure both modify the data/filter contract and intersect ADR-0008/0010 — they may deserve a short ADR rather than a silent change, per our "document decisions as they're made" rule.

---

## 7. Sources

**Trends & minimalism (general)**
- Figma — Web Design Trends 2026: https://www.figma.com/resource-library/web-design-trends/
- DigitalSilk — Top 10 Minimalist Web Design Trends 2026: https://www.digitalsilk.com/digital-trends/minimalist-web-design-trends/
- Envato — UX/UI trends 2026: calm interfaces, end of visual theatrics: https://elements.envato.com/learn/ux-ui-design-trends
- Lollypop — Top UI Trends 2026: https://lollypop.design/blog/2026/february/top-ui-trends-2026/
- Sanjay Dey — Biggest UX/UI Design Trends 2026 (data-backed): https://www.sanjaydey.com/ux-ui-design-trends-2026-biggest/
- Anctech — Minimalist UI 2026 (performance/accessibility/clarity): https://www.anctech.in/blog/explore-how-minimalist-ui-design-in-2026-focuses-on-performance-accessibility-and-content-clarity-learn-how-clean-interfaces-subtle-interactions-and-data-driven-layouts-create-better-user-experie/
- Scenic IT — Minimalist Web Design 2026 (glassmorphism): https://www.scenicitsolutions.com/blogs/minimalist-web-design.html
- We Are Tenet — 15 UI/UX Design Trends 2026 (spatial/depth): https://www.wearetenet.com/blog/ui-ux-design-trends
- Line25 — Web Design Trends 2026 (scroll-driven): https://line25.com/articles/web-design-trends-2026/
- WriterDock — Bento Grids & Beyond: https://writerdock.in/blog/bento-grids-and-beyond-7-ui-trends-dominating-web-design-2026
- Fireart — Tactile Brutalism & Invisible Architecture: https://fireart.studio/blog/the-best-web-design-trends/

**Typography**
- DesignMonks — Typography Trends 2026: https://www.designmonks.co/blog/typography-trends-2026
- The Inkorporated — Variable Fonts, Kinetic Text: https://www.theinkorporated.com/insights/future-of-typography/
- Wix — Biggest Typography Trends 2026: https://www.wix.com/wixel/resources/typography-trends
- Kittl — Type Collage: https://www.kittl.com/blogs/type-collage-design-stl/
- Naturaily — Web Design Trends (fluid type): https://naturaily.com/blog/web-design-trends
- Immehedy — Minimalism and Typography: https://immehedy.com/minimalism-and-typography/
- Re-Thinking The Future — Minimalist typography: https://www.re-thinkingthefuture.com/architectural-community/a10891-minimalist-typography-exploring-the-effectiveness-of-simplicity-in-communication/

**Color**
- Lounge Lizard — 2026 Color Trends: https://www.loungelizard.com/blog/web-design-color-trends/
- Wix — Website color trends 2026: https://www.wix.com/blog/website-color-trends
- VistaPrint — Color Trends 2026: https://www.vistaprint.com/hub/color-trends
- ColorPsychology — 2026 Color Trends: https://www.colorpsychology.org/blog/color-trends-for-2026/

**Motion**
- Primotech — Micro-Interactions & Motion 2026: https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/
- CourseUX — UI Animations 2026: https://courseux.com/ui-animations/
- Medium / Rythm — Motion & Microinteraction Trends: https://medium.com/@Rythmuxdesigner/motion-microinteraction-trends-from-subtle-to-delightful-262f6ed360a7

**Accessibility**
- W3C WAI — What's New in WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- W3C — Understanding SC 2.5.8 Target Size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Deque University — WCAG 2.2 Updates: https://dequeuniversity.com/resources/wcag-2.2/
- Level Access — WCAG 2.2 Checklist 2026: https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/
- AdaQuickScan — WCAG 3.0 working draft (Mar 2026): https://adaquickscan.com/blog/wcag-3-working-draft-march-2026-174-outcomes

**E-commerce filtering**
- Baymard — Ecommerce Filter UI: https://baymard.com/learn/ecommerce-filter-ui
- BTNG.studio — Filter Design Patterns 2026: https://www.btng.studio/articles/top-ecommerce-ux-filter-design-patterns-practical-tips-for-2025/
- WisePIM — Product Filters UX Best Practices: https://wisepim.com/blog/ecommerce-product-filters-ux-best-practices
- BrokenRubik — Faceted Search Best Practices 2026: https://www.brokenrubik.com/blog/faceted-search-best-practices

**Performance**
- InnoVision — Core Web Vitals 2026 Guide: https://innovisionbiz.com/core-web-vitals-guide/
- corewebvitals.io — LCP/INP/CLS: https://www.corewebvitals.io/core-web-vitals
- Hyperspeed — Core Web Vitals 2026 changes: https://hyperspeed.me/blog/core-web-vitals-2026-what-changed/
- SEO-Marketing Köln — CWV & conversion-optimized design: https://seo-marketing.koeln/en/core-web-vitals-and-conversion-optimized-web-design-best-practices-for-2026/

**Whitespace**
- Flux Academy — Importance of whitespace: https://www.flux-academy.com/blog/the-importance-of-whitespace-in-design-with-examples
