---
name: data-model
description: Domain-model invariants and Supabase conventions for the Venue-First platform. Read this skill BEFORE any code or discussion that touches the database schema, table/field design, migrations, Supabase queries, RLS policies, ORM models, or the "venue / artist / event / performance / follow / live_note" entities. Prevents the agent from "fixing" the model into something event-centric or denormalized, which would destroy the product's only differentiation.
---

# Domain Model · Invariants

> The differentiation is encoded in the schema. **Violating these invariants = turning the product into yet another Bandsintown.**

## 1. Top-priority invariants (violation = reject)

1. **venue and performance are first-class entities; event is NOT the center.**
   - The agent's instinct is event-centric (one row per event, artists as fields). **That is wrong and directly destroys the differentiation.**
   - Correct structure: `venue → event → performance (M:N to artist)`. venue and artist are both independent root entities, each with its own slug, home page, and history.
   - Litmus test: "follow a venue", "venue history archive", and "an artist's home venues" must all be **simple queries over the same graph**, not extra features/tables. If your design makes them require new features, you built it wrong.

2. **Do not denormalize away the venue/performance split.** Don't stuff an artist's name into event to "save a join", or flatten performance into event. Joins are free at tens-of-thousands of rows; the split is the moat.

3. **follow is polymorphic.** `follows(user_id, target_type[venue|artist], target_id)`. follow-venue is first-class, same table and same logic as follow-artist. Do not make separate follow tables for venue and artist.

## 2. Core entities (authoritative definitions in `docs/venue-first-tech-plan.md` §3)

```text
users         -- fans, via Supabase Auth
venues        (slug, name, geo, neighborhood, vibe_desc, hero_media, ig_*, claimed_by)
artists       (slug, name, bio, hero_media, claimed_by)
events        (venue_id→venues, starts_at, title, status, source[manual|ig|backfill])
performances  (event_id→events, artist_id→artists, billing_order, setlist jsonb)  -- M:N
follows       (user_id, target_type[venue|artist], target_id)                      -- polymorphic
live_notes    (user_id, event_id, venue_id, body≤140)        -- one-line live note, not a rating
ig_connections(venue_id, ig_account_id, access_token(enc), token_expires_at, last_synced_at)
venue_admins / artist_admins (user_id, *_id, role)           -- B-side ownership
media         (owner_type, owner_id, url, source, ig_media_id, posted_at)  -- v1+
```

## 3. These queries must be "free" (not new features)

Self-check before writing code — all four should be direct SQL with no new table:

- **venue history archive**: `performances ⨝ events WHERE venue_id ORDER BY starts_at`
- **follow-venue feed**: upcoming events for the venues a user follows
- **an artist's home venues**: that artist's performances `GROUP BY venue_id ORDER BY count`
- **local scene graph**: the venues in a neighborhood + the artists threading them

## 4. Supabase / RLS conventions

- **RLS on by default, deny by default.** Every table writes explicit policies.
- **Data ownership is enforced by RLS** (this is a product promise, see §9, not just security):
  - Fans can only read/write **their own** `follows` / `live_notes`.
  - venue data is editable only by that venue's `venue_admins` (matching `claimed_by`); artist likewise.
  - Fields the public pages need to read (public venue/artist info, events, performances) go through a **public read policy**, but writes are always restricted.
- `ig_connections.access_token` is **stored encrypted** and never falls within any public policy's readable scope.
- For sensitive tables (tokens, admin relations), beyond RLS make sure they can't be queried directly by the client anon key.

## 5. Migration flow

- All schema changes go through **Supabase migration files** (versioned); don't hand-edit production in the dashboard.
- Every migration carries its corresponding RLS policy — **a new table with no policy = not done.**
- Indexes: `follows(user_id)`, `follows(target_type, target_id)`, `events(venue_id, starts_at)`, `performances(event_id)`, `performances(artist_id)`, unique on `media(ig_media_id)`.
- Search uses **Postgres FTS (pg_trgm/tsvector)**; no external search service in v0 (decision §11-4).

## 6. Related

- Full text: `docs/venue-first-tech-plan.md` §3, §9
- Handling of IG fields: the [ig-sync](../ig-sync/SKILL.md) skill
