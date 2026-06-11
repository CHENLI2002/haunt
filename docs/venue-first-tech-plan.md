# Venue-First Platform · Software Technical Plan

> Draft v0.1 | 2026-06-10
> Companion doc: *Venue-First Live Music Platform · Plan* (business/GTM). This document only covers **how to build the software**.

---

## 1. Scope

Covered here: domain model, system architecture, tech stack, key technical risk (IG sync), feature→system mapping by version, MVP engineering scope, data & privacy architecture.

Not covered: positioning, cold start, business model, competitors — see the companion business plan.

---

## 2. Core Design Principles

1. **venue is the root entity, not event.** The whole schema is modeled around venue + performance — this is the product differentiation and the architectural moat (see §3).
2. **During cold start: velocity beats scale.** Single city, a few thousand to tens of thousands of users — **one Postgres + two clients is enough**. Explicitly avoid the heavy infra you reach for by default (see "do not build" in §5).
3. **Data ownership is part of the product, and an architectural constraint.** We don't sell data, don't feed external LLMs, users can export — these have concrete architectural implementations (see §9), as a response to the Songkick→Suno trust vacuum.
4. **Public pages must be discoverable by Google.** venue/artist home pages use SSR/SSG so search engines index them — this is itself an acquisition channel.

---

## 3. Domain Model (the core — differentiation is encoded here)

Key insight: **make venue and performance first-class entities** (not just event), and "follow a venue", "venue history archive", and "an artist's home venues" all collapse into simple queries over the same graph, rather than being extra features. Bandsintown's artist-centric schema structurally cannot produce "this venue's character + regulars" — that's the moat at the schema layer.

```text
users            (id, …)                              -- fans, via managed Auth
venues           (id, slug, name, geo, neighborhood,
                  vibe_desc, hero_media, ig_account_id,
                  ig_handle, claimed_by, created_at)
artists          (id, slug, name, bio, hero_media, claimed_by)
events           (id, venue_id→venues, starts_at, title,
                  status, source[manual|ig|backfill])
performances     (id, event_id→events, artist_id→artists,
                  billing_order, setlist jsonb null)    -- M:N, = "artist X plays at venue Y on date Z"
follows          (id, user_id→users, target_type[venue|artist],
                  target_id, created_at)                -- polymorphic follow, follow-venue is first-class
live_notes       (id, user_id, event_id, venue_id,
                  body(≤140), created_at)               -- one-line live note, not a rating
ig_connections   (id, venue_id, ig_account_id,
                  access_token(enc), token_expires_at, last_synced_at)
venue_admins     (user_id, venue_id, role)             -- B-side ownership
artist_admins    (user_id, artist_id, role)
media            (id, owner_type, owner_id, url, source,
                  ig_media_id, posted_at)               -- v1+, IG-synced content lands here
```

**This schema turns all of the following into free queries (not new features):**
- **venue history archive**: `performances ⨝ events WHERE venue_id ORDER BY starts_at` → who played here, and when.
- **follow-venue feed**: upcoming events for the venues a user follows.
- **an artist's home venues**: over that artist's performances, `GROUP BY venue_id ORDER BY count` → "their regular venues".
- **local scene graph**: the venues in a neighborhood + the artists/regulars that thread them together.

> Keep this page handy — for your boss/co-founder/future engineers. It explains at a glance "why we can do what others can't".

---

## 4. System Architecture

```text
                    ┌─────────────────────────────┐
   Google ◀─SEO──── │  Next.js public pages        │  SSR/SSG, Vercel
                    │  (venue/artist)              │
                    └──────────────┬──────────────┘
   fan phone ── Expo App ──┐        │
   venue/artist ─ Web admin ┤        │
                          ▼        ▼
                    ┌─────────────────────────────┐
                    │   Supabase (Postgres + Auth   │
                    │   + Storage + RLS + Edge Fn)  │
                    └──────┬───────────────┬────────┘
                           │               │
              ┌────────────▼──┐     ┌──────▼────────────┐
              │ IG Sync Worker │     │ Push (Expo)       │
              │ (cron→Graph API)│     │ follow fanout     │
              └────────────────┘     └───────────────────┘
```

- **Public pages (Next.js):** venue/artist home pages, SSR + indexable by search engines; also the entry point to the lightweight admin backend for venues/artists.
- **Fan client (Expo / React Native):** one codebase for iOS + Android; follow, feed, live notes, push.
- **Data/auth/storage (Supabase):** managed Postgres + Auth + Storage + Row Level Security — one service replaces four, ideal for cold start. RLS also backs data ownership (each venue can only touch its own data).
- **IG sync worker:** scheduled job, calls the Graph API per connected venue to pull media (see §6).
- **Notifications:** a followed venue gets a new event → push fanout; at local scale this is just a simple query, no message queue needed.

---

## 5. Tech Stack (decided, velocity first)

