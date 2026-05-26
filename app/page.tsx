import type { Metadata } from "next";
import HomeExperience from "./HomeExperience";
import {
  defaultDescription,
  defaultTitle,
  homepageStructuredData,
  publicPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata("/", defaultTitle, defaultDescription);

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageStructuredData()).replace(/</g, "\\u003c"),
        }}
      />
      <HomeExperience />
    </>
  );
}
