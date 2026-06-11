# supabase

Postgres + Auth + Storage + RLS + Edge Functions — the whole backend (plan §4–§5).

```
supabase/
├── config.toml             local stack config (supabase CLI)
├── migrations/
│   └── 0001_init.sql       v0 core graph: profiles, venues, artists, events, performances, follows + RLS + FTS
├── seed/
│   └── backfill.ts         founder-maintained archive seed (service role)
└── functions/
    └── ig-sync/            IG Graph API worker — v1 stub
```

## Common commands

```bash
pnpm db:start    # supabase start (local Docker stack)
pnpm db:reset    # drop + re-apply all migrations
pnpm db:migrate  # push migrations to the linked project
pnpm db:types    # regenerate packages/types/src/database.types.ts from the schema
```

Schema invariants and RLS conventions: [data-model skill](../.claude/skills/data-model/SKILL.md).
