# Haunt · Engineering Backlog (standalone tasks, impact-ordered)

> Companion to [`venue-first-tech-plan.md`](venue-first-tech-plan.md) §12.

Every task is **standalone and independently testable** — it has a **Do** (the change) and a **Done when** (how to verify it *by itself*, before the rest of the feature exists). Sized to **~1–2h with agents**. IDs are stable; reference them when assigning work. Everything is **TypeScript** (decision §11-1).

**This file is ordered by user-visible impact** — the §12 ranking (#1 highest), now expanded to task granularity across **all** versions (v0–v3).

> ⚠️ **Impact order ≠ build order.** A high-impact item often depends on a lower-ranked enabler (the venue page #1 needs seed content #8; following #2 needs login #5). Each task lists its **Deps**. Build bottom-up along the deps; ship top-down by impact.
>
> **Foundation first** (no direct user impact, unblocks everything): **B1 → B2 → B3 → B4**.
> **Suggested v0 build order:** B1–B4 → S1–S3 (#8) → P1,P3 (#1) → P2 (#6) → P4–P8 (#9) → A1–A4 (#5) → D1–D3 (#2) → E1–E2 (#3) → SE1–SE2 (#7) → PU/AN.

Version tags: **[v0] [v1] [v2] [v3]**.

---

## Foundation — prerequisite (no direct user-visible impact)

- [ ] **B1 · Install & typecheck the workspace** *[v0] (~1h)* — **Do:** `pnpm install`; resolve version conflicts; `pnpm typecheck`. **Done when:** both exit 0 on a clean clone. **Deps:** —
- [ ] **B2 · Local Supabase + apply 0001 migration** *[v0] (~1h)* — **Do:** `pnpm db:start`, `pnpm db:reset`. **Done when:** the 6 tables + indexes exist (Studio/`\d+`), RLS enabled on each. **Deps:** B1
- [ ] **B3 · Generate real DB types** *[v0] (~0.5h)* — **Do:** `pnpm db:types`. **Done when:** `database.types.ts` holds real types (not placeholder) and `pnpm typecheck` passes. **Deps:** B2
- [ ] **B4 · Env wiring + web boots** *[v0] (~0.5h)* — **Do:** fill `.env`; `pnpm --filter web dev`. **Done when:** `localhost:3000` serves the landing page, no env errors. **Deps:** B1

---

## Impact rank #1 — Venue page (character + who's played here) `[v0]`

- [ ] **P1 · Venue SSR core fields** *(~1.5h)* — **Do:** render name/neighborhood/vibe_desc via the Supabase server client. **Done when:** `view-source` of `/venue/<slug>` contains the real text (proves SSR, not CSR). **Deps:** B4, S1
- [ ] **P3 · Not-found handling** *(~0.5h)* — **Do:** `notFound()` for unknown slug. **Done when:** `/venue/does-not-exist` returns HTTP 404. **Deps:** P1

## Impact rank #2 — Follow a venue (the core bet) `[v0]`

- [ ] **D1 · FollowButton insert/delete** *(~1.5h)* — **Do:** client component inserting/deleting a `follows` row (`target_type='venue'`). **Done when:** click creates a row (check DB), click again removes it; button toggles optimistically. **Deps:** A3, P1
- [ ] **D2 · Initial follow state on load** *(~1h)* — **Do:** read whether the user follows this venue; render correct state. **Done when:** logged in, button shows followed/not correctly on first paint. **Deps:** D1
- [ ] **D3 · Login gating** *(~0.5h)* — **Do:** logged-out click → login → back. **Done when:** the round-trip lands you back on the venue page. **Deps:** D1, A3

## Impact rank #3 — Follow-feed (the payoff) `[v0]`

- [ ] **E1 · `followFeed` query** *(~1.5h)* — **Do:** "upcoming events for venues I follow" (SQL view/function or two-step in `packages/db`). **Done when:** with seeded data it returns only future events of followed venues. **Deps:** D1, S3
- [ ] **E2 · Feed route + empty state** *(~1.5h)* — **Do:** `/feed` rendering the query; empty state. **Done when:** following a venue makes its upcoming show appear; following nothing shows the empty state. **Deps:** E1

## Impact rank #4 — Push on new show `[v0]`

- [ ] **PU1 · Decide + scaffold channel** *(~1h)* — **Do:** decide Web Push (v0) vs defer to native (v1); record it. **Done when:** decision written; if Web Push, a service worker registers and a manual test push arrives. **Deps:** B4
- [ ] **PU2 · Fanout query (followers of a venue)** *(~1h)* — **Do:** "who follows venue X" in `packages/db`. **Done when:** returns exactly the followers of a given venue (seeded follows). **Deps:** D1
- [ ] **PU3 · New-event → notify** *(~2h)* — **Do:** edge function/trigger that on a new event for a followed venue notifies (or stub-logs) followers. **Done when:** inserting such an event produces a notification/log per follower. **Deps:** PU1, PU2

## Impact rank #5 — Account / login `[v0]`

- [ ] **A1 · Enable Supabase Auth (email OTP/magic link)** *(~1h)* — **Done when:** requesting a login email and clicking the link sets a session cookie. **Deps:** B2
- [ ] **A2 · Auto-provision `profiles` on signup** *(~1h)* — **Do:** migration `0002_*` with a trigger inserting `public.profiles` on new `auth.users`. **Done when:** a new signup has a matching `profiles` row. **Deps:** A1
- [ ] **A3 · Login UI + sign out** *(~2h)* — **Done when:** you can log in, see logged-in state, refresh persists, sign out clears it. **Deps:** A1
- [ ] **A4 · SSR auth (middleware refresh)** *(~1.5h)* — **Do:** `middleware.ts` refreshing the session cookie. **Done when:** a Server Component reads the current user id; session survives navigation. **Deps:** A3

## Impact rank #6 — Venue history archive `[v0]`

- [ ] **P2 · History archive section** *(~1.5h)* — **Do:** render `performances ⨝ events` on the venue page. **Done when:** lists seeded shows newest-first, each with artist name(s). **Deps:** P1, S3

## Impact rank #7 — Find a venue (search) `[v0]`

- [ ] **SE1 · Verify FTS search query** *(~1h)* — **Do:** confirm `queries.searchVenues` against seeded data (tune `search_tsv`/trgm). **Done when:** a name substring returns the venue; a 1-char typo still matches (pg_trgm). **Deps:** S1
- [ ] **SE2 · Search box UI + results** *(~2h)* — **Done when:** typing shows live matches; clicking a result opens that venue. **Deps:** SE1, P1

## Impact rank #8 — Seed / backfill (invisible enabler, high leverage) `[v0]`

- [ ] **S1 · Seed venues** *(~1.5h)* — **Do:** 10–20 realistic single-city venues in `backfill.ts`. **Done when:** `pnpm seed` inserts them; re-run = no dupes (upsert on `slug`). **Deps:** B2
- [ ] **S2 · Seed artists** *(~1h)* — **Done when:** artists inserted; idempotent on `slug`. **Deps:** S1
- [ ] **S3 · Seed events + performances** *(~2h)* — **Done when:** each venue has ≥1 event, each event ≥1 performance to a real artist; `venueArchive` returns rows. **Deps:** S1, S2

## Impact rank #9 — Venue page SEO + OG `[v0]`

- [ ] **P4 · `generateMetadata`** *(~1h)* — **Done when:** page-source `<title>`/`<meta description>`/canonical reflect real venue data. **Deps:** P1
- [ ] **P5 · JSON-LD MusicVenue** *(~1h)* — **Done when:** passes Google's Rich Results test with MusicVenue detected. **Deps:** P1
- [ ] **P6 · OG image route** *(~2h)* — **Do:** `opengraph-image.tsx` via `next/og`, styled with `@haunt/ui` tokens. **Done when:** `/venue/<slug>/opengraph-image` returns a PNG with the venue name; shows in a link-preview debugger. **Deps:** P1
- [ ] **P7 · Dynamic sitemap** *(~1h)* — **Done when:** `/sitemap.xml` lists every seeded venue + artist URL. **Deps:** B4, S1
- [ ] **P8 · robots.txt** *(~0.5h)* — **Do:** verify `robots.ts`; set `NEXT_PUBLIC_SITE_URL`. **Done when:** `/robots.txt` served with the correct `Sitemap:` line. **Deps:** P7

## Validation instrumentation — plan §8.6 (how v0 proves itself) `[v0]`

- [ ] **AN1 · Wire PostHog** *(~1h)* — **Done when:** a localhost pageview appears in PostHog. **Deps:** B4
- [ ] **AN2 · Track the follow event** *(~0.5h)* — **Done when:** clicking follow emits an event with the venue id — **the metric v0 exists to move.** **Deps:** AN1, D1

---

## Impact rank #10 — Artist page + "where do they play next" `[v1]`

- [ ] **AR1 · Artist SSR page core fields** *(~1.5h)* — **Do:** `/artist/[slug]` render name/bio/hero via server client. **Done when:** `view-source` has the artist data. **Deps:** B4, S2
- [ ] **AR2 · "Where do they play next" section** *(~1.5h)* — **Do:** upcoming performances for the artist. **Done when:** lists the artist's future events with venues. **Deps:** AR1, S3
- [ ] **AR4 · Artist `generateMetadata`** *(~1h)* — **Done when:** title/description/canonical reflect the artist. **Deps:** AR1
- [ ] **AR5 · Artist JSON-LD `MusicGroup`** *(~1h)* — **Done when:** validator detects MusicGroup on the page. **Deps:** AR1
- [ ] **AR6 · Artist OG image** *(~1.5h)* — **Done when:** `/artist/<slug>/opengraph-image` returns a PNG. **Deps:** AR1, P6

## Impact rank #11 — Follow an artist `[v1]`

- [ ] **AR7 · Follow an artist** *(~1h)* — **Do:** reuse FollowButton with `target_type='artist'`; include artists in the feed. **Done when:** following an artist creates a row and their upcoming shows enter `/feed`. **Deps:** D1, AR1

## Impact rank #12 — Artist's home venues `[v1]`

- [ ] **AR3 · Home-venues query + section** *(~1.5h)* — **Do:** `performances GROUP BY venue_id ORDER BY count` for the artist. **Done when:** the artist page shows their most-played ("regular") venues. **Deps:** AR1, S3

## Impact rank #13 — Find an artist (search) `[v1]`

- [ ] **AR8 · Extend search to artists** *(~1h)* — **Done when:** the search box returns matching artists (FTS/trgm) alongside venues. **Deps:** SE2, S2

## Impact rank #14 — Instagram sync `[v1]`  *(read the [ig-sync skill](../.claude/skills/ig-sync/SKILL.md) first)*

- [ ] **IG-A · `venue_admins` migration + write RLS** *(~1.5h)* — **Do:** `venue_admins` table; RLS letting an owner edit only their venue. **Done when:** an admin can update their venue; a non-admin cannot (verify both). **Deps:** B2, A4
- [ ] **IG-B · Venue claim/admin onboarding** *(~2h)* — **Do:** a flow for a venue user to claim a venue (→ `venue_admins`). **Done when:** a user claims a venue and gains edit rights. **Deps:** IG-A
- [ ] **IG1 · `ig_connections` migration (encrypted token)** *(~1h)* — **Done when:** table exists with RLS; token column stores encrypted, never in any public read policy. **Deps:** B2
- [ ] **IG2 · `media` migration** *(~1h)* — **Done when:** table exists; unique constraint on `ig_media_id`. **Deps:** B2
- [ ] **IG3 · Submit Meta App Review** *(~2h, then waiting)* — **Do:** configure the Meta app + permissions and submit for Advanced Access. **Done when:** review submitted (start early — approval lags). **Deps:** —
- [ ] **IG4 · OAuth connect flow** *(~2h)* — **Do:** Professional-account check → OAuth → store long-lived token (encrypted). **Done when:** a venue admin connects a Professional IG and a long-lived token is persisted encrypted. **Deps:** IG1, IG-B
- [ ] **IG5 · Token refresh job** *(~1.5h)* — **Done when:** a token near expiry is refreshed before it expires (simulate by shortening expiry). **Deps:** IG4
- [ ] **IG6 · Graph API media fetch worker** *(~2h)* — **Do:** incremental pull since `last_synced_at`, cache, rate-limit aware. **Done when:** running it imports new media into `media`; re-running creates no dupes. **Deps:** IG2, IG4
- [ ] **IG7 · Webhook receiver for new media** *(~2h)* — **Done when:** a simulated webhook event upserts `media` idempotently (no dupes on replay). **Deps:** IG2, IG4
- [ ] **IG8 · Render media on the venue page** *(~1.5h)* — **Done when:** a connected venue's page shows its synced IG media; an unconnected venue page is unaffected. **Deps:** IG6, P1
- [ ] **IG9 · Manual media fallback (no IG)** *(~1.5h)* — **Do:** admin pastes a media URL → `media` (source≠ig). **Done when:** a non-connected venue gets media without any IG connection. **Deps:** IG2, IG-B

## Impact rank #15 — Native app (Expo) `[v1]`  *(read the [mobile-app skill](../.claude/skills/mobile-app/SKILL.md))*

- [ ] **M1 · Initialize Expo app (pin versions)** *(~2h)* — **Done when:** the app boots on an iOS/Android simulator showing a screen. **Deps:** B1
- [ ] **M2 · Supabase auth on device** *(~2h)* — **Done when:** you log in on-device and the session persists across app restart. **Deps:** M1, A1
- [ ] **M3 · Venue detail screen** *(~2h)* — **Done when:** the screen shows a venue + its archive on-device. **Deps:** M1, S3
- [ ] **M4 · Follow on device** *(~1h)* — **Done when:** the follow toggle works from the app (row in DB). **Deps:** M2, M3
- [ ] **M5 · Feed screen** *(~1.5h)* — **Done when:** the feed shows followed venues' upcoming shows on-device. **Deps:** M4, E1
- [ ] **M6 · Venue search on device** *(~1.5h)* — **Done when:** search returns venues in the app. **Deps:** M3, SE1
- [ ] **M7 · Expo push registration** *(~1.5h)* — **Done when:** the device registers an Expo push token, stored on the user record. **Deps:** M2
- [ ] **M8 · Push fanout to devices** *(~1.5h)* — **Do:** extend PU3 to send via Expo push tokens. **Done when:** a new event for a followed venue triggers a device notification. **Deps:** M7, PU3

## Impact rank #16 — Live notes `[v2]`

- [ ] **LN1 · `live_notes` migration + RLS** *(~1h)* — **Done when:** table + policies exist; a user writes only their own notes. **Deps:** B2, A4
- [ ] **LN2 · Post a live note (≤140) UI** *(~2h)* — **Done when:** submitting at an event creates a row and the note appears. **Deps:** LN1
- [ ] **LN3 · Lightweight moderation (report + manual)** *(~2h)* — **Done when:** reporting a note flags it into a review queue. **Deps:** LN2
- [ ] **LN4 · Feed blending** *(~1.5h)* — **Done when:** notes from followed venues appear in `/feed`. **Deps:** LN2, E2

## Impact rank #17 — Regulars circle `[v2]`

- [ ] **RC1 · Regulars query** *(~1.5h)* — **Do:** "who frequents this venue" (respecting privacy policy §9). **Done when:** returns the expected regulars for a seeded venue. **Deps:** S3, D1
- [ ] **RC2 · Regulars circle UI** *(~1.5h)* — **Done when:** the venue page shows regulars (only data the privacy policy permits). **Deps:** RC1, P1

## Impact rank #18 — Shareable archive + share cards `[v3]`

- [ ] **SH1 · Shareable archive view** *(~2h)* — **Done when:** a venue's history renders as a clean, shareable page/section. **Deps:** P2
- [ ] **SH2 · Share-card OG generation** *(~1.5h)* — **Do:** reuse the P6 OG infra for an archive card. **Done when:** sharing an archive yields a rich preview card image. **Deps:** SH1, P6

## Impact rank #19 — Long-tail SEO archive pages `[v3]`

- [ ] **SH3 · Long-tail archive pages** *(~2h)* — **Do:** per-show/per-period indexable pages; add to sitemap. **Done when:** an old show has its own indexable URL listed in `/sitemap.xml`. **Deps:** P2, P7
