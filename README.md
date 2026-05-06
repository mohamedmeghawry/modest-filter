# modest-filter

> A mobile-first web app that helps Muslim women find modest dresses, abayas, and tops from mainstream brands by filtering on AI-extracted clothing attributes.

**Status:** in development.

## The problem

Muslim women who want to dress modestly while shopping at mainstream clothing brands face a recurring frustration. Brands like Aritzia, Everlane, Anthropologie, Reformation, and Banana Republic carry a wide range of styles, but their sites have no filters for the attributes that determine modesty: sleeve length, neckline, hem length, fit, and opacity. The user has to scroll through hundreds of products and manually check each one — repetitive, exhausting, and often abandoned before finding something suitable.

Modest-specific platforms exist, but they carry only modest-niche brands. They don't solve "I want a modest piece from Aritzia."

## The solution

modest-filter ingests product catalogues from selected mainstream brands, uses AI vision models to extract objective clothing attributes for every item, and lets users filter the entire catalogue using their own modesty criteria. Users browse, filter, find pieces that meet their personal standards, and click through to the brand's site to purchase.

The core insight: the AI does not judge whether something is modest. It extracts objective attributes (sleeve length, neckline shape, hem length, fit, opacity), and the user defines what modesty means to them.

## v1 scope

- Mobile-first responsive web app
- 3–5 hand-picked mainstream brands, sourced via affiliate networks
- 3 product categories: dresses, abayas, tops
- Women's clothing only
- AI-extracted attributes per product: sleeve length, neckline shape, hem length, fit, opacity
- Filter UI where the user sets their own thresholds for each attribute
- Product listing with image, brand, name, and price
- Click-through to the brand's site via affiliate link

## Tech stack

- **Language:** TypeScript
- **Framework:** Next.js (App Router) with React
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes
- **Database:** PostgreSQL on Supabase
- **ORM:** Prisma
- **AI tagging:** Claude Vision API (Anthropic)
- **Hosting:** Vercel
- **CI:** GitHub Actions

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Architectural decisions

Design rationale lives as ADRs in [`docs/files/`](docs/files/). Read the relevant ADR before proposing changes to the stack, data flow, or security model.
