# @haunt/db

Supabase access for the workspace.

- `client.ts` — `createBrowserClient` (anon key, RLS-bounded) and `createServiceClient` (service role, server-only, bypasses RLS).
- `queries.ts` — the "free" venue-first queries from the [data-model skill](../../.claude/skills/data-model/SKILL.md) §3: venue archive, follow feed, search.

App-side SSR cookie wiring lives in `apps/web/lib/supabase` (uses `@supabase/ssr`); this package holds the framework-agnostic pieces.
