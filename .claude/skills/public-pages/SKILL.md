---
name: public-pages
description: SSR/SEO conventions for the Next.js public pages (venue/artist home pages). Read this skill first for any code or discussion touching Next.js App Router pages, venue or artist public pages, SEO metadata, Open Graph / OG images, sitemaps, SSR/SSG rendering strategy, or "getting pages indexed by Google".
---

# Next.js Public Pages · SEO Conventions

> Core constraint: **venue/artist home pages must be indexable by Google.** The public pages are themselves an acquisition channel (see `docs/venue-first-tech-plan.md` §2.4, §4). SEO is not optional.

## 1. Rendering strategy (invariant)

- venue/artist public pages use **SSR or SSG**, **never** pure client-side rendering (CSR). The HTML a crawler receives must already contain the real content (name, character description, history archive, upcoming shows).
- App Router: render with **Server Components** by default; fetch data on the server (direct to Supabase via the public read policy).
- Statically generate (SSG/ISR) whatever you can + incremental revalidation (venue info changes infrequently); wrap only the parts that need live data in client components.
- Interactivity (follow button, etc.) goes in client-component islands — **do not** degrade the whole page to CSR because of it.

## 2. SEO elements every public page must have

- `generateMetadata()`: title, description, canonical URL. Use real venue/artist data for title/description, not template placeholders.
- **Structured URLs**: `/venue/[slug]`, `/artist/[slug]`, with slugs from the DB (stable, readable, no id noise).
- **OG / Twitter cards**: `openGraph` + `twitter` metadata, with an OG image (see §3).
- **JSON-LD structured data**: use `MusicVenue` / `Place` for venues and `MusicEvent` for shows (schema.org types) — helps Google produce rich results.
- **sitemap.xml** + **robots.txt**: a dynamic sitemap enumerating all venue/artist slugs, submitted to search engines.

## 3. OG image generation

- Use Next.js **`ImageResponse` (`next/og`)** to dynamically generate venue/artist share cards (name + character + hero visual).
- Drive it with design tokens (see [design-system](../design-system/SKILL.md)) so the visuals match the product.
- v3 will expand "venue history archive as shareable content" into long-tail SEO pages + share cards (see §7); lay the OG image infrastructure now.

## 4. Data fetching

- Public pages **read public data only**: public venue/artist fields, events, performances. Go through the Supabase **public read policy**; never use the service key to expose restricted data.
- The history-archive query = `performances ⨝ events` (see [data-model](../data-model/SKILL.md)) — it's a direct query, don't take a detour.
- Watch for N+1: a venue page should fetch venue + its events + performances + artists in one shot.

## 5. Deployment

- Deploy on **Vercel**. Leverage its ISR, edge, and image optimization.
- Public pages also serve as the entry to the lightweight admin backend for venues/artists (see §4), but admin operations must go through auth + RLS — don't leak write permissions in the public shell.

## 6. Related

- Full text: `docs/venue-first-tech-plan.md` §4, §5, §7
- Data queries: [data-model](../data-model/SKILL.md) · Visuals: [design-system](../design-system/SKILL.md)
