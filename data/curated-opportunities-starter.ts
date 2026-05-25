export type CuratedOpportunitySeed = {
  title: string;
  company: string;
  location: string;
  country: string;
  workplace_type: "remote" | "hybrid" | "onsite" | "not_specified";
  employment_type:
    | "full-time"
    | "part-time"
    | "contract"
    | "internship"
    | "temporary"
    | "not_specified";
  salary_range?: string;
  external_apply_url: string;
  source_name:
    | "Company Careers"
    | "Greenhouse"
    | "Lever"
    | "Ashby"
    | "Indeed discovery"
    | "LinkedIn discovery"
    | "Other"
    | "Needs verification";
  source_description: "Sourced from active external hiring channels";
  opportunity_type: "curated_opportunity";
  status: "draft";
  description: string;
  skills_keywords?: string[];
  application_deadline?: string;
};

/*
 * Add the validated starter opportunity records here before using the admin
 * importer. Records are intentionally not fabricated: the referenced 40-job
 * source list is not present in this repository.
 */
export const curatedOpportunitiesStarter: readonly CuratedOpportunitySeed[] = [];
