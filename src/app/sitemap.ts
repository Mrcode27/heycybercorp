import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { SITE_URL } from "@/lib/site";

// Course slugs come from Convex at request time (same reason the catalogue pages
// are force-dynamic: there is no Convex data at build time).
export const dynamic = "force-dynamic";

const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/formations", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tarifs", priority: 0.8, changeFrequency: "monthly" },
  { path: "/entreprise", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // A Convex hiccup must not take the whole sitemap down — serving the static
  // routes is far better than serving a 500 to a crawler.
  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await fetchQuery(api.courses.listPublished, {});
    courseEntries = courses.map((c) => ({
      url: `${SITE_URL}/formations/${c.slug}`,
      lastModified: new Date(c._creationTime),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    courseEntries = [];
  }

  return [...staticEntries, ...courseEntries];
}
