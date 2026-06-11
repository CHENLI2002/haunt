# ig-sync (Edge Function)

**v1 only.** Pulls a connected venue's Instagram media into the `media` table.

⚠️ Read the [ig-sync skill](../../../.claude/skills/ig-sync/SKILL.md) before writing any code here.
The short version: Basic Display API is dead (EOL 2024-12-04); use the **Graph API** for
**Professional** accounts via OAuth; long-lived tokens + refresh; ~200 req/h → cache + webhook;
idempotent on `ig_media_id`; IG is an optional import source, never a hard dependency.

Not used in v0 (decision §11-2) — v0 fills archives via `supabase/seed`.
