import type { Metadata } from "next";
import HomeExperience from "./HomeExperience";
import {
  defaultDescription,
  defaultTitle,
  homepageStructuredData,
  publicPageMetadata,
} from "@/lib/seo";
import curatedOpportunitiesData from "@/data/created-opportunities.data.json";
import { getActiveJobsCount, getUniqueJobCountries } from "@/lib/jobsMetrics";

export const metadata: Metadata = publicPageMetadata("/", defaultTitle, defaultDescription);

export default function HomePage() {
  const activeJobCount = getActiveJobsCount(curatedOpportunitiesData);
  const countryCount = getUniqueJobCountries(curatedOpportunitiesData).length;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageStructuredData()).replace(/</g, "\\u003c"),
        }}
      />
      <HomeExperience
        homepageMetrics={{
          activeJobs: `${activeJobCount}+`,
          countries: `${countryCount}+`,
        }}
      />
    </>
  );
}