| Layer | Choice | Rationale |
|---|---|---|
| Public pages | **Next.js (App Router) + Vercel** | SSR→SEO, venue pages get indexed by Google |
| Fan client | **Expo (React Native)** | one codebase for iOS+Android, fastest iteration |
| Backend/DB/Auth/Storage | **Supabase (Postgres)** | four-in-one, RLS backs data ownership, zero ops |
| Search | **Postgres full-text search (pg_trgm/tsvector)** | enough for v0; Typesense/Algolia etc. only if needed |
| IG sync | Supabase Edge Function (cron) or a small Railway worker | single responsibility, independently retryable |
| Analytics | **self-hosted PostHog / Plausible** | consistent with the "don't leak data" positioning |
| Push | Expo Notifications (APNs/FCM) | native integration with Expo |

**Explicitly do NOT build (this matters — it's your comfort zone, but here it's all over-engineering):**
- ❌ Kafka / Flink / Paimon / Spark — this is not a big-data scenario; single city, tens of thousands of rows, it's one Postgres table.
- ❌ Neo4j — the follow graph at this scale is fine on Postgres relational tables; don't reach for a graph DB just because it's "a graph".
- ❌ Kubernetes / microservices — one monolith backend + two clients, PaaS deploy.
- ❌ Self-built Auth — use Supabase Auth, don't reinvent the wheel.

> Go alternative: if you strongly prefer writing the backend/worker in Go, that's fine too, but at this stage the speed from "shared TS types across front/back + Supabase zero-ops" is worth more than a language preference. **Decided: start with TS (see §11-1).**

---

## 6. Key Technical Risk ①: Instagram Sync (highest risk)

The business plan treats "one-click IG sync" as the linchpin of B-side adoption, but the engineering reality has barriers and must be designed honestly:

**Current API reality (2026):**
- The Basic Display API was **fully shut down on 2024-12-04**; personal accounts can no longer be read via any official API.
- Legitimate path: the venue must be a **Professional (Business/Creator) account**, authorize your app via OAuth, and then you can use the Graph API to read **its own** media.
- Production requires **Meta App Review (Advanced Access)**; long-lived tokens must be refreshed on the OAuth cycle; rate limit is ~200 req/h/account, so cache + webhook.

**So the precise meaning of "one-click sync":**
- One-time: the venue connects IG (Professional account required) → OAuth authorization → you store a long-lived token.
- After that: the worker pulls new media on a schedule / via webhook automatically — **for the venue it is genuinely zero-maintenance afterward**; "one-click" refers to this recurring experience after the one-time connection.
- But the **build side has two points of friction: Meta review + the Professional-account prerequisite**. Don't pretend they don't exist at the demo stage.

