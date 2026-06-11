// Supabase Edge Function: ig-sync  (v1 — NOT enabled in v0; see ig-sync skill §0)
//
// HARD CONSTRAINTS (ig-sync skill — violating these ships dead code):
//   • Instagram Basic Display API is EOL (2024-12-04). DO NOT USE IT.
//   • Read media only via the Instagram GRAPH API, for Professional (Business/Creator)
//     accounts that OAuth-authorized this app. Requires Meta App Review in production.
//   • Long-lived tokens, refreshed BEFORE expiry. ~200 req/h/account → cache + webhook.
//   • Idempotent on ig_media_id. IG is an OPTIONAL import source; the core model never
//     depends on it.
//
// This is a SKELETON. Implement against the Graph API in v1.

// @ts-nocheck — runs on Deno (Supabase Edge runtime), not the Node/TS workspace.
Deno.serve(async (_req) => {
  // TODO v1:
  //   1. for each ig_connections row whose token nears expiry → refresh long-lived token
  //   2. pull new media since last_synced_at via the Graph API (cache; respect rate limit)
  //   3. upsert into `media` keyed by ig_media_id (idempotent)
  //   4. prefer webhook-driven updates over polling
  return new Response(
    JSON.stringify({ ok: true, note: "ig-sync is a v1 stub" }),
    { headers: { "content-type": "application/json" } },
  );
});
