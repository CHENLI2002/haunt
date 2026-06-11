# @haunt/types

Shared TypeScript types — the single source of truth consumed by `apps/web`, `apps/mobile`, and the seed scripts (plan §11-1).

- `domain.ts` — hand-written domain model (Venue, Artist, Event, Performance, Follow, LiveNote). Mirrors the schema in plan §3; governed by the [data-model skill](../../.claude/skills/data-model/SKILL.md).
- `database.types.ts` — **generated** from the live Supabase schema via `pnpm db:types`. The committed file is a placeholder until you run that.

Don't hand-copy DB types into apps — import from here.
