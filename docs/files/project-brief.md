# Project Brief

> Working title: TBD (placeholder name throughout this doc)

## One-line description

A mobile-first web app that helps Muslim women find modest dresses, abayas, and tops from mainstream brands by filtering on AI-extracted clothing attributes.

## The problem

Muslim women who want to dress modestly while shopping at mainstream clothing brands face a recurring frustration. Brands like Aritzia, Everlane, Anthropologie, Reformation, and Banana Republic carry a wide range of styles, but their websites have no filters for the attributes that determine modesty: sleeve length, neckline, hem length, fit, and opacity. The user has to scroll through hundreds of products and manually check each one. The work is repetitive, exhausting, and often gives up before finding something suitable.

Modest-specific platforms like Modanisa exist but carry only modest-niche brands. They do not solve the problem of "I want a modest piece from Aritzia." The two markets stay separate, and the user is forced to choose between modest selection and brand preference.

## The solution

A web app that ingests product catalogues from selected mainstream brands, uses AI vision models to extract objective clothing attributes for every item, and lets users filter the entire catalogue using their own modesty criteria. Users browse, filter, find pieces that meet their personal standards, and click through to the brand's website to purchase.

The core product insight: do not have AI judge whether something is modest. Have AI extract objective attributes (sleeve length, neckline shape, hem length, fit, opacity) and let the user define what modesty means to them.

## Primary user

Muslim women, ages roughly 18-45, comfortable with online shopping, who already shop or want to shop at mainstream Western brands but find modesty filtering tedious or impossible on those brands' own sites. Mobile-first audience.

The very first users in v1 are the founder's wife and her immediate circle. The product must work well for them before any consideration of broader audience.

## Scope for v1

### In scope

- Mobile-first responsive web app
- 3-5 hand-picked brands sourced via affiliate networks (initial candidates: Aritzia, Everlane, Anthropologie, Reformation, Banana Republic, pending affiliate availability)
- 3 product categories: dresses, abayas, tops
- Women's clothing only
- AI-tagged objective attributes per product:
  - Sleeve length (sleeveless, cap, short, elbow, three-quarter, long, extra-long)
  - Neckline shape (crew, v-neck, scoop, high neck, turtleneck, off-shoulder, etc.)
  - Hem length (mini, knee, midi, ankle, floor)
  - Fit (fitted, semi-fitted, loose, oversized)
  - Opacity (sheer, semi-sheer, opaque)
- Filter UI where user sets their own thresholds for each attribute
- Product listing with image, brand, name, price
- Click-through to brand site via affiliate link
- English only

### Explicitly NOT in scope for v1

- User accounts and saved favorites
- Multi-language support
- Multi-region pricing or currency
- Outfit collections or styling features
- User reviews or community features
- Native mobile apps (iOS or Android)
- Brands beyond the initial 3-5
- Categories beyond dresses, abayas, tops
- Men's or children's clothing
- Modesty-level pre-sets (the user defines their own filters)
- Push notifications, email alerts, or new-arrival subscriptions
- Admin UI for tag correction (manual database edits acceptable in v1)

## Success criteria for v1

The founder's wife uses the product to find at least one piece of clothing she actually buys, and reports that the experience was meaningfully better than browsing the brand's site directly. Three to five other women in her circle use it and give qualitative feedback.

This is a hobby project. The success metric is "this works and I'm proud of it," not user counts or revenue.

## Non-goals

- Building a business in v1
- Beating Modanisa or any incumbent
- SEO traffic acquisition (will come if the product survives v1)
- Earning meaningful revenue in v1 (affiliate links will be present but income is not a goal)

## Key constraints

- Solo developer with limited evening and weekend hours
- Built primarily as a learning project and portfolio piece
- Budget: minimal. Free tiers for hosting and database where possible. AI API costs estimated under $50 for v1 catalogue.
- Build quality must be portfolio-grade: documented, tested, well-architected. The output is judged on engineering quality more than on product reach.

## Risks and assumptions

- **Affiliate network access:** Assumes that at least 3 of the target brands are accessible through ShareASale, Rakuten, Awin, or similar. If fewer than 3 are accessible, the brand list will be adjusted to whatever is available, prioritizing brands the founder's wife actually shops.
- **AI tagging accuracy:** Assumes Claude Vision (or equivalent) can reliably extract objective attributes from product images at acceptable accuracy (target: 90%+ on clean product shots). To be validated on a sample of 20 products before committing to the full pipeline.
- **Image rights:** Assumes affiliate network terms permit display of product images for the purpose of driving traffic to the brand. To be validated by reading each network's affiliate agreement before launch.
- **Wife's time:** Assumes the founder's wife is available to validate brand selection, review tagging quality, and give product feedback. She is the domain expert and the primary user; her involvement is non-negotiable.

## Tech stack

- Language: TypeScript (across frontend and backend)
- Frontend: Next.js with React, mobile-first
- Styling: Tailwind CSS, with shadcn/ui for components
- Backend: Next.js API routes (same project, same repo)
- Database: PostgreSQL on Supabase (free tier)
- ORM: Prisma
- AI tagging: Claude Vision API
- Hosting: Vercel (free tier)
- Version control: GitHub
- CI: GitHub Actions
- Future mobile app (post-v1): React Native with Expo, consuming the same API

Each significant tech choice is documented in its own ADR.

## Architecture principle: API-first

All data access in the application goes through API routes, never direct database queries from page components. The website calls these API routes. A future React Native mobile app will call the same API routes. This keeps the website and any future client surfaces decoupled from the database.

Server components are used for static or rarely-changing content (page shells, layout, metadata). Dynamic data (products, filters, search results) is fetched through API routes.

This adds approximately 5% to v1 build time and removes the need for a future data-layer rewrite.

## Security

### Threat model

This is a hobby project at v1, not a high-value target. Realistic threats in order of likelihood:

- Accidental exposure of secrets in version control (most likely, fully preventable)
- Automated internet-wide vulnerability scans (likely, mitigated by hosting choices)
- Casual scraping of the product catalogue and AI tags (possible, partially mitigated)
- Targeted attack by a sophisticated adversary (unlikely at this scale)

### Mandatory controls before production

- All secrets in environment variables, never in source code
- `.gitignore` covers all `.env*` files; verified before first commit
- Database is never exposed to the public internet; access only through backend API routes
- All Anthropic API calls happen server-side; the API key never reaches the browser
- Row Level Security (RLS) enabled in Supabase with explicit read/write/delete policies
- Rate limiting on all public API routes (default: 100 requests per minute per IP)
- Billing alerts configured on Anthropic and Vercel
- Bot protection enabled (Vercel built-in or Cloudflare)

### Explicitly out of scope for v1

- Custom authentication (no user accounts in v1; if added later, use Supabase Auth or NextAuth.js)
- Web Application Firewall beyond Vercel/Cloudflare defaults
- CAPTCHA challenges
- DDoS mitigation beyond hosting provider defaults

### Code visibility

Frontend code is inherently public (downloaded by every browser). Backend code (API routes) runs server-side and is not exposed. Repository visibility (public vs private on GitHub) is a separate decision driven by portfolio goals, not security: making the repo public does not increase real-world risk if the controls above are in place.

## Author

Mohamed Meghawry, Toronto, Canada.

## Domain co-owner

Wife (name redacted in public version), product and curation lead.
