# supabase/seed

Seed / backfill scripts. For v0, this is how venue archives get populated — the founder
loads a single city's 10–20 venues and their public shows (plan §8.2). IG sync is **not**
used in v0 (decision §11-2).

```bash
pnpm seed   # runs backfill.ts with tsx (needs SUPABASE_SERVICE_ROLE_KEY)
```

`backfill.ts` uses the **service role** client (bypasses RLS) — run it only in trusted
environments, never bundle it into a client.
