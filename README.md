# modest-filter

> A mobile-first web app that helps Muslim women find modest clothing from mainstream brands (Aritzia, Everlane, and others) by filtering on objective, AI-extracted garment attributes — sleeve length, neckline, hem length, fit, opacity — against their own personal modesty thresholds.

**Live demo → [modest-filter.vercel.app/products](https://modest-filter.vercel.app/products)**

## Status

Catalogue, filtering, and product detail UI are complete and deployed. Remaining v1 work is the AI tagging pipeline and real product ingestion.

- ✅ Catalogue, filtering & product detail UI complete
- 🚧 AI attribute tagging & affiliate ingestion next

## Try it

- **Baseline catalogue** — [modest-filter.vercel.app/products](https://modest-filter.vercel.app/products) (all products)
- **Shareable filtered link** — [`/products?sleeveLength=long&category=dresses`](https://modest-filter.vercel.app/products?sleeveLength=long&category=dresses) — filter state lives in the URL, so any filtered view is a shareable link (this one narrows to a single product)
- **Product detail** — e.g. [Effortless Long-Sleeve Midi Dress](https://modest-filter.vercel.app/products/seed-aritzia-effortless-midi) or [The Linen Maxi Dress](https://modest-filter.vercel.app/products/seed-everlane-linen-maxi)

## What's built

- **Database schema** — Postgres on Supabase: 3 entities (Brand, Category, Product) with 14 modesty-relevant product attributes, modelled in Prisma 7 ([ADR-0007](docs/files/0007-v1-schema.md))
- **Data layer** — shared, typed data-access helpers in `lib/data/`, called from both API routes and server components so business logic is written once ([ADR-0004](docs/files/0004-api-first-architecture.md))
- **API** — `GET /api/products` returns the catalogue with brand and category relations
- **Filterable product listing** — `/products`, a server-rendered responsive grid with URL-based filter state across category, sleeve length, hem length, opacity, material, primary color, and top length; filtered URLs are shareable ([ADR-0008](docs/files/0008-filter-null-semantics.md) documents the strict-`in` NULL semantics)
- **Product detail pages** — `/products/[id]`, full attribute breakdown grouped by Coverage / Fit & material / Visual, with an affiliate click-through ([ADR-0009](docs/files/0009-product-url-design.md))
- **Unit tests** — 74 vitest tests covering the filter parser, display helpers, and vision schema completeness: input shapes, comma/repeated multi-value, and forgiving validation (`npm test`)
- **ADR-driven decisions** — every stack and architecture choice is an Accepted ADR in [`docs/files/`](docs/files/), written before it's built

## What's next

- **AI vision tagging** — Claude Vision pipeline to extract garment attributes from product images ([ADR-0005](docs/files/0005-claude-vision-tagging.md))
- **Affiliate ingestion** — pull real product catalogues from mainstream brands via affiliate networks

## Project structure

- `app/` — Next.js App Router pages and API routes
- `lib/data/` — Prisma-touching data-access helpers (the API-first seam, ADR-0004)
- `lib/products/` — pure presentation helpers (price/label formatting, color map; no I/O)
- `lib/generated/prisma/` — generated Prisma client (gitignored, rebuilt via `postinstall`)
- `docs/files/` — Architecture Decision Records

## Tech stack

- **Next.js 16** (App Router) + React
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Prisma 7** with the driver-adapter connection model ([ADR-0006](docs/files/0006-prisma-7-connection-architecture.md))
- **Supabase** Postgres
- **Vercel** hosting

## Local development

Requires Node.js 20+.

```bash
git clone git@github.com:mohamedmeghawry/modest-filter.git
cd modest-filter
npm install
cp .env.local.example .env.local   # then fill in your Supabase connection strings
npm run dev
```

Open [http://localhost:3000/products](http://localhost:3000/products).

## License

MIT — see [LICENSE](LICENSE).

## Author

Built by Mohamed Meghawry, Toronto.
