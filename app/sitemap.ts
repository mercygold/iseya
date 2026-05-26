import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/demo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/demo/recruiter`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/recruiters`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/institutions`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
