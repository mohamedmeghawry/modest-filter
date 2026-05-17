# modest-filter

> A mobile-first web app that helps Muslim women find modest clothing from mainstream brands (Aritzia, Everlane, and others) by filtering on objective, AI-extracted garment attributes — sleeve length, neckline, hem length, fit, opacity — against their own personal modesty thresholds.

**Live demo → [modest-filter.vercel.app/products](https://modest-filter.vercel.app/products)**

## Status

Backend is complete and deployed; the user-facing filtering experience is the active area of work.

- ✅ Backend & data layer complete
- 🚧 UI and filtering in progress

## What's built

- **Database schema** — Postgres on Supabase: 3 entities (Brand, Category, Product) with 14 modesty-relevant product attributes, modelled in Prisma 7 ([ADR-0007](docs/files/0007-v1-schema.md))
- **Data layer** — shared, typed data-access helpers in `lib/data/`, called from both API routes and server components so business logic is written once ([ADR-0004](docs/files/0004-api-first-architecture.md))
- **API** — `GET /api/products` returns the catalogue with brand and category relations
- **Products page** — `/products`, a server component rendering the live catalogue as a responsive grid
- **ADR-driven decisions** — every stack and architecture choice is an Accepted ADR in [`docs/files/`](docs/files/), written before it's built

## What's next

- **Filter UI** — let users set their own per-attribute modesty thresholds and filter the catalogue
- **AI vision tagging** — Claude Vision pipeline to extract garment attributes from product images ([ADR-0005](docs/files/0005-claude-vision-tagging.md))
- **Affiliate ingestion** — pull real product catalogues from mainstream brands via affiliate networks

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
