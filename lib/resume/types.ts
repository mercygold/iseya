export type ResumeHeader = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
};

export type ResumeExperience = {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  employmentType: string;
  bullets: string[];
};

export type ResumeProject = {
  title: string;
  organization: string;
  bullets: string[];
};

export type ResumeEducation = {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
};

export type AdditionalResumeSection = {
  heading: string;
  items: string[];
};

export type CanonicalResume = {
  header: ResumeHeader;
  professionalSummary: string;
  coreSkills: string[];
  professionalExperience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certifications: string[];
  leadership: string[];
  awards: string[];
  volunteerExperience: string[];
  publications: string[];
  additionalSections: AdditionalResumeSection[];
};

export type ResumeValidationIssue = {
  code: string;
  message: string;
  section?: string;
};

export type ResumeValidationResult = {
  resume: CanonicalResume;
  issues: ResumeValidationIssue[];
};

export type CandidateSeniority = "entry-level" | "mid-level" | "senior" | "executive";

export type ResumeIntelligenceStrategy = {
  seniority: CandidateSeniority;
  strongestSignals: string[];
  suppressedContentCount: number;
  sectionOrder: string[];
};

export type SemanticSectionType =
  | "professionalSummary"
  | "coreSkills"
  | "professionalExperience"
  | "projects"
  | "education"
  | "certifications"
  | "leadership"
  | "awards"
  | "volunteerExperience"
  | "publications"
  | "additionalSections";

export type SemanticClassification = {
  sectionType: SemanticSectionType;
  confidenceScore: number;
  scores: Record<SemanticSectionType, number>;
};

export type RenderResumeSection = {
  id: string;
  title: string;
  kind:
    | "summary"
    | "skills"
    | "experience"
    | "projects"
    | "education"
    | "list"
    | "additional";
  content:
    | string
    | string[]
    | ResumeExperience[]
    | ResumeProject[]
    | ResumeEducation[]
    | AdditionalResumeSection;
};

export type RenderResumeState = {
  header: ResumeHeader;
  sections: RenderResumeSection[];
  plainText: string;
  validationIssues: ResumeValidationIssue[];
};
