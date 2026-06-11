import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

// Dynamic sitemap of every venue/artist slug (public-pages skill §2).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const db = await createClient();

  const [{ data: venues }, { data: artists }] = await Promise.all([
    db.from("venues").select("slug"),
    db.from("artists").select("slug"),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...((venues ?? []) as Array<{ slug: string }>).map((v) => ({
      url: `${base}/venue/${v.slug}`,
      changeFrequency: "weekly" as const,
    })),
    ...((artists ?? []) as Array<{ slug: string }>).map((a) => ({
      url: `${base}/artist/${a.slug}`,
      changeFrequency: "weekly" as const,
    })),
  ];
}
