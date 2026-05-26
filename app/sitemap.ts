import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/recruiters`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/institutions`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/demo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/demo/recruiter`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/demo/candidate`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/demo/institution`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
