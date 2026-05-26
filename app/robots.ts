import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/manage",
        "/admin",
        "/account",
        "/dashboard",
        "/workspace",
        "/applications",
        "/recruiter/dashboard",
        "/recruiters/dashboard",
        "/recruiters/onboarding",
        "/recruiters/jobs",
        "/institutions/dashboard",
        "/institutions/onboarding",
        "/login",
        "/signup",
        "/reset-password",
        "/billing/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
