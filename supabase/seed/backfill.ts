// Seed / backfill — load 10–20 single-city venues + their public shows into
// venues / artists / events / performances (plan §8.2). Run: pnpm seed
//
// Uses the SERVICE ROLE key (bypasses RLS) — server-only. Never ship this anywhere
// client-side. This is the "founder maintains the archive" path for cold start;
// IG sync is NOT used in v0 (decision §11-2, ig-sync skill §0).

import { createServiceClient } from "@haunt/db";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).",
  );
}

async function main() {
  const db = createServiceClient(url!, serviceKey!);

  // TODO: replace with real single-city data. Shape only, to show the graph wiring:
  //   venue ──< event ──< performance >── artist
  const venues = [
    {
      slug: "example-room",
      name: "The Example Room",
      neighborhood: "Downtown",
      vibe_desc: "Low ceiling, loud guitars, sticky floor.",
    },
  ];

  for (const v of venues) {
    const { error } = await db.from("venues").upsert(v, { onConflict: "slug" });
    if (error) throw error;
  }

  console.log(`Seeded ${venues.length} venue(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
