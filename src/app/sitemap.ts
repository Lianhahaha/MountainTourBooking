import type { MetadataRoute } from "next";
import { getAllHikingDays } from "@/lib/hiking-days-file";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const days = await getAllHikingDays();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/book`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/hikes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const albumRoutes: MetadataRoute.Sitemap = days.map((day) => ({
    url: `${base}/hikes/${day.id}`,
    lastModified: day.updatedAt ? new Date(day.updatedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...albumRoutes];
}
