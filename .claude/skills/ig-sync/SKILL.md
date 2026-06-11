---
name: ig-sync
description: Hard constraints and the correct implementation path for Instagram sync. Read this skill BEFORE any code, design, or discussion that touches "pulling a venue/artist's posts/media/account info from Instagram", IG OAuth, IG tokens, IG webhooks, the Graph API, or "one-click IG sync". Prevents the agent from generating code that calls the discontinued Basic Display API.
---

# Instagram Sync · Invariants

> This skill pins down the real-world constraints of IG integration. Training data widely "remembers" APIs that are already dead — **not reading this will produce broken code.**

## 0. Current status (project decision)

- **No IG sync in v0** (see `docs/venue-first-tech-plan.md` §11-2). v0 fills archives via manual / founder-proxy entry.
- IG OAuth + Meta App Review go in **v1**; since review takes time, you can apply in parallel ahead of time.
- So when writing code now: **the core data model must never depend on IG.** IG is always an **optional import source**, not a hard dependency.

## 1. Absolutely forbidden ❌

- **Do not use the Instagram Basic Display API.** It was **fully EOL'd on 2024-12-04**; all endpoints are down. Any code hitting `graph.instagram.com/me/media` via a Basic Display token is dead.
- **Do not assume a personal account is readable.** Personal accounts have no official API path at all.
- **Do not poll all media to "check for updates"** — it will instantly blow the rate limit (see §3).
- **Do not store access tokens in plaintext.** They must be stored encrypted (matching `ig_connections.access_token(enc)` in the schema).

## 2. The only legitimate path ✅

1. The venue's IG must be a **Professional account (Business or Creator)**. This is a prerequisite — the connect flow's first step must validate/guide toward it.
2. Go through **OAuth** via **Facebook Login / Instagram API with Instagram Login**; the user authorizes and you receive a token.
3. Use the **Instagram Graph API** (`graph.facebook.com`, via the linked Facebook Page, or Instagram Login directly) to read the **account's own** media. You can only read the accounts you've been authorized for — you cannot read arbitrary public accounts.
4. Production requires **Meta App Review (Advanced Access)** to get permissions like `instagram_basic` / `instagram_manage_insights` for non-test users. In dev, only test accounts assigned a role on the app work.

## 3. Tokens and rate limits

- OAuth yields a **short-lived token** → exchange for a **long-lived token (~60 days)** → **refresh** before expiry on the OAuth cycle. The schema has `token_expires_at`; the worker must proactively refresh before expiry, not wait for a 401.
- Rate limit is roughly **200 req/hour/account**. Design accordingly:
  - **Cache** the media list (`media` table + `ig_media_id` dedupe), sync incrementally, never pull everything each time.
  - Track `last_synced_at` and only fetch content new since the last sync.

## 4. Prefer webhooks for incremental sync, not cron polling

- Prefer **Instagram webhooks** to subscribe to new-media events and receive them passively → avoids polling burning the rate limit.
- The cron worker is only a **reconciliation fallback** (low frequency, e.g. once a day to catch what webhooks missed).
- The worker must be **idempotent**: use a uniqueness constraint on `ig_media_id` so duplicate events don't create duplicate `media` rows.

## 5. Fallback (mandatory, or venues that can't connect churn immediately)

1. Personal account / venue unwilling to connect IG → offer **manual paste/forward** entry, or founder-maintained archives during cold start.
2. IG sync is an **optional enhancement**: the venue home page/archive must be fully usable **with no IG connection at all**.
3. The precise meaning of "one-click sync" in the UI: it refers to the **zero-maintenance loop after a one-time connection** (Professional account + OAuth), not "frictionless onboarding". Don't whitewash the build-side friction (Meta review + Professional account) in demos/docs.

## 6. Related

- Data model: `docs/venue-first-tech-plan.md` §3, §6
- `ig_connections` / `media` table definitions: same doc §3
- Data-model invariants: the [data-model](../data-model/SKILL.md) skill
