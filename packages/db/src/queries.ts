import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@haunt/types";

type DB = SupabaseClient<Database>;

// The queries below are the "free" ones from the data-model skill §3 — they fall
// straight out of the venue-first schema and are NOT separate features.

/**
 * Venue history archive = performances ⨝ events WHERE venue_id ORDER BY starts_at.
 * Powers the venue public page's "who's played here".
 */
export function venueArchive(db: DB, venueId: string) {
  return db
    .from("events")
    .select(
      "id, title, starts_at, status, performances(billing_order, artists(slug, name))",
    )
    .eq("venue_id", venueId)
    .order("starts_at", { ascending: false });
}

/**
 * Follow-venue feed = upcoming events for the venues a user follows.
 * TODO(v0): implement as a SQL view/function or a two-step query
 * (follows where target_type='venue' → events where starts_at >= now()).
 */
export function followedVenueIds(db: DB, userId: string) {
  return db
    .from("follows")
    .select("target_id")
    .eq("user_id", userId)
    .eq("target_type", "venue");
}

/**
 * Search venues by name — Postgres FTS over the generated `search_tsv` column
 * (decision §11-4). pg_trgm indexes also exist for fuzzy/typo-tolerant matching.
 */
export function searchVenues(db: DB, q: string) {
  return db
    .from("venues")
    .select("id, slug, name, neighborhood")
    .textSearch("search_tsv", q, { type: "websearch" });
}
