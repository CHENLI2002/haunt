# web — Next.js (App Router)

Two jobs (plan §4):
1. **Public venue/artist pages** — SSR + SEO so Google indexes them (an acquisition channel).
2. **v0 fan client (Web/PWA)** — follow, feed, account. Native app is v1 (decision §11-3).

Conventions are governed by the [public-pages skill](../../.claude/skills/public-pages/SKILL.md):
SSR/SSG (never CSR for public pages), `generateMetadata`, JSON-LD, dynamic sitemap, OG images.

## Key files

- `app/venue/[slug]/page.tsx` — SSR venue page + metadata + JSON-LD + history archive.
- `app/artist/[slug]/page.tsx` — v1 stub.
- `app/sitemap.ts`, `app/robots.ts` — SEO surface.
- `lib/supabase/server.ts` / `client.ts` — SSR + browser Supabase clients (`@supabase/ssr`).

## Run

```bash
pnpm --filter web dev
```
