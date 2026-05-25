export type CuratedOpportunitySeed = {
  title: string;
  company: string;
  location: string;
  country: string;
  workplace_type: string;
  employment_type: string;
  salary_range?: string | null;
  external_apply_url: string;
  source_name: string;
  source_description: string;
  opportunity_type: string;
  status: string;
  description: string;
  skills_keywords?: string[];
  application_deadline?: string | null;
  needs_verification?: boolean;
};