**Fallback (mandatory, otherwise venues that can't connect just churn):**
1. Venue is a personal account / unwilling to connect → offer **manual paste/forward** entry, or have you (the founder) maintain the archive during cold start (already in the business plan).
2. Use IG **webhooks** to listen for new media, avoiding polling that burns the rate limit.
3. Make IG sync an **optional enhancement, not a hard dependency** — the core data model does not depend on IG; IG is only an import source.

**Engineering recommendation:** don't build IG sync in v0; use manual/proxy entry to fill the archives for the first 10–20 venues and validate demand; put IG OAuth + Meta review in v1, since review takes time — apply in parallel. **Decided: no IG sync in v0 (see §11-2).**

---

## 7. Feature → System Mapping (ordered by the business plan's versions)

| Version | Feature | Main system work |
|---|---|---|
| **v0** | venue home page + `follow venue` + public-page SEO | Next.js public pages, venues/follows tables, Postgres FTS, **Web/PWA client follow & feed (fastest validation signal first, see §11-3)**, **seed/backfill tooling** (scripts to load existing shows into events/performances) |
| **v1** | artist home page + linked to venues + "where do they play next" + IG sync + native App | artists/performances relational queries, artist public pages, **IG OAuth + Graph API worker + Meta review**, media table, **Expo native client** |
| **v2** | live notes (one line) + regulars circle | live_notes table, lightweight moderation (report + manual), feed blending |
| **v3** | venue history archive turned into revisitable/shareable content | performances-based archive views, share cards (OG image generation), long-tail SEO pages |

Each version is built only after the previous one works and you need to unlock the next set of users.

---

## 8. MVP (v0) Engineering Scope (ordered by dependency, usable as a todo)

1. Stand up Supabase tables: users / venues / follows / events / performances (these 5 first).
2. Seed & backfill scripts: load the public show info for 10–20 venues in a single city into events/performances, making them "home venues with existing content".
3. Next.js venue public page (SSR): character description + history archive (performances query) + follow button + SEO meta/OG.
4. **Fan client (v0 uses Web/PWA, native App not required, see §11-3):** login (Supabase Auth), venue detail, follow, follow-feed, (PWA push registration optional).
5. follow→push fanout: notify when a followed venue gets a new event (one query, no queue).
6. Basic instrumentation (self-hosted PostHog): validate "does anyone actually follow a venue".

**Validation goal:** will fans follow a venue (this is the new primitive the whole product bets on — the one thing v0 must prove).

---

## 9. Data & Privacy Architecture (the engineering realization of the positioning)

The positioning is "your live record belongs to you, not fed to AI" — this isn't just copy, it has concrete architectural moves:

- **Data ownership:** Supabase **RLS** enforces that each user/venue can only access their own data.
- **Exportable:** provide a user data export endpoint (attendance history, follows, live notes), addressing the demand of users spooked by the Songkick→Suno episode (GDPR-style "data portability").
- **No leakage:** analytics use **self-hosted** PostHog/Plausible, no third parties that resell data; do not feed user content to external LLMs.
- **Write it into the privacy policy and make it a selling point** — this is the trust Bandsintown / acquired-Songkick cannot offer.

---

## 10. Non-Functional / Scale Assumptions

- **Scale:** cold-start single city, designed for a few thousand DAU and tens of thousands of rows. **Do not architect for millions** — premature optimization is the biggest waste at this stage.
- **Cost:** start on the free/low tiers of Vercel + Supabase + Expo; monthly cost at single-city stage is kept very low.
- **Evolvable:** all choices can be migrated later (Supabase→self-managed Postgres, FTS→dedicated search, worker split-out), but **don't migrate now**.
- **Observability:** self-hosted PostHog doubles as product analytics + basic monitoring; use Sentry for errors.

---

## 11. Technical Decisions (settled)

| # | Decision point | Conclusion | Notes |
|---|---|---|---|
| 1 | Backend language | **TS** | velocity first, shared types across front/back; Go not chosen for now |
| 2 | IG sync timing | **Not in v0** | v0 uses manual/proxy entry to fill archives; IG OAuth + Meta review go in v1, apply in parallel |
| 3 | Fan client form | **v0 uses Web/PWA (fastest validation signal first)** | native Expo App pushed to v1; validate the follow primitive on Web first |
| 4 | Search | **v0 uses Postgres FTS (pg_trgm/tsvector)** | no external search service; add Typesense/Algolia only if needed |

> **On §11-4 (what "search" is):** "Search" here is the in-app box where a user types a name and finds the matching **venue/artist** (and later, neighborhood). It runs **inside Postgres** using its built-in full-text search — `tsvector` for word/phrase matching, and the `pg_trgm` extension for fuzzy, typo-tolerant, as-you-type prefix matching. No separate search service. At single-city scale (tens of thousands of rows) this is fast and effectively free. A dedicated engine like Typesense/Algolia is a separately-hosted product we'd add only if FTS stops keeping up — not now.

---

## 12. Flattened Backlog — Impact-Ordered (user perspective)

All versions (v0–v3) merged into a single list. Each row is **roughly one shippable small feature**, ordered by **user-perceived impact**, *not* by build order. Everything is built in **TypeScript** throughout.

> Dependency caveat: a few high-impact items depend on lower-ranked enablers (you can't follow without an **account** (#5); pages are empty without **seed content** (#8)). Rank is by impact; actual build order must still respect those prerequisites.

| # | Feature | What the user gets | From |
|---|---|---|---|
| 1 | **Venue page** — character + who's played here | The "aha": a venue with a personality and a real history, worth caring about | v0 |
| 2 | **Follow a venue** | The core primitive — claim a venue as "yours" | v0 |
| 3 | **Follow-feed** | Upcoming shows at the venues you follow, all in one place | v0 |
| 4 | **Push: followed venue announces a show** | You hear about a new show without checking | v0 |
| 5 | **Account / login** | Your follows persist and belong to you (prereq for #2–4) | v0 |
| 6 | **Venue history archive** | Browse everything that's ever played this room | v0 |
| 7 | **Find a venue (search)** | Type a name, jump to the venue *(at v0 scale a simple browse list can stand in)* | v0 |
| 8 | **Seed / backfill existing shows** | Pages are full of real content from day one (invisible enabler) | v0 |
| 9 | **Venue page SEO + OG** | You can reach the venue from Google or a shared link | v0 |
| 10 | **Artist page + "where do they play next"** | Follow the act, see their next show | v1 |
| 11 | **Follow an artist** | Same primitive, second entity | v1 |
| 12 | **Artist's home venues** | "Their regular rooms" — connects artist ↔ venue | v1 |
| 13 | **Find an artist (search)** | The same search, extended to artists | v1 |
| 14 | **IG sync** | Venue pages stay fresh automatically | v1 |
| 15 | **Native app (Expo)** | Smoother phone experience, real push | v1 |
| 16 | **Live notes** | Leave a one-line trace at a show | v2 |
| 17 | **Regulars circle** | See who else haunts this venue | v2 |
| 18 | **Shareable archive + share cards** | Post a venue's history as a nice card | v3 |
| 19 | **Long-tail SEO archive pages** | Old shows become discoverable search landing pages | v3 |

**Reading the order:** items 1–4 are the core loop the product bets on (find a venue worth following → follow → get the payoff). 5–9 make that loop real and reachable. 10–13 add the second entity (artists) and a second axis of discovery. 14–15 are freshness + reach. 16–17 add community texture. 18–19 are shareable, long-tail growth.
