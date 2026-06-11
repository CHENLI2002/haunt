import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// venue/[slug] — SSR public page. SEO is MANDATORY here (public-pages skill §1–§2):
// the crawler must receive real content (character + history) in the first-paint HTML.
// Renders: character (vibe_desc) + history archive (performances ⨝ events) + a follow island.

type Params = { params: Promise<{ slug: string }> };

async function getVenue(slug: string) {
  const db = await createClient();
  const { data } = await db
    .from("venues")
    .select(
      "id, slug, name, neighborhood, vibe_desc, hero_media, " +
        "events(id, title, starts_at, status, performances(billing_order, artists(slug, name)))",
    )
    .eq("slug", slug)
    .order("starts_at", { referencedTable: "events", ascending: false })
    .single();
  // Loose typing until `pnpm db:types` generates the real schema types.
  return data as VenueWithArchive | null;
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) return {};
  const title = venue.neighborhood
    ? `${venue.name} · ${venue.neighborhood}`
    : venue.name;
  const description =
    venue.vibe_desc ?? `Live shows and history at ${venue.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/venue/${venue.slug}` },
    openGraph: {
      title,
      description,
      images: [`/venue/${venue.slug}/opengraph-image`],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function VenuePage({ params }: Params) {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) notFound();

  // schema.org MusicVenue — helps Google emit rich results (public-pages skill §2).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicVenue",
    name: venue.name,
    address: venue.neighborhood ?? undefined,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1>{venue.name}</h1>
      {venue.neighborhood && <p>{venue.neighborhood}</p>}
      {venue.vibe_desc && <p>{venue.vibe_desc}</p>}

      {/* TODO: <FollowButton targetType="venue" targetId={venue.id} /> — client island */}

      <section>
        <h2>History</h2>
        {/* performances ⨝ events — the "free" archive query (data-model skill §3). */}
        <ul>
          {venue.events?.map((e) => (
            <li key={e.id}>
              <time dateTime={e.starts_at}>{e.starts_at}</time>
              {" — "}
              {e.title ??
                e.performances
                  ?.map((p) => p.artists?.name)
                  .filter(Boolean)
                  .join(", ")}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

// Local shape for the nested select (replace with generated types after `pnpm db:types`).
type VenueWithArchive = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string | null;
  vibe_desc: string | null;
  hero_media: string | null;
  events: Array<{
    id: string;
    title: string | null;
    starts_at: string;
    status: string;
    performances: Array<{
      billing_order: number | null;
      artists: { slug: string; name: string } | null;
    }>;
  }> | null;
};
