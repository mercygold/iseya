import type { Metadata } from "next";
import HomeExperience from "./HomeExperience";
import {
  defaultDescription,
  defaultTitle,
  publicPageMetadata,
  siteName,
  siteUrl,
} from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata("/", defaultTitle, defaultDescription);

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: defaultDescription,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jormp LLC",
    alternateName: siteName,
    url: siteUrl,
    logo: `${siteUrl}/brand/iseya-logo2.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomeExperience />
    </>
  );
}
