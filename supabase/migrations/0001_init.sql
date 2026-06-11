-- 0001_init.sql — Venue-First v0 core schema
-- Authoritative model: docs/venue-first-tech-plan.md §3 · Invariants: .claude/skills/data-model
--
-- v0 scope: the venue-first read graph (venues, artists, events, performances)
-- + fans (profiles) + polymorphic follows. RLS on every table.
-- Search via Postgres FTS + pg_trgm (decision §11-4). No external search service.
--
-- NOTE on "users": fans are auth.users (Supabase Auth). `profiles` is the public
-- extension row keyed to auth.users.id. user_id columns reference auth.users directly
-- so RLS can use auth.uid().

create extension if not exists pg_trgm;

-- ── profiles (fans) ──────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ── venues (root entity) ─────────────────────────────────────────────
create table public.venues (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  lat           double precision,
  lng           double precision,
  neighborhood  text,
  vibe_desc     text,
  hero_media    text,
  ig_account_id text,
  ig_handle     text,
  claimed_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  -- generated full-text vector over the searchable text (decision §11-4)
  search_tsv    tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' || coalesce(neighborhood, '') || ' ' || coalesce(vibe_desc, '')
    )
  ) stored
);
create index venues_search_tsv_idx on public.venues using gin (search_tsv);
create index venues_name_trgm_idx  on public.venues using gin (name gin_trgm_ops);

-- ── artists (root entity) ────────────────────────────────────────────
create table public.artists (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  bio         text,
  hero_media  text,
  claimed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  search_tsv  tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(bio, ''))
  ) stored
);
create index artists_search_tsv_idx on public.artists using gin (search_tsv);
create index artists_name_trgm_idx  on public.artists using gin (name gin_trgm_ops);

-- ── events (a show at a venue) ───────────────────────────────────────
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues (id) on delete cascade,
  starts_at  timestamptz not null,
  title      text,
  status     text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'past')),
  source     text not null default 'manual'    check (source in ('manual', 'ig', 'backfill')),
  created_at timestamptz not null default now()
);
create index events_venue_starts_idx on public.events (venue_id, starts_at);

-- ── performances (M:N artist × event — "artist X at venue Y on date Z") ──
create table public.performances (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  artist_id     uuid not null references public.artists (id) on delete cascade,
  billing_order int,
  setlist       jsonb,
  created_at    timestamptz not null default now(),
  unique (event_id, artist_id)
);
create index performances_event_idx  on public.performances (event_id);
create index performances_artist_idx on public.performances (artist_id);

-- ── follows (polymorphic — follow-venue is first-class) ──────────────
create table public.follows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('venue', 'artist')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index follows_user_idx   on public.follows (user_id);
create index follows_target_idx on public.follows (target_type, target_id);

-- ═════════════════════════════════════════════════════════════════════
-- Row Level Security — on by default, deny by default (data-model skill §4)
-- ═════════════════════════════════════════════════════════════════════
alter table public.profiles     enable row level security;
alter table public.venues       enable row level security;
alter table public.artists      enable row level security;
alter table public.events       enable row level security;
alter table public.performances enable row level security;
alter table public.follows      enable row level security;

-- Public read for the venue-first graph (powers the SSR public pages).
create policy "public read venues"       on public.venues       for select using (true);
create policy "public read artists"      on public.artists      for select using (true);
create policy "public read events"       on public.events       for select using (true);
create policy "public read performances" on public.performances for select using (true);
-- Writes to the graph happen via the service role (seed/backfill), which bypasses RLS.
-- B-side claiming/editing (claimed_by, *_admins) is v1 — add write policies then.

-- profiles: a user sees and edits only their own row.
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- follows: a user reads/creates/deletes only their own follows.
-- (The public "regulars circle" is v2 — do NOT open follows to public read here.)
create policy "own follows read"   on public.follows for select using (auth.uid() = user_id);
create policy "own follows insert" on public.follows for insert with check (auth.uid() = user_id);
create policy "own follows delete" on public.follows for delete using (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════════════════════
-- Deferred to later versions (see skills/docs):
--   live_notes                    (v2)  — one-line live notes
--   ig_connections                (v1)  — encrypted token store; see ig-sync skill
--   media                         (v1)  — IG-synced media
--   venue_admins / artist_admins  (v1)  — B-side ownership + RLS write policies
-- ═════════════════════════════════════════════════════════════════════
