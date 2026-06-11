import type { Metadata } from "next";

// artist/[slug] — v1 (plan §7). Mirrors the venue page: SSR + SEO, plus
// "where do they play next" and home venues (performances GROUP BY venue_id).
// Stubbed until v1.

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug, description: `Shows by ${slug}.` };
}

export default async function ArtistPage({ params }: Params) {
  const { slug } = await params;
  return (
    <main>
      <h1>{slug}</h1>
      <p>Artist pages ship in v1 — see docs/venue-first-tech-plan.md §7.</p>
    </main>
  );
}
