# Haunt

Venue-First live music platform. Follow a **venue**, see who plays next, browse its history.

> Full technical plan: [`docs/venue-first-tech-plan.md`](docs/venue-first-tech-plan.md).
> Engineering invariants live as skills in [`.claude/skills/`](.claude/skills/) — read the relevant one before touching that area.

## Monorepo layout

```
haunt/
├── apps/
│   ├── web/        Next.js (App Router) — public venue/artist pages (SSR/SEO) + the v0 fan client (Web/PWA)
│   └── mobile/     Expo (React Native) — native fan client (v1; skeleton only for now)
├── packages/
│   ├── types/      Shared TS types — domain model + generated Supabase DB types (single source of truth)
│   ├── db/         Supabase client factories (anon / service) + the "free" queries from the data-model skill
│   └── ui/         Design tokens shared by web + mobile (design-system skill; brand TBD)
├── supabase/
│   ├── migrations/ Versioned SQL + RLS (0001_init = the v0 core graph)
│   ├── seed/       Seed / backfill scripts (load a single city's venues + shows)
│   └── functions/  Edge Functions — ig-sync worker (v1 stub)
└── docs/           The plan
```

### How it maps to the plan

| Plan | Here |
|---|---|
| §4 Public pages (Next.js, SSR/SEO) | `apps/web` |
| §4 Fan client (v0 Web/PWA → v1 Expo) | `apps/web` now, `apps/mobile` at v1 (decision §11-3) |
| §4 Supabase (Postgres + Auth + RLS) | `supabase/`, clients in `packages/db` |
| §4/§6 IG sync worker (v1) | `supabase/functions/ig-sync` |
| §3 Domain model | `supabase/migrations/0001_init.sql` + `packages/types` |
| §11-1 Shared TS types front/back | `packages/types` consumed by web, mobile, seed |

## Getting started

> Nothing is installed yet — this is a scaffold. Steps below assume [pnpm](https://pnpm.io) and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
pnpm install                 # install the workspace
cp .env.example .env         # then fill in Supabase keys
pnpm db:start                # start local Supabase (Docker)
pnpm db:reset                # apply migrations (0001_init) to the local DB
pnpm db:types                # regenerate packages/types/src/database.types.ts from the live schema
pnpm seed                    # load placeholder seed data (edit supabase/seed/backfill.ts first)
pnpm dev                     # run the web app (and any other dev tasks)
```

## v0 scope

The one thing v0 must prove: **will fans follow a venue?** See the impact-ordered backlog in plan §12 — items #1–#9 are v0.
