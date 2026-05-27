"use client";

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Search,
  Settings,
  UsersRound,
  Zap,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Json } from "@/lib/database.types";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  FinalConversionCta,
  HowIseyaWorks,
  TrustAudienceSection,
} from "@/components/HomeProductStory";
import {
  canUseSubscriptionFeature,
  isProPlan,
  isStarterPlan,
  planDownloadLimit,
  planOptimizationLimit,
  planSavedVersionLimit,
  subscriptionLabel,
  normalizeSubscriptionPlan,
  type SubscriptionFeature,
  type SubscriptionPlanId,
} from "@/lib/subscription";
import { useAuth } from "./auth/AuthProvider";

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2";
const buttonBaseClass =
  `inline-flex items-center justify-center rounded-md font-semibold transition duration-150 ease-out hover:shadow-md active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass}`;
const buttonSizeSmClass = "min-h-9 px-3.5 py-2 text-xs";
const buttonSizeMdClass = "min-h-10 px-4 py-2 text-sm";
const primaryButtonClass = `${buttonBaseClass} border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]`;
const secondaryButtonClass = `${buttonBaseClass} border border-[var(--iseya-border)] bg-[var(--iseya-white)] text-[var(--iseya-navy)] hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]`;
const dangerButtonClass = `${buttonBaseClass} border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50`;
const menuItemClass =
  `block w-full rounded-md px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-[#FFF8E6] hover:text-[var(--iseya-navy)] ${focusRingClass}`;

type TemplateId =
  | "executive-navy"
  | "modern-product"
  | "ats-clean"
  | "consulting-classic"
  | "tech-minimal"
  | "bold-leadership"
  | "ats-professional"
  | "executive-modern"
  | "academic-research"
  | "finance-fintech"
  | "healthcare-health-it"
  | "creative-portfolio"
  | "legal-policy"
  | "product-saas";
type ThemeId =
  | "deep-navy"
  | "modern-teal"
  | "royal-blue"
  | "emerald"
  | "slate-gray"
  | "minimal-black"
  | "purple-executive";

type TailoringResult = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendedKeywords: string[];
  summary: string;
  skills: string[];
  bullets: string[];
  rewrittenResume: string;
  coverLetter: string;
  scoreNotes: string[];
  matchBreakdown: MatchBreakdown;
  positioningStrategy: string;
  improvementNotes: string[];
  riskFlags: string[];
  topStrengths: string[];
  gapsToFix: string[];
  bulletImprovementSuggestions: string[];
  atsReadiness: string;
  recruiterReadability: string;
  industryFit: string;
  coach: CoachData;
  advancedAnalysis: AdvancedAnalysis;
  linkedin: LinkedInKit;
  applicationKit: ApplicationKit;
  extractedResumeJson?: unknown;
  optimizedResumeJson?: unknown;
  renderResumeState?: unknown;
};

type LinkedInKit = {
  headline: string;
  about: string;
  featuredProjects: string;
  topSkills: string[];
  recruiterKeywords: string[];
  openToWorkPositioning: string;
  networkingMessage: string;
  recruiterOutreachMessage: string;
};

type ApplicationKit = {
  recruiterEmail: string;
  followUpEmail: string;
  referralRequest: string;
  connectionRequest: string;
  interviewIntroPitch: string;
  tellMeAboutYourself: string;
};

type PersonalBranding = {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedInUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
  profileImageDataUrl: string;
};

type OutputTab = "resume" | "cover" | "linkedin" | "application" | "preview";

type MatchBreakdown = {
  roleFit: number;
  industryFit: number;
  requiredSkillsMatch: number;
  preferredSkillsMatch: number;
  metricStrength: number;
  seniorityAlignment: number;
  projectRelevance: number;
  atsReadability: number;
};

type SectionCritique = {
  headerContact: string[];
  professionalSummary: string[];
  skills: string[];
  experience: string[];
  projects: string[];
  educationCertifications: string[];
  coverLetter: string[];
};

type WeakBulletSuggestion = {
  original: string;
  issueType: string;
  issue: string;
  strongerVersion: string;
};

type CoachData = {
  overallRecruiterImpression: string;
  whyThisScore: string[];
  topStrengths: string[];
  topGaps: string[];
  atsRisks: string[];
  recruiterReadabilityScore: number;
  seniorityAlignment: string;
  industryAlignment: string;
  keywordDensityNotes: string[];
  rolePositioningRecommendation: string;
  sectionCritique: SectionCritique;
  weakBullets: WeakBulletSuggestion[];
  recruiterObjections: string[];
};

type ReviewSimulation = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  concerns: string[];
  interviewProbability: string;
};

type BulletImprovement = {
  original: string;
  strongerVersion: string;
  atsOptimizedVersion: string;
  executiveVersion: string;
  conciseVersion: string;
  metricFocusedVersion: string;
  suggestedMetrics: string[];
};

type AdvancedAnalysis = {
  recruiterSimulation: {
    atsScreening: ReviewSimulation;
    recruiterReview: ReviewSimulation;
    hiringManagerReview: ReviewSimulation;
  };
  keyScores: {
    likelihoodOfInterview: number;
    atsPassProbability: number;
    executiveReadiness: number;
    technicalDepth: number;
    leadershipStrength: number;
    industryAlignment: number;
  };
  interviewPrep: {
    whyYouFitThisRole: string;
    likelyQuestions: string[];
    behavioralQuestions: string[];
    technicalQuestions: string[];
    executiveQuestions: string[];
    industrySpecificQuestions: string[];
    potentialRecruiterObjections: string[];
  };
  gapAnalysis: {
    missingKeywords: string[];
    weakExperienceAreas: string[];
    seniorityGaps: string[];
    leadershipGaps: string[];
    technicalGaps: string[];
    educationAlignment: string[];
    certificationAlignment: string[];
    recommendations: string[];
    wordingChanges: string[];
  };
  jobDescriptionIntelligence: {
    requiredSkills: string[];
    preferredSkills: string[];
    hiddenPriorities: string[];
    likelyHiringGoals: string[];
    leadershipExpectations: string[];
    senioritySignals: string[];
    keywordMap: string[];
    alignmentSummary: string;
    roleStrategy: string;
  };
  bulletImprovements: BulletImprovement[];
  aiSuggestions: string[];
  positioningMode: PositioningMode;
};

type PositioningMode =
  | "Executive"
  | "Technical"
  | "Product"
  | "Academic"
  | "Consulting"
  | "Startup"
  | "Enterprise"
  | "Research"
  | "Operations";

type AiSettings = {
  model: string;
  creativity: number;
  atsStrictness: number;
  toneStyle: string;
  aggressiveOptimization: boolean;
  positioningMode: PositioningMode;
};

type ResumeSection = {
  heading: string;
  body: string[];
  bullets: string[];
  lines?: string[];
};

type ExperienceEntry = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
};

type StructuredResume = {
  header?: PersonalBranding;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  projects: string[];
  education: string[];
  certifications: string[];
  publications: string[];
  leadership: string[];
  awards: string[];
  volunteerExperience: string[];
  tools: string[];
  additionalSections: ResumeSection[];
  unmatchedSections?: ResumeSection[];
};

type EditableExperienceEntry = Omit<ExperienceEntry, "bullets"> & {
  bulletsText: string;
};

type EditableProjectEntry = {
  id: string;
  name: string;
  context: string;
  tools: string;
  details: string;
};

type EditableEducationEntry = {
  id: string;
  school: string;
  degree: string;
  location: string;
  dates: string;
  details: string;
};

type EditableCertificationEntry = {
  id: string;
  name: string;
  issuer: string;
  year: string;
};

type EditableResumeDraft = Omit<
  StructuredResume,
  "summary" | "skills" | "experience" | "projects" | "education" | "certifications" | "publications" | "tools"
> & {
  summaryText: string;
  skillsText: string;
  experience: EditableExperienceEntry[];
  projects: EditableProjectEntry[];
  education: EditableEducationEntry[];
  certifications: EditableCertificationEntry[];
  publicationsText: string;
  toolsText: string;
};

type EditableResumeSession = {
  resumeText: string;
  draft: EditableResumeDraft;
};

type AiOptimizationAction =
  | "Optimize Summary"
  | "Improve Skills"
  | "Rewrite Bullet"
  | "Make More Executive"
  | "Make More Technical"
  | "Make More ATS-Friendly"
  | "Shorten"
  | "Strengthen Metrics"
  | "Tailor to Industry"
  | "Improve Recruiter Readability"
  | "Optimize this section"
  | "Rewrite this section"
  | "Improve for selected industry";

type UploadedSourceFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  extractionStatus?: ExtractionStatus;
  warnings?: string[];
  extractedText?: string;
};

type ExtractionStatus =
  | "extracted"
  | "extraction_failed"
  | "ocr_required"
  | "unsupported_for_extraction"
  | "metadata_only"
  | "unsupported"
  | "failed";

type ExtractApiResponse = {
  extractedText: string;
  fileName: string;
  fileType: string;
  extractionStatus: ExtractionStatus;
  warnings: string[];
};

type SavedState = {
  masterResume: string;
  jobDescription: string;
  targetRole: string;
  industryTarget: IndustryTarget;
  template: TemplateId;
  theme: ThemeId;
  result: TailoringResult | null;
  uploadedFiles?: UploadedSourceFile[];
  aiSettings?: AiSettings;
  personalBranding: PersonalBranding;
};

type CloudResumeContent = SavedState & {
  savedVersions?: SavedResumeVersion[];
};

type UsageStats = {
  date: string;
  aiGenerations: number;
  exportsCreated: number;
  downloadsUsed: number;
  optimizationCreditsUsed: number;
};

type SavedResumeVersion = {
  id: string;
  name: string;
  targetRole: string;
  industryTarget: IndustryTarget;
  companyName: string;
  template: TemplateId;
  theme: ThemeId;
  createdAt: string;
  updatedAt: string;
  matchScore: number;
  masterResume: string;
  jobDescription: string;
  result: TailoringResult;
  uploadedFiles: UploadedSourceFile[];
  personalBranding: PersonalBranding;
};

type IndustryTarget =
  | "AI / Technology"
  | "SaaS"
  | "Healthcare IT"
  | "Health Informatics"
  | "Finance"
  | "Fintech"
  | "Banking"
  | "Strategy"
  | "Academia"
  | "Higher Education"
  | "Law / Legal Tech"
  | "Government"
  | "Operations"
  | "Supply Chain"
  | "Aviation"
  | "Energy"
  | "Manufacturing"
  | "Product Management"
  | "Technical Program Management"
  | "Project Management"
  | "Academic / Research"
  | "Finance / Fintech"
  | "Real Estate"
  | "Healthcare / Health IT"
  | "Consulting"
  | "Legal / Policy"
  | "Operations / Logistics"
  | "Marketing / Growth"
  | "General / ATS";

type TailorApiResponse = {
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  missingKeywords: string[];
  recommendedKeywords: string[];
  positioningStrategy: string;
  tailoredResume: string;
  coverLetter: string;
  improvementNotes: string[];
  riskFlags: string[];
  coaching?: CoachData;
  advancedAnalysis?: AdvancedAnalysis;
  linkedin?: LinkedInKit;
  applicationKit?: ApplicationKit;
  extractedResumeJson?: unknown;
  optimizedResumeJson?: unknown;
  renderResumeState?: unknown;
};

const storageKey = "resume-agent-state-v2";
const versionStorageKey = "iseya_resume_versions";
const usageStorageKey = "iseya_usage_stats";
const acceptedSourceFileTypes = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.ppt,.pptx";
const industryTargets: IndustryTarget[] = [
  "AI / Technology",
  "SaaS",
  "Healthcare IT",
  "Health Informatics",
  "Finance",
  "Fintech",
  "Banking",
  "Real Estate",
  "Consulting",
  "Strategy",
  "Academia",
  "Higher Education",
  "Law / Legal Tech",
  "Government",
  "Operations",
  "Supply Chain",
  "Aviation",
  "Energy",
  "Manufacturing",
  "Product Management",
  "Technical Program Management",
  "Project Management",
  "Academic / Research",
  "Finance / Fintech",
  "Healthcare / Health IT",
  "Legal / Policy",
  "Operations / Logistics",
  "Marketing / Growth",
  "General / ATS",
];
const positioningModes: PositioningMode[] = [
  "Executive",
  "Technical",
  "Product",
  "Academic",
  "Consulting",
  "Startup",
  "Enterprise",
  "Research",
  "Operations",
];
const defaultAiSettings: AiSettings = {
  model: "gpt-5.5",
  creativity: 25,
  atsStrictness: 75,
  toneStyle: "Executive concise",
  aggressiveOptimization: false,
  positioningMode: "Product",
};

const emptyPersonalBranding: PersonalBranding = {
  fullName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  location: "",
  linkedInUrl: "",
  portfolioUrl: "",
  websiteUrl: "",
  profileImageDataUrl: "",
};

const keywordBank = [
  "AI",
  "LLM",
  "SaaS",
  "Agile",
  "roadmap",
  "stakeholder",
  "analytics",
  "API",
  "CRM",
  "automation",
  "enterprise",
  "metrics",
  "customer discovery",
  "prompt engineering",
  "responsible AI",
  "cross-functional",
  "product strategy",
  "QA",
  "launch",
  "workflow",
  "requirements",
  "user research",
  "prioritization",
  "go-to-market",
  "data",
  "experimentation",
  "delivery",
  "technical",
  "integration",
  "leadership",
  "research",
  "publications",
  "teaching",
  "methodology",
  "ROI",
  "compliance",
  "EMR",
  "EHR",
  "workflow optimization",
  "banking",
  "fintech",
  "SaaS",
  "supply chain",
  "aviation",
  "manufacturing",
  "energy",
  "technical program management",
  "project management",
  "strategy",
  "legal tech",
];

const sampleResume = `Avery Morgan
Senior Product Manager
avery.morgan@example.com | (949) 555-0142 | Irvine, CA | linkedin.com/in/averymorgan

PROFESSIONAL SUMMARY
Product leader with eight years of experience delivering SaaS workflow products, translating customer needs into roadmap decisions, and guiding cross-functional launches across product, design, engineering, and operations.

CORE SKILLS
Product Strategy | Roadmapping | Agile Delivery | Jira | SQL | API Integrations | Stakeholder Management | Customer Discovery

PROFESSIONAL EXPERIENCE
Senior Product Manager - Meridian Cloud
Irvine, CA | Jan 2022 - Present
- Led roadmap delivery for a workflow automation portfolio serving 40 enterprise customers, improving feature adoption by 24%.
- Partnered with engineering and design to launch onboarding improvements that reduced time-to-value from 21 days to 14 days.
- Managed quarterly prioritization with sales, support, and operations leaders using customer evidence and product performance data.

Product Manager - Northstar Payments
Costa Mesa, CA | Jun 2018 - Dec 2021
- Delivered merchant reporting enhancements that reduced manual reconciliation effort by 30% across operations teams.
- Coordinated API integration requirements with compliance, engineering, and partner stakeholders for three platform releases.
- Established release-readiness reviews and issue triage practices that improved launch predictability.

PROJECTS
- Customer Health Dashboard | Consolidated product usage and support signals into an account health view for customer success planning.

EDUCATION
- University of California, Irvine | Bachelor of Science, Business Information Management | 2017

CERTIFICATIONS
- Certified Scrum Product Owner (CSPO), Scrum Alliance
- Pragmatic Institute Product Management Certification

ACHIEVEMENTS
- Recognized with the Meridian Cloud Product Excellence Award for cross-functional launch execution.
`;

const sampleJob = `Paste the target job description here.

Include the role title, company priorities, required skills, preferred skills, tools, responsibilities, seniority signals, and any keywords you want ISEYA to consider while tailoring your resume.`;

const restrictedSeedDataPatterns = [
  new RegExp(`\\b${["a", "nu"].join("")}\\b`, "i"),
  new RegExp(["mercy", "gold"].join(""), "i"),
  new RegExp(["jos", "hua"].join(""), "i"),
  new RegExp(["949", "510", "1667"].join(""), "i"),
  new RegExp(["mercy", "gold", "96"].join(""), "i"),
  new RegExp(["inves", "tofly"].join(""), "i"),
  new RegExp(["ja", "paul"].join(""), "i"),
];

function containsRestrictedSeedData(value: unknown): boolean {
  if (typeof value === "string") {
    return restrictedSeedDataPatterns.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsRestrictedSeedData(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => containsRestrictedSeedData(item));
  }

  return false;
}

const previewThemes: Record<
  ThemeId,
  {
    accentText: string;
    accentBorder: string;
    headerBg: string;
    headerText: string;
    subheadText: string;
    accentHex: string;
    headerHex: string;
    textHex: string;
  }
> = {
  "deep-navy": {
    accentText: "text-[#12345a]",
    accentBorder: "border-[#b7c6d8]",
    headerBg: "bg-[#0b1f3a]",
    headerText: "text-white",
    subheadText: "text-[#d8e4f2]",
    accentHex: "#12345a",
    headerHex: "#0b1f3a",
    textHex: "#18181b",
  },
  "modern-teal": {
    accentText: "text-teal-700",
    accentBorder: "border-teal-200",
    headerBg: "bg-teal-800",
    headerText: "text-white",
    subheadText: "text-teal-50",
    accentHex: "#0f766e",
    headerHex: "#115e59",
    textHex: "#18181b",
  },
  "royal-blue": {
    accentText: "text-blue-700",
    accentBorder: "border-blue-200",
    headerBg: "bg-blue-800",
    headerText: "text-white",
    subheadText: "text-blue-50",
    accentHex: "#1d4ed8",
    headerHex: "#1e40af",
    textHex: "#18181b",
  },
  emerald: {
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    headerBg: "bg-emerald-800",
    headerText: "text-white",
    subheadText: "text-emerald-50",
    accentHex: "#047857",
    headerHex: "#065f46",
    textHex: "#18181b",
  },
  "slate-gray": {
    accentText: "text-slate-700",
    accentBorder: "border-slate-300",
    headerBg: "bg-slate-700",
    headerText: "text-white",
    subheadText: "text-slate-100",
    accentHex: "#334155",
    headerHex: "#334155",
    textHex: "#18181b",
  },
  "minimal-black": {
    accentText: "text-zinc-800",
    accentBorder: "border-zinc-300",
    headerBg: "bg-zinc-900",
    headerText: "text-white",
    subheadText: "text-zinc-200",
    accentHex: "#27272a",
    headerHex: "#18181b",
    textHex: "#18181b",
  },
  "purple-executive": {
    accentText: "text-purple-800",
    accentBorder: "border-purple-200",
    headerBg: "bg-purple-900",
    headerText: "text-white",
    subheadText: "text-purple-100",
    accentHex: "#6b21a8",
    headerHex: "#581c87",
    textHex: "#18181b",
  },
};

type TemplateFamily =
  | "ats"
  | "executive"
  | "consulting"
  | "academic"
  | "finance"
  | "healthcare"
  | "creative"
  | "legal"
  | "product"
  | "technical";

type TemplateProfile = {
  label: string;
  description: string;
  family: TemplateFamily;
  allowImage: boolean;
  sectionOrder: string[];
  headingLabel: string;
};

const professionalResumeSectionOrder = [
  "SUMMARY",
  "SKILLS",
  "EXPERIENCE",
  "PROJECTS",
  "EDUCATION",
  "CERTIFICATIONS",
  "ACHIEVEMENTS",
  "TOOLS",
  "LEADERSHIP",
  "AWARDS",
  "VOLUNTEER",
  "PUBLICATIONS",
  "RESEARCH",
];

const templates: Record<TemplateId, TemplateProfile> = {
  "executive-navy": {
    label: "Executive Navy",
    description: "Formal preview with a strong navy header and classic spacing.",
    family: "executive",
    allowImage: true,
    headingLabel: "Leadership-first",
    sectionOrder: professionalResumeSectionOrder,
  },
  "modern-product": {
    label: "Modern Product",
    description: "Product-focused preview with clean section rhythm.",
    family: "product",
    allowImage: false,
    headingLabel: "Product outcomes",
    sectionOrder: professionalResumeSectionOrder,
  },
  "ats-clean": {
    label: "ATS Clean",
    description: "Minimal preview optimized for straightforward scanning.",
    family: "ats",
    allowImage: false,
    headingLabel: "Parser-friendly",
    sectionOrder: professionalResumeSectionOrder,
  },
  "consulting-classic": {
    label: "Consulting Classic",
    description: "Traditional consulting-style preview with crisp section rules.",
    family: "consulting",
    allowImage: false,
    headingLabel: "Consulting impact",
    sectionOrder: professionalResumeSectionOrder,
  },
  "tech-minimal": {
    label: "Tech Minimal",
    description: "Lean technical preview with compact spacing and clear hierarchy.",
    family: "technical",
    allowImage: false,
    headingLabel: "Technical clarity",
    sectionOrder: professionalResumeSectionOrder,
  },
  "bold-leadership": {
    label: "Bold Leadership",
    description: "High-impact preview with a stronger leadership-oriented header.",
    family: "executive",
    allowImage: true,
    headingLabel: "Executive scope",
    sectionOrder: professionalResumeSectionOrder,
  },
  "ats-professional": {
    label: "ATS Professional",
    description: "Plain parser-friendly layout with simple headings, tight spacing, and no image.",
    family: "ats",
    allowImage: false,
    headingLabel: "Parser-friendly",
    sectionOrder: professionalResumeSectionOrder,
  },
  "executive-modern": {
    label: "Executive Modern",
    description: "Premium leadership hierarchy with a strong header, open spacing, and executive emphasis.",
    family: "executive",
    allowImage: true,
    headingLabel: "Leadership-first",
    sectionOrder: professionalResumeSectionOrder,
  },
  "academic-research": {
    label: "Academic Research",
    description: "Academic preview with formal typography for research, teaching, methods, and credentials.",
    family: "academic",
    allowImage: false,
    headingLabel: "Academic clarity",
    sectionOrder: professionalResumeSectionOrder,
  },
  "finance-fintech": {
    label: "Finance / Fintech",
    description: "Metrics-forward structure for impact, risk, compliance, controls, and financial systems.",
    family: "finance",
    allowImage: false,
    headingLabel: "Impact and controls",
    sectionOrder: professionalResumeSectionOrder,
  },
  "healthcare-health-it": {
    label: "Healthcare / Health IT",
    description: "Clinical-systems layout for compliance, integration, credentials, and care operations.",
    family: "healthcare",
    allowImage: false,
    headingLabel: "Systems and compliance",
    sectionOrder: professionalResumeSectionOrder,
  },
  "creative-portfolio": {
    label: "Creative Portfolio",
    description: "Creative preview with optional image, visual accents, and stronger link presentation.",
    family: "creative",
    allowImage: true,
    headingLabel: "Creative clarity",
    sectionOrder: professionalResumeSectionOrder,
  },
  "legal-policy": {
    label: "Legal / Policy",
    description: "Formal hierarchy for governance, policy, publications, compliance, and advisory work.",
    family: "legal",
    allowImage: false,
    headingLabel: "Formal governance",
    sectionOrder: professionalResumeSectionOrder,
  },
  "product-saas": {
    label: "Product / SaaS",
    description: "Product outcomes layout emphasizing roadmap, users, APIs, experiments, and business metrics.",
    family: "product",
    allowImage: false,
    headingLabel: "Product outcomes",
    sectionOrder: professionalResumeSectionOrder,
  },
};

const standardTemplateIds = new Set<TemplateId>([
  "executive-navy",
  "modern-product",
  "ats-clean",
]);

function isPremiumTemplate(template: TemplateId) {
  return !standardTemplateIds.has(template);
}

function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && value in templates;
}

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in previewThemes;
}

function templateProfile(template: TemplateId) {
  return templates[template] ?? templates["executive-navy"];
}

function sectionOrderScore(section: ResumeSection, template: TemplateId) {
  const heading = section.heading.toUpperCase();
  const order = templateProfile(template).sectionOrder;
  const index = order.findIndex((token) => heading.includes(token));

  return index === -1 ? order.length + 1 : index;
}

function orderedResumeSections(sections: ResumeSection[], template: TemplateId) {
  return sections
    .map((section, index) => ({ section, index }))
    .sort((left, right) => {
      const leftScore = sectionOrderScore(left.section, template);
      const rightScore = sectionOrderScore(right.section, template);

      return leftScore === rightScore ? left.index - right.index : leftScore - rightScore;
    })
    .map(({ section }) => section);
}

function preparedPreviewSections(sections: ResumeSection[], template: TemplateId) {
  const prepared = new Map<string, ResumeSection>();

  for (const section of sections) {
    const heading = canonicalResumeHeading(section.heading);

    if (!heading || isSourceArtifactHeading(heading) || isPlaceholderResumeText(heading)) {
      continue;
    }

    const body = uniqueStrings(section.body);
    const bullets = uniqueStrings(section.bullets);
    const lines = Array.from(
      new Set(
        (section.lines ?? [])
          .map((line) => line.trim())
          .filter(
            (line) =>
              line &&
              !isSourceArtifactHeading(cleanEditorText(line)) &&
              !isPlaceholderResumeText(cleanEditorText(line)),
          ),
      ),
    );

    if (body.length === 0 && bullets.length === 0 && lines.length === 0) {
      continue;
    }

    const existing = prepared.get(heading);

    if (existing) {
      prepared.set(heading, {
        heading,
        body: uniqueStrings([...existing.body, ...body]),
        bullets: uniqueStrings([...existing.bullets, ...bullets]),
        lines: Array.from(new Set([...(existing.lines ?? []), ...lines])),
      });
    } else {
      prepared.set(heading, { heading, body, bullets, lines });
    }
  }

  const experienceBullets = new Set(
    (prepared.get("PROFESSIONAL EXPERIENCE")?.bullets ?? []).map((bullet) =>
      cleanExportBullet(bullet).toLowerCase(),
    ),
  );
  const achievements = prepared.get("ACHIEVEMENTS");

  if (achievements) {
    const uniqueAchievements = achievements.bullets.filter(
      (bullet) => !experienceBullets.has(cleanExportBullet(bullet).toLowerCase()),
    );

    if (achievements.body.length === 0 && uniqueAchievements.length === 0) {
      prepared.delete("ACHIEVEMENTS");
    } else {
      prepared.set("ACHIEVEMENTS", {
        ...achievements,
        bullets: uniqueAchievements,
      });
    }
  }

  return orderedResumeSections(Array.from(prepared.values()), template);
}

function isIndustryTarget(value: unknown): value is IndustryTarget {
  return typeof value === "string" && industryTargets.includes(value as IndustryTarget);
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function extractKeywords(text: string) {
  const normalized = normalizeText(text);

  return keywordBank.filter((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    return normalized.includes(normalizedKeyword);
  });
}

function extractSignals(text: string) {
  const normalized = normalizeText(text);
  return Array.from(new Set(normalized.match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []));
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function dedupeKeywords(keywords: string[]) {
  return Array.from(new Set(keywords));
}

function keywordMatchRatio(expected: string[], actual: string[]) {
  if (expected.length === 0) {
    return 1;
  }

  const actualSet = new Set(actual);
  return expected.filter((keyword) => actualSet.has(keyword)).length / expected.length;
}

function extractRoleTerms(text: string) {
  return extractSignals(text).filter(
    (word) =>
      ![
        "manager",
        "director",
        "owner",
        "lead",
        "senior",
        "principal",
        "specialist",
        "role",
        "title",
      ].includes(word),
  );
}

function inferJobKeywordGroups(jobDescription: string) {
  const requiredKeywords: string[] = [];
  const preferredKeywords: string[] = [];
  const preferredPattern =
    /\b(preferred|nice to have|plus|bonus|desired|ideally|familiarity)\b/i;

  for (const sentence of splitSentences(jobDescription)) {
    const sentenceKeywords = extractKeywords(sentence);

    if (preferredPattern.test(sentence)) {
      preferredKeywords.push(...sentenceKeywords);
    } else {
      requiredKeywords.push(...sentenceKeywords);
    }
  }

  const required = dedupeKeywords(requiredKeywords);
  const preferred = dedupeKeywords(
    preferredKeywords.filter((keyword) => !required.includes(keyword)),
  );
  const allJobKeywords = extractKeywords(jobDescription);

  return {
    required: required.length > 0 ? required : allJobKeywords,
    preferred,
  };
}

function roleAlignmentScore(
  masterResume: string,
  jobDescription: string,
  targetRole: string,
) {
  const resumeHeader = masterResume.split(/\r?\n/).slice(0, 6).join(" ");
  const jobRole = targetRole || firstMeaningfulLine(jobDescription, "");
  const roleTerms = extractRoleTerms(jobRole);

  if (roleTerms.length === 0) {
    return 1;
  }

  const resumeSignals = new Set(extractSignals(resumeHeader));
  const matchedRoleTerms = roleTerms.filter((term) => resumeSignals.has(term));
  return matchedRoleTerms.length / roleTerms.length;
}

function metricsImpactScore(masterResume: string) {
  const normalized = normalizeText(masterResume);
  const metricHits = masterResume.match(/(\$?\d[\d,.]*\+?%?|\b\d+\+?\b)/g) ?? [];
  const impactTerms = [
    "increased",
    "reduced",
    "improved",
    "grew",
    "launched",
    "led",
    "managed",
    "built",
    "delivered",
    "optimized",
    "automated",
    "coordinated",
  ].filter((term) => normalized.includes(term));

  return Math.min(1, metricHits.length / 3) * 0.45 + Math.min(1, impactTerms.length / 5) * 0.55;
}

function aiProjectScore(masterResume: string, jobDescription: string) {
  const aiPattern = /\b(ai|a\/i|ml|machine learning|llm|prompt|model|automation)\b/i;

  if (!aiPattern.test(jobDescription)) {
    return 1;
  }

  const normalizedResume = normalizeText(masterResume);
  const aiTerms = [
    "ai",
    "ml",
    "machine learning",
    "llm",
    "prompt",
    "automation",
    "assistant",
    "model",
  ];
  const matches = aiTerms.filter((term) => normalizedResume.includes(term));

  return Math.min(1, matches.length / 3);
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function articleFor(value: string) {
  return /^[aeiou]/i.test(value.trim()) ? "an" : "a";
}

function firstMeaningfulLine(text: string, fallback: string) {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? fallback
  );
}

function findResumeLine(text: string, patterns: RegExp[]) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .find((line) => patterns.some((pattern) => pattern.test(line)));
}

function buildCoverLetterFromInputs(
  resumeText: string,
  targetRole: string,
  jobDescription: string,
) {
  const candidateName = firstMeaningfulLine(resumeText, "");
  const role = titleCase(
    targetRole || firstMeaningfulLine(jobDescription, "Target Role"),
  );
  const resumeKeywords = extractKeywords(resumeText);
  const jobKeywords = extractKeywords(jobDescription);
  const alignedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const primaryStrengths =
    alignedKeywords.slice(0, 4).join(", ") ||
    resumeKeywords.slice(0, 4).join(", ") ||
    "role-relevant execution, stakeholder alignment, and practical delivery";
  const impactLine = cleanExportBullet(
    findResumeLine(resumeText, [
      /\$?\d[\d,.]*\+?%?/,
      /\b(led|launched|built|delivered|improved|managed|automated|coordinated)\b/i,
    ]) ??
      "I have led cross-functional work from requirements through delivery, aligning business goals with practical implementation.",
  );
  const jobFocus =
    firstMeaningfulLine(jobDescription, role).replace(/[.。]\s*$/, "");
  const signature = candidateName ? `\n${candidateName}` : "";

  return `Dear Hiring Team,

I am interested in the ${role} role because your focus on ${jobFocus} aligns with my verified experience in ${primaryStrengths}.

One relevant example is: ${impactLine} This reflects how I approach work: clarify priorities, align stakeholders, and turn requirements into practical outcomes.

I would welcome the opportunity to bring this mix of judgment, execution discipline, and role-relevant experience to your team.

Sincerely,
${signature}`.trim();
}

function scoreResume(
  masterResume: string,
  jobDescription: string,
  matchedKeywords: string[],
  requiredKeywords: string[],
  preferredKeywords: string[],
  targetRole: string,
) {
  const requiredScore = keywordMatchRatio(requiredKeywords, matchedKeywords);
  const preferredScore = keywordMatchRatio(preferredKeywords, matchedKeywords);
  const roleScore = roleAlignmentScore(masterResume, jobDescription, targetRole);
  const metricsScore = metricsImpactScore(masterResume);
  const aiScore = aiProjectScore(masterResume, jobDescription);
  const score = Math.round(
    Math.min(
      100,
      Math.max(
        20,
        requiredScore * 35 +
          preferredScore * 20 +
          roleScore * 20 +
          metricsScore * 15 +
          aiScore * 10,
      ),
    ),
  );

  return {
    score,
    notes: [
      `Required keyword match: ${Math.round(requiredScore * 35)}/35`,
      `Preferred keyword match: ${Math.round(preferredScore * 20)}/20`,
      `Role/title alignment: ${Math.round(roleScore * 20)}/20`,
      `Metrics/impact language: ${Math.round(metricsScore * 15)}/15`,
      `Technical project relevance: ${Math.round(aiScore * 10)}/10`,
    ],
  };
}

function buildLocalMatchBreakdown(score: number): MatchBreakdown {
  return {
    roleFit: Math.min(100, score + 2),
    industryFit: Math.min(100, score),
    requiredSkillsMatch: Math.min(100, score + 4),
    preferredSkillsMatch: Math.max(0, score - 6),
    metricStrength: Math.max(0, score - 10),
    seniorityAlignment: Math.min(100, score + 3),
    projectRelevance: Math.min(100, score + 1),
    atsReadability: Math.min(100, score + 5),
  };
}

function safeScore(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function safeMatchBreakdown(value: unknown, fallbackScore: number): MatchBreakdown {
  const fallback = buildLocalMatchBreakdown(fallbackScore);
  const breakdown =
    value && typeof value === "object" ? (value as Partial<MatchBreakdown>) : {};

  return {
    roleFit: safeScore(breakdown.roleFit, fallback.roleFit),
    industryFit: safeScore(breakdown.industryFit, fallback.industryFit),
    requiredSkillsMatch: safeScore(
      breakdown.requiredSkillsMatch,
      fallback.requiredSkillsMatch,
    ),
    preferredSkillsMatch: safeScore(
      breakdown.preferredSkillsMatch,
      fallback.preferredSkillsMatch,
    ),
    metricStrength: safeScore(breakdown.metricStrength, fallback.metricStrength),
    seniorityAlignment: safeScore(
      breakdown.seniorityAlignment,
      fallback.seniorityAlignment,
    ),
    projectRelevance: safeScore(
      breakdown.projectRelevance,
      fallback.projectRelevance,
    ),
    atsReadability: safeScore(breakdown.atsReadability, fallback.atsReadability),
  };
}

function scoreNotesFromBreakdown(breakdown: MatchBreakdown) {
  return [
    `Role fit: ${Math.round(breakdown.roleFit)}/100`,
    `Industry fit: ${Math.round(breakdown.industryFit)}/100`,
    `Required skills match: ${Math.round(breakdown.requiredSkillsMatch)}/100`,
    `Preferred skills match: ${Math.round(breakdown.preferredSkillsMatch)}/100`,
    `Metric strength: ${Math.round(breakdown.metricStrength)}/100`,
    `Seniority alignment: ${Math.round(breakdown.seniorityAlignment)}/100`,
    `Project relevance: ${Math.round(breakdown.projectRelevance)}/100`,
    `ATS readability: ${Math.round(breakdown.atsReadability)}/100`,
  ];
}

function emptySectionCritique(): SectionCritique {
  return {
    headerContact: [],
    professionalSummary: [],
    skills: [],
    experience: [],
    projects: [],
    educationCertifications: [],
    coverLetter: [],
  };
}

function safeStringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : fallback;
}

function normalizePersonalBranding(value: unknown): PersonalBranding {
  if (!value || typeof value !== "object") {
    return emptyPersonalBranding;
  }

  const candidate = value as Partial<PersonalBranding>;

  return {
    fullName: candidate.fullName?.trim() ?? "",
    professionalTitle: candidate.professionalTitle?.trim() ?? "",
    email: candidate.email?.trim() ?? "",
    phone: candidate.phone?.trim() ?? "",
    location: candidate.location?.trim() ?? "",
    linkedInUrl: candidate.linkedInUrl?.trim() ?? "",
    portfolioUrl: candidate.portfolioUrl?.trim() ?? "",
    websiteUrl: candidate.websiteUrl?.trim() ?? "",
    profileImageDataUrl:
      typeof candidate.profileImageDataUrl === "string" &&
      candidate.profileImageDataUrl.startsWith("data:image/")
        ? candidate.profileImageDataUrl
        : "",
  };
}

function brandingFromResumeText(resumeText: string): PersonalBranding {
  const resume = parseResumePreview(resumeText);
  const contact = extractContactInfoFromText(resumeText);

  return {
    ...emptyPersonalBranding,
    fullName: resume.name,
    professionalTitle: resume.title,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    location: contact.location ?? "",
    linkedInUrl: contact.linkedIn ?? "",
    portfolioUrl: contact.portfolio ?? "",
    websiteUrl: contact.website ?? "",
  };
}

function mergeBrandingWithResume(
  resumeText: string,
  branding?: PersonalBranding,
) {
  const resume = parseResumePreview(resumeText);
  const extracted = extractContactInfoFromText(resumeText);
  const normalized = normalizePersonalBranding(branding);

  return {
    name: normalized.fullName || resume.name,
    title: normalized.professionalTitle || resume.title,
    email: normalized.email || extracted.email,
    phone: normalized.phone || extracted.phone,
    linkedIn: normalized.linkedInUrl || extracted.linkedIn,
    portfolio: normalized.portfolioUrl || extracted.portfolio,
    website: normalized.websiteUrl || extracted.website,
    location: normalized.location || extracted.location,
    profileImageDataUrl: normalized.profileImageDataUrl,
  };
}

function usageDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function defaultUsageStats(): UsageStats {
  return {
    date: usageDateKey(),
    aiGenerations: 0,
    exportsCreated: 0,
    downloadsUsed: 0,
    optimizationCreditsUsed: 0,
  };
}

function normalizeUsageStats(value: unknown): UsageStats {
  if (!value || typeof value !== "object") {
    return defaultUsageStats();
  }

  const candidate = value as Partial<UsageStats>;

  if (candidate.date !== usageDateKey()) {
    return defaultUsageStats();
  }

  return {
    date: candidate.date,
    aiGenerations: Math.max(0, Number(candidate.aiGenerations) || 0),
    exportsCreated: Math.max(0, Number(candidate.exportsCreated) || 0),
    downloadsUsed: Math.max(0, Number(candidate.downloadsUsed) || 0),
    optimizationCreditsUsed: Math.max(0, Number(candidate.optimizationCreditsUsed) || 0),
  };
}

function safeWeakBullets(value: unknown, fallback: WeakBulletSuggestion[] = []) {
  return Array.isArray(value)
    ? value.filter(
        (bullet): bullet is WeakBulletSuggestion =>
          Boolean(
            bullet &&
              typeof bullet === "object" &&
              "original" in bullet &&
              "strongerVersion" in bullet &&
              typeof bullet.original === "string" &&
              typeof bullet.strongerVersion === "string",
          ),
      )
    : fallback;
}

function clampPercent(value: unknown, fallback: number) {
  return Math.max(0, Math.min(100, Math.round(safeScore(value, fallback))));
}

function safeReviewSimulation(
  value: Partial<ReviewSimulation> | undefined,
  fallbackScore: number,
): ReviewSimulation {
  return {
    score: clampPercent(value?.score, fallbackScore),
    strengths: safeStringArray(value?.strengths, [
      "Relevant experience is visible for this target role.",
    ]),
    weaknesses: safeStringArray(value?.weaknesses, [
      "Add stronger proof points where source material supports them.",
    ]),
    concerns: safeStringArray(value?.concerns, [
      "Recruiter may look for clearer evidence of scope, impact, and role fit.",
    ]),
    interviewProbability:
      value?.interviewProbability ||
      (fallbackScore >= 85 ? "High" : fallbackScore >= 70 ? "Moderate" : "Low"),
  };
}

function bulletsFromResumeText(resumeText: string) {
  return resumeText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => line.length > 20)
    .filter((line) =>
      /\b(led|managed|built|created|supported|developed|coordinated|improved|launched|owned|translated)\b/i.test(
        line,
      ),
    )
    .slice(0, 8);
}

function buildBulletImprovements(resumeText: string): BulletImprovement[] {
  return bulletsFromResumeText(resumeText).map((bullet) => {
    const base = bullet.replace(/\.$/, "");
    const hasMetric = /\$?\d[\d,.]*\+?%?/.test(bullet);
    const metricSuffix = hasMetric
      ? "."
      : ", adding verified scope, stakeholder count, timeline, or business result where available.";

    return {
      original: bullet,
      strongerVersion: `${base}. Add verified ownership, scope, or outcome detail where supported.`,
      atsOptimizedVersion: `${base}, aligning keywords, tools, and responsibilities to the target job description.`,
      executiveVersion: `${base}, connecting execution to strategic priorities, stakeholder confidence, and measurable business value.`,
      conciseVersion: base.length > 120 ? `${base.slice(0, 117)}...` : base,
      metricFocusedVersion: `${base}${metricSuffix}`,
      suggestedMetrics: hasMetric
        ? ["Existing metric detected; verify accuracy before use."]
        : [
            "Suggested detail - verify before use: number of stakeholders involved.",
            "Suggested detail - verify before use: number of projects, launches, users, or workflows affected.",
            "Suggested detail - verify before use: time saved, revenue influenced, cost reduced, or quality improved.",
          ],
    };
  });
}

function buildAdvancedAnalysis({
  score,
  breakdown,
  missingKeywords,
  recommendedKeywords,
  rewrittenResume,
  summary,
  industryTarget,
  positioningMode,
}: {
  score: number;
  breakdown: MatchBreakdown;
  missingKeywords: string[];
  recommendedKeywords: string[];
  rewrittenResume: string;
  summary: string;
  industryTarget: IndustryTarget;
  positioningMode: PositioningMode;
}): AdvancedAnalysis {
  const requiredSkills = recommendedKeywords.slice(0, 6);
  const preferredSkills = missingKeywords.slice(0, 6);
  const industryName = readableIndustryName(industryTarget);

  return {
    recruiterSimulation: {
      atsScreening: safeReviewSimulation(
        {
          score: breakdown.atsReadability,
          strengths: ["Plain section structure and role keywords support ATS parsing."],
          weaknesses:
            missingKeywords.length > 0
              ? [`Missing or light keywords: ${missingKeywords.slice(0, 5).join(", ")}.`]
              : ["No major ATS keyword gaps detected."],
          concerns: ["Unsupported keywords should not be added without source evidence."],
          interviewProbability:
            breakdown.atsReadability >= 85 ? "Likely to pass ATS" : "Needs ATS tightening",
        },
        breakdown.atsReadability,
      ),
      recruiterReview: safeReviewSimulation(
        {
          score,
          strengths: ["Resume has a clear role target and recruiter-readable positioning."],
          weaknesses: ["Some bullets may need stronger measurable proof."],
          concerns: missingKeywords.slice(0, 3),
          interviewProbability: score >= 85 ? "Strong" : score >= 70 ? "Moderate" : "Limited",
        },
        score,
      ),
      hiringManagerReview: safeReviewSimulation(
        {
          score: breakdown.seniorityAlignment,
          strengths: ["Experience can be mapped to ownership, delivery, and stakeholder outcomes."],
          weaknesses: ["Hiring manager may ask for deeper examples of scope and decision-making."],
          concerns: ["Prepare proof stories for the most senior claims."],
          interviewProbability:
            breakdown.seniorityAlignment >= 85 ? "Strong" : "Moderate with proof points",
        },
        breakdown.seniorityAlignment,
      ),
    },
    keyScores: {
      likelihoodOfInterview: score,
      atsPassProbability: breakdown.atsReadability,
      executiveReadiness: Math.round((breakdown.seniorityAlignment + breakdown.metricStrength) / 2),
      technicalDepth: breakdown.projectRelevance,
      leadershipStrength: breakdown.seniorityAlignment,
      industryAlignment: breakdown.industryFit,
    },
    interviewPrep: {
      whyYouFitThisRole: summary,
      likelyQuestions: [
        "Walk me through the most relevant project for this role.",
        "Which accomplishment best proves your fit for this position?",
        "How have you translated ambiguous requirements into execution?",
      ],
      behavioralQuestions: [
        "Tell me about a time you influenced stakeholders without direct authority.",
        "Describe a project that changed direction and how you handled it.",
      ],
      technicalQuestions: [
        "Which systems, tools, or technical workflows are most relevant here?",
        "How do you work with engineering or technical teams to make tradeoffs?",
      ],
      executiveQuestions: [
        "How would you prioritize the first 90 days in this role?",
        "What business outcome would you focus on first?",
      ],
      industrySpecificQuestions: [
        `What makes your experience relevant to ${industryName}?`,
        `Which ${industryName} risks or constraints would you watch first?`,
      ],
      potentialRecruiterObjections:
        missingKeywords.length > 0
          ? [`Potential concern: evidence for ${missingKeywords.slice(0, 4).join(", ")}.`]
          : ["Potential concern: depth of proof for the strongest claims."],
    },
    gapAnalysis: {
      missingKeywords,
      weakExperienceAreas: ["Quantified impact", "Scope clarity", "Role-specific proof stories"],
      seniorityGaps: ["Make ownership level, decision rights, and stakeholder level explicit."],
      leadershipGaps: ["Add leadership outcomes only where supported by source material."],
      technicalGaps: missingKeywords.filter((keyword) =>
        /ai|ml|api|data|analytics|automation|llm|technical/i.test(keyword),
      ),
      educationAlignment: ["Education should stay concise and relevant to the target role."],
      certificationAlignment: [
        "Add certifications only if already earned or clearly marked as planned.",
      ],
      recommendations: [
        "Prioritize achievements with action, scope, and verified outcome.",
        "Add missing keywords only where the source resume or uploaded materials support them.",
        `Adjust tone toward ${positioningMode.toLowerCase()} positioning.`,
      ],
      wordingChanges: [
        "Replace task language with ownership and outcome language.",
        "Move the most role-relevant keywords into the summary and skills sections.",
      ],
    },
    jobDescriptionIntelligence: {
      requiredSkills,
      preferredSkills,
      hiddenPriorities: [
        "Ability to reduce ambiguity",
        "Stakeholder trust",
        "Evidence of execution under constraints",
      ],
      likelyHiringGoals: [
        "Find a candidate who can ramp quickly and show credible impact.",
      ],
      leadershipExpectations: [
        "Clear ownership, prioritization, communication, and delivery judgment.",
      ],
      senioritySignals: [
        "Scope of ownership",
        "Cross-functional influence",
        "Decision quality",
      ],
      keywordMap: [...requiredSkills, ...preferredSkills].slice(0, 12),
      alignmentSummary: `The resume is positioned for ${industryName} with a ${score}/100 overall match.`,
      roleStrategy: `Use ${positioningMode.toLowerCase()} positioning while keeping every claim grounded in the source material.`,
    },
    bulletImprovements: buildBulletImprovements(rewrittenResume),
    aiSuggestions: [
      missingKeywords.length > 0
        ? `Add stronger evidence for ${missingKeywords.slice(0, 3).join(", ")} if truthful.`
        : "Keyword coverage is strong; focus on proof depth.",
      "Add stronger roadmap ownership language where source material supports it.",
      "Check whether metrics are concentrated in one role and distribute proof across relevant experience.",
      "Leadership positioning could be stronger if scope and stakeholder level are verified.",
    ],
    positioningMode,
  };
}

function buildApplicationPackage({
  resumeText,
  targetRole,
  industryTarget,
  jobDescription,
  coach,
}: {
  resumeText: string;
  targetRole: string;
  industryTarget: IndustryTarget;
  jobDescription: string;
  coach: CoachData;
}): { linkedin: LinkedInKit; applicationKit: ApplicationKit } {
  const resume = parseResumePreview(resumeText);
  const role = titleCase(targetRole || resume.title || "Target Role");
  const industry = readableIndustryName(industryTarget);
  const strengths = safeStringArray(coach.topStrengths).slice(0, 5);
  const keywords = Array.from(
    new Set([
      ...strengths,
      ...extractKeywords(jobDescription),
      ...safeStringArray(coach.topGaps).slice(0, 4),
    ]),
  ).slice(0, 12);
  const strengthText =
    strengths.join(", ") || "product delivery, stakeholder alignment, and execution";
  const firstProject =
    parseResumePreview(resumeText)
      .sections.flatMap((section) => section.bullets)
      .find(Boolean) || "Relevant projects available in the tailored resume";
  const article = articleFor(role);

  return {
    linkedin: {
      headline: `${role} | ${industry} | ${strengthText}`,
      about: `${role} focused on ${industry} opportunities. I bring experience in ${strengthText}, with a practical record of translating business needs into clear priorities, stakeholder alignment, and execution-ready work. My background is strongest where product judgment, technical fluency, and measurable delivery need to come together. I am targeting roles where I can help teams clarify strategy, improve workflows, and deliver outcomes grounded in real customer or business needs.`,
      featuredProjects: firstProject,
      topSkills: keywords.slice(0, 10),
      recruiterKeywords: keywords,
      openToWorkPositioning: `Open to ${role} opportunities in ${industry}, especially roles that value execution discipline, stakeholder leadership, and practical technical fluency.`,
      networkingMessage: `Hi, I am exploring ${role} opportunities in ${industry}. Your work caught my attention, and I would value connecting with professionals in this space.`,
      recruiterOutreachMessage: `Hi, I am interested in ${role} opportunities and bring experience across ${strengthText}. I would welcome a conversation if my background aligns with roles you are supporting.`,
    },
    applicationKit: {
      recruiterEmail: `Hello,\n\nI am reaching out regarding ${role} opportunities. My background aligns with ${industry} needs through ${strengthText}. I would welcome the chance to share how my experience could support your team.\n\nBest regards,\n${resume.name}`,
      followUpEmail: `Hello,\n\nI wanted to follow up on my interest in the ${role} role. I remain interested because the opportunity aligns with my experience in ${strengthText}. Please let me know if I can provide any additional information.\n\nBest regards,\n${resume.name}`,
      referralRequest: `Hi, I am applying for ${article} ${role} role and noticed your connection to the team. If you feel comfortable, I would appreciate a referral or any guidance on how to position my background for this opportunity.`,
      connectionRequest: `Hi, I am exploring ${role} opportunities in ${industry} and would value connecting with people working in this space.`,
      interviewIntroPitch: `I am ${article} ${role} candidate with experience in ${strengthText}. I focus on turning business needs into clear priorities, aligning stakeholders, and supporting delivery that is practical, measurable, and recruiter-ready.`,
      tellMeAboutYourself: `I have built my background around ${strengthText}, with a focus on practical execution and cross-functional alignment. For this ${role} opportunity, I am especially interested in applying that experience to ${industry} challenges where clear priorities, technical fluency, and measurable outcomes matter.`,
    },
  };
}

function normalizeLinkedInKit(value: Partial<LinkedInKit> | undefined, fallback: LinkedInKit) {
  return {
    headline: value?.headline || fallback.headline,
    about: value?.about || fallback.about,
    featuredProjects: value?.featuredProjects || fallback.featuredProjects,
    topSkills: safeStringArray(value?.topSkills, fallback.topSkills),
    recruiterKeywords: safeStringArray(
      value?.recruiterKeywords,
      fallback.recruiterKeywords,
    ),
    openToWorkPositioning:
      value?.openToWorkPositioning || fallback.openToWorkPositioning,
    networkingMessage: value?.networkingMessage || fallback.networkingMessage,
    recruiterOutreachMessage:
      value?.recruiterOutreachMessage || fallback.recruiterOutreachMessage,
  };
}

function normalizeApplicationKit(
  value: Partial<ApplicationKit> | undefined,
  fallback: ApplicationKit,
) {
  return {
    recruiterEmail: value?.recruiterEmail || fallback.recruiterEmail,
    followUpEmail: value?.followUpEmail || fallback.followUpEmail,
    referralRequest: value?.referralRequest || fallback.referralRequest,
    connectionRequest: value?.connectionRequest || fallback.connectionRequest,
    interviewIntroPitch:
      value?.interviewIntroPitch || fallback.interviewIntroPitch,
    tellMeAboutYourself:
      value?.tellMeAboutYourself || fallback.tellMeAboutYourself,
  };
}

function isSourceArtifactHeading(value: string) {
  return /^(SOURCE RESUME EXCERPT|SUPPORTING SOURCE MATERIAL|TAILORING NOTES|PARSER NOTES?|RAW EXTRACTED TEXT|EXTRACTED TEXT|SOURCE MATERIALS?)$/i.test(
    cleanEditorText(value),
  );
}

function isPlaceholderResumeText(value: string) {
  return /jordan taylor|jordan@example\.com|555-0100|write a 3-?4 line|role title|company name|add 3-?5 measurable|replace this placeholder|paste the target job description/i.test(
    value,
  );
}

function isResumeNoiseLine(value: string) {
  const cleaned = value.trim();

  return (
    !cleaned ||
    /^[-–—_=]{3,}$/.test(cleaned) ||
    /^page\s+\d+(?:\s+of\s+\d+)?$/i.test(cleaned) ||
    /^\d+$/.test(cleaned) ||
    /^selected delivery highlights$/i.test(cleaned) ||
    /^selected highlights$/i.test(cleaned) ||
    /^key achievements$/i.test(cleaned) ||
    /^resume$/i.test(cleaned) ||
    /^curriculum vitae$/i.test(cleaned)
  );
}

function sanitizeResumeSourceText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !isResumeNoiseLine(line) &&
        !isSourceArtifactHeading(line) &&
        !isPlaceholderResumeText(line),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function serializeLinkedInKit(linkedin: LinkedInKit) {
  return `LINKEDIN HEADLINE
${linkedin.headline}

ABOUT
${linkedin.about}

FEATURED PROJECTS
${linkedin.featuredProjects}

TOP SKILLS
${linkedin.topSkills.join(", ")}

RECRUITER KEYWORDS
${linkedin.recruiterKeywords.join(", ")}

OPEN TO WORK POSITIONING
${linkedin.openToWorkPositioning}

NETWORKING MESSAGE
${linkedin.networkingMessage}

RECRUITER OUTREACH MESSAGE
${linkedin.recruiterOutreachMessage}`;
}

function serializeApplicationKit(applicationKit: ApplicationKit) {
  return `RECRUITER EMAIL
${applicationKit.recruiterEmail}

FOLLOW-UP EMAIL
${applicationKit.followUpEmail}

REFERRAL REQUEST
${applicationKit.referralRequest}

LINKEDIN CONNECTION REQUEST
${applicationKit.connectionRequest}

INTERVIEW INTRODUCTION PITCH
${applicationKit.interviewIntroPitch}

TELL ME ABOUT YOURSELF
${applicationKit.tellMeAboutYourself}`;
}

function normalizeAdvancedAnalysis(
  analysis: Partial<AdvancedAnalysis> | undefined | null,
  fallback: Parameters<typeof buildAdvancedAnalysis>[0],
): AdvancedAnalysis {
  const fallbackAnalysis = buildAdvancedAnalysis(fallback);
  const keyScores = analysis?.keyScores ?? fallbackAnalysis.keyScores;
  const recruiterSimulation =
    analysis?.recruiterSimulation ?? fallbackAnalysis.recruiterSimulation;
  const interviewPrep = analysis?.interviewPrep ?? fallbackAnalysis.interviewPrep;
  const gapAnalysis = analysis?.gapAnalysis ?? fallbackAnalysis.gapAnalysis;
  const jobDescriptionIntelligence =
    analysis?.jobDescriptionIntelligence ??
    fallbackAnalysis.jobDescriptionIntelligence;

  return {
    recruiterSimulation: {
      atsScreening: safeReviewSimulation(
        recruiterSimulation.atsScreening,
        fallbackAnalysis.recruiterSimulation.atsScreening.score,
      ),
      recruiterReview: safeReviewSimulation(
        recruiterSimulation.recruiterReview,
        fallbackAnalysis.recruiterSimulation.recruiterReview.score,
      ),
      hiringManagerReview: safeReviewSimulation(
        recruiterSimulation.hiringManagerReview,
        fallbackAnalysis.recruiterSimulation.hiringManagerReview.score,
      ),
    },
    keyScores: {
      likelihoodOfInterview: clampPercent(
        keyScores.likelihoodOfInterview,
        fallbackAnalysis.keyScores.likelihoodOfInterview,
      ),
      atsPassProbability: clampPercent(
        keyScores.atsPassProbability,
        fallbackAnalysis.keyScores.atsPassProbability,
      ),
      executiveReadiness: clampPercent(
        keyScores.executiveReadiness,
        fallbackAnalysis.keyScores.executiveReadiness,
      ),
      technicalDepth: clampPercent(
        keyScores.technicalDepth,
        fallbackAnalysis.keyScores.technicalDepth,
      ),
      leadershipStrength: clampPercent(
        keyScores.leadershipStrength,
        fallbackAnalysis.keyScores.leadershipStrength,
      ),
      industryAlignment: clampPercent(
        keyScores.industryAlignment,
        fallbackAnalysis.keyScores.industryAlignment,
      ),
    },
    interviewPrep: {
      whyYouFitThisRole:
        interviewPrep.whyYouFitThisRole ||
        fallbackAnalysis.interviewPrep.whyYouFitThisRole,
      likelyQuestions: safeStringArray(
        interviewPrep.likelyQuestions,
        fallbackAnalysis.interviewPrep.likelyQuestions,
      ),
      behavioralQuestions: safeStringArray(
        interviewPrep.behavioralQuestions,
        fallbackAnalysis.interviewPrep.behavioralQuestions,
      ),
      technicalQuestions: safeStringArray(
        interviewPrep.technicalQuestions,
        fallbackAnalysis.interviewPrep.technicalQuestions,
      ),
      executiveQuestions: safeStringArray(
        interviewPrep.executiveQuestions,
        fallbackAnalysis.interviewPrep.executiveQuestions,
      ),
      industrySpecificQuestions: safeStringArray(
        interviewPrep.industrySpecificQuestions,
        fallbackAnalysis.interviewPrep.industrySpecificQuestions,
      ),
      potentialRecruiterObjections: safeStringArray(
        interviewPrep.potentialRecruiterObjections,
        fallbackAnalysis.interviewPrep.potentialRecruiterObjections,
      ),
    },
    gapAnalysis: {
      missingKeywords: safeStringArray(
        gapAnalysis.missingKeywords,
        fallbackAnalysis.gapAnalysis.missingKeywords,
      ),
      weakExperienceAreas: safeStringArray(
        gapAnalysis.weakExperienceAreas,
        fallbackAnalysis.gapAnalysis.weakExperienceAreas,
      ),
      seniorityGaps: safeStringArray(
        gapAnalysis.seniorityGaps,
        fallbackAnalysis.gapAnalysis.seniorityGaps,
      ),
      leadershipGaps: safeStringArray(
        gapAnalysis.leadershipGaps,
        fallbackAnalysis.gapAnalysis.leadershipGaps,
      ),
      technicalGaps: safeStringArray(
        gapAnalysis.technicalGaps,
        fallbackAnalysis.gapAnalysis.technicalGaps,
      ),
      educationAlignment: safeStringArray(
        gapAnalysis.educationAlignment,
        fallbackAnalysis.gapAnalysis.educationAlignment,
      ),
      certificationAlignment: safeStringArray(
        gapAnalysis.certificationAlignment,
        fallbackAnalysis.gapAnalysis.certificationAlignment,
      ),
      recommendations: safeStringArray(
        gapAnalysis.recommendations,
        fallbackAnalysis.gapAnalysis.recommendations,
      ),
      wordingChanges: safeStringArray(
        gapAnalysis.wordingChanges,
        fallbackAnalysis.gapAnalysis.wordingChanges,
      ),
    },
    jobDescriptionIntelligence: {
      requiredSkills: safeStringArray(
        jobDescriptionIntelligence.requiredSkills,
        fallbackAnalysis.jobDescriptionIntelligence.requiredSkills,
      ),
      preferredSkills: safeStringArray(
        jobDescriptionIntelligence.preferredSkills,
        fallbackAnalysis.jobDescriptionIntelligence.preferredSkills,
      ),
      hiddenPriorities: safeStringArray(
        jobDescriptionIntelligence.hiddenPriorities,
        fallbackAnalysis.jobDescriptionIntelligence.hiddenPriorities,
      ),
      likelyHiringGoals: safeStringArray(
        jobDescriptionIntelligence.likelyHiringGoals,
        fallbackAnalysis.jobDescriptionIntelligence.likelyHiringGoals,
      ),
      leadershipExpectations: safeStringArray(
        jobDescriptionIntelligence.leadershipExpectations,
        fallbackAnalysis.jobDescriptionIntelligence.leadershipExpectations,
      ),
      senioritySignals: safeStringArray(
        jobDescriptionIntelligence.senioritySignals,
        fallbackAnalysis.jobDescriptionIntelligence.senioritySignals,
      ),
      keywordMap: safeStringArray(
        jobDescriptionIntelligence.keywordMap,
        fallbackAnalysis.jobDescriptionIntelligence.keywordMap,
      ),
      alignmentSummary:
        jobDescriptionIntelligence.alignmentSummary ||
        fallbackAnalysis.jobDescriptionIntelligence.alignmentSummary,
      roleStrategy:
        jobDescriptionIntelligence.roleStrategy ||
        fallbackAnalysis.jobDescriptionIntelligence.roleStrategy,
    },
    bulletImprovements:
      Array.isArray(analysis?.bulletImprovements) &&
      analysis.bulletImprovements.length > 0
        ? analysis.bulletImprovements
        : fallbackAnalysis.bulletImprovements,
    aiSuggestions: safeStringArray(
      analysis?.aiSuggestions,
      fallbackAnalysis.aiSuggestions,
    ),
    positioningMode: analysis?.positioningMode || fallbackAnalysis.positioningMode,
  };
}

function buildCoachData({
  score,
  breakdown,
  positioningStrategy,
  missingKeywords,
  improvementNotes,
  riskFlags,
  rewrittenResume,
  coverLetter,
}: {
  score: number;
  breakdown: MatchBreakdown;
  positioningStrategy: string;
  missingKeywords: string[];
  improvementNotes: string[];
  riskFlags: string[];
  rewrittenResume: string;
  coverLetter: string;
}): CoachData {
  const parsedResume = parseResumePreview(rewrittenResume);
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(rewrittenResume);
  const hasPhone = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/.test(
    rewrittenResume,
  );
  const hasProjects = parsedResume.sections.some((section) =>
    /project/i.test(section.heading),
  );
  const weakBullets = detectWeakBullets(rewrittenResume).slice(0, 6);

  return {
    overallRecruiterImpression:
      score >= 90
        ? "Strong fit with clear role alignment and recruiter-readable positioning."
        : score >= 75
          ? "Credible fit, with a few proof points and keyword gaps to tighten before applying."
          : "Some relevant experience is present, but the resume needs sharper evidence and closer role alignment.",
    whyThisScore: scoreNotesFromBreakdown(breakdown),
    topStrengths: [
      "Relevant source material is available for truthful tailoring.",
      "The resume can be positioned around role fit without inventing new experience.",
      "Experience language can be tightened for recruiter readability and ATS scanning.",
    ],
    topGaps:
      missingKeywords.length > 0
        ? missingKeywords.slice(0, 5)
        : ["No major keyword gaps detected from the provided job description."],
    atsRisks: riskFlags.slice(0, 5),
    recruiterReadabilityScore: Math.round(breakdown.atsReadability),
    seniorityAlignment: `Seniority alignment is ${Math.round(breakdown.seniorityAlignment)}/100 based on title language, leadership signals, and scope described in the resume.`,
    industryAlignment: `Industry alignment is ${Math.round(breakdown.industryFit)}/100 for the selected target based on the overlap between source material and job requirements.`,
    keywordDensityNotes:
      missingKeywords.length > 0
        ? [
            `Recommended keywords to add only where truthful: ${missingKeywords
              .slice(0, 6)
              .join(", ")}.`,
            "Keep keyword use natural in the summary, skills, and strongest experience bullets.",
          ]
        : ["Keyword coverage is strong; avoid repeating terms unnaturally."],
    rolePositioningRecommendation: positioningStrategy,
    sectionCritique: {
      headerContact: [
        hasEmail || hasPhone
          ? "Header has basic contact signal; confirm LinkedIn and location are included if appropriate."
          : "Add direct contact details before exporting or applying.",
      ],
      professionalSummary: [
        "Lead with the target role, strongest domain fit, and two to three recruiter-relevant strengths.",
      ],
      skills: [
        "Keep skills grouped around the job description and remove unsupported tools.",
      ],
      experience: improvementNotes[0]
        ? [improvementNotes[0]]
        : ["Prioritize achievements that show action, scope, and measurable outcome."],
      projects: [
        hasProjects
          ? "Project evidence is visible; connect it directly to the target role."
          : "Add a projects section only if the source resume supports relevant project work.",
      ],
      educationCertifications: [
        "Keep education and certifications concise, current, and directly relevant.",
      ],
      coverLetter: [
        coverLetter.trim().length > 0
          ? "Cover letter is available; keep it concise and aligned with the edited resume."
          : "Generate a concise cover letter after the resume positioning is final.",
      ],
    },
    weakBullets,
    recruiterObjections:
      missingKeywords.length > 0
        ? [
            `Recruiter may question missing evidence for ${missingKeywords
              .slice(0, 4)
              .join(", ")}.`,
            "Claims should stay tied to source material and avoid unsupported tools or metrics.",
          ]
        : ["Recruiter objections are mostly around proof depth, not keyword coverage."],
  };
}

function normalizeCoachData(
  coach: Partial<CoachData> | undefined | null,
  fallback: Omit<Parameters<typeof buildCoachData>[0], "rewrittenResume" | "coverLetter"> & {
    rewrittenResume: string;
    coverLetter: string;
  },
): CoachData {
  const fallbackCoach = buildCoachData(fallback);
  const sectionCritique = coach?.sectionCritique ?? emptySectionCritique();

  return {
    overallRecruiterImpression:
      coach?.overallRecruiterImpression || fallbackCoach.overallRecruiterImpression,
    whyThisScore: safeStringArray(coach?.whyThisScore, fallbackCoach.whyThisScore),
    topStrengths: safeStringArray(coach?.topStrengths, fallbackCoach.topStrengths),
    topGaps: safeStringArray(coach?.topGaps, fallbackCoach.topGaps),
    atsRisks: safeStringArray(coach?.atsRisks, fallbackCoach.atsRisks),
    recruiterReadabilityScore:
      typeof coach?.recruiterReadabilityScore === "number"
        ? Math.max(0, Math.min(100, Math.round(coach.recruiterReadabilityScore)))
        : fallbackCoach.recruiterReadabilityScore,
    seniorityAlignment: coach?.seniorityAlignment || fallbackCoach.seniorityAlignment,
    industryAlignment: coach?.industryAlignment || fallbackCoach.industryAlignment,
    keywordDensityNotes: safeStringArray(
      coach?.keywordDensityNotes,
      fallbackCoach.keywordDensityNotes,
    ),
    rolePositioningRecommendation:
      coach?.rolePositioningRecommendation ||
      fallbackCoach.rolePositioningRecommendation,
    sectionCritique: {
      headerContact: safeStringArray(
        sectionCritique.headerContact,
        fallbackCoach.sectionCritique.headerContact,
      ),
      professionalSummary: safeStringArray(
        sectionCritique.professionalSummary,
        fallbackCoach.sectionCritique.professionalSummary,
      ),
      skills: safeStringArray(
        sectionCritique.skills,
        fallbackCoach.sectionCritique.skills,
      ),
      experience: safeStringArray(
        sectionCritique.experience,
        fallbackCoach.sectionCritique.experience,
      ),
      projects: safeStringArray(
        sectionCritique.projects,
        fallbackCoach.sectionCritique.projects,
      ),
      educationCertifications: safeStringArray(
        sectionCritique.educationCertifications,
        fallbackCoach.sectionCritique.educationCertifications,
      ),
      coverLetter: safeStringArray(
        sectionCritique.coverLetter,
        fallbackCoach.sectionCritique.coverLetter,
      ),
    },
    weakBullets: safeWeakBullets(coach?.weakBullets, fallbackCoach.weakBullets),
    recruiterObjections: safeStringArray(
      coach?.recruiterObjections,
      fallbackCoach.recruiterObjections,
    ),
  };
}

function detectWeakBullets(resumeText: string): WeakBulletSuggestion[] {
  return resumeText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => line.length > 0)
    .filter((line) =>
      /\b(responsible for|helped|worked on|assisted|supported|handled|participated|managed|coordinated)\b/i.test(
        line,
      ),
    )
    .filter((line) => !/\$?\d[\d,.]*\+?%?/.test(line) || line.length < 95)
    .slice(0, 8)
    .map((line) => {
      const lacksMetric = !/\$?\d[\d,.]*\+?%?/.test(line);
      const issueType = /\b(responsible for|helped|worked on|assisted|participated)\b/i.test(
        line,
      )
        ? "too_task_based"
        : lacksMetric
          ? "missing_metrics"
          : "too_vague";

      return {
        original: line,
        issueType,
        issue: lacksMetric
          ? "This achievement would be stronger with a supported outcome, scope, or measurable result."
          : "This achievement can lead with impact more clearly.",
        strongerVersion: line
          .replace(/^responsible for\s+/i, "Owned ")
          .replace(/^helped\s+/i, "Contributed to ")
          .replace(/^worked on\s+/i, "Advanced ")
          .replace(/^assisted\s+/i, "Supported ")
          .replace(/^handled\s+/i, "Managed ")
          .replace(/^participated in\s+/i, "Collaborated on ")
          .replace(/\.$/, "") +
          (lacksMetric
            ? ". Add only verified scope, stakeholder, or outcome details where supported."
            : "."),
      };
    });
}

function resultFromApiResponse(
  response: TailorApiResponse,
  activeIndustryTarget: IndustryTarget,
  positioningMode: PositioningMode,
  targetRole: string,
  jobDescription: string,
): TailoringResult {
  const matchScore = safeScore(response.matchScore, 0);
  const matchBreakdown = safeMatchBreakdown(response.matchBreakdown, matchScore);
  const tailoredResume = response.tailoredResume
    ? serializeStructuredResume(
        structuredResumeFromText(response.tailoredResume),
        brandingFromResumeText(response.tailoredResume),
      )
    : "";
  const coverLetter = response.coverLetter || "";
  const positioningStrategy = response.positioningStrategy || "";
  const parsed = parseResumePreview(tailoredResume);
  const missingKeywords = safeStringArray(response.missingKeywords);
  const recommendedKeywords = safeStringArray(response.recommendedKeywords);
  const improvementNotes = safeStringArray(response.improvementNotes);
  const riskFlags = safeStringArray(response.riskFlags);
  const summarySection = parsed.sections.find(
    (section) => section.heading === "PROFESSIONAL SUMMARY",
  );
  const skillsSection = parsed.sections.find(
    (section) => section.heading === "CORE SKILLS",
  );
  const highlightSection = parsed.sections.find((section) =>
    /EXPERIENCE|HIGHLIGHT/i.test(section.heading),
  );
  const skills =
    skillsSection?.body
      .join(" | ")
      .split("|")
      .map((skill) => skill.trim())
      .filter(Boolean) ?? recommendedKeywords;

  const fallbackCoachInput = {
    score: Math.round(matchScore),
    breakdown: matchBreakdown,
    positioningStrategy,
    missingKeywords,
    improvementNotes,
    riskFlags,
    rewrittenResume: tailoredResume,
    coverLetter,
  };
  const advancedFallbackInput = {
    score: Math.round(matchScore),
    breakdown: matchBreakdown,
    missingKeywords,
    recommendedKeywords,
    rewrittenResume: tailoredResume,
    summary: summarySection?.body.join(" ") || positioningStrategy,
    industryTarget: activeIndustryTarget,
    positioningMode,
  };
  const packageFallback = buildApplicationPackage({
    resumeText: tailoredResume,
    targetRole,
    industryTarget: activeIndustryTarget,
    jobDescription,
    coach: normalizeCoachData(response.coaching, fallbackCoachInput),
  });

  return {
    score: Math.round(matchScore),
    matchedKeywords: [],
    missingKeywords,
    recommendedKeywords,
    summary: summarySection?.body.join(" ") || positioningStrategy,
    skills,
    bullets: highlightSection?.bullets ?? improvementNotes.slice(0, 4),
    rewrittenResume: tailoredResume,
    coverLetter,
    scoreNotes: scoreNotesFromBreakdown(matchBreakdown),
    matchBreakdown,
    positioningStrategy,
    improvementNotes,
    riskFlags,
    topStrengths: recommendedKeywords.slice(0, 6),
    gapsToFix: missingKeywords.slice(0, 6),
    bulletImprovementSuggestions: improvementNotes,
    atsReadiness: `ATS readability score: ${Math.round(matchBreakdown.atsReadability)}/100`,
    recruiterReadability: `Recruiter readability is supported by role fit at ${Math.round(matchBreakdown.roleFit)}/100 and seniority alignment at ${Math.round(matchBreakdown.seniorityAlignment)}/100.`,
    industryFit: `Industry fit score: ${Math.round(matchBreakdown.industryFit)}/100`,
    coach: normalizeCoachData(response.coaching, fallbackCoachInput),
    advancedAnalysis: normalizeAdvancedAnalysis(
      response.advancedAnalysis,
      advancedFallbackInput,
    ),
    linkedin: normalizeLinkedInKit(response.linkedin, packageFallback.linkedin),
    applicationKit: normalizeApplicationKit(
      response.applicationKit,
      packageFallback.applicationKit,
    ),
    extractedResumeJson: response.extractedResumeJson,
    optimizedResumeJson: response.optimizedResumeJson,
    renderResumeState: response.renderResumeState,
  };
}

function ensureTailoringResult(
  result: TailoringResult | null,
  activeIndustryTarget: IndustryTarget = "General / ATS",
  positioningMode: PositioningMode = "Product",
): TailoringResult | null {
  if (!result) {
    return null;
  }

  const score = safeScore(result.score, 0);
  const matchBreakdown = safeMatchBreakdown(result.matchBreakdown, score);
  const missingKeywords = safeStringArray(result.missingKeywords);
  const recommendedKeywords = safeStringArray(result.recommendedKeywords);
  const improvementNotes = safeStringArray(result.improvementNotes);
  const riskFlags = safeStringArray(result.riskFlags);
  const coach = normalizeCoachData(result.coach, {
    score,
    breakdown: matchBreakdown,
    positioningStrategy: result.positioningStrategy || "",
    missingKeywords,
    improvementNotes,
    riskFlags,
    rewrittenResume: result.rewrittenResume || "",
    coverLetter: result.coverLetter || "",
  });
  const advancedAnalysis = normalizeAdvancedAnalysis(result.advancedAnalysis, {
    score,
    breakdown: matchBreakdown,
    missingKeywords,
    recommendedKeywords,
    rewrittenResume: result.rewrittenResume || "",
    summary: result.summary || result.positioningStrategy || "",
    industryTarget: activeIndustryTarget,
    positioningMode,
  });
  const packageFallback = buildApplicationPackage({
    resumeText: result.rewrittenResume || "",
    targetRole: result.positioningStrategy || "Target Role",
    industryTarget: activeIndustryTarget,
    jobDescription: "",
    coach,
  });

  return {
    ...result,
    score,
    missingKeywords,
    recommendedKeywords,
    improvementNotes,
    riskFlags,
    matchBreakdown,
    coach,
    advancedAnalysis,
    linkedin: normalizeLinkedInKit(result.linkedin, packageFallback.linkedin),
    applicationKit: normalizeApplicationKit(
      result.applicationKit,
      packageFallback.applicationKit,
    ),
  };
}

function buildTailoredResume(
  masterResume: string,
  jobDescription: string,
  targetRole: string,
): TailoringResult {
  const sourceResume = sanitizeResumeSourceText(masterResume);
  const keywordGroups = inferJobKeywordGroups(jobDescription);
  const jobKeywords = dedupeKeywords([
    ...keywordGroups.required,
    ...keywordGroups.preferred,
  ]);
  const resumeKeywords = extractKeywords(sourceResume);
  const matchedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !resumeKeywords.includes(keyword),
  );
  const scoreResult = scoreResume(
    sourceResume,
    jobDescription,
    matchedKeywords,
    keywordGroups.required,
    keywordGroups.preferred,
    targetRole,
  );
  const role = titleCase(
    targetRole || firstMeaningfulLine(jobDescription, "Target Role"),
  );
  const parsedSource = structuredResumeFromText(sourceResume);
  const sourceBranding = brandingFromResumeText(sourceResume);
  const sourceSkills = parsedSource.skills.length > 0 ? parsedSource.skills : [];
  const strongestKeywords = matchedKeywords.slice(0, 12);
  const skills = prioritizeSkillsForJob(
    [...sourceSkills, ...strongestKeywords].filter((skill) => !isPlaceholderResumeText(skill)),
    jobDescription,
    18,
  );
  const summary =
    generateExecutiveSummary({
      sourceSummary: parsedSource.summary,
      targetRole: role,
      jobDescription,
      skills,
      experience: parsedSource.experience,
    });
  const structuredResume = validateCanonicalResume({
    ...parsedSource,
    summary,
    skills,
    experience: parsedSource.experience,
    additionalSections: [],
  });
  const rewrittenResume = serializeStructuredResume(structuredResume, sourceBranding);
  const bullets = parsedSource.experience.flatMap((entry) => entry.bullets).slice(0, 8);
  const matchBreakdown = buildLocalMatchBreakdown(scoreResult.score);
  const baseResult = {
    score: scoreResult.score,
    matchedKeywords,
    missingKeywords,
    recommendedKeywords: missingKeywords.slice(0, 8),
    summary,
    skills,
    bullets,
    rewrittenResume,
    scoreNotes: scoreResult.notes,
    matchBreakdown,
    positioningStrategy:
      "Position you as a practical technical product leader who can translate business needs into delivery-ready product work.",
    improvementNotes: [
      "Add quantified outcomes where the source resume supports them.",
      "Keep role-specific keywords in the summary, skills, and experience sections.",
      "Make each achievement show action, scope, and business impact.",
    ],
    riskFlags:
      missingKeywords.length > 0
        ? [
            `Only include ${missingKeywords.slice(0, 3).join(", ")} if you can confidently explain that experience in interviews.`,
          ]
        : ["No major unsupported-claim risks detected from the provided text."],
    topStrengths: matchedKeywords.slice(0, 6),
    gapsToFix: missingKeywords.slice(0, 6),
    bulletImprovementSuggestions: [
      "Convert responsibility statements into achievements with scope, metric, or launch result.",
      "Add tools, systems, and stakeholders only when they are present in the source material.",
    ],
    atsReadiness:
      "ATS readiness is solid when the tailored resume keeps required keywords in plain section headings and avoids unsupported claims.",
    recruiterReadability:
      "Recruiter readability improves with a focused summary, concise skills, and bullets that lead with business impact.",
    industryFit:
      "Industry fit is based on the overlap between the job description and the provided resume/source materials.",
  };
  const coverLetter = buildCoverLetterFromInputs(
    rewrittenResume,
    targetRole,
    jobDescription,
  );
  const coach = buildCoachData({
    score: scoreResult.score,
    breakdown: matchBreakdown,
    positioningStrategy: baseResult.positioningStrategy,
    missingKeywords,
    improvementNotes: baseResult.improvementNotes,
    riskFlags: baseResult.riskFlags,
    rewrittenResume,
    coverLetter,
  });
  const packageFallback = buildApplicationPackage({
    resumeText: rewrittenResume,
    targetRole,
    industryTarget: "General / ATS",
    jobDescription,
    coach,
  });

  return {
    ...baseResult,
    coverLetter,
    coach: {
      ...coach,
      topStrengths:
        matchedKeywords.length > 0 ? matchedKeywords.slice(0, 5) : coach.topStrengths,
    },
    advancedAnalysis: buildAdvancedAnalysis({
      score: scoreResult.score,
      breakdown: matchBreakdown,
      missingKeywords,
      recommendedKeywords: missingKeywords.slice(0, 8),
      rewrittenResume,
      summary,
      industryTarget: "General / ATS",
      positioningMode: "Product",
    }),
    linkedin: packageFallback.linkedin,
    applicationKit: packageFallback.applicationKit,
  };
}

function parseResumePreview(resumeText: string) {
  const lines = sanitizeResumeSourceText(resumeText).split(/\r?\n/);
  const contact = extractContactInfoFromText(resumeText);
  const headerLines = lines
    .map((line) => cleanEditorText(line))
    .filter(
      (line) =>
        line &&
        !isLikelyContactLine(line, contact) &&
        !isRecognizedResumeHeading(line),
    );
  const name = headerLines[0] || "";
  const title = headerLines[1] || "";
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (const rawLine of lines.slice(2)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const cleanedLine = line.replace(/^#{1,6}\s*/, "").replace(/^\*+\s*/, "");

    if (
      isLikelyContactLine(cleanedLine, contact) ||
      isSourceArtifactHeading(cleanedLine) ||
      isPlaceholderResumeText(cleanedLine)
    ) {
      continue;
    }

    const isHeading = isRecognizedResumeHeading(cleanedLine);

    if (isHeading) {
      currentSection = {
        heading: canonicalResumeHeading(cleanedLine),
        body: [],
        bullets: [],
        lines: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = {
        heading: "PROFILE",
        body: [],
        bullets: [],
        lines: [],
      };
      sections.push(currentSection);
    }

    if (/^[-*•]\s+/.test(cleanedLine)) {
      const bullet = cleanedLine.replace(/^[-*•]\s+/, "");
      currentSection.bullets.push(bullet);
      currentSection.lines?.push(`- ${bullet}`);
    } else {
      currentSection.body.push(cleanedLine);
      currentSection.lines?.push(cleanedLine);
    }
  }

  return { name, title, sections };
}

function canonicalResumeHeading(value: string) {
  const heading = cleanEditorText(value).toUpperCase();

  if (/^(PROFILE|SUMMARY|PROFESSIONAL SUMMARY|CAREER SUMMARY|EXECUTIVE SUMMARY)$/.test(heading)) {
    return "PROFESSIONAL SUMMARY";
  }

  if (/^(CORE SKILLS|SKILLS|KEY SKILLS|TECHNICAL SKILLS|COMPETENCIES|AREAS OF EXPERTISE)$/.test(heading)) {
    return "CORE SKILLS";
  }

  if (/^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|EMPLOYMENT HISTORY|CAREER EXPERIENCE)$/.test(heading)) {
    return "PROFESSIONAL EXPERIENCE";
  }

  if (/^(PROJECTS|PROJECT EXPERIENCE|SELECTED PROJECTS|AI PROJECTS|AI & AUTOMATION PROJECTS)$/.test(heading)) {
    return "PROJECTS";
  }

  if (/^(EDUCATION|ACADEMIC BACKGROUND)$/.test(heading)) {
    return "EDUCATION";
  }

  if (/^(CERTIFICATIONS|CERTIFICATES|LICENSES|LICENSES & CERTIFICATIONS)$/.test(heading)) {
    return "CERTIFICATIONS";
  }

  if (/^(ACHIEVEMENTS|KEY ACHIEVEMENTS|CAREER ACHIEVEMENTS|SELECTED ACHIEVEMENTS)$/.test(heading)) {
    return "ACHIEVEMENTS";
  }

  if (/^(PUBLICATIONS|RESEARCH|PUBLICATIONS \/ RESEARCH|PUBLICATIONS & RESEARCH)$/.test(heading)) {
    return "PUBLICATIONS / RESEARCH";
  }

  if (/^(TOOLS|TECHNOLOGIES|TOOLS \/ TECHNOLOGIES|TECHNICAL TOOLS|PLATFORMS)$/.test(heading)) {
    return "TOOLS / TECHNOLOGIES";
  }

  if (/^(LEADERSHIP|LEADERSHIP EXPERIENCE|AWARDS|HONORS|AWARDS & HONORS|VOLUNTEER|VOLUNTEER EXPERIENCE|COMMUNITY LEADERSHIP)$/.test(heading)) {
    return heading.includes("AWARD") || heading.includes("HONOR")
      ? "AWARDS"
      : heading.includes("VOLUNTEER")
        ? "VOLUNTEER EXPERIENCE"
        : "LEADERSHIP";
  }

  return heading;
}

function isRecognizedResumeHeading(value: string) {
  const cleaned = cleanEditorText(value);
  const heading = cleaned.toUpperCase();

  if (isSourceArtifactHeading(cleaned) || cleaned.startsWith("-")) {
    return false;
  }

  if (
    /^(PROFILE|SUMMARY|PROFESSIONAL SUMMARY|CAREER SUMMARY|EXECUTIVE SUMMARY|CORE SKILLS|SKILLS|KEY SKILLS|TECHNICAL SKILLS|COMPETENCIES|AREAS OF EXPERTISE|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|EMPLOYMENT HISTORY|CAREER EXPERIENCE|PROJECTS|PROJECT EXPERIENCE|SELECTED PROJECTS|AI PROJECTS|AI & AUTOMATION PROJECTS|EDUCATION|ACADEMIC BACKGROUND|CERTIFICATIONS|CERTIFICATES|LICENSES|LICENSES & CERTIFICATIONS|ACHIEVEMENTS|KEY ACHIEVEMENTS|CAREER ACHIEVEMENTS|SELECTED ACHIEVEMENTS|PUBLICATIONS|RESEARCH|PUBLICATIONS \/ RESEARCH|PUBLICATIONS & RESEARCH|TOOLS|TECHNOLOGIES|TOOLS \/ TECHNOLOGIES|TECHNICAL TOOLS|PLATFORMS|LEADERSHIP|LEADERSHIP EXPERIENCE|AWARDS|HONORS|AWARDS & HONORS|VOLUNTEER|VOLUNTEER EXPERIENCE|COMMUNITY LEADERSHIP)$/i.test(cleaned)
  ) {
    return true;
  }

  return (
    cleaned === heading &&
    /^[A-Z0-9 &/+-]+$/.test(cleaned) &&
    cleaned.length <= 40
  );
}

function findResumeSection(
  sections: ResumeSection[],
  headings: string[],
): ResumeSection | undefined {
  const normalizedHeadings = headings.map((heading) => heading.toUpperCase());

  return sections.find((section) =>
    normalizedHeadings.some((heading) => section.heading.toUpperCase().includes(heading)),
  );
}

function uniqueStrings(items: string[]) {
  return Array.from(
    new Set(
      items
        .map((item) => cleanEditorText(item))
        .filter((item) => item && !isResumeNoiseLine(item) && !isSourceArtifactHeading(item)),
    ),
  );
}

function splitResumeList(value: string) {
  return uniqueStrings(
    value
      .split(/\n|,|\||;/)
      .map((item) => item.replace(/^[-*]\s+/, "").trim()),
  );
}

function cleanEditorText(value: string) {
  return value
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[•●▪◦]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\bpage\s+\d+(?:\s+of\s+\d+)?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionItems(section?: ResumeSection) {
  if (!section) {
    return [];
  }

  return uniqueStrings([...section.body, ...section.bullets]);
}

function createEmptyExperience(index = 0): ExperienceEntry {
  return {
    id: `experience-${Date.now()}-${index}`,
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    bullets: [],
  };
}

function cleanBullets(bullets: string[]) {
  return uniqueStrings(
    bullets
      .map((bullet) => cleanAchievementBullet(bullet.replace(/^[-*]\s+/, "")))
      .filter(Boolean),
  );
}

function splitDateRange(value: string) {
  const cleaned = cleanEditorText(value);
  const match = cleaned.match(
    /^(.*?)\s*(?:-|–|—|to)\s*(present|current|now|.*?)$/i,
  );

  if (!match) {
    return { startDate: "", endDate: cleaned, isCurrent: /present|current/i.test(cleaned) };
  }

  const endDate = cleanEditorText(match[2] || "");

  return {
    startDate: cleanEditorText(match[1] || ""),
    endDate: /present|current|now/i.test(endDate) ? "" : endDate,
    isCurrent: /present|current|now/i.test(endDate),
  };
}

function dateSignalRegex() {
  return /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}\/\d{4}|(?:19|20)\d{2}|present|current|now)\b/i;
}

function companySignalRegex() {
  return /\b(?:inc|llc|ltd|corp|corporation|company|co\.|group|partners|systems|technologies|technology|solutions|ventures|university|college|hospital|health|bank|financial|consulting|labs|agency|foundation|department|ministry)\b/i;
}

function likelyExperienceLine(line: string) {
  const cleaned = cleanEditorText(line);

  if (!cleaned || isRecognizedResumeHeading(cleaned) || isLikelyEducationLine(cleaned)) {
    return false;
  }

  return (
    /\b(at|@)\b/i.test(cleaned) ||
    /\s+[|]\s+/.test(cleaned) ||
    /\s+-\s+/.test(cleaned) ||
    dateSignalRegex().test(cleaned) ||
    companySignalRegex().test(cleaned)
  );
}

function isLikelyEducationLine(line: string) {
  return /\b(?:bachelor|master|mba|ph\.?d|doctorate|associate|degree|university|college|school|institute|certification|certificate|licensed|license)\b/i.test(
    line,
  );
}

function isLikelyCertificationLine(line: string) {
  return /\b(?:certified|certification|certificate|license|licensed|pmp|scrum|aws|azure|google|salesforce|cfa|cpa|security\+|six sigma)\b/i.test(
    line,
  );
}

function isLikelySkillLine(line: string) {
  const cleaned = cleanEditorText(line);

  return (
    /[,|;•]/.test(cleaned) &&
    cleaned.length <= 220 &&
    !/[.!?]$/.test(cleaned) &&
    !dateSignalRegex().test(cleaned) &&
    !isLikelyEducationLine(cleaned) &&
    !isLikelyProjectLine(cleaned) &&
    !/@/.test(cleaned)
  );
}

function isLikelyProjectLine(line: string) {
  return /\b(?:project|portfolio|prototype|implementation|automation|dashboard|model|platform|app|application|system|tool)\b/i.test(
    line,
  );
}

function isLikelyLeadershipLine(line: string) {
  return /\b(?:leadership|chair|president|board|committee|mentor|mentored|led|founded|captain|officer|community|volunteer)\b/i.test(
    line,
  );
}

function isLikelyAwardLine(line: string) {
  return /\b(?:award|honor|honour|dean'?s list|scholarship|recognition|recognized|winner|finalist|fellowship)\b/i.test(
    line,
  );
}

function inferProjectSectionTitle(projects: string[], industryTarget?: string) {
  const joined = projects.join(" ").toLowerCase();

  if (/research|publication|study|methodology/.test(joined) || /academic|research/i.test(industryTarget || "")) {
    return "RESEARCH PROJECTS";
  }

  if (/product|roadmap|launch|user|saas/.test(joined)) {
    return "PRODUCT PROJECTS";
  }

  if (/finance|fintech|bank|risk|portfolio/.test(joined)) {
    return "FINANCE PROJECTS";
  }

  if (/operation|workflow|supply|logistics/.test(joined)) {
    return "OPERATIONS PROJECTS";
  }

  if (/technical|api|automation|ai|machine learning|model|platform|system/.test(joined)) {
    return "TECHNICAL PROJECTS";
  }

  return "PROJECTS";
}

function parseExperienceLine(line: string) {
  const cleaned = cleanEditorText(line);
  const parts = cleaned.split(/\s+\|\s+/).map(cleanEditorText).filter(Boolean);
  const datePart = parts.find((part) => dateSignalRegex().test(part)) || "";
  const roleCompany = (parts.find((part) => part !== datePart && !/^[A-Za-z .'-]+,\s*[A-Z]{2}/.test(part)) || parts[0] || cleaned)
    .replace(datePart, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const location = parts.find((part) => part !== roleCompany && part !== datePart) || "";
  const atMatch = roleCompany.match(/^(.+?)\s+at\s+(.+)$/i);
  const dashParts = roleCompany.split(/\s+-\s+/);
  const commaParts = roleCompany.split(/\s*,\s*/).filter(Boolean);
  const dateRange = splitDateRange(datePart);

  if (atMatch) {
    return {
      title: atMatch[1].trim(),
      company: atMatch[2].trim(),
      location,
      ...dateRange,
    };
  }

  if (dashParts.length >= 2) {
    const [first, ...rest] = dashParts;
    const second = rest.join(" - ");
    const firstLooksCompany = companySignalRegex().test(first);
    const secondLooksCompany = companySignalRegex().test(second);

    return {
      title: firstLooksCompany && !secondLooksCompany ? second.trim() : first.trim(),
      company: firstLooksCompany && !secondLooksCompany ? first.trim() : second.trim(),
      location,
      ...dateRange,
    };
  }

  if (commaParts.length >= 2) {
    const [first, ...rest] = commaParts;
    const second = rest.join(", ");
    const firstLooksCompany = companySignalRegex().test(first);

    return {
      title: firstLooksCompany ? second.trim() : first.trim(),
      company: firstLooksCompany ? first.trim() : second.trim(),
      location,
      ...dateRange,
    };
  }

  return {
    title: cleaned,
    company: "",
    location,
    ...dateRange,
  };
}

function looksLikeRoleTitle(line: string) {
  return /\b(?:manager|director|lead|specialist|analyst|engineer|developer|consultant|coordinator|associate|assistant|officer|administrator|designer|researcher|scientist|product|project|program|operations|strategy|marketing|finance|legal|policy|data|ai|ml|software|clinical|healthcare)\b/i.test(
    line,
  );
}

function cleanResumeSkill(value: string) {
  const cleaned = cleanEditorText(value)
    .replace(/^[-*]\s+/, "")
    .replace(/\.$/, "");

  if (
    !cleaned ||
    cleaned.length > 48 ||
    /\b(?:award|honor|dean'?s list|scholarship|club|society|volunteer)\b/i.test(cleaned) ||
    /[.!?]/.test(cleaned)
  ) {
    return "";
  }

  return titleCase(cleaned);
}

function prioritizeSkillsForJob(skills: string[], jobDescription: string, maxItems = 18) {
  const jobKeywords = dedupeKeywords([
    ...inferJobKeywordGroups(jobDescription).required,
    ...inferJobKeywordGroups(jobDescription).preferred,
  ]).map((keyword) => keyword.toLowerCase());

  return uniqueStrings(skills.map(cleanResumeSkill).filter(Boolean))
    .sort((a, b) => {
      const aScore = jobKeywords.some((keyword) => a.toLowerCase().includes(keyword)) ? 0 : 1;
      const bScore = jobKeywords.some((keyword) => b.toLowerCase().includes(keyword)) ? 0 : 1;
      return aScore - bScore || a.localeCompare(b);
    })
    .slice(0, maxItems);
}

function cleanAchievementBullet(value: string) {
  const cleaned = cleanExportBullet(value)
    .replace(/^selected delivery highlights:?$/i, "")
    .replace(/^key achievements:?$/i, "")
    .replace(/^achievements:?$/i, "");

  if (
    !cleaned ||
    isResumeNoiseLine(cleaned) ||
    isRecognizedResumeHeading(cleaned) ||
    isLikelyEducationLine(cleaned)
  ) {
    return "";
  }

  return cleaned;
}

function normalizeExperience(entry: Partial<ExperienceEntry>, index = 0): ExperienceEntry | null {
  const normalized: ExperienceEntry = {
    id: entry.id || `experience-${index}`,
    title: cleanEditorText(entry.title || ""),
    company: cleanEditorText(entry.company || ""),
    location: cleanEditorText(entry.location || ""),
    startDate: cleanEditorText(entry.startDate || ""),
    endDate: cleanEditorText(entry.endDate || ""),
    isCurrent: Boolean(entry.isCurrent),
    bullets: cleanBullets(entry.bullets ?? []),
  };

  const hasIdentity = Boolean(normalized.title || normalized.company);

  if (!hasIdentity) {
    return null;
  }

  if (
    normalized.title &&
    normalized.company &&
    normalized.title.toLowerCase() === normalized.company.toLowerCase()
  ) {
    normalized.title = "";
  }

  normalized.bullets = normalized.bullets.slice(0, 5);

  return normalized;
}

function dedupeExperience(entries: ExperienceEntry[]) {
  const seen = new Set<string>();
  const deduped: ExperienceEntry[] = [];

  for (const entry of entries) {
    const key = [
      entry.title.toLowerCase(),
      entry.company.toLowerCase(),
      entry.startDate.toLowerCase(),
      entry.endDate.toLowerCase(),
      entry.isCurrent ? "current" : "",
    ].join("|");

    if (seen.has(key)) {
      const existing = deduped.find(
        (item) =>
          item.title.toLowerCase() === entry.title.toLowerCase() &&
          item.company.toLowerCase() === entry.company.toLowerCase() &&
          item.startDate.toLowerCase() === entry.startDate.toLowerCase() &&
          item.endDate.toLowerCase() === entry.endDate.toLowerCase(),
      );

      if (existing) {
        existing.bullets = cleanBullets([...existing.bullets, ...entry.bullets]);
      }

      continue;
    }

    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function parseExperienceEntries(section?: ResumeSection): ExperienceEntry[] {
  if (!section) {
    return [];
  }

  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | null = null;
  const orderedLines = (section.lines && section.lines.length > 0
    ? section.lines
    : [...section.body, ...section.bullets.map((bullet) => `- ${bullet}`)]
  )
    .map((line) => line.trim())
    .filter(Boolean);
  const isHighlightsOnly = /HIGHLIGHT/i.test(section.heading);

  for (const rawLine of orderedLines) {
    const isBullet = /^[-*•]\s+/.test(rawLine);
    const line = cleanEditorText(rawLine.replace(/^[-*•]\s+/, ""));

    if (!line) {
      continue;
    }

    if (isBullet) {
      if (!current) {
        const fallback = normalizeExperience(
          {
            id: `experience-${entries.length}`,
            title: "",
            company: "",
            bullets: [],
          },
          entries.length,
        );

        if (fallback) {
          current = fallback;
          entries.push(current);
        }
      }

      current?.bullets.push(line);
      continue;
    }

    const looksLikeMetaLine =
      current &&
      /\d{4}|present|current|now/i.test(line) &&
      !/\b(at|@)\b/i.test(line);

    if (looksLikeMetaLine && current) {
      const parts = line.split(/\s+\|\s+/).map(cleanEditorText).filter(Boolean);
      const datePart = parts.find((part) => /\d{4}|present|current|now/i.test(part)) || line;
      const locationPart = parts.find((part) => part !== datePart && !/\d{4}|present|current|now/i.test(part)) || "";
      const dateRange = splitDateRange(datePart);

      current.location = current.location || locationPart;
      current.startDate = current.startDate || dateRange.startDate;
      current.endDate = current.endDate || dateRange.endDate;
      current.isCurrent = current.isCurrent || dateRange.isCurrent;
      continue;
    }

    const looksLikeRole =
      /\b(at|@)\b/i.test(line) ||
      /\s+-\s+/.test(line) ||
      /\d{4}|present|current/i.test(line);

    if (!looksLikeRole && current) {
      current.bullets.push(line);
      continue;
    }

    if (!looksLikeRole && isHighlightsOnly) {
      continue;
    }

    const parsed = parseExperienceLine(line);
    const normalized = normalizeExperience(
      {
        id: `experience-${entries.length}`,
        title: parsed.title,
        company: parsed.company,
        location: parsed.location,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        isCurrent: parsed.isCurrent,
        bullets: [],
      },
      entries.length,
    );

    if (normalized) {
      current = normalized;
      entries.push(current);
    }
  }

  return dedupeExperience(
    entries
      .map((entry, index) => normalizeExperience(entry, index))
      .filter((entry): entry is ExperienceEntry => Boolean(entry)),
  );
}

function sourceLinesForParsing(resumeText: string) {
  return sanitizeResumeSourceText(resumeText)
    .split(/\r?\n/)
    .flatMap((line) =>
      line
        .replace(/\s+([•*-])\s+/g, "\n$1 ")
        .split(/\n/),
    )
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line && !isLikelyContactLine(line, extractContactInfoFromText(resumeText)));
}

function inferExperienceFromResumeText(resumeText: string) {
  const lines = sourceLinesForParsing(resumeText);
  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | null = null;
  let currentSection = "profile";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (isRecognizedResumeHeading(line)) {
      currentSection = canonicalResumeHeading(line).toLowerCase();
      continue;
    }

    if (/education|certification|publication|research|skill|tool|project/.test(currentSection)) {
      continue;
    }

    const isBullet = /^[-*•]\s+/.test(line);
    const cleaned = cleanEditorText(line.replace(/^[-*•]\s+/, ""));

    if (!cleaned || isPlaceholderResumeText(cleaned) || isLikelyEducationLine(cleaned)) {
      continue;
    }

    if (isBullet || (current && cleaned.length > 45 && !likelyExperienceLine(cleaned))) {
      current?.bullets.push(cleaned);
      continue;
    }

    const nextLine = cleanEditorText(lines[index + 1] || "");
    const followingLine = cleanEditorText(lines[index + 2] || "");
    const lineLooksCompany = companySignalRegex().test(cleaned);
    const nextLooksCompany = companySignalRegex().test(nextLine);
    const lineLooksRole = looksLikeRoleTitle(cleaned);
    const nextLooksRole = looksLikeRoleTitle(nextLine);
    const followingLooksDate = dateSignalRegex().test(followingLine);

    if (
      lineLooksCompany &&
      nextLooksRole &&
      (followingLooksDate || dateSignalRegex().test(nextLine))
    ) {
      const dateRange = splitDateRange(followingLooksDate ? followingLine : nextLine);
      const normalized = normalizeExperience(
        {
          id: `experience-${entries.length}`,
          title: nextLine,
          company: cleaned,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          isCurrent: dateRange.isCurrent,
          bullets: [],
        },
        entries.length,
      );

      if (normalized) {
        current = normalized;
        entries.push(current);
        index += followingLooksDate ? 2 : 1;
        continue;
      }
    }

    if (lineLooksRole && nextLooksCompany) {
      const dateRange = splitDateRange(followingLooksDate ? followingLine : "");
      const normalized = normalizeExperience(
        {
          id: `experience-${entries.length}`,
          title: cleaned,
          company: nextLine,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          isCurrent: dateRange.isCurrent,
          bullets: [],
        },
        entries.length,
      );

      if (normalized) {
        current = normalized;
        entries.push(current);
        index += followingLooksDate ? 2 : 1;
        continue;
      }
    }

    const combinedCandidate =
      nextLine && !isRecognizedResumeHeading(nextLine) && dateSignalRegex().test(nextLine)
        ? `${cleaned} | ${nextLine}`
        : cleaned;
    const looksLikeExperience =
      likelyExperienceLine(combinedCandidate) ||
      (nextLine && companySignalRegex().test(nextLine)) ||
      (followingLine && dateSignalRegex().test(followingLine));

    if (!looksLikeExperience) {
      if (current && cleaned.length > 20) {
        current.bullets.push(cleaned);
      }
      continue;
    }

    const parsed = parseExperienceLine(combinedCandidate);
    const normalized = normalizeExperience(
      {
        id: `experience-${entries.length}`,
        title: parsed.title,
        company: parsed.company || (companySignalRegex().test(nextLine) ? nextLine : ""),
        location: parsed.location,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        isCurrent: parsed.isCurrent,
        bullets: [],
      },
      entries.length,
    );

    if (normalized) {
      current = normalized;
      entries.push(current);
    }
  }

  return dedupeExperience(
    entries
      .map((entry, index) => normalizeExperience(entry, index))
      .filter((entry): entry is ExperienceEntry => Boolean(entry)),
  );
}

function inferListFromResumeText(
  resumeText: string,
  predicate: (line: string) => boolean,
  limit = 12,
) {
  return uniqueStrings(
    sourceLinesForParsing(resumeText)
      .filter((line) => !isRecognizedResumeHeading(line) && predicate(line))
      .flatMap((line) => (isLikelySkillLine(line) ? splitResumeList(line) : [line]))
      .filter((line) => !isPlaceholderResumeText(line)),
  ).slice(0, limit);
}

function generateExecutiveSummary({
  sourceSummary,
  targetRole,
  jobDescription,
  skills,
  experience,
}: {
  sourceSummary: string;
  targetRole: string;
  jobDescription: string;
  skills: string[];
  experience: ExperienceEntry[];
}) {
  const cleanedSource = cleanEditorText(sourceSummary);
  const role = titleCase(targetRole || firstMeaningfulLine(jobDescription, "Target Role"));
  const leadershipSignal = experience.some((entry) =>
    /\b(?:director|lead|manager|head|principal|senior|executive|founder)\b/i.test(
      `${entry.title} ${entry.bullets.join(" ")}`,
    ),
  );
  const skillPhrase = skills.slice(0, 5).join(", ");

  if (cleanedSource && cleanedSource.length >= 80 && cleanedSource.length <= 420) {
    return cleanEditorText(cleanedSource);
  }

  return [
    role && role !== "Target Role" ? `${role}` : "Experienced professional",
    leadershipSignal ? "with leadership experience" : "with cross-functional experience",
    skillPhrase ? `spanning ${skillPhrase}` : "",
    "Known for translating business priorities into structured execution, stakeholder alignment, and measurable outcomes while preserving source-verified achievements.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateCanonicalResume(structured: StructuredResume) {
  const cleanList = (items: string[]) =>
    uniqueStrings(
      items
        .map(cleanEditorText)
        .filter(
          (item) =>
            item &&
            !isResumeNoiseLine(item) &&
            !isSourceArtifactHeading(item) &&
            !isPlaceholderResumeText(item),
        ),
    );

  return {
    ...structured,
    summary: cleanEditorText(structured.summary),
    skills: prioritizeSkillsForJob(structured.skills, "", 18),
    experience: dedupeExperience(
      structured.experience
        .map((entry, index) => normalizeExperience(entry, index))
        .filter((entry): entry is ExperienceEntry => Boolean(entry)),
    ),
    projects: cleanList(structured.projects),
    education: cleanList(structured.education),
    certifications: cleanList(structured.certifications),
    publications: cleanList(structured.publications),
    leadership: cleanList(structured.leadership),
    awards: cleanList(structured.awards),
    volunteerExperience: cleanList(structured.volunteerExperience),
    tools: cleanList(structured.tools),
    additionalSections: structured.additionalSections.filter(
      (section) =>
        section.heading &&
        !isSourceArtifactHeading(section.heading) &&
        [...section.body, ...section.bullets].some((item) => cleanEditorText(item)),
    ),
    unmatchedSections: structured.unmatchedSections ?? [],
  };
}

function structuredResumeFromText(resumeText: string): StructuredResume {
  const cleanedResumeText = sanitizeResumeSourceText(resumeText);
  const { sections } = parseResumePreview(cleanedResumeText);
  const summarySection = findResumeSection(sections, [
    "PROFESSIONAL SUMMARY",
    "SUMMARY",
    "PROFILE",
  ]);
  const skillsSection = findResumeSection(sections, ["CORE SKILLS", "SKILLS"]);
  const experienceSection = findResumeSection(sections, [
    "PROFESSIONAL EXPERIENCE",
    "EXPERIENCE HIGHLIGHTS",
    "EXPERIENCE",
  ]);
  const projectSection = findResumeSection(sections, [
    "PROJECTS",
    "TECHNICAL PROJECTS",
    "RESEARCH PROJECTS",
    "PRODUCT PROJECTS",
    "FINANCE PROJECTS",
    "OPERATIONS PROJECTS",
  ]);
  const educationSection = findResumeSection(sections, ["EDUCATION"]);
  const certificationSection = findResumeSection(sections, ["CERTIFICATIONS"]);
  const publicationSection = findResumeSection(sections, [
    "PUBLICATIONS",
    "RESEARCH",
  ]);
  const toolsSection = findResumeSection(sections, [
    "TOOLS / TECHNOLOGIES",
    "TOOLS",
    "TECHNOLOGIES",
  ]);
  const leadershipSection = findResumeSection(sections, ["LEADERSHIP"]);
  const awardsSection = findResumeSection(sections, ["AWARDS", "HONORS"]);
  const volunteerSection = findResumeSection(sections, ["VOLUNTEER"]);
  const knownSections = new Set(
    [
      summarySection,
      skillsSection,
      experienceSection,
      projectSection,
      educationSection,
      certificationSection,
      publicationSection,
      toolsSection,
      leadershipSection,
      awardsSection,
      volunteerSection,
    ]
      .filter(Boolean)
      .map((section) => section?.heading),
  );

  const parsedExperience = parseExperienceEntries(experienceSection);
  const inferredExperience =
    experienceSection ? parsedExperience : inferExperienceFromResumeText(cleanedResumeText);
  const parsedSkills = splitResumeList(sectionItems(skillsSection).join(", "));
  const inferredSkills =
    skillsSection ? parsedSkills : inferListFromResumeText(cleanedResumeText, isLikelySkillLine, 24);
  const parsedEducation = sectionItems(educationSection);
  const parsedCertifications = sectionItems(certificationSection);
  const parsedProjects = sectionItems(projectSection);
  const unmatchedSections = sections.filter(
    (section) =>
      !knownSections.has(section.heading) &&
      !isSourceArtifactHeading(section.heading),
  );
  const inferredAwards = sectionItems(awardsSection);
  const inferredLeadership = sectionItems(leadershipSection);
  const inferredVolunteer = sectionItems(volunteerSection);

  return validateCanonicalResume({
    header: brandingFromResumeText(cleanedResumeText),
    summary: sectionItems(summarySection).join(" "),
    skills: inferredSkills,
    experience: inferredExperience,
    projects:
      projectSection ? parsedProjects : inferListFromResumeText(cleanedResumeText, isLikelyProjectLine, 8),
    education:
      educationSection ? parsedEducation : inferListFromResumeText(cleanedResumeText, isLikelyEducationLine, 8),
    certifications:
      certificationSection ? parsedCertifications : inferListFromResumeText(cleanedResumeText, isLikelyCertificationLine, 8),
    publications: sectionItems(publicationSection),
    leadership:
      inferredLeadership.length > 0
        ? inferredLeadership
        : inferListFromResumeText(cleanedResumeText, isLikelyLeadershipLine, 6),
    awards:
      inferredAwards.length > 0
        ? inferredAwards
        : inferListFromResumeText(cleanedResumeText, isLikelyAwardLine, 6),
    volunteerExperience: inferredVolunteer,
    tools: splitResumeList(sectionItems(toolsSection).join(", ")),
    additionalSections: [],
    unmatchedSections,
  });
}

function serializeStructuredResume(
  structured: StructuredResume,
  branding: PersonalBranding,
  options: { preserveEmptySections?: boolean } = {},
) {
  const lines: string[] = [];
  const contact = normalizePersonalBranding(branding);
  const preserveEmptySections = Boolean(options.preserveEmptySections);

  if (contact.fullName) {
    lines.push(contact.fullName);
  }

  if (contact.professionalTitle) {
    lines.push(contact.professionalTitle);
  }

  const contactLine = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedInUrl,
    contact.portfolioUrl,
    contact.websiteUrl,
  ].filter(Boolean);

  if (contactLine.length > 0) {
    lines.push(contactLine.join(" | "));
  }

  function pushTextSection(heading: string, body: string) {
    const cleaned = cleanEditorText(body);

    if (!cleaned && !preserveEmptySections) {
      return;
    }

    lines.push("", heading);
    if (cleaned) {
      lines.push(cleaned);
    }
  }

  function pushListSection(heading: string, items: string[]) {
    const cleanedItems = uniqueStrings(items);

    if (cleanedItems.length === 0 && !preserveEmptySections) {
      return;
    }

    lines.push("", heading, ...cleanedItems.map((item) => `- ${item}`));
  }

  pushTextSection("PROFESSIONAL SUMMARY", structured.summary);

  if (structured.skills.length > 0 || preserveEmptySections) {
    lines.push("", "CORE SKILLS", uniqueStrings(structured.skills).join(" | "));
  }

  const experience = dedupeExperience(
    structured.experience
      .map((entry, index) => normalizeExperience(entry, index))
      .filter((entry): entry is ExperienceEntry => Boolean(entry)),
  );

  if (experience.length > 0 || preserveEmptySections) {
    lines.push("", "PROFESSIONAL EXPERIENCE");

    for (const entry of experience) {
      const roleLine = [
        cleanEditorText(entry.title),
        cleanEditorText(entry.company),
      ]
        .filter(Boolean)
        .join(" - ");
      const dateLine = [entry.startDate, entry.isCurrent ? "Present" : entry.endDate]
        .filter(Boolean)
        .join(" - ");
      const metaLine = [cleanEditorText(entry.location), dateLine]
        .filter(Boolean)
        .join(" | ");

      if (roleLine) {
        lines.push(roleLine);
      }

      if (metaLine) {
        lines.push(metaLine);
      }

      lines.push(
        ...uniqueStrings(entry.bullets).map((bullet) => `- ${bullet}`),
      );
    }
  }

  pushListSection(inferProjectSectionTitle(structured.projects), structured.projects);
  pushListSection("EDUCATION", structured.education);
  pushListSection("CERTIFICATIONS", structured.certifications);
  pushListSection("PUBLICATIONS / RESEARCH", structured.publications);
  pushListSection("LEADERSHIP", structured.leadership);
  pushListSection("AWARDS", structured.awards);
  pushListSection("VOLUNTEER EXPERIENCE", structured.volunteerExperience);

  if (structured.tools.length > 0) {
    lines.push("", "TOOLS / TECHNOLOGIES", uniqueStrings(structured.tools).join(" | "));
  }

  for (const section of structured.additionalSections) {
    const heading = cleanEditorText(section.heading).toUpperCase();
    const body = section.body
      .map(cleanEditorText)
      .filter((item) => item && !isSourceArtifactHeading(item) && !isPlaceholderResumeText(item));
    const bullets = uniqueStrings(section.bullets).filter(
      (item) => !isSourceArtifactHeading(item) && !isPlaceholderResumeText(item),
    );

    if (
      !heading ||
      isSourceArtifactHeading(heading) ||
      isPlaceholderResumeText(heading) ||
      (body.length === 0 && bullets.length === 0)
    ) {
      continue;
    }

    lines.push("", heading, ...body, ...bullets.map((bullet) => `- ${bullet}`));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function optimizeResumeText(value: string) {
  const cleaned = cleanEditorText(value);

  if (!cleaned) {
    return "";
  }

  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function optimizeResumeBullet(value: string) {
  const cleaned = cleanEditorText(value)
    .replace(/^responsible for\s+/i, "Led ")
    .replace(/^worked on\s+/i, "Contributed to ")
    .replace(/^helped\s+/i, "Supported ");

  return optimizeResumeText(cleaned);
}

function cleanExportBullet(value: string) {
  return cleanEditorText(value)
    .replace(
      /,?\s*clarifying scope, stakeholders, and outcome using only verified source details\.?/gi,
      "",
    )
    .replace(
      /,?\s*clarifying ownership, scope, and outcome with source-backed detail\.?/gi,
      "",
    )
    .replace(/\busing only verified source details\b\.?/gi, "")
    .replace(/^responsible for\s+/i, "Led ")
    .replace(/^worked on\s+/i, "Advanced ")
    .replace(/^helped\s+/i, "Supported ")
    .replace(/^handled\s+/i, "Managed ")
    .replace(/^participated in\s+/i, "Collaborated on ")
    .replace(/\s+/g, " ")
    .trim();
}

function userFacingGuidance(value: string) {
  return value
    .replace(/AI suggestion - verify before use:/gi, "Suggested detail - verify before use:")
    .replace(
      /Do not claim ([^.]+?) unless the candidate can verify that experience\.?/gi,
      "Only include $1 if you can confidently explain that experience in interviews.",
    )
    .replace(/\bthe candidate\b/gi, "you")
    .replace(/\bcandidate\b/gi, "you")
    .replace(/\btheir\b/gi, "your")
    .replace(/\bthey\b/gi, "you")
    .replace(/\bthem\b/gi, "you");
}

function optimizationFallbackText(value: string, action: AiOptimizationAction) {
  const lines = value
    .split(/\r?\n/)
    .map(cleanEditorText)
    .filter(Boolean);
  const optimized = lines.map((line) => {
    if (action === "Rewrite Bullet" || action === "Strengthen Metrics") {
      return optimizeResumeBullet(line);
    }

    if (action === "Shorten" && line.length > 150) {
      return `${line.slice(0, 147).replace(/\s+\S*$/, "")}.`;
    }

    return optimizeResumeText(line);
  });

  if (action === "Strengthen Metrics") {
    return [
      "Suggested detail - verify before use: add only supported metric, scope, or outcome details.",
      ...optimized,
    ].join("\n");
  }

  return optimized.join("\n");
}

function extractContactInfoFromText(resumeText: string) {
  const email = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = resumeText.match(
    /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/,
  )?.[0];
  const linkedIn = resumeText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,)]+/i,
  )?.[0];
  const urls = resumeText.match(/(?:https?:\/\/|www\.)[^\s,)]+/gi) ?? [];
  const portfolio = urls.find((url) => /portfolio|behance|dribbble|github/i.test(url));
  const website = urls.find(
    (url) => !/linkedin\.com/i.test(url) && url !== portfolio,
  );
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
  const labeledLocation = lines
    .find((line) => /^location\s*:/i.test(line))
    ?.replace(/^location\s*:/i, "")
    .trim();
  const location =
    labeledLocation ||
    lines.find(
      (line) =>
        !line.includes("@") &&
        !/(?:https?:\/\/|www\.|linkedin\.com)/i.test(line) &&
        !phoneRegex().test(line) &&
        /^[A-Za-z .'-]+,\s*[A-Z]{2}(?:\s+\d{5})?$/.test(line),
    );

  return {
    email,
    phone,
    linkedIn,
    portfolio,
    website,
    location,
  };
}

function phoneRegex() {
  return /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;
}

function isLikelyContactLine(
  line: string,
  contact: ReturnType<typeof extractContactInfoFromText>,
) {
  return Boolean(
    (contact.email && line.includes(contact.email)) ||
      (contact.phone && line.includes(contact.phone)) ||
      (contact.linkedIn && line.includes(contact.linkedIn)) ||
      (contact.portfolio && line.includes(contact.portfolio)) ||
      (contact.website && line.includes(contact.website)) ||
      (contact.location && line === contact.location) ||
      /^location\s*:/i.test(line),
  );
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isUrlLike(value: string) {
  return /^(?:https?:\/\/|www\.|linkedin\.com\/)/i.test(value);
}

function shouldShowProfileImage(template: TemplateId, imageDataUrl = "") {
  return Boolean(imageDataUrl && templateProfile(template).allowImage);
}

function fileNameForRole(targetRole: string, extension: "pdf" | "docx") {
  const roleSlug =
    targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "tailored-resume";

  return `${roleSlug}.${extension}`;
}

function coverLetterFileName(targetRole: string, extension: "pdf" | "docx" | "txt") {
  const roleSlug =
    targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "cover-letter";

  return `${roleSlug}-cover-letter.${extension}`;
}

function linkedinKitFileName(targetRole: string, extension: "pdf" | "docx") {
  const roleSlug =
    targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "linkedin-kit";

  return `${roleSlug}-linkedin-kit.${extension}`;
}

function applicationKitFileName(targetRole: string, extension: "pdf" | "docx") {
  const roleSlug =
    targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "application-kit";

  return `${roleSlug}-application-kit.${extension}`;
}

function versionId() {
  return `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatVersionDate(value: string | Date = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function readableIndustryName(industry: IndustryTarget) {
  return industry
    .replace(" / ", " ")
    .replace("General ATS", "General ATS")
    .replace("Healthcare Health IT", "Healthcare IT")
    .replace("Finance Fintech", "Fintech");
}

function defaultVersionName(targetRole: string, industry: IndustryTarget) {
  const role = targetRole.trim() || "Tailored Resume";
  return `${role} — ${readableIndustryName(industry)} — ${formatVersionDate()}`;
}

function inferCompanyName(jobDescription: string) {
  const companyPatterns = [
    /\bat\s+([A-Z][A-Za-z0-9&.,' -]{2,60})/i,
    /\bjoin\s+([A-Z][A-Za-z0-9&.,' -]{2,60})/i,
    /\bcompany:\s*([^\n]+)/i,
    /\bemployer:\s*([^\n]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = jobDescription.match(pattern)?.[1]?.trim();

    if (match) {
      return match.replace(/[.。]\s*$/, "").slice(0, 80);
    }
  }

  return "";
}

function normalizeSavedVersion(version: Partial<SavedResumeVersion>) {
  if (containsRestrictedSeedData(version)) {
    return null;
  }

  const result = ensureTailoringResult(
    version.result ?? null,
    isIndustryTarget(version.industryTarget) ? version.industryTarget : "General / ATS",
    version.result?.advancedAnalysis?.positioningMode ?? "Product",
  );

  if (!version.id || !result) {
    return null;
  }

  const targetRole = version.targetRole || "Target Role";
  const industryTarget = isIndustryTarget(version.industryTarget)
    ? version.industryTarget
    : "General / ATS";
  const template = isTemplateId(version.template)
    ? version.template
    : "executive-navy";
  const theme = isThemeId(version.theme) ? version.theme : "deep-navy";
  const now = new Date().toISOString();

  return {
    id: version.id,
    name: version.name || defaultVersionName(targetRole, industryTarget),
    targetRole,
    industryTarget,
    companyName: version.companyName || "",
    template,
    theme,
    createdAt: version.createdAt || now,
    updatedAt: version.updatedAt || version.createdAt || now,
    matchScore: safeScore(version.matchScore, result.score),
    masterResume: version.masterResume || sampleResume,
    jobDescription: version.jobDescription || sampleJob,
    result,
    uploadedFiles: Array.isArray(version.uploadedFiles)
      ? version.uploadedFiles
      : [],
    personalBranding: normalizePersonalBranding(
      version.personalBranding ?? brandingFromResumeText(version.masterResume || sampleResume),
    ),
  } satisfies SavedResumeVersion;
}

function stripHash(color: string) {
  return color.replace("#", "");
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sourceFileId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function sourceFileType(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? `.${extension}` : file.type || "unknown";
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function extractionStatusLabel(status?: ExtractionStatus) {
  if (status === "extracted") {
    return "Text extracted";
  }

  if (status === "ocr_required") {
    return "OCR required";
  }

  if (status === "extraction_failed") {
    return "Extraction failed";
  }

  if (status === "unsupported_for_extraction") {
    return "Saved as reference";
  }

  if (status === "metadata_only") {
    return "Metadata saved";
  }

  if (status === "unsupported") {
    return "Unsupported for extraction";
  }

  if (status === "failed") {
    return "Extraction failed";
  }

  return "Pending extraction";
}

async function extractUploadedFile(file: File): Promise<UploadedSourceFile> {
  const baseFile = {
    id: sourceFileId(file),
    name: file.name,
    type: sourceFileType(file),
    size: file.size,
  };
  const formData = new FormData();

  formData.append("file", file);

  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Extraction failed.");
    }

    const data = (await response.json()) as Partial<ExtractApiResponse>;

    return {
      ...baseFile,
      name: data.fileName || baseFile.name,
      type: data.fileType || baseFile.type,
      extractedText: data.extractedText || undefined,
      extractionStatus: data.extractionStatus || "failed",
      warnings: safeStringArray(data.warnings),
    };
  } catch {
    if (file.name.toLowerCase().endsWith(".txt")) {
      return {
        ...baseFile,
        extractedText: await file.text(),
        extractionStatus: "extracted",
        warnings: ["Text extracted successfully and added to your source materials."],
      };
    }

    return {
      ...baseFile,
      extractionStatus: "extraction_failed",
      warnings: ["We could not extract text from this file. You can still use it as source material or paste the text manually."],
    };
  }
}

async function createResumePdfBlob(
  resumeText: string,
  template: TemplateId,
  theme: (typeof previewThemes)[ThemeId],
  branding?: PersonalBranding,
) {
  const ReactPdf = await import("@react-pdf/renderer");
  const { Document, Image, Link, Page, StyleSheet, Text, View, pdf } = ReactPdf;
  const resume = parseResumePreview(resumeText);
  const contact = mergeBrandingWithResume(resumeText, branding);
  const contactLines = [
    contact.email,
    contact.phone,
    contact.linkedIn,
    contact.portfolio,
    contact.website,
    contact.location,
  ].filter((item): item is string => Boolean(item));
  const profile = templateProfile(template);
  const family = profile.family;
  const isAts = family === "ats";
  const hasHeaderBand =
    family === "executive" || family === "creative" || family === "finance";
  const isModern = ["product", "technical", "creative"].includes(family);
  const pagePadding =
    family === "ats"
      ? 30
      : family === "executive"
        ? 44
        : family === "academic" || family === "legal"
          ? 38
          : 36;
	  const orderedSections = preparedPreviewSections(resume.sections, template);
  const contactSeparator = "  |  ";
	  const styles = StyleSheet.create({
    page: {
      padding: pagePadding,
      color: theme.textHex,
      fontFamily:
        family === "academic" || family === "legal" ? "Times-Roman" : "Helvetica",
      fontSize: isAts ? 9.5 : family === "executive" ? 10.5 : 10,
      lineHeight: family === "consulting" || family === "finance" ? 1.35 : 1.45,
    },
	    header: {
	      backgroundColor: hasHeaderBand ? theme.headerHex : "#ffffff",
	      borderBottomColor: theme.accentHex,
	      borderBottomWidth: hasHeaderBand ? 0 : family === "ats" ? 1 : 2,
	      marginBottom: family === "executive" ? 26 : 21,
	      padding: hasHeaderBand ? (family === "executive" ? 22 : 18) : 0,
	    },
    name: {
      color: hasHeaderBand ? "#ffffff" : theme.accentHex,
      fontSize:
        family === "executive"
          ? 24
          : family === "creative"
            ? 23
            : family === "ats"
              ? 18
              : 20,
	      fontWeight: 700,
	      marginBottom: family === "ats" ? 7 : 8,
	    },
	    title: {
	      color: hasHeaderBand ? "#e5e7eb" : theme.accentHex,
	      fontSize: family === "executive" ? 12 : 10.5,
	      fontWeight: 600,
	      marginBottom: 8,
	    },
	    contact: {
	      color: hasHeaderBand ? "#e5e7eb" : theme.textHex,
	      fontSize: 8.8,
	      lineHeight: 1.45,
	      marginTop: 2,
	    },
    headerRow: {
      alignItems: "center",
      display: "flex",
      flexDirection: "row",
      gap: 12,
    },
    headerText: {
      flexGrow: 1,
    },
    profileImage: {
      borderRadius: 999,
      height: 58,
      objectFit: "cover",
      width: 58,
    },
	    section: {
      borderLeftColor: isModern ? theme.accentHex : "#ffffff",
      borderLeftWidth: isModern ? (family === "creative" ? 4 : 2) : 0,
	      marginBottom:
	        family === "ats" || family === "consulting" || family === "finance"
	          ? 12
	          : 16,
	      paddingLeft: isModern ? 9 : 0,
	    },
    heading: {
      borderBottomColor: theme.accentHex,
      borderBottomWidth: family === "ats" ? 0.5 : 1,
      color: theme.accentHex,
      fontSize: family === "academic" || family === "legal" ? 10 : 9,
      fontWeight: 700,
      letterSpacing: family === "ats" ? 0.2 : 0.8,
	      marginBottom: 8,
	      paddingBottom: 4,
	      textTransform: "uppercase",
	    },
	    paragraph: {
	      marginBottom: 6,
	    },
	    bullet: {
	      lineHeight: 1.5,
	      marginBottom: 5,
	      paddingLeft: 10,
	    },
  });

  const documentNode = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "LETTER", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(
          View,
          { style: styles.headerRow },
          shouldShowProfileImage(template, contact.profileImageDataUrl)
            ? createElement(Image, {
                src: contact.profileImageDataUrl,
                style: styles.profileImage,
              })
            : null,
          createElement(
            View,
            { style: styles.headerText },
	            contact.name
	              ? createElement(Text, { style: styles.name }, contact.name)
	              : null,
            contact.title
              ? createElement(Text, { style: styles.title }, contact.title)
              : null,
            contactLines.length > 0
              ? createElement(
                  Text,
                  { style: styles.contact },
                  ...contactLines.map((item, itemIndex) =>
                    isUrlLike(item)
                      ? createElement(
                          Link,
                          {
                            key: `${item}-${itemIndex}`,
                            src: normalizeUrl(item),
                          },
	                          `${item}${itemIndex < contactLines.length - 1 ? contactSeparator : ""}`,
	                        )
	                      : `${item}${itemIndex < contactLines.length - 1 ? contactSeparator : ""}`,
	                  ),
	                )
              : null,
          ),
        ),
      ),
      ...orderedSections.map((section, sectionIndex) =>
        createElement(
          View,
          { key: `${section.heading}-${sectionIndex}`, style: styles.section },
          createElement(Text, { style: styles.heading }, section.heading),
          ...section.body.map((paragraph, paragraphIndex) =>
            createElement(
              Text,
              { key: `${paragraph}-${paragraphIndex}`, style: styles.paragraph },
              paragraph,
            ),
          ),
	          ...section.bullets.map((bullet, bulletIndex) =>
	            createElement(
	              Text,
	              { key: `${bullet}-${bulletIndex}`, style: styles.bullet },
	              `• ${cleanExportBullet(bullet)}`,
	            ),
	          ),
        ),
      ),
    ),
  );

  return pdf(documentNode).toBlob();
}

async function createResumeDocxBlob(
  resumeText: string,
  template: TemplateId,
  theme: (typeof previewThemes)[ThemeId],
  branding?: PersonalBranding,
) {
  const Docx = await import("docx");
  const {
    BorderStyle,
    Document: DocxDocument,
    ExternalHyperlink,
    Packer,
    Paragraph,
    ShadingType,
    TextRun,
  } = Docx;
  const resume = parseResumePreview(resumeText);
  const contact = mergeBrandingWithResume(resumeText, branding);
  const contactLines = [
    contact.email,
    contact.phone,
    contact.linkedIn,
    contact.portfolio,
    contact.website,
    contact.location,
  ].filter((item): item is string => Boolean(item));
  const profile = templateProfile(template);
  const family = profile.family;
  const hasHeaderBand =
    family === "executive" || family === "creative" || family === "finance";
  const isModern = ["product", "technical", "creative"].includes(family);
  const accentColor = stripHash(theme.accentHex);
  const headerColor = stripHash(theme.headerHex);
  const textColor = stripHash(theme.textHex);
  const orderedSections = preparedPreviewSections(resume.sections, template);
  const headingSize = family === "academic" || family === "legal" ? 21 : 19;
  const bodySize = family === "ats" ? 20 : family === "executive" ? 22 : 21;
  const contactSize = family === "ats" ? 17 : 18;
  const headerShading = hasHeaderBand
    ? {
        type: ShadingType.CLEAR,
        color: "auto",
        fill: headerColor,
      }
    : undefined;
  const headerTextColor = hasHeaderBand ? "FFFFFF" : accentColor;
  const headerAccentColor = hasHeaderBand ? "FFFFFF" : accentColor;
  const children = [
    new Paragraph({
      shading: headerShading,
      spacing: { after: contact.title ? 110 : 160 },
      children: [
        new TextRun({
          text: contact.name || "",
          bold: true,
          color: headerTextColor,
          size: family === "executive" ? 34 : family === "ats" ? 28 : 30,
        }),
      ],
    }),
    new Paragraph({
      shading: headerShading,
      border: hasHeaderBand
        ? undefined
        : {
            bottom: {
              style: BorderStyle.SINGLE,
              color: accentColor,
              size: 8,
              space: 1,
            },
          },
      spacing: { after: contactLines.length > 0 ? 130 : 280 },
      children: [
        new TextRun({
          text: contact.title || "",
          bold: true,
          color: headerAccentColor,
          size: family === "executive" ? 23 : 21,
        }),
      ],
    }),
  ];

  if (contactLines.length > 0) {
    const contactRuns = contactLines.flatMap((item, itemIndex) => {
      const suffix =
        itemIndex < contactLines.length - 1
          ? [
              new TextRun({
                text: "  |  ",
                color: hasHeaderBand ? "FFFFFF" : textColor,
                size: contactSize,
              }),
            ]
          : [];

      if (isUrlLike(item)) {
        return [
          new ExternalHyperlink({
            link: normalizeUrl(item),
            children: [
              new TextRun({
                text: item,
                color: hasHeaderBand ? "FFFFFF" : accentColor,
                size: contactSize,
                underline: {},
              }),
            ],
          }),
          ...suffix,
        ];
      }

      return [
        new TextRun({
          text: item,
          color: hasHeaderBand ? "FFFFFF" : textColor,
          size: contactSize,
        }),
        ...suffix,
      ];
    });

    children.push(
      new Paragraph({
        shading: headerShading,
        spacing: { after: family === "executive" ? 300 : 250 },
        children: contactRuns,
      }),
    );
  }

  for (const section of orderedSections) {
    children.push(
      new Paragraph({
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            color: accentColor,
            size: isModern || family === "consulting" || family === "finance" ? 8 : 6,
            space: 1,
          },
        },
        spacing: {
          before: family === "executive" ? 190 : 145,
          after: family === "ats" ? 95 : 130,
        },
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            color: accentColor,
            size: headingSize,
          }),
        ],
      }),
    );

    for (const paragraph of section.body) {
      children.push(
        new Paragraph({
          spacing: { after: 90 },
          children: [new TextRun({ text: paragraph, color: textColor, size: bodySize })],
        }),
      );
    }

    for (const bullet of section.bullets) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: family === "consulting" || family === "finance" ? 75 : 90 },
          children: [
            new TextRun({
              text: cleanExportBullet(bullet),
              color: textColor,
              size: bodySize,
            }),
          ],
        }),
      );
    }
  }

  const document = new DocxDocument({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

function coverLetterLines(coverLetter: string, name: string) {
  const lines = coverLetter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const hasGreeting = lines.some((line) => /^dear\b/i.test(line));
  const hasSignature = lines.some((line) =>
    /^(sincerely|regards|best regards),?$/i.test(line),
  );
  const nextLines = hasGreeting ? lines : ["Dear Hiring Team,", ...lines];

  if (!hasSignature) {
    nextLines.push("Sincerely,", name);
  }

  return nextLines;
}

async function createCoverLetterPdfBlob({
  coverLetter,
  resumeText,
  template,
  theme,
  branding,
}: {
  coverLetter: string;
  resumeText: string;
  template: TemplateId;
  theme: (typeof previewThemes)[ThemeId];
  branding?: PersonalBranding;
}) {
  const ReactPdf = await import("@react-pdf/renderer");
  const { Document, Page, StyleSheet, Text, View, pdf } = ReactPdf;
  const contact = mergeBrandingWithResume(resumeText, branding);
  const lines = coverLetterLines(coverLetter, contact.name);
  const contactLines = [
    contact.email ? `Email: ${contact.email}` : "",
    contact.phone ? `Phone: ${contact.phone}` : "",
    contact.linkedIn ? `LinkedIn: ${contact.linkedIn}` : "",
    contact.portfolio ? `Portfolio: ${contact.portfolio}` : "",
    contact.website ? `Website: ${contact.website}` : "",
    contact.location ? `Location: ${contact.location}` : "",
  ].filter((item): item is string => Boolean(item));
  const profile = templateProfile(template);
  const family = profile.family;
  const hasHeaderBand =
    family === "executive" || family === "creative" || family === "finance";
  const isAts = family === "ats";
  const isModern = ["product", "technical", "creative"].includes(family);
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const styles = StyleSheet.create({
    page: {
      padding: isAts || family === "technical" ? 42 : family === "executive" ? 52 : 48,
      color: theme.textHex,
      fontFamily:
        family === "academic" || family === "legal" ? "Times-Roman" : "Helvetica",
      fontSize: isAts ? 10 : family === "executive" ? 11 : 10.5,
      lineHeight: family === "consulting" || family === "finance" ? 1.45 : 1.55,
    },
    header: {
      backgroundColor: hasHeaderBand ? theme.headerHex : "#ffffff",
      borderBottomColor: theme.accentHex,
      borderBottomWidth: hasHeaderBand ? 0 : 2,
      marginBottom: family === "executive" ? 26 : 22,
      padding: hasHeaderBand ? (family === "executive" ? 20 : 16) : 0,
    },
    name: {
      color: hasHeaderBand ? "#ffffff" : theme.textHex,
      fontSize: family === "executive" ? 24 : family === "ats" ? 19 : 21,
      fontWeight: 700,
      marginBottom: 4,
    },
    title: {
      color: hasHeaderBand ? "#e5e7eb" : theme.accentHex,
      fontSize: 10.5,
      fontWeight: 600,
      marginBottom: 7,
    },
    contact: {
      color: hasHeaderBand ? "#e5e7eb" : theme.textHex,
      fontSize: 9,
      marginBottom: 2,
    },
    date: {
      color: theme.textHex,
      fontSize: 10.5,
      marginBottom: 18,
      textAlign: "right",
    },
    body: {
      borderLeftColor: isModern ? theme.accentHex : "#ffffff",
      borderLeftWidth: isModern ? 2 : 0,
      paddingLeft: isModern ? 12 : 0,
    },
    paragraph: {
      marginBottom: 10,
    },
  });

  const documentNode = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "LETTER", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.name }, contact.name),
        createElement(Text, { style: styles.title }, contact.title),
        ...contactLines.map((line, lineIndex) =>
          createElement(
            Text,
            { key: `${line}-${lineIndex}`, style: styles.contact },
            line,
          ),
        ),
      ),
      createElement(Text, { style: styles.date }, today),
      createElement(
        View,
        { style: styles.body },
        ...lines.map((line, index) =>
          createElement(Text, { key: `${line}-${index}`, style: styles.paragraph }, line),
        ),
      ),
    ),
  );

  return pdf(documentNode).toBlob();
}

async function createCoverLetterDocxBlob({
  coverLetter,
  resumeText,
  template,
  theme,
  branding,
}: {
  coverLetter: string;
  resumeText: string;
  template: TemplateId;
  theme: (typeof previewThemes)[ThemeId];
  branding?: PersonalBranding;
}) {
  const Docx = await import("docx");
  const {
    BorderStyle,
    Document: DocxDocument,
    Packer,
    Paragraph,
    ShadingType,
    TextRun,
  } = Docx;
  const contact = mergeBrandingWithResume(resumeText, branding);
  const lines = coverLetterLines(coverLetter, contact.name);
  const contactLine = [
    contact.email ? `Email: ${contact.email}` : "",
    contact.phone ? `Phone: ${contact.phone}` : "",
    contact.linkedIn ? `LinkedIn: ${contact.linkedIn}` : "",
    contact.portfolio ? `Portfolio: ${contact.portfolio}` : "",
    contact.website ? `Website: ${contact.website}` : "",
    contact.location ? `Location: ${contact.location}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const family = templateProfile(template).family;
  const hasHeaderBand =
    family === "executive" || family === "creative" || family === "finance";
  const accentColor = stripHash(theme.accentHex);
  const headerColor = stripHash(theme.headerHex);
  const textColor = stripHash(theme.textHex);
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const children = [
    new Paragraph({
      shading: hasHeaderBand
        ? {
            type: ShadingType.CLEAR,
            color: "auto",
            fill: headerColor,
          }
        : undefined,
      spacing: { after: 80 },
      children: [
        new TextRun({
              text: contact.name,
              bold: true,
              color: hasHeaderBand ? "FFFFFF" : textColor,
              size: family === "executive" ? 34 : family === "ats" ? 28 : 30,
            }),
      ],
    }),
    new Paragraph({
      border: hasHeaderBand
        ? undefined
        : {
            bottom: {
              style: BorderStyle.SINGLE,
              color: accentColor,
              size: 8,
              space: 1,
            },
          },
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: contact.title,
          bold: true,
          color: hasHeaderBand ? "FFFFFF" : accentColor,
          size: 21,
        }),
      ],
    }),
    ...(contactLine
      ? [
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: contactLine,
                color: textColor,
                size: 18,
              }),
            ],
          }),
        ]
      : []),
    new Paragraph({
      alignment: "right",
      spacing: { before: 220, after: 260 },
      children: [new TextRun({ text: today, color: textColor, size: 21 })],
    }),
  ];

  for (const [index, line] of lines.entries()) {
    children.push(
      new Paragraph({
        spacing: { after: index === 0 ? 220 : 170 },
        children: [new TextRun({ text: line, color: textColor, size: 22 })],
      }),
    );
  }

  const document = new DocxDocument({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

async function createTextKitPdfBlob({
  title,
  body,
  theme,
}: {
  title: string;
  body: string;
  theme: (typeof previewThemes)[ThemeId];
}) {
  const ReactPdf = await import("@react-pdf/renderer");
  const { Document, Page, StyleSheet, Text, View, pdf } = ReactPdf;
  const sections = body.split(/\n{2,}/).filter(Boolean);
  const styles = StyleSheet.create({
    page: {
      padding: 46,
      color: theme.textHex,
      fontFamily: "Helvetica",
      fontSize: 10.5,
      lineHeight: 1.55,
    },
    title: {
      borderBottomColor: theme.accentHex,
      borderBottomWidth: 2,
      color: theme.headerHex,
      fontSize: 21,
      fontWeight: 700,
      marginBottom: 18,
      paddingBottom: 8,
    },
    section: {
      marginBottom: 12,
    },
    text: {
      marginBottom: 5,
    },
  });
  const documentNode = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "LETTER", style: styles.page },
      createElement(Text, { style: styles.title }, title),
      ...sections.map((section, index) =>
        createElement(
          View,
          { key: `${section.slice(0, 30)}-${index}`, style: styles.section },
          ...section.split(/\n/).map((line, lineIndex) =>
            createElement(
              Text,
              { key: `${line}-${lineIndex}`, style: styles.text },
              line,
            ),
          ),
        ),
      ),
    ),
  );

  return pdf(documentNode).toBlob();
}

async function createTextKitDocxBlob({
  title,
  body,
  theme,
}: {
  title: string;
  body: string;
  theme: (typeof previewThemes)[ThemeId];
}) {
  const Docx = await import("docx");
  const { Document: DocxDocument, Packer, Paragraph, TextRun } = Docx;
  const textColor = stripHash(theme.textHex);
  const accentColor = stripHash(theme.accentHex);
  const children = [
    new Paragraph({
      spacing: { after: 260 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          color: accentColor,
          size: 32,
        }),
      ],
    }),
    ...body.split(/\n/).map(
      (line) =>
        new Paragraph({
          spacing: { after: line.trim() ? 120 : 180 },
          children: [
            new TextRun({
              text: line,
              bold: /^[A-Z][A-Z\s-]+$/.test(line),
              color: textColor,
              size: 22,
            }),
          ],
        }),
    ),
  ];
  const document = new DocxDocument({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(document);
}

function isTransientSessionError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : String(error ?? "");

  return /jwt issued at future|failed to fetch|fetch failed|network|session|auth/i.test(message);
}

export default function HomeExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicLanding = pathname === "/";
  const [masterResume, setMasterResume] = useState(sampleResume);
  const [jobDescription, setJobDescription] = useState(sampleJob);
  const [targetRole, setTargetRole] = useState("Product Manager");
  const [personalBranding, setPersonalBranding] = useState<PersonalBranding>(() =>
    brandingFromResumeText(sampleResume),
  );
  const [industryTarget, setIndustryTarget] =
    useState<IndustryTarget>("General / ATS");
  const [template, setTemplate] = useState<TemplateId>("executive-navy");
  const [theme, setTheme] = useState<ThemeId>("deep-navy");
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);
  const [result, setResult] = useState<TailoringResult | null>(null);
  const [tailorError, setTailorError] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedSourceFile[]>([]);
  const [previewSourceFileId, setPreviewSourceFileId] = useState("");
  const [savedVersions, setSavedVersions] = useState<SavedResumeVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [compareVersionIds, setCompareVersionIds] = useState<string[]>([]);
  const [versionStatus, setVersionStatus] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [systemStatus, setSystemStatus] = useState("");
  const [usageStats, setUsageStats] = useState<UsageStats>(defaultUsageStats);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlanId>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [resumeDownloadCredits, setResumeDownloadCredits] = useState(0);
  const [optimizationCredits, setOptimizationCredits] = useState(0);
  const [downloadsUsed, setDownloadsUsed] = useState(0);
  const [optimizationCreditsUsed, setOptimizationCreditsUsed] = useState(0);
  const [savedVersionsCount, setSavedVersionsCount] = useState(0);
  const [subscriptionProfileLoaded, setSubscriptionProfileLoaded] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [activeOutput, setActiveOutput] = useState<OutputTab>("resume");
  const [hydrated, setHydrated] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const authLoaded = !authLoading;
  const authUserId = authUser?.id ?? "";
  const [cloudResumeId, setCloudResumeId] = useState<string | null>(null);
  const [cloudSaveStatus, setCloudSaveStatus] = useState("");
  const [cloudLoadedForUser, setCloudLoadedForUser] = useState("");
  const skipNextSave = useRef(false);
  const skipNextCloudSave = useRef(false);
  const lastAuthUserIdRef = useRef<string | null>(null);
  const cloudLoadInFlightUserRef = useRef<string | null>(null);
  const billingRefreshAttemptedRef = useRef(false);
  const subscriptionFetchFailedRef = useRef(false);
  const opportunityPrefillRef = useRef("");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [editableResumeSession, setEditableResumeSession] = useState<EditableResumeSession | null>(null);
  const feedbackTimers = useRef<Record<string, number>>({});
  const persistEditableResumeDraft = useCallback(
    (draft: EditableResumeDraft, resumeText: string) => {
      setEditableResumeSession({ draft, resumeText });
    },
    [],
  );
  const previewTheme = previewThemes[theme];
  const displayedSubscriptionPlan =
    authUserId && !subscriptionProfileLoaded ? null : subscriptionPlan;
  const currentPlanLabel = displayedSubscriptionPlan
    ? subscriptionLabel(displayedSubscriptionPlan)
    : "Loading plan...";
  const currentSubscriptionStatusLabel =
    !displayedSubscriptionPlan
      ? "Loading"
      : displayedSubscriptionPlan === "free"
      ? "Active"
      : subscriptionStatus
          .split("_")
          .filter(Boolean)
          .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
          .join(" ") || "Active";
  const downloadLimit = planDownloadLimit(subscriptionPlan);
  const optimizationLimit = planOptimizationLimit(subscriptionPlan);
  const documentExportLimit =
    authUser && resumeDownloadCredits > 0 ? resumeDownloadCredits : downloadLimit;
  const optimizationCreditLimit =
    authUser && optimizationCredits > 0 ? optimizationCredits : optimizationLimit;
  const effectiveDownloadsUsed = authUser ? downloadsUsed : usageStats.downloadsUsed;
  const effectiveOptimizationCreditsUsed = authUser
    ? optimizationCreditsUsed
    : usageStats.optimizationCreditsUsed;
  const documentExportsRemaining = Number.isFinite(documentExportLimit)
    ? Math.max(0, documentExportLimit - effectiveDownloadsUsed)
    : documentExportLimit;
  const optimizationCreditsRemaining = Number.isFinite(optimizationCreditLimit)
    ? Math.max(0, optimizationCreditLimit - effectiveOptimizationCreditsUsed)
    : optimizationCreditLimit;
  const starterResumeExportUsed =
    isStarterPlan(subscriptionPlan) && effectiveDownloadsUsed >= 1;
  const optimizationProgressPercent = Number.isFinite(optimizationLimit)
    ? Math.min(100, Math.round((effectiveOptimizationCreditsUsed / Math.max(1, optimizationCreditLimit)) * 100))
    : 100;
  const activeSavedVersionsCount = authUser ? savedVersionsCount : savedVersions.length;
  const savedVersionLimit = planSavedVersionLimit(subscriptionPlan);
  const savedVersionProgressPercent = Number.isFinite(savedVersionLimit)
    ? Math.min(100, Math.round((activeSavedVersionsCount / Math.max(1, savedVersionLimit)) * 100))
    : 100;
  const canSaveAnotherVersion =
    canUseSubscriptionFeature(subscriptionPlan, "savedVersions") &&
    (!Number.isFinite(savedVersionLimit) || savedVersions.length < savedVersionLimit);
  const hasCoverLetterAccess = canUseSubscriptionFeature(subscriptionPlan, "coverLetter");
  const hasLinkedInAccess = canUseSubscriptionFeature(subscriptionPlan, "linkedinProfile");
  const hasApplicationKitAccess = canUseSubscriptionFeature(subscriptionPlan, "applicationKit");
  const extractedSourceTextForPreview = uploadedFiles
    .map((file) => file.extractedText?.trim())
    .filter((text): text is string => Boolean(text))
    .join("\n\n");
  const hasExtractedSourceText = extractedSourceTextForPreview.trim().length > 0;
  const premiumPreviewResult = useMemo(
    () => buildTailoredResume(sampleResume, sampleJob, "Product Manager"),
    [],
  );
  const starterPreviewSourceText = useMemo(
    () =>
      [
        hasExtractedSourceText && masterResume.trim() === sampleResume.trim()
          ? ""
          : masterResume,
        extractedSourceTextForPreview,
      ]
        .filter((text) => text.trim().length > 0)
        .join("\n\nSUPPORTING SOURCE MATERIAL\n"),
    [extractedSourceTextForPreview, hasExtractedSourceText, masterResume],
  );
  const starterWorkspacePreviewResult = useMemo(
    () =>
      buildTailoredResume(
        starterPreviewSourceText.trim().length >= 40
          ? starterPreviewSourceText
          : sampleResume,
        jobDescription.trim().length >= 40 ? jobDescription : sampleJob,
        targetRole.trim() || "Product Manager",
      ),
    [jobDescription, starterPreviewSourceText, targetRole],
  );
  const premiumPreviewPackage = useMemo(
    () =>
      buildApplicationPackage({
        resumeText: starterWorkspacePreviewResult.rewrittenResume,
        targetRole: targetRole.trim() || "Product Manager",
        industryTarget,
        jobDescription: jobDescription.trim().length >= 40 ? jobDescription : sampleJob,
        coach: starterWorkspacePreviewResult.coach,
      }),
    [industryTarget, jobDescription, starterWorkspacePreviewResult, targetRole],
  );
  const panelCoverLetter = hasCoverLetterAccess
    ? result?.coverLetter ?? premiumPreviewResult.coverLetter
    : result?.coverLetter ?? starterWorkspacePreviewResult.coverLetter;
  const panelLinkedIn = hasLinkedInAccess
    ? result?.linkedin ?? premiumPreviewPackage.linkedin
    : result?.linkedin ?? premiumPreviewPackage.linkedin;
  const panelApplicationKit = hasApplicationKitAccess
    ? result?.applicationKit ?? premiumPreviewPackage.applicationKit
    : result?.applicationKit ?? premiumPreviewPackage.applicationKit;
  const workspaceResult = result ?? starterWorkspacePreviewResult;
  const isStarterWorkflowPreview = !result && Boolean(workspaceResult) && isStarterPlan(subscriptionPlan);
  const isStarterBranding =
    personalBranding.fullName === "Avery Morgan" &&
    personalBranding.email === "avery.morgan@example.com";
  const workspaceBranding =
    isStarterPlan(subscriptionPlan) && hasExtractedSourceText && isStarterBranding
      ? brandingFromResumeText(extractedSourceTextForPreview)
      : personalBranding;
  const hasPersonalizedSourceMaterial =
    hasExtractedSourceText || masterResume.trim() !== sampleResume.trim();
  const hasWorkspaceIdentity =
    !isStarterBranding &&
    [
      workspaceBranding.fullName,
      workspaceBranding.professionalTitle,
      workspaceBranding.email,
      workspaceBranding.location,
    ].some((field) => field.trim().length > 0);
  const workspaceDirection = targetRole.trim() || "your target direction";

  const buildSavedState = useCallback((): SavedState => {
    return {
      masterResume,
      jobDescription,
      targetRole,
      industryTarget,
      template,
      theme,
      result,
      uploadedFiles,
      aiSettings,
      personalBranding,
    };
  }, [
    aiSettings,
    industryTarget,
    jobDescription,
    masterResume,
    personalBranding,
    result,
    targetRole,
    template,
    theme,
    uploadedFiles,
  ]);

  const refreshSubscriptionProfile = useCallback(async () => {
    if (!authLoaded || !supabase || !authUserId) {
      return false;
    }

    let liveUserId = authUserId;

    try {
      const {
        data: { user: liveUser },
        error: liveUserError,
      } = await supabase.auth.getUser();

      if (liveUserError) {
        if (isTransientSessionError(liveUserError)) {
          return false;
        }

        console.error("Unable to refresh workspace session.");
        return false;
      }

      liveUserId = liveUser?.id ?? authUserId;
    } catch (sessionError) {
      if (!isTransientSessionError(sessionError)) {
        console.error("Unable to refresh workspace session.");
      }

      return false;
    }

    if (!liveUserId) {
      return false;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, email, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, resume_download_credits, optimization_credits",
      )
      .eq("id", liveUserId)
      .maybeSingle();

    if (error) {
      if (!isTransientSessionError(error)) {
        console.error("Unable to refresh workspace subscription profile.");
      }

      return false;
    }

    subscriptionFetchFailedRef.current = false;
    setSubscriptionProfileLoaded(true);
    setSystemStatus((current) =>
      current === "Reconnecting to your workspace..." ||
      current === "We could not refresh your session. Your current workspace remains available."
        ? ""
        : current,
    );

    if (!profile) {
      setSubscriptionPlan("free");
      setSubscriptionStatus("free");
      setResumeDownloadCredits(0);
      setOptimizationCredits(0);
      setDownloadsUsed(0);
      setOptimizationCreditsUsed(0);
      setSavedVersionsCount(0);
      setOrganizationName("");
      return true;
    }

    const nextPlan = normalizeSubscriptionPlan(profile.subscription_plan);
    const defaultDownloadCredits = planDownloadLimit(nextPlan);
    const defaultOptimizationCredits = planOptimizationLimit(nextPlan);

    setSubscriptionPlan(nextPlan);
    setSubscriptionStatus(profile.subscription_status || "free");
    setResumeDownloadCredits(
      isProPlan(nextPlan) && !profile.resume_download_credits
        ? defaultDownloadCredits
        : profile.resume_download_credits ?? defaultDownloadCredits,
    );
    setOptimizationCredits(
      isProPlan(nextPlan) && !profile.optimization_credits
        ? defaultOptimizationCredits
        : profile.optimization_credits ?? defaultOptimizationCredits,
    );
    const { data: usageData, error: usageError } = await supabase
      .from("profiles")
      .select("document_exports_used, optimization_credits_used, saved_versions_count")
      .eq("id", liveUserId)
      .maybeSingle();

    if (!usageError && usageData) {
      setDownloadsUsed(Math.max(0, Number(usageData.document_exports_used) || 0));
      setOptimizationCreditsUsed(Math.max(0, Number(usageData.optimization_credits_used) || 0));
      setSavedVersionsCount(Math.max(0, Number(usageData.saved_versions_count) || 0));
    } else {
      setDownloadsUsed(0);
      setOptimizationCreditsUsed(0);
      setSavedVersionsCount(savedVersions.length);
      if (usageError && !/column .* does not exist/i.test(usageError.message)) {
        console.error("Unable to refresh workspace usage counters.");
      }
    }
    {
      const response = await fetch("/api/institution/associate");
      const data = (await response.json().catch(() => ({}))) as {
        institution?: { institution_name?: string } | null;
      };
      setOrganizationName(data.institution?.institution_name ?? "");
    }
    return true;
  }, [authLoaded, authUserId, savedVersions.length, supabase]);

  const applySavedState = useCallback((state: Partial<SavedState>) => {
    setMasterResume(state.masterResume ?? sampleResume);
    setPersonalBranding(
      state.personalBranding
        ? normalizePersonalBranding(state.personalBranding)
        : brandingFromResumeText(state.masterResume ?? sampleResume),
    );
    setJobDescription(state.jobDescription ?? sampleJob);
    setTargetRole(state.targetRole ?? "AI Product Manager");
    setIndustryTarget(
      isIndustryTarget(state.industryTarget) ? state.industryTarget : "AI / Technology",
    );
    setTemplate(isTemplateId(state.template) ? state.template : "executive-navy");
    setTheme(isThemeId(state.theme) ? state.theme : "deep-navy");
    setAiSettings({
      ...defaultAiSettings,
      ...(state.aiSettings ?? {}),
      model: defaultAiSettings.model,
      positioningMode: positioningModes.includes(
        state.aiSettings?.positioningMode ?? defaultAiSettings.positioningMode,
      )
        ? state.aiSettings?.positioningMode ?? defaultAiSettings.positioningMode
        : defaultAiSettings.positioningMode,
    });
    setResult(
      ensureTailoringResult(
        state.result ?? null,
        isIndustryTarget(state.industryTarget) ? state.industryTarget : "AI / Technology",
        state.aiSettings?.positioningMode ?? defaultAiSettings.positioningMode,
      ),
    );
    setUploadedFiles(state.uploadedFiles ?? []);
  }, []);

  const starterSavedState = useCallback(
    (): SavedState => ({
      masterResume: sampleResume,
      jobDescription: sampleJob,
      targetRole: "Product Manager",
      industryTarget: "General / ATS",
      template: "executive-navy",
      theme: "deep-navy",
      result: null,
      uploadedFiles: [],
      aiSettings: defaultAiSettings,
      personalBranding: {
        ...brandingFromResumeText(sampleResume),
        fullName: "Avery Morgan",
        professionalTitle: "Senior Product Manager",
        email: "avery.morgan@example.com",
        phone: "(949) 555-0142",
        location: "Irvine, CA",
      },
    }),
    [],
  );

  const starterCloudContent = useCallback(
    (): CloudResumeContent => ({
      ...starterSavedState(),
      savedVersions: [],
    }),
    [starterSavedState],
  );

  const applyCloudContent = useCallback((content: CloudResumeContent) => {
    if (containsRestrictedSeedData(content)) {
      applySavedState(starterSavedState());
      setSavedVersions([]);
      setSelectedVersionId("");
      setCompareVersionIds([]);
      return;
    }

    applySavedState(content);

    const cloudVersions = Array.isArray(content.savedVersions)
      ? content.savedVersions
          .map(normalizeSavedVersion)
          .filter((version): version is SavedResumeVersion => Boolean(version))
      : [];

    setSavedVersions(cloudVersions);
    setSavedVersionsCount(cloudVersions.length);
    setSelectedVersionId((current) => current || cloudVersions[0]?.id || "");
  }, [applySavedState, starterSavedState]);

  useEffect(() => {
    if (!authLoaded) {
      return;
    }

    window.setTimeout(() => {
      try {
        if (authUser) {
          setHydrated(true);
          return;
        }

        const saved = window.localStorage.getItem(storageKey);

        if (saved) {
          const parsed = JSON.parse(saved) as Partial<SavedState>;
          if (containsRestrictedSeedData(parsed)) {
            window.localStorage.removeItem(storageKey);
            applySavedState(starterSavedState());
          } else {
            applySavedState(parsed);
          }
        }

        const savedVersionData = window.localStorage.getItem(versionStorageKey);

        if (savedVersionData) {
          const parsedVersions = JSON.parse(savedVersionData) as Array<
            Partial<SavedResumeVersion>
          >;
          if (containsRestrictedSeedData(parsedVersions)) {
            window.localStorage.removeItem(versionStorageKey);
            setSavedVersions([]);
          } else {
            const normalizedVersions = parsedVersions
              .map(normalizeSavedVersion)
              .filter((version): version is SavedResumeVersion => Boolean(version));

            setSavedVersions(normalizedVersions);
          }
        }

        const savedUsageData = window.localStorage.getItem(usageStorageKey);

        if (savedUsageData) {
          setUsageStats(normalizeUsageStats(JSON.parse(savedUsageData)));
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      } finally {
        setHydrated(true);
      }
    }, 0);
  }, [applySavedState, authLoaded, authUser, starterSavedState]);

  useEffect(() => {
    if (!authLoaded) {
      return;
    }

    const nextUserId = authUser?.id ?? null;

    if (lastAuthUserIdRef.current === nextUserId) {
      return;
    }

    lastAuthUserIdRef.current = nextUserId;

    window.setTimeout(() => {
      skipNextSave.current = true;
      skipNextCloudSave.current = true;
      setCloudResumeId(null);
      setCloudLoadedForUser("");
      setCloudSaveStatus(nextUserId ? "Loading your workspace..." : "");
      setSavedVersions([]);
      setSelectedVersionId("");
      setCompareVersionIds([]);
      setPreviewSourceFileId("");
      setUploadedFiles([]);
      setResult(null);
      setTailorError("");
      applySavedState(starterSavedState());
    }, 0);
  }, [applySavedState, authLoaded, authUser?.id, starterSavedState]);

  useEffect(() => {
    if (!authLoaded) {
      return;
    }

    if (!supabase || !authUserId) {
      window.setTimeout(() => {
        subscriptionFetchFailedRef.current = false;
        setSubscriptionProfileLoaded(false);
        setSubscriptionPlan("free");
        setSubscriptionStatus("free");
        setResumeDownloadCredits(0);
        setOptimizationCredits(0);
        setDownloadsUsed(0);
        setOptimizationCreditsUsed(0);
        setSavedVersionsCount(0);
        setOrganizationName("");
      }, 0);
      return;
    }

    let cancelled = false;
    let retryAttempted = false;
    let retryTimer: number | undefined;
    subscriptionFetchFailedRef.current = false;
    window.setTimeout(() => {
      setSubscriptionProfileLoaded(false);
    }, 0);

    async function loadSubscriptionProfile() {
      if (cancelled || subscriptionFetchFailedRef.current) {
        return;
      }

      const ok = await refreshSubscriptionProfile();

      if (!ok) {
        if (!retryAttempted) {
          retryAttempted = true;
          setSystemStatus("Reconnecting to your workspace...");
          retryTimer = window.setTimeout(() => {
            void loadSubscriptionProfile();
          }, 1500);
          return;
        }

        subscriptionFetchFailedRef.current = true;
        setSubscriptionProfileLoaded(true);
        setSystemStatus("We could not refresh your session. Your current workspace remains available.");
        window.clearInterval(refreshInterval);
      }
    }

    const refreshInterval = window.setInterval(loadSubscriptionProfile, 7000);
    loadSubscriptionProfile();

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      window.clearInterval(refreshInterval);
    };
  }, [authLoaded, authUserId, refreshSubscriptionProfile, supabase]);

  useEffect(() => {
    if (!authLoaded || !authUserId || !supabase) {
      return;
    }

    function refreshLiveProfile() {
      subscriptionFetchFailedRef.current = false;
      void refreshSubscriptionProfile();
    }

    function refreshVisibleProfile() {
      if (document.visibilityState === "visible") {
        refreshLiveProfile();
      }
    }

    window.addEventListener("focus", refreshLiveProfile);
    document.addEventListener("visibilitychange", refreshVisibleProfile);

    return () => {
      window.removeEventListener("focus", refreshLiveProfile);
      document.removeEventListener("visibilitychange", refreshVisibleProfile);
    };
  }, [authLoaded, authUserId, refreshSubscriptionProfile, supabase]);

  useEffect(() => {
    if (!authLoaded || !authUserId || !supabase || billingRefreshAttemptedRef.current) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("billing") !== "success") {
      return;
    }

    billingRefreshAttemptedRef.current = true;
    subscriptionFetchFailedRef.current = false;
    router.refresh();
    const immediateTimer = window.setTimeout(() => {
      setSubscriptionProfileLoaded(false);
      void refreshSubscriptionProfile();
    }, 0);
    const retryTimer = window.setTimeout(() => {
      void refreshSubscriptionProfile();
    }, 1500);

    return () => {
      window.clearTimeout(immediateTimer);
      window.clearTimeout(retryTimer);
    };
  }, [authLoaded, authUserId, refreshSubscriptionProfile, router, supabase]);

  useEffect(() => {
    if (isStarterPlan(subscriptionPlan) && isPremiumTemplate(template)) {
      window.setTimeout(() => {
        setTemplate("executive-navy");
        setSystemStatus("Premium template locked on Starter. Executive Navy is selected.");
      }, 0);
    }
  }, [subscriptionPlan, template]);

  useEffect(() => {
    if (!hydrated || !authLoaded || !supabase || !authUser) {
      return;
    }

    if (cloudLoadedForUser === authUser.id) {
      return;
    }

    if (cloudLoadInFlightUserRef.current === authUser.id) {
      return;
    }

    const activeSupabase = supabase;
    const activeUser = authUser;
    let cancelled = false;
    cloudLoadInFlightUserRef.current = activeUser.id;

    async function loadCloudResume() {
      setCloudSaveStatus("Loading saved workspace...");

      const { data, error } = await activeSupabase
        .from("resumes")
        .select("id, user_id, content_json")
        .eq("user_id", activeUser.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        setCloudSaveStatus("Cloud resume load failed. Please refresh or try again.");
        setCloudLoadedForUser(activeUser.id);
        cloudLoadInFlightUserRef.current = null;
        return;
      }

      if (
        data?.content_json &&
        typeof data.content_json === "object" &&
        data.user_id === activeUser.id &&
        !containsRestrictedSeedData(data.content_json)
      ) {
        skipNextSave.current = true;
        skipNextCloudSave.current = true;
        setCloudResumeId(data.id);
        applyCloudContent(data.content_json as CloudResumeContent);
        setCloudSaveStatus("Loaded saved workspace.");
      } else {
        const starterState = starterSavedState();
        const starterContent = starterCloudContent();
        const starterPayload = {
          user_id: activeUser.id,
          title: starterState.targetRole,
          target_role: starterState.targetRole,
          content_json: starterContent as Json,
          template: starterState.template,
          theme: starterState.theme,
        };
        const starterQuery = data?.id && data.user_id === activeUser.id
          ? activeSupabase
              .from("resumes")
              .update(starterPayload)
              .eq("id", data.id)
              .eq("user_id", activeUser.id)
              .select("id")
              .single()
          : activeSupabase
              .from("resumes")
              .insert(starterPayload)
              .select("id")
              .single();
        const { data: starterResume, error: starterError } = await starterQuery;

        if (cancelled) {
          return;
        }

        if (starterError) {
          setCloudSaveStatus("Could not create your starter workspace yet.");
          setCloudLoadedForUser(activeUser.id);
          cloudLoadInFlightUserRef.current = null;
          return;
        }

        skipNextSave.current = true;
        skipNextCloudSave.current = true;
        setCloudResumeId(starterResume.id);
        applySavedState(starterState);
        setSavedVersions([]);
        setSelectedVersionId("");
        setCompareVersionIds([]);
        setCloudSaveStatus(data?.id ? "Starter workspace restored." : "Starter workspace created.");
      }

      setCloudLoadedForUser(activeUser.id);
      cloudLoadInFlightUserRef.current = null;
    }

    loadCloudResume();

    return () => {
      cancelled = true;
      if (cloudLoadInFlightUserRef.current === activeUser.id) {
        cloudLoadInFlightUserRef.current = null;
      }
    };
  }, [applyCloudContent, applySavedState, authLoaded, authUser, cloudLoadedForUser, hydrated, starterCloudContent, starterSavedState, supabase]);

  useEffect(() => {
    if (!hydrated || authUser) {
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const savedState = buildSavedState();

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(savedState));
    } catch {
      // Storage can fail in private mode or when quota is full. User-facing
      // save/load actions surface their own status messages.
    }
  }, [
    hydrated,
    jobDescription,
    masterResume,
    result,
    industryTarget,
    targetRole,
    template,
    theme,
    uploadedFiles,
    aiSettings,
    personalBranding,
    buildSavedState,
    authUser,
  ]);

  useEffect(() => {
    if (!hydrated || !authLoaded || !supabase || !authUser) {
      return;
    }

    if (cloudLoadedForUser !== authUser.id) {
      return;
    }

    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }

    const activeSupabase = supabase;
    const activeUser = authUser;

    const timeout = window.setTimeout(async () => {
      setCloudSaveStatus("Autosaving...");

      const content = {
        ...buildSavedState(),
        savedVersions,
      } satisfies CloudResumeContent;

      const payload = {
        user_id: activeUser.id,
        title: targetRole.trim() || "Untitled Resume",
        target_role: targetRole.trim() || null,
        content_json: content as Json,
        template,
        theme,
      };

      const query = cloudResumeId
        ? activeSupabase
            .from("resumes")
            .update(payload)
            .eq("id", cloudResumeId)
            .eq("user_id", activeUser.id)
            .select("id")
            .single()
        : activeSupabase.from("resumes").insert(payload).select("id").single();

      const { data, error } = await query;

      if (error) {
        setCloudSaveStatus("Autosave failed. Your local draft is still saved.");
        return;
      }

      setCloudResumeId(data.id);
      setCloudSaveStatus("Autosaved to your account.");
    }, 60000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    aiSettings,
    authLoaded,
    authUser,
    cloudLoadedForUser,
    cloudResumeId,
    hydrated,
    jobDescription,
    masterResume,
    personalBranding,
    result,
    savedVersions,
    supabase,
    targetRole,
    template,
    theme,
    uploadedFiles,
    buildSavedState,
  ]);

  useEffect(() => {
    if (
      pathname !== "/workspace" ||
      !hydrated ||
      (authUser && cloudLoadedForUser !== authUser.id)
    ) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const opportunityRole = params.get("opportunityRole")?.trim() ?? "";
    const opportunityDescription = params.get("opportunityDescription")?.trim() ?? "";
    const prefillKey = `${opportunityRole}|${opportunityDescription}`;

    if (
      opportunityRole.length < 2 ||
      opportunityDescription.length < 20 ||
      opportunityPrefillRef.current === prefillKey
    ) {
      return;
    }

    opportunityPrefillRef.current = prefillKey;
    setTargetRole(opportunityRole);
    setJobDescription(opportunityDescription);
    setResult(null);
    setActiveOutput("resume");
    setSystemStatus("Opportunity details loaded. Review your materials, then optimize for this role.");
  }, [authUser, cloudLoadedForUser, hydrated, pathname]);

  useEffect(() => {
    if (!hydrated || authUser) {
      return;
    }

    try {
      window.localStorage.setItem(versionStorageKey, JSON.stringify(savedVersions));
    } catch {
      // Keep the in-memory version list active even if browser storage rejects it.
    }
  }, [authUser, hydrated, savedVersions]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(usageStorageKey, JSON.stringify(usageStats));
    } catch {
      // Usage limits are advisory in local mode.
    }
  }, [hydrated, usageStats]);

  useEffect(
    () => () => {
      Object.values(feedbackTimers.current).forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const extractedSourceText = useMemo(
    () =>
      uploadedFiles
        .map((file) => file.extractedText?.trim())
        .filter((text): text is string => Boolean(text))
        .join("\n\n"),
    [uploadedFiles],
  );

  const canTailor = useMemo(
    () =>
      masterResume.trim().length >= 40 &&
      jobDescription.trim().length >= 40 &&
      targetRole.trim().length >= 2,
    [jobDescription, masterResume, targetRole],
  );

  const selectedVersion = useMemo(
    () => savedVersions.find((version) => version.id === selectedVersionId) ?? null,
    [savedVersions, selectedVersionId],
  );

  const comparedVersions = useMemo(
    () =>
      compareVersionIds
        .map((id) => savedVersions.find((version) => version.id === id))
        .filter((version): version is SavedResumeVersion => Boolean(version)),
    [compareVersionIds, savedVersions],
  );

  function requireSubscriptionFeature(feature: SubscriptionFeature, label: string) {
    if (canUseSubscriptionFeature(subscriptionPlan, feature)) {
      return true;
    }

    setSystemStatus(
      `${label} is locked on Starter. Upgrade to Plus or Pro to unlock it.`,
    );
    return false;
  }

  function requireTemplateAccess(nextTemplate: TemplateId) {
    if (!isPremiumTemplate(nextTemplate) || canUseSubscriptionFeature(subscriptionPlan, "premiumTemplates")) {
      return true;
    }

    setSystemStatus("Premium templates are locked on Starter. Upgrade to Plus or Pro to unlock them.");
    return false;
  }

  function requireDownloadAccess(label: string, advanced = false) {
    if (advanced && !canUseSubscriptionFeature(subscriptionPlan, "advancedExports")) {
      setSystemStatus(`${label} is an advanced export. Upgrade to Plus or Pro to unlock it.`);
      return false;
    }

    if (canUseSubscriptionFeature(subscriptionPlan, "exports")) {
      if (documentExportsRemaining > 0) {
        return true;
      }

      setSystemStatus("You have used your available document exports. Upgrade or renew your plan for more exports.");
      return false;
    }

    if (effectiveDownloadsUsed < 1) {
      return true;
    }

    setSystemStatus("Starter includes 1 free resume download. Upgrade to Plus or Pro for premium document exports.");
    return false;
  }

  function requireOptimizationAccess(label: string) {
    if (canUseSubscriptionFeature(subscriptionPlan, "aiGenerations")) {
      if (optimizationCreditsRemaining > 0) {
        return true;
      }

      setSystemStatus("You have used your available optimization credits. Upgrade or renew your plan for more credits.");
      return false;
    }

    setSystemStatus(`${label} is locked on Starter. Upgrade to Plus or Pro to unlock advanced optimization.`);
    return false;
  }

  function openOutputTab(tab: OutputTab) {
    setActiveOutput(tab);
  }

  function syncProfileUsage(next: {
    downloadsUsed?: number;
    optimizationCreditsUsed?: number;
    savedVersionsCount?: number;
    resumeDownloadCredits?: number;
    optimizationCredits?: number;
  }) {
    if (!supabase || !authUser) {
      return;
    }

    void supabase
      .from("profiles")
      .update({
        ...(typeof next.downloadsUsed === "number"
          ? { document_exports_used: next.downloadsUsed }
          : {}),
        ...(typeof next.optimizationCreditsUsed === "number"
          ? { optimization_credits_used: next.optimizationCreditsUsed }
          : {}),
        ...(typeof next.savedVersionsCount === "number"
          ? { saved_versions_count: next.savedVersionsCount }
          : {}),
        ...(typeof next.resumeDownloadCredits === "number"
          ? { resume_download_credits: next.resumeDownloadCredits }
          : {}),
        ...(typeof next.optimizationCredits === "number"
          ? { optimization_credits: next.optimizationCredits }
          : {}),
      })
      .eq("id", authUser.id);
  }

  async function consumePersistedUsage(kind: "optimization" | "export") {
    const response = await fetch("/api/usage/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      downloadsUsed?: number;
      exportsRemaining?: number;
      exportLimit?: number;
      optimizationCreditsUsed?: number;
      optimizationCreditsRemaining?: number;
      optimizationCreditLimit?: number;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error || "Unable to update usage.");
    }

    if (typeof data.downloadsUsed === "number") {
      setDownloadsUsed(data.downloadsUsed);
    }
    if (typeof data.exportLimit === "number") {
      setResumeDownloadCredits(data.exportLimit);
    }
    if (typeof data.optimizationCreditsUsed === "number") {
      setOptimizationCreditsUsed(data.optimizationCreditsUsed);
    }
    if (typeof data.optimizationCreditLimit === "number") {
      setOptimizationCredits(data.optimizationCreditLimit);
    }

    return data;
  }

  function trackUsage(kind: "aiGenerations" | "exportsCreated" | "optimizationCreditsUsed") {
    setUsageStats((current) => {
      const normalized =
        current.date === usageDateKey() ? current : defaultUsageStats();
      const nextDownloads =
        kind === "exportsCreated" ? normalized.downloadsUsed + 1 : normalized.downloadsUsed;
      const nextOptimization =
        kind === "optimizationCreditsUsed"
          ? normalized.optimizationCreditsUsed + 1
          : normalized.optimizationCreditsUsed;

      return {
        ...normalized,
        aiGenerations:
          kind === "aiGenerations" || kind === "optimizationCreditsUsed"
            ? normalized.aiGenerations + 1
            : normalized.aiGenerations,
        exportsCreated:
          kind === "exportsCreated" ? normalized.exportsCreated + 1 : normalized.exportsCreated,
        downloadsUsed: nextDownloads,
        optimizationCreditsUsed: nextOptimization,
      };
    });

    if (kind === "exportsCreated") {
      const nextDownloadsUsed = downloadsUsed + 1;
      setDownloadsUsed(nextDownloadsUsed);
      if (authUser) {
        void consumePersistedUsage("export").catch((error) => {
          setSystemStatus(error instanceof Error ? error.message : "Unable to update export usage.");
          void refreshSubscriptionProfile();
        });
      } else {
        syncProfileUsage({ downloadsUsed: nextDownloadsUsed });
      }
    }

    if (kind === "optimizationCreditsUsed") {
      const nextOptimizationUsed = optimizationCreditsUsed + 1;
      setOptimizationCreditsUsed(nextOptimizationUsed);
      if (authUser) {
        void consumePersistedUsage("optimization").catch((error) => {
          setSystemStatus(error instanceof Error ? error.message : "Unable to update optimization usage.");
          void refreshSubscriptionProfile();
        });
      } else {
        syncProfileUsage({ optimizationCreditsUsed: nextOptimizationUsed });
      }
    }

    if (supabase && authUser) {
      if (kind === "aiGenerations" || kind === "optimizationCreditsUsed") {
        void supabase.from("ai_generations").insert({
          user_id: authUser.id,
          resume_id: cloudResumeId,
          prompt_type: kind === "optimizationCreditsUsed" ? "section_optimization" : "tailor_resume",
          tokens_used: 0,
        });
      } else if (kind === "exportsCreated") {
        void supabase.from("exports").insert({
          user_id: authUser.id,
          resume_id: cloudResumeId,
          export_type: activeOutput,
        });
      }
    }
  }

  function showActionFeedback(key: string, label: string, duration = 1700) {
    window.clearTimeout(feedbackTimers.current[key]);
    setActionFeedback((current) => ({ ...current, [key]: label }));
    feedbackTimers.current[key] = window.setTimeout(() => {
      setActionFeedback((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }, duration);
  }

  async function runWithFeedback(
    key: string,
    activeLabel: string,
    doneLabel: string,
    action: () => void | Promise<void>,
  ) {
    showActionFeedback(key, activeLabel, 30000);

    try {
      await action();
      showActionFeedback(key, doneLabel);
    } catch (error) {
      showActionFeedback(key, "Try again");
      throw error;
    }
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Sign out failed.");
      return;
    }

    setCloudResumeId(null);
    setCloudLoadedForUser("");
    cloudLoadInFlightUserRef.current = null;
    setCloudSaveStatus("");
    setSavedVersions([]);
    setSelectedVersionId("");
    setCompareVersionIds([]);
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(versionStorageKey);
    applySavedState(starterSavedState());
    setAccountStatus("Signed out. Neutral starter workspace is ready.");
  }

  function openMyResumesPlaceholder() {
    setAccountStatus(
      authUser
        ? "Your saved resume versions are synced in this workspace."
        : "Login to sync saved resume versions to your account.",
    );
    setSelectedVersionId((current) => current || savedVersions[0]?.id || "");
  }

  function currentVersionSnapshot(
    id = versionId(),
    name = defaultVersionName(targetRole, industryTarget),
  ) {
    if (!result) {
      return null;
    }

    const now = new Date().toISOString();

    return {
      id,
      name,
      targetRole,
      industryTarget,
      companyName: inferCompanyName(jobDescription),
      template,
      theme,
      createdAt: now,
      updatedAt: now,
      matchScore: result.score,
      masterResume,
      jobDescription,
      result,
      uploadedFiles,
      personalBranding,
    } satisfies SavedResumeVersion;
  }

  async function saveCurrentVersion() {
    if (!requireSubscriptionFeature("savedVersions", "Saved versions")) {
      return;
    }

    if (!canSaveAnotherVersion) {
      setVersionStatus(
        subscriptionPlan === "plus"
          ? "Plus includes up to 5 saved versions. Delete one or upgrade to Pro for unlimited saved versions."
          : "Saved versions are locked on Starter. Upgrade to Plus or Pro to save history.",
      );
      return;
    }

    const snapshot = currentVersionSnapshot();

    if (!snapshot) {
      setVersionStatus("Tailor a resume before saving a version.");
      return;
    }

    setSavedVersions((current) => [snapshot, ...current]);
    setSelectedVersionId(snapshot.id);
    setVersionStatus("Current resume version saved.");
    const nextSavedVersionsCount = savedVersionsCount + 1;
    setSavedVersionsCount(nextSavedVersionsCount);
    syncProfileUsage({ savedVersionsCount: nextSavedVersionsCount });

    if (!supabase || !authUser || !cloudResumeId) {
      return;
    }

    const { error } = await supabase.from("resume_versions").insert({
      resume_id: cloudResumeId,
      version_name: snapshot.name,
      content_json: snapshot as unknown as Json,
    });

    if (error) {
      setVersionStatus("Version saved locally. Cloud version save failed.");
    }
  }

  function loadVersion(version: SavedResumeVersion | null) {
    if (!version) {
      setVersionStatus("Select a saved version to load.");
      return;
    }

    try {
      setMasterResume(version.masterResume);
      setJobDescription(version.jobDescription);
      setTargetRole(version.targetRole);
      setIndustryTarget(version.industryTarget);
      setTemplate(version.template);
      setTheme(version.theme);
      setPersonalBranding(
        normalizePersonalBranding(
          version.personalBranding ?? brandingFromResumeText(version.masterResume),
        ),
      );
      setResult(
        ensureTailoringResult(
          version.result,
          version.industryTarget,
          version.result.advancedAnalysis?.positioningMode ??
            aiSettings.positioningMode,
        ),
      );
      setUploadedFiles(version.uploadedFiles);
      setActiveOutput("resume");
      setVersionStatus(`Loaded ${version.name}.`);
    } catch {
      setVersionStatus("This saved version could not be loaded.");
    }
  }

  function duplicateVersion(version: SavedResumeVersion | null) {
    if (!requireSubscriptionFeature("savedVersions", "Saved versions")) {
      return;
    }

    if (!canSaveAnotherVersion) {
      setVersionStatus(
        subscriptionPlan === "plus"
          ? "Plus includes up to 5 saved versions. Delete one or upgrade to Pro for unlimited saved versions."
          : "Saved versions are locked on Starter. Upgrade to Plus or Pro to duplicate versions.",
      );
      return;
    }

    if (!version) {
      setVersionStatus("Select a saved version to duplicate.");
      return;
    }

    const now = new Date().toISOString();
    const duplicate = {
      ...version,
      id: versionId(),
      name: `${version.name} Copy`,
      createdAt: now,
      updatedAt: now,
    };

    setSavedVersions((current) => [duplicate, ...current]);
    setSelectedVersionId(duplicate.id);
    const nextSavedVersionsCount = savedVersionsCount + 1;
    setSavedVersionsCount(nextSavedVersionsCount);
    syncProfileUsage({ savedVersionsCount: nextSavedVersionsCount });
    setVersionStatus("Version duplicated.");
  }

  function renameVersion(version: SavedResumeVersion | null) {
    if (!version) {
      setVersionStatus("Select a saved version to rename.");
      return;
    }

    const nextName = window.prompt("Rename saved resume version", version.name)?.trim();

    if (!nextName) {
      return;
    }

    setSavedVersions((current) =>
      current.map((item) =>
        item.id === version.id
          ? { ...item, name: nextName, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    setVersionStatus("Version renamed.");
  }

  function deleteVersion(version: SavedResumeVersion | null) {
    if (!version) {
      setVersionStatus("Select a saved version to delete.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this saved resume version?")) {
      return;
    }

    setSavedVersions((current) => current.filter((item) => item.id !== version.id));
    setCompareVersionIds((current) => current.filter((id) => id !== version.id));
    setSelectedVersionId((current) => (current === version.id ? "" : current));
    const nextSavedVersionsCount = Math.max(0, savedVersionsCount - 1);
    setSavedVersionsCount(nextSavedVersionsCount);
    syncProfileUsage({ savedVersionsCount: nextSavedVersionsCount });
    setVersionStatus("Version deleted.");
  }

  function toggleCompareVersion(versionIdToToggle: string) {
    setCompareVersionIds((current) =>
      current.includes(versionIdToToggle)
        ? current.filter((id) => id !== versionIdToToggle)
        : [...current, versionIdToToggle].slice(-4),
    );
  }

  async function tailorResume() {
    if (!requireOptimizationAccess("advanced resume tailoring")) {
      if (isStarterPlan(subscriptionPlan)) {
        const starterSourceText =
          extractedSourceText.trim().length > 0 &&
          masterResume.trim() === sampleResume.trim()
            ? extractedSourceText
            : [masterResume, extractedSourceText]
                .filter((text) => text.trim().length > 0)
                .join("\n\nSUPPORTING SOURCE MATERIAL\n");
        const starterGeneratedResult = buildTailoredResume(
          starterSourceText,
          jobDescription,
          targetRole,
        );
        setActiveOutput("resume");
        setTailorError("");
        setResult(starterGeneratedResult);
        setSystemStatus(
          "Starter preview generated one editable resume. Upgrade to unlock advanced optimization, premium exports, and saved versions.",
        );
      }
      return;
    }

    setActiveOutput("resume");
    setTailorError("");
    setIsTailoring(true);

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterResume,
          jobDescription,
          targetRole,
          industryTarget,
          uploadedSourceMaterials: uploadedFiles.map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            extractionStatus: file.extractionStatus,
            warnings: file.warnings,
            extractedText: file.extractedText,
          })),
          currentEditedResume: result?.rewrittenResume,
          aiSettings,
        }),
      });

      if (!response.ok) {
        throw new Error("Resume tailoring is unavailable right now.");
      }

      const data = (await response.json()) as TailorApiResponse;
      setResult(
        resultFromApiResponse(
          data,
          industryTarget,
          aiSettings.positioningMode,
          targetRole,
          jobDescription,
        ),
      );
      trackUsage("optimizationCreditsUsed");
    } catch {
      setTailorError(
        "Resume tailoring could not complete, so I used a safe fallback and kept your draft editable.",
      );
      setResult(
        buildTailoredResume(
          [masterResume, extractedSourceText]
            .filter((text) => text.trim().length > 0)
            .join("\n\nSUPPORTING SOURCE MATERIAL\n"),
          jobDescription,
          targetRole,
        ),
      );
      trackUsage("optimizationCreditsUsed");
    } finally {
      setIsTailoring(false);
    }
  }

  function generateCoverLetter() {
    if (!requireSubscriptionFeature("coverLetter", "Cover letters")) {
      return;
    }

    if (!requireOptimizationAccess("Cover letter generation")) {
      return;
    }

    setActiveOutput("cover");
    setResult((current) => {
      const nextResult =
        current ?? buildTailoredResume(masterResume, jobDescription, targetRole);
      const resumeText =
        nextResult.rewrittenResume.trim().length > 0
          ? nextResult.rewrittenResume
          : masterResume;

      return {
        ...nextResult,
        coverLetter: buildCoverLetterFromInputs(
          resumeText,
          targetRole,
          jobDescription,
        ),
      };
    });
    trackUsage("optimizationCreditsUsed");
  }

  function generateLinkedInProfile() {
    if (!requireSubscriptionFeature("linkedinProfile", "LinkedIn profile generation")) {
      return;
    }

    if (!requireOptimizationAccess("LinkedIn profile generation")) {
      return;
    }

    setResult((current) => {
      const nextResult =
        current ?? buildTailoredResume(masterResume, jobDescription, targetRole);
      const packageKit = buildApplicationPackage({
        resumeText: nextResult.rewrittenResume || masterResume,
        targetRole,
        industryTarget,
        jobDescription,
        coach: nextResult.coach,
      });

      return {
        ...nextResult,
        linkedin: packageKit.linkedin,
        applicationKit: packageKit.applicationKit,
      };
    });
    setActiveOutput("linkedin");
    trackUsage("optimizationCreditsUsed");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function resetSavedResume() {
    const starterState = starterSavedState();
    skipNextSave.current = true;
    window.localStorage.removeItem(storageKey);
    applySavedState(starterState);
    setTailorError("");
    setPreviewSourceFileId("");
    setActiveOutput("resume");
  }

  async function handleSourceFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const selectedFiles = Array.from(files);
    const selectedTypes = selectedFiles.map((file) => sourceFileType(file));

    if (selectedTypes.some((type) => [".png", ".jpg", ".jpeg", ".pdf"].includes(type))) {
      setSystemStatus("We are extracting text from the image. This may take a moment.");
    }

    const nextFiles = await Promise.all(selectedFiles.map(extractUploadedFile));

    setUploadedFiles((current) => {
      const byId = new Map(current.map((file) => [file.id, file]));

      for (const file of nextFiles) {
        byId.set(file.id, file);
      }

      return Array.from(byId.values());
    });

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }

    if (nextFiles.some((file) => file.extractionStatus === "extracted")) {
      const nextExtractedText = nextFiles
        .map((file) => file.extractedText?.trim())
        .filter((text): text is string => Boolean(text))
        .join("\n\n");

      if (nextExtractedText) {
        const extractedBranding = brandingFromResumeText(nextExtractedText);
        setPersonalBranding((current) => {
          const currentIsStarter =
            current.fullName === "Avery Morgan" &&
            current.email === "avery.morgan@example.com";

          return currentIsStarter
            ? {
                ...current,
                fullName: extractedBranding.fullName,
                professionalTitle: extractedBranding.professionalTitle,
                email: extractedBranding.email,
                phone: extractedBranding.phone,
                location: extractedBranding.location,
                linkedInUrl: extractedBranding.linkedInUrl,
                portfolioUrl: extractedBranding.portfolioUrl,
                websiteUrl: extractedBranding.websiteUrl,
              }
            : current;
        });
      }

      setActiveOutput("resume");
      setSystemStatus("Text extracted successfully and added to your source materials.");
    }

    if (
      nextFiles.some(
        (file) =>
          file.extractionStatus === "extraction_failed" &&
          [".png", ".jpg", ".jpeg"].includes(file.type),
      )
    ) {
      setSystemStatus(
        "We could not read text clearly from this image. Please upload a clearer file or paste the text manually.",
      );
      return;
    }

    if (
      nextFiles.some(
        (file) =>
          file.extractionStatus === "extraction_failed" ||
          file.extractionStatus === "ocr_required",
      )
    ) {
      setSystemStatus(
        "We could not extract text from this file. You can still use it as source material or paste the text manually.",
      );
      return;
    }

    if (nextFiles.some((file) => [".ppt", ".pptx"].includes(file.type))) {
      setSystemStatus(
        "PowerPoint files are saved as reference material. Text extraction for presentations will be added later.",
      );
    }
  }

  function removeSourceFile(fileId: string) {
    setUploadedFiles((current) => current.filter((file) => file.id !== fileId));
    setPreviewSourceFileId((current) => (current === fileId ? "" : current));
  }

  function updatePersonalBranding(field: keyof PersonalBranding, value: string) {
    setPersonalBranding((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleProfileImage(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSystemStatus("Profile image must be a PNG or JPG image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPersonalBranding((current) => ({
        ...current,
        profileImageDataUrl:
          typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.onerror = () => {
      setSystemStatus("Profile image could not be loaded.");
    };
    reader.readAsDataURL(file);
  }

  function updateResumeOutput(value: string) {
    const structured = structuredResumeFromText(value);

    setResult((current) =>
      current
        ? {
            ...current,
            rewrittenResume: value,
            summary: structured.summary,
            skills: structured.skills,
          }
        : current,
    );
  }

  function updateWorkspaceResumeOutput(value: string) {
    if (!result && workspaceResult) {
      const structured = structuredResumeFromText(value);

      setResult({
        ...workspaceResult,
        rewrittenResume: value,
        summary: structured.summary,
        skills: structured.skills,
      });
      return;
    }

    updateResumeOutput(value);
  }

  function updateCoverLetter(value: string) {
    setResult((current) =>
      current || workspaceResult
        ? {
            ...(current ?? workspaceResult),
            coverLetter: value,
          }
        : current,
    );
  }

  function rewriteSuggestedBullet(original: string, strongerVersion: string) {
    setResult((current) => {
      if (!current) {
        return current;
      }

      const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const bulletPattern = new RegExp(`(^|\\n)([-*]\\s*)?${escapedOriginal}`, "m");
      const rewrittenResume = bulletPattern.test(current.rewrittenResume)
        ? current.rewrittenResume.replace(
            bulletPattern,
            (_match, prefix: string, bulletMarker: string | undefined) =>
              `${prefix}${bulletMarker ?? ""}${strongerVersion}`,
          )
        : current.rewrittenResume;

      return {
        ...current,
        rewrittenResume,
        bullets: current.bullets.map((bullet) =>
          bullet === original ? strongerVersion : bullet,
        ),
        coach: {
          ...current.coach,
          weakBullets: current.coach.weakBullets.filter(
            (bullet) => bullet.original !== original,
          ),
        },
      };
    });
  }

  function replaceBulletWithVersion(original: string, replacement: string) {
    setResult((current) => {
      if (!current) {
        return current;
      }

      const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const bulletPattern = new RegExp(`(^|\\n)([-*]\\s*)?${escapedOriginal}`, "m");
      const rewrittenResume = bulletPattern.test(current.rewrittenResume)
        ? current.rewrittenResume.replace(
            bulletPattern,
            (_match, prefix: string, bulletMarker: string | undefined) =>
              `${prefix}${bulletMarker ?? ""}${replacement}`,
          )
        : current.rewrittenResume;

      return {
        ...current,
        rewrittenResume,
        bullets: current.bullets.map((bullet) =>
          bullet === original ? replacement : bullet,
        ),
      };
    });
  }

  async function downloadCoverLetterPdf() {
    if (!requireDownloadAccess("Cover letter PDF export", true)) {
      return;
    }

    if (!result) {
      return;
    }

    try {
      const blob = await createCoverLetterPdfBlob({
        coverLetter: result.coverLetter,
        resumeText: result.rewrittenResume,
        template,
        theme: previewTheme,
        branding: personalBranding,
      });
      saveBlob(blob, coverLetterFileName(targetRole, "pdf"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("Cover letter PDF export failed. Try DOCX or refresh and retry.");
    }
  }

  async function downloadCoverLetterDocx() {
    if (!requireDownloadAccess("Cover letter DOCX export", true)) {
      return;
    }

    if (!result) {
      return;
    }

    try {
      const blob = await createCoverLetterDocxBlob({
        coverLetter: result.coverLetter,
        resumeText: result.rewrittenResume,
        template,
        theme: previewTheme,
        branding: personalBranding,
      });
      saveBlob(blob, coverLetterFileName(targetRole, "docx"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("Cover letter DOCX export failed. Try PDF or refresh and retry.");
    }
  }

  function downloadCoverLetterTxt() {
    if (!requireDownloadAccess("Cover letter TXT export", true)) {
      return;
    }

    if (!result) {
      return;
    }

    try {
      saveBlob(
        new Blob([result.coverLetter], { type: "text/plain;charset=utf-8" }),
        coverLetterFileName(targetRole, "txt"),
      );
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("Cover letter TXT export failed. Try PDF or DOCX.");
    }
  }

  async function downloadResumePdf() {
    if (!requireDownloadAccess("Resume export")) {
      return;
    }

    const exportResult = result ?? workspaceResult;

    if (!exportResult) {
      return;
    }

    try {
      const blob = await createResumePdfBlob(
        exportResult.rewrittenResume,
        template,
        previewTheme,
        workspaceBranding,
      );
      saveBlob(blob, fileNameForRole(targetRole, "pdf"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("Resume PDF export failed. Try DOCX or refresh and retry.");
    }
  }

  async function downloadResumeDocx() {
    if (!requireDownloadAccess("Resume export")) {
      return;
    }

    const exportResult = result ?? workspaceResult;

    if (!exportResult) {
      return;
    }

    try {
      const blob = await createResumeDocxBlob(
        exportResult.rewrittenResume,
        template,
        previewTheme,
        workspaceBranding,
      );
      saveBlob(blob, fileNameForRole(targetRole, "docx"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("Resume DOCX export failed. Try PDF or refresh and retry.");
    }
  }

  async function downloadLinkedInKitPdf() {
    if (!requireDownloadAccess("LinkedIn Kit PDF export", true)) {
      return;
    }

    if (!result) {
      return;
    }

    try {
      const blob = await createTextKitPdfBlob({
        title: "LinkedIn Kit",
        body: serializeLinkedInKit(result.linkedin),
        theme: previewTheme,
      });
      saveBlob(blob, linkedinKitFileName(targetRole, "pdf"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("LinkedIn Kit PDF export failed. Try DOCX or retry.");
    }
  }

  async function downloadLinkedInKitDocx() {
    if (!requireDownloadAccess("LinkedIn Kit DOCX export", true)) {
      return;
    }

    if (!result) {
      return;
    }

    try {
      const blob = await createTextKitDocxBlob({
        title: "LinkedIn Kit",
        body: serializeLinkedInKit(result.linkedin),
        theme: previewTheme,
      });
      saveBlob(blob, linkedinKitFileName(targetRole, "docx"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("LinkedIn Kit DOCX export failed. Try PDF or retry.");
    }
  }

  async function downloadApplicationKitPdf() {
    if (!requireDownloadAccess("Application Kit PDF export", true)) {
      return;
    }

    if (!result) {
      return;
    }

    try {
      const blob = await createTextKitPdfBlob({
        title: "Application Kit",
        body: serializeApplicationKit(result.applicationKit),
        theme: previewTheme,
      });
      saveBlob(blob, applicationKitFileName(targetRole, "pdf"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("Application Kit PDF export failed. Try DOCX or retry.");
    }
  }

  async function downloadApplicationKitDocx() {
    if (!requireDownloadAccess("Application Kit DOCX export", true)) {
      return;
    }

    if (!result) {
      return;
    }

    try {
      const blob = await createTextKitDocxBlob({
        title: "Application Kit",
        body: serializeApplicationKit(result.applicationKit),
        theme: previewTheme,
      });
      saveBlob(blob, applicationKitFileName(targetRole, "docx"));
      trackUsage("exportsCreated");
    } catch {
      setSystemStatus("Application Kit DOCX export failed. Try PDF or retry.");
    }
  }

  function updateLinkedIn(field: keyof LinkedInKit, value: string | string[]) {
    setResult((current) =>
      current || workspaceResult
        ? {
            ...(current ?? workspaceResult),
            linkedin: {
              ...(current ?? workspaceResult).linkedin,
              [field]: value,
            },
          }
        : current,
    );
  }

  function updateApplicationKit(field: keyof ApplicationKit, value: string) {
    setResult((current) =>
      current || workspaceResult
        ? {
            ...(current ?? workspaceResult),
            applicationKit: {
              ...(current ?? workspaceResult).applicationKit,
              [field]: value,
            },
          }
        : current,
    );
  }

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="iseya-header">
        <div className="mx-auto max-w-[112rem] px-5 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/" aria-label="ISEYA home">
                <Image
                  src="/brand/iseya-logo2.png"
                  alt="ISEYA"
                  width={280}
                  height={140}
                  priority
                  className="h-auto w-[128px] object-contain sm:w-[185px] xl:w-[170px] 2xl:w-[185px]"
                />
              </Link>
              <p className="hidden border-l border-[var(--iseya-gold)] pl-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)] sm:block xl:text-[11px] xl:tracking-[0.14em] 2xl:text-xs">
                Beyond Resume. Positioning.
              </p>
            </div>
            <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 xl:flex 2xl:gap-4">
            <nav className="flex min-w-0 items-center justify-end gap-x-2.5 text-[10px] font-medium text-white/80 2xl:gap-x-3 2xl:text-[11px]">
              {authUser ? (
                <Link
                  className="transition hover:text-[var(--iseya-gold)]"
                  href="/workspace"
                >
                  Dashboard
                </Link>
              ) : null}
              <Link
                className={!isPublicLanding ? "text-[var(--iseya-gold)]" : authUser ? "transition hover:text-[var(--iseya-gold)]" : "text-[var(--iseya-gold)]"}
                href="/workspace"
              >
                Career Assets
              </Link>
              <Link className="transition hover:text-[var(--iseya-gold)]" href="/jobs">
                Jobs
              </Link>
              <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters">
                Recruiters
              </Link>
              <Link className="transition hover:text-[var(--iseya-gold)]" href="/institutions">
                Institutions
              </Link>
              {!authUser ? (
                <Link className="transition hover:text-[var(--iseya-gold)]" href="/demo">
                  Demo
                </Link>
              ) : null}
              <Link className="transition hover:text-[var(--iseya-gold)]" href="/pricing">
                Pricing
              </Link>
              <Link className="transition hover:text-[var(--iseya-gold)]" href="/contact">
                Contact
              </Link>
              {authUser ? (
                <Link className="transition hover:text-[var(--iseya-gold)]" href="/account">
                  Settings
                </Link>
              ) : null}
            </nav>
            <div className="flex shrink-0 items-center gap-2 [&_button]:min-h-9 [&_button]:px-2.5 [&_button]:text-[11px] [&_a]:min-h-9 [&_a]:px-2.5 [&_a]:text-[11px] 2xl:[&_button]:px-3 2xl:[&_a]:px-3">
              {authUser ? (
                <Link
                  href="/account"
                  className={`border border-white/40 bg-transparent text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] ${buttonBaseClass} ${buttonSizeMdClass}`}
                >
                  My Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() =>
                    trackAnalyticsEvent("login_initiated", { source: "homepage_header" })
                  }
                  className={`border border-white/40 bg-transparent text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] ${buttonBaseClass} ${buttonSizeMdClass}`}
                >
                  Login / Sign up
                </Link>
              )}
              {authUser ? (
                  <button
                    type="button"
                    onClick={openMyResumesPlaceholder}
                    className={`border border-white/40 bg-transparent text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] ${buttonBaseClass} ${buttonSizeMdClass}`}
                  >
                    My Resumes
                  </button>
              ) : null}
              {isPublicLanding ? (
                <Link
                  href="/workspace"
                  className={`${buttonBaseClass} ${buttonSizeMdClass} border border-[var(--iseya-gold)] bg-[var(--iseya-gold)] text-[var(--iseya-navy)] hover:border-white hover:bg-white`}
                >
                  Tailor Resume
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    runWithFeedback("tailor", "Tailoring...", "Done", tailorResume)
                  }
                  disabled={!canTailor || isTailoring}
                  className={`${buttonBaseClass} ${buttonSizeMdClass} border border-[var(--iseya-gold)] bg-[var(--iseya-gold)] text-[var(--iseya-navy)] hover:border-white hover:bg-white disabled:bg-white/30 disabled:text-white/70`}
                >
                  {isTailoring ? "Tailoring..." : actionFeedback.tailor ?? "Tailor Resume"}
                </button>
              )}
            </div>
            </div>
            <details className="relative xl:hidden">
              <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-md border border-white/30 px-3 text-sm font-semibold text-white">
                Menu
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                <nav className="grid gap-1 text-sm font-semibold text-[var(--iseya-navy)]">
                  {authUser ? <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/workspace">Dashboard</Link> : null}
                  <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/workspace">Career Assets</Link>
                  <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/jobs">Jobs</Link>
                  {authUser ? <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/applications">My Applications</Link> : null}
                  <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/recruiters">Recruiters</Link>
                  <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/institutions">Institutions</Link>
                  <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/demo">Demo</Link>
                  <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/pricing">Pricing</Link>
                  <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/contact">Contact</Link>
                  {authUser ? <Link className="rounded-md px-3 py-2 hover:bg-[#FFF8E6]" href="/account">Settings</Link> : null}
                </nav>
                <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                  <Link href={authUser ? "/account" : "/login"} className={`${secondaryButtonClass} ${buttonSizeMdClass}`}>
                    {authUser ? "My Account" : "Login / Sign up"}
                  </Link>
                  {authUser ? (
                    <button type="button" onClick={openMyResumesPlaceholder} className={`${secondaryButtonClass} ${buttonSizeMdClass}`}>
                      My Resumes
                    </button>
                  ) : null}
                  {isPublicLanding ? (
                    <Link href="/workspace" className={`${primaryButtonClass} ${buttonSizeMdClass}`}>
                      Tailor Resume
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => runWithFeedback("tailor", "Tailoring...", "Done", tailorResume)}
                      disabled={!canTailor || isTailoring}
                      className={`${primaryButtonClass} ${buttonSizeMdClass}`}
                    >
                      {isTailoring ? "Tailoring..." : actionFeedback.tailor ?? "Tailor Resume"}
                    </button>
                  )}
                </div>
              </div>
            </details>
          </div>
            {accountStatus ? (
              <div className="mt-3 rounded-md border border-white/15 bg-white/10 p-3 text-xs font-medium text-white/80">
                <p>{accountStatus}</p>
                {authUser ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-2 rounded-md border border-white/30 px-3 py-1.5 font-semibold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
                  >
                    Sign out
                  </button>
                ) : null}
              </div>
            ) : null}
        </div>
      </section>

      {isPublicLanding ? (
        <>
      <section className="mx-auto max-w-[92rem] px-5 pt-6 pb-5 sm:px-8 sm:pt-9 sm:pb-8 lg:pt-12 lg:pb-8">
          <div className="grid w-full gap-7 sm:gap-10 lg:grid-cols-[minmax(480px,1fr)_minmax(330px,0.62fr)] lg:items-center lg:gap-20">
            <div>
              <h1 className="max-w-3xl text-[2.2rem] font-semibold leading-[1.08] text-[var(--iseya-navy)] sm:text-5xl lg:text-[4rem]">
                Career infrastructure for today&apos;s talent.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:mt-5 sm:text-base sm:leading-7">
                Build career assets, discover trusted opportunities, and stay visible to recruiters and institutions.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
                <Link
                  href={authUser ? "/workspace" : "/signup"}
                  onClick={() => {
                    trackAnalyticsEvent("homepage_cta_clicked", {
                      cta: "start_free",
                      destination: authUser ? "workspace" : "signup",
                    });
                    trackAnalyticsEvent(
                      authUser ? "candidate_workspace_started" : "signup_initiated",
                      { source: "homepage_hero" },
                    );
                  }}
                  className={`${primaryButtonClass} ${buttonSizeMdClass} w-full sm:w-auto`}
                >
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/demo"
                  onClick={() =>
                    trackAnalyticsEvent("demo_opened", {
                      source: "homepage_hero",
                    })
                  }
                  className={`${secondaryButtonClass} ${buttonSizeMdClass} w-full sm:w-auto`}
                >
                  See Demo
                </Link>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:mt-8 sm:grid-cols-3">
                {[
                  {
                    title: "Career workspace",
                    copy: "Organize materials and next steps in one place.",
                    icon: FolderOpen,
                    href: authUser ? "/workspace" : "/signup?redirectedFrom=%2Fworkspace",
                    iconClass: "bg-blue-50 text-blue-600",
                  },
                  {
                    title: "Professional visibility",
                    copy: "Present structured career assets with clarity.",
                    icon: UsersRound,
                    href: authUser ? "/workspace" : "/signup?redirectedFrom=%2Fworkspace",
                    iconClass: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    title: "Trusted opportunities",
                    copy: "Explore sourced roles and readiness insight.",
                    icon: Building2,
                    href: "/jobs",
                    iconClass: "bg-amber-50 text-amber-700",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg border border-transparent px-0 py-1.5 transition hover:border-[var(--iseya-gold)]/30 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 sm:px-2 sm:py-2"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${item.iconClass}`}>
                      <item.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold leading-5 text-[var(--iseya-navy)] transition group-hover:text-[var(--iseya-gold)]">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        {item.copy}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative lg:translate-x-4">
              <div className="pointer-events-none absolute -left-12 top-10 hidden w-36 rotate-[-5deg] rounded-xl border border-slate-200/80 bg-white p-3 opacity-85 shadow-[0_14px_32px_rgb(0_14_47_/_0.08)] lg:block">
                <p className="text-xs font-semibold text-[var(--iseya-navy)]">Jordan Taylor</p>
                <p className="mt-1 text-[10px] text-slate-500">Product Operations Manager</p>
                <div className="mt-3 space-y-1.5">
                  {["Summary", "Skills", "Experience"].map((line, index) => (
                    <div key={line} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-[var(--iseya-gold)]" : "bg-slate-300"}`} />
                      <span className="h-1.5 flex-1 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute -left-7 bottom-8 hidden w-32 rotate-[4deg] rounded-xl border border-slate-200/80 bg-white p-3 opacity-80 shadow-[0_14px_32px_rgb(0_14_47_/_0.07)] lg:block">
                <p className="text-xs font-semibold text-[var(--iseya-navy)]">Career Profile</p>
                <div className="mt-3 space-y-2">
                  {["Role Fit", "Key Strengths", "Readiness"].map((line, index) => (
                    <div key={line}>
                      <p className="text-[9px] font-medium text-slate-500">{line}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className={`h-1.5 rounded-full ${index === 2 ? "w-[82%] bg-[var(--iseya-gold)]" : "w-[70%] bg-[var(--iseya-navy)]/70"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            <aside className="iseya-hero-card relative z-10 rounded-2xl border border-slate-200/85 bg-white p-4 shadow-[0_18px_46px_rgb(0_14_47_/_0.09)] sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold leading-7 text-[var(--iseya-navy)]">
                    Jordan Taylor
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Product Operations Manager
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Ready
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {[
                  { label: "Resume", icon: FileText, active: true },
                  { label: "Cover Letter", icon: ClipboardList },
                  { label: "LinkedIn Profile", icon: UsersRound },
                  { label: "Application Kit", icon: BriefcaseBusiness },
                  { label: "Interview Prep", icon: UsersRound },
                  { label: "Job Tracker", icon: BriefcaseBusiness },
                ].map((module) => (
                  <div
                    key={module.label}
                    className={`flex min-h-12 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                      module.active
                        ? "border-[var(--iseya-navy)] bg-[var(--iseya-navy)] text-white shadow-[0_10px_22px_rgb(0_14_47_/_0.12)]"
                        : "border-slate-200 bg-[#F8FAFD] text-[var(--iseya-navy)]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                        module.active ? "bg-[var(--iseya-gold)] text-[var(--iseya-navy)]" : "bg-white text-slate-500"
                      }`}
                    >
                      <module.icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">{module.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 rounded-xl bg-[#F8FAFD] p-4">
                {[
                  { label: "ATS Readiness", value: "90/100", percent: "90%", color: "bg-[var(--iseya-gold)]" },
                  { label: "Role Fit", value: "88/100", percent: "88%", color: "bg-emerald-500" },
                ].map((score) => (
                  <div key={score.label}>
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                      <span className="text-slate-600">{score.label}</span>
                      <span className="text-[var(--iseya-navy)]">{score.value}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                      <div className={`h-1.5 rounded-full ${score.color}`} style={{ width: score.percent }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Run ATS Check", "Keyword Match", "Optimize Resume"].map((action, index) => (
                  <span
                    key={action}
                    className={`inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold ${
                      index === 0
                        ? "border-[var(--iseya-gold)] bg-[var(--iseya-gold)] text-[var(--iseya-navy)]"
                        : "border-slate-200 bg-white text-[var(--iseya-navy)]"
                    }`}
                  >
                    {action}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Career assets structured for recruiter review.
              </div>
            </aside>
            </div>
          </div>
      </section>
      <HowIseyaWorks workspaceHref={authUser ? "/workspace" : "/signup?redirectedFrom=%2Fworkspace"} />
      <FinalConversionCta
        startHref={authUser ? "/workspace" : "/signup"}
        onStartFree={() => {
          trackAnalyticsEvent("homepage_cta_clicked", {
            cta: "start_free",
            destination: authUser ? "workspace" : "signup",
            source: "homepage_story_cta",
          });
          trackAnalyticsEvent(
            authUser ? "candidate_workspace_started" : "signup_initiated",
            { source: "homepage_story_cta" },
          );
        }}
        onExploreJobs={() =>
          trackAnalyticsEvent("homepage_cta_clicked", {
            cta: "explore_jobs",
            source: "homepage_story_cta",
          })
        }
      />
      <section className="border-y border-slate-200/70 bg-white">
        <div className="mx-auto grid max-w-[92rem] gap-6 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-[240px_repeat(5,minmax(0,1fr))] lg:gap-0">
          <div className="pr-6 sm:col-span-2 lg:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              Built for the career ecosystem
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-[var(--iseya-navy)]">
              One platform.
              <br />Every career connection.
            </h2>
            <p className="mt-4 text-xs leading-5 text-slate-600">
              Career preparation meets transparent opportunity discovery and professional visibility.
            </p>
          </div>
          {[
            { title: "Career Workspace", copy: "Build career assets and tailor resumes for specific opportunities.", icon: FolderOpen, href: "/workspace", linkLabel: "Explore career workspace", color: "bg-blue-50 text-blue-600" },
            { title: "Opportunity Discovery", copy: "Explore source-transparent roles from recruiters, employers, and curated channels.", icon: Search, href: "/jobs", linkLabel: "Browse opportunities", color: "bg-emerald-50 text-emerald-600" },
            { title: "Recruiter Access", copy: "Verified recruiters post roles and review structured candidate interest.", icon: UsersRound, href: "/recruiters", linkLabel: "Explore recruiter tools", color: "bg-blue-50 text-blue-700" },
            { title: "Institution Insights", copy: "Institutions receive aggregate, privacy-safe career readiness insights.", icon: Building2, href: "/institutions", linkLabel: "View institution experience", color: "bg-orange-50 text-orange-600" },
            { title: "Career Co-pilots", copy: "Refine professional positioning and application materials with focused guidance.", icon: Zap, href: "/workspace", linkLabel: "Build career assets", color: "bg-amber-50 text-amber-600" },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-lg border border-slate-200/80 p-4 transition hover:border-[var(--iseya-gold)]/45 hover:bg-[#FFFDF8] hover:shadow-[0_8px_20px_rgb(0_14_47_/_0.045)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] sm:p-5 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l lg:px-6 lg:py-1"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}>
                <feature.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-[var(--iseya-navy)]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.copy}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:text-[var(--iseya-navy)]">
                {feature.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <TrustAudienceSection />
        </>
      ) : null}

      {!isPublicLanding ? (
        <>
      <section id="resume-builder" className="mx-auto max-w-[112rem] overflow-x-hidden px-4 pt-4 sm:px-8 sm:pt-5">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgb(15_23_42_/_0.04)] transition sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-3xl">
                Career Assets
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Build, tailor, and optimize your career documents in one intelligent workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-navy)]">
                {cloudSaveStatus || "Live workspace"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <MiniAnalyticsCard
              label="ATS Readiness"
              value={`${Math.round(safeMatchBreakdown(workspaceResult.matchBreakdown, safeScore(workspaceResult.score, 0)).atsReadability)}/100`}
              detail="Document strength"
              progress={safeMatchBreakdown(workspaceResult.matchBreakdown, safeScore(workspaceResult.score, 0)).atsReadability}
              tone="green"
            />
            <MiniAnalyticsCard
              label="Role Fit"
              value={`${Math.round(safeMatchBreakdown(workspaceResult.matchBreakdown, safeScore(workspaceResult.score, 0)).roleFit)}/100`}
              detail="Target alignment"
              progress={safeMatchBreakdown(workspaceResult.matchBreakdown, safeScore(workspaceResult.score, 0)).roleFit}
              tone="blue"
            />
            <MiniAnalyticsCard
              label="Optimization Credits"
              value={`${optimizationCreditsRemaining}/${optimizationCreditLimit}`}
              detail={`${effectiveOptimizationCreditsUsed} used`}
              progress={optimizationProgressPercent}
              tone="gold"
            />
            <MiniAnalyticsCard
              label="Saved Versions"
              value={`${activeSavedVersionsCount}${Number.isFinite(savedVersionLimit) ? `/${savedVersionLimit}` : ""}`}
              detail={Number.isFinite(savedVersionLimit) ? "Role-specific drafts" : "Unlimited version history"}
              progress={savedVersionProgressPercent}
              tone="blue"
            />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.95fr)]">
            <section
              aria-labelledby="next-best-actions-title"
              className="rounded-lg border border-slate-200 bg-slate-50/55 p-3.5 sm:p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                    Career Progress
                  </p>
                  <h2 id="next-best-actions-title" className="mt-1 text-base font-semibold text-[var(--iseya-navy)]">
                    Next Best Actions
                  </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {currentPlanLabel}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link
                  href="#active-document-workspace"
                  className={`group rounded-md border border-slate-200 bg-white p-3 transition hover:border-[var(--iseya-gold)]/55 hover:shadow-sm ${focusRingClass}`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--iseya-gold)]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                        Improve career materials
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {hasPersonalizedSourceMaterial
                          ? "Continue tailoring the resume source already in your workspace."
                          : "Add your resume source to begin role-specific tailoring."}
                      </p>
                    </div>
                  </div>
                </Link>
                <Link
                  href="/jobs"
                  className={`group rounded-md border border-slate-200 bg-white p-3 transition hover:border-[var(--iseya-gold)]/55 hover:shadow-sm ${focusRingClass}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Search className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                        Browse matching jobs
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Explore published opportunities for {workspaceDirection}.
                      </p>
                    </div>
                  </div>
                </Link>
                <Link
                  href="/applications"
                  className={`group rounded-md border border-slate-200 bg-white p-3 transition hover:border-[var(--iseya-gold)]/55 hover:shadow-sm ${focusRingClass}`}
                >
                  <div className="flex items-start gap-2.5">
                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-[var(--iseya-navy)]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                        Review active applications
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Track your submissions, progress, and recruiter updates.
                      </p>
                    </div>
                  </div>
                </Link>
                <Link
                  href="#active-document-workspace"
                  className={`group rounded-md border border-slate-200 bg-white p-3 transition hover:border-[var(--iseya-gold)]/55 hover:shadow-sm ${focusRingClass}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                        Complete workspace details
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {hasWorkspaceIdentity
                          ? "Your personal details are ready for document output."
                          : "Add contact and professional details for polished output."}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
              {isStarterPlan(subscriptionPlan) ? (
                <div className="mt-3 flex flex-col gap-2 rounded-md border border-[var(--iseya-gold)]/30 bg-[#FFF8E6]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-[var(--iseya-navy)]">
                    Upgrade when you need additional optimization credits, exports, and saved versions.
                  </p>
                  <Link href="/pricing" className={`${secondaryButtonClass} ${buttonSizeSmClass} shrink-0`}>
                    View plans
                  </Link>
                </div>
              ) : null}
            </section>

            <section
              aria-labelledby="opportunity-preview-title"
              className="rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                Career Direction
              </p>
              <h2 id="opportunity-preview-title" className="mt-1 text-base font-semibold text-[var(--iseya-navy)]">
                Recommended Opportunities Preview
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Based on the target role in this workspace, start with published roles aligned to{" "}
                <span className="font-semibold text-[var(--iseya-navy)]">{workspaceDirection}</span>.
              </p>
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start gap-2.5">
                  <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-[var(--iseya-gold)]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                      Explore verified and sourced roles
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Open a job to bring its requirements back into your tailoring workflow.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Link href="/jobs" className={`${primaryButtonClass} ${buttonSizeSmClass}`}>
                  Browse opportunities
                  <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link href="/applications" className={`${secondaryButtonClass} ${buttonSizeSmClass}`}>
                  My applications
                </Link>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                Opportunity suggestions use your selected direction only. Application status remains private in My Applications.
              </p>
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[112rem] overflow-x-hidden px-4 py-3 sm:px-8 sm:py-4">
        <div className="hidden">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Resume Tailoring
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--iseya-navy)]">
            Let&apos;s tailor your resume
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add your details and target role so we can optimize your resume.
          </p>
          <label
            htmlFor="source-resume-detail"
            className="sr-only"
          >
            Source Resume
          </label>
          <p className="sr-only">
            Paste your source resume or start from the neutral starter draft.
          </p>
          <textarea
            id="source-resume-detail"
            value={masterResume}
            onChange={(event) => setMasterResume(event.target.value)}
            className="sr-only"
            placeholder="Paste your master resume here..."
          />

          <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">
                  Personal Information
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These details control the resume preview and exports without
                  inserting placeholder values.
                </p>
              </div>
              {personalBranding.profileImageDataUrl ? (
                <button
                  type="button"
                  onClick={() => updatePersonalBranding("profileImageDataUrl", "")}
                  className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                >
                  Remove Image
                </button>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ContactField label="Full Name" value={personalBranding.fullName} onChange={(value) => updatePersonalBranding("fullName", value)} />
              <ContactField label="Professional Title" value={personalBranding.professionalTitle} onChange={(value) => updatePersonalBranding("professionalTitle", value)} />
              <ContactField label="Email" value={personalBranding.email} onChange={(value) => updatePersonalBranding("email", value)} />
              <ContactField label="Phone" value={personalBranding.phone} onChange={(value) => updatePersonalBranding("phone", value)} />
              <ContactField label="Location" value={personalBranding.location} onChange={(value) => updatePersonalBranding("location", value)} />
              <ContactField label="LinkedIn URL" value={personalBranding.linkedInUrl} onChange={(value) => updatePersonalBranding("linkedInUrl", value)} />
              <ContactField label="Portfolio URL" value={personalBranding.portfolioUrl} onChange={(value) => updatePersonalBranding("portfolioUrl", value)} />
              <ContactField label="Website URL" value={personalBranding.websiteUrl} onChange={(value) => updatePersonalBranding("websiteUrl", value)} />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              {personalBranding.profileImageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={personalBranding.profileImageDataUrl}
                  alt=""
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                />
              ) : null}
              <label className={`${secondaryButtonClass} ${buttonSizeMdClass} cursor-pointer`}>
                Optional Profile Image
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={(event) => handleProfileImage(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>
              <p className="text-xs leading-5 text-slate-500">
                Hidden automatically in ATS-focused templates.
              </p>
            </div>
          </section>

          <section className="mt-4 rounded-lg border border-[var(--iseya-gold)]/25 bg-[#FFF8E6]/60 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
              Readiness Assistant
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--iseya-navy)]">
              {[
                "Add a clear professional summary",
                "Include quantifiable achievements",
                "Match keywords from the job description",
                "Keep formatting clean and consistent",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--iseya-gold)]" />
                  {tip}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => runWithFeedback("tailor", "Optimizing...", "Optimized", tailorResume)}
              disabled={!canTailor || isTailoring}
              className={`${primaryButtonClass} ${buttonSizeMdClass} mt-4 w-full`}
            >
              {isTailoring ? "Optimizing..." : "Optimize Resume"}
            </button>
          </section>

          <div className="hidden">
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Accepts PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, PPT, and PPTX.
              Text extraction is available for readable PDF, DOCX, TXT, and
              image files. Presentations are saved as reference material.
            </p>

            {uploadedFiles.length > 0 ? (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {file.type.toUpperCase()} | {formatFileSize(file.size)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {extractionStatusLabel(file.extractionStatus)} |
                          {" "}
                          {(file.extractedText?.length ?? 0).toLocaleString()}
                          {" "}
                          characters
                        </p>
                        {safeStringArray(file.warnings).length > 0 ? (
                          <p className="mt-1 text-xs leading-5 text-amber-700">
                            {safeStringArray(file.warnings).join(" ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewSourceFileId((current) =>
                              current === file.id ? "" : file.id,
                            )
                          }
                          disabled={!file.extractedText}
                          className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                        >
                          Preview Extracted Text
                        </button>
                        <FeedbackButton
                          onClick={() => removeSourceFile(file.id)}
                          doneLabel="Removed"
                          className={`${dangerButtonClass} ${buttonSizeSmClass}`}
                        >
                          Remove
                        </FeedbackButton>
                      </div>
                    </div>
                    {previewSourceFileId === file.id && file.extractedText ? (
                      <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-white p-3 text-xs leading-5 text-zinc-600">
                        {file.extractedText}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <section className="hidden">
            <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">
              Source Materials
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-700">
              <div>
                <p className="font-semibold text-zinc-800">Pasted resume</p>
                <p className="text-zinc-500">
                  {masterResume.trim().length > 0
                    ? `${masterResume.trim().length.toLocaleString()} characters available`
                    : "No pasted resume text yet"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800">Uploaded files</p>
                {uploadedFiles.length > 0 ? (
                  <ul className="mt-1 space-y-2">
                    {uploadedFiles.map((file) => (
                      <li
                        key={file.id}
                        className="rounded-md border border-zinc-200 bg-white p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-zinc-800">{file.name}</p>
                            <p className="text-xs text-zinc-500">
                              {file.type.toUpperCase()} |{" "}
                              {extractionStatusLabel(file.extractionStatus)} |{" "}
                              {(file.extractedText?.length ?? 0).toLocaleString()} chars
                            </p>
                          </div>
                          <FeedbackButton
                            onClick={() => removeSourceFile(file.id)}
                            doneLabel="Removed"
                            className={`${dangerButtonClass} ${buttonSizeSmClass}`}
                          >
                            Remove
                          </FeedbackButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-500">No uploaded files yet</p>
                )}
              </div>
              {extractedSourceText ? (
                <details className="rounded-md border border-zinc-200 bg-white p-3">
                  <summary className="text-sm font-semibold text-zinc-800">
                    Combined extracted source text
                  </summary>
                  <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                    {extractedSourceText}
                  </pre>
                </details>
              ) : null}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="hidden">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-navy)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-[var(--iseya-navy)]">1</span>
              Target Role &amp; Job Description
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--iseya-navy)]">
              Opportunity alignment
            </h2>
            <label
              htmlFor="target-role"
              className="mt-5 block text-sm font-semibold text-[var(--iseya-navy)]"
            >
              Target Role / Job Title
            </label>
            <input
              id="target-role"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-4 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              placeholder="Example: Product Manager"
            />

            <label
              htmlFor="industry-target"
              className="mt-5 block text-sm font-semibold text-[var(--iseya-navy)]"
            >
              Target Industry
            </label>
            <select
              id="industry-target"
              value={industryTarget}
              onChange={(event) =>
                setIndustryTarget(event.target.value as IndustryTarget)
              }
              className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
            >
              {industryTargets.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>

            <div className="hidden">
              <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                Template
                <select
                  value={template}
                  onChange={(event) => {
                    const nextTemplate = event.target.value as TemplateId;

                    if (requireTemplateAccess(nextTemplate)) {
                      setTemplate(nextTemplate);
                    }
                  }}
                  className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                >
                  {Object.entries(templates).map(([id, item]) => {
                    const templateId = id as TemplateId;
                    const locked =
                      isPremiumTemplate(templateId) &&
                      !canUseSubscriptionFeature(subscriptionPlan, "premiumTemplates");

                    return (
                    <option key={id} value={id}>
                      {locked ? "🔒 " : ""}{item.label}{locked ? " (Plus)" : ""}
                    </option>
                    );
                  })}
                </select>
              </label>

              <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                Theme
                <select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as ThemeId)}
                  className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                >
                  <option value="deep-navy">Deep Navy</option>
                  <option value="modern-teal">Modern Teal</option>
                  <option value="royal-blue">Royal Blue</option>
                  <option value="emerald">Emerald</option>
                  <option value="slate-gray">Slate Gray</option>
                  <option value="minimal-black">Minimal Black</option>
                  <option value="purple-executive">Purple Executive</option>
                </select>
              </label>
            </div>

            <p className="hidden">
              {templates[template].description}
              {isPremiumTemplate(template) && isStarterPlan(subscriptionPlan)
                ? " Premium preview locked on Starter."
                : ""}
            </p>

            <label
              htmlFor="job-description"
              className="mt-5 block text-sm font-semibold text-[var(--iseya-navy)]"
            >
              Job Description
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="mt-3 min-h-[180px] w-full resize-y rounded-md border border-zinc-300 bg-white p-3 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              placeholder="Paste the target job description here..."
            />
          </div>

          <section id="source-materials-legacy" className="hidden">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-navy)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-[var(--iseya-navy)]">3</span>
              Source Materials
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Paste a resume or upload supporting material for accurate tailoring.
            </p>
            <label htmlFor="master-resume" className="mt-4 block text-xs font-semibold text-slate-700">
              Pasted Resume
            </label>
            <textarea
              id="master-resume"
              value={masterResume}
              onChange={(event) => setMasterResume(event.target.value)}
              className="mt-2 min-h-[135px] w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              placeholder="Paste your source resume here..."
            />
            <label
              htmlFor="source-file-upload"
              className={`${secondaryButtonClass} ${buttonSizeSmClass} mt-3 cursor-pointer`}
            >
              Upload Files
            </label>
            <input
              id="source-file-upload"
              type="file"
              multiple
              accept={acceptedSourceFileTypes}
              onChange={(event) => handleSourceFiles(event.target.files)}
              className="sr-only"
            />
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              PDF, DOCX, TXT and supported image files.
            </p>
            {uploadedFiles.length > 0 ? (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs">
                    <p className="truncate font-semibold text-[var(--iseya-navy)]">{file.name}</p>
                    <p className="mt-1 text-slate-500">
                      {extractionStatusLabel(file.extractionStatus)} | {(file.extractedText?.length ?? 0).toLocaleString()} chars
                    </p>
                    {safeStringArray(file.warnings).length > 0 ? (
                      <p className="mt-1 text-[11px] leading-5 text-amber-700">
                        {safeStringArray(file.warnings).join(" ")}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewSourceFileId((current) => current === file.id ? "" : file.id)}
                        disabled={!file.extractedText}
                        className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                      >
                        Preview
                      </button>
                      <FeedbackButton
                        onClick={() => removeSourceFile(file.id)}
                        doneLabel="Removed"
                        className={`${dangerButtonClass} ${buttonSizeSmClass}`}
                      >
                        Remove
                      </FeedbackButton>
                    </div>
                    {previewSourceFileId === file.id && file.extractedText ? (
                      <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600">
                        {file.extractedText}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No uploaded files yet.</p>
            )}
          </section>

          <section id="optimization-settings-legacy" className="hidden">
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--iseya-navy)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-xs font-bold text-[var(--iseya-navy)]">4</span>
                Optimization Settings
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[var(--iseya-navy)]">
                  Positioning Mode
                  <select
                    value={aiSettings.positioningMode}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        positioningMode: event.target.value as PositioningMode,
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                  >
                    {positioningModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-[var(--iseya-navy)]">
                  Creativity: {aiSettings.creativity}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={aiSettings.creativity}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        creativity: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full"
                  />
                </label>
                <label className="text-sm font-semibold text-[var(--iseya-navy)]">
                  ATS Strictness: {aiSettings.atsStrictness}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={aiSettings.atsStrictness}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        atsStrictness: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full"
                  />
                </label>
                <label className="text-sm font-semibold text-[var(--iseya-navy)]">
                  Tone Style
                  <select
                    value={aiSettings.toneStyle}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        toneStyle: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                  >
                    <option value="Executive concise">Executive concise</option>
                    <option value="Technical precise">Technical precise</option>
                    <option value="Consulting polished">Consulting polished</option>
                    <option value="Academic evidence-based">
                      Academic evidence-based
                    </option>
                  </select>
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold text-[var(--iseya-navy)]">
                  <input
                    type="checkbox"
                    checked={aiSettings.aggressiveOptimization}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        aggressiveOptimization: event.target.checked,
                      }))
                    }
                  />
                  Aggressive optimization
                </label>
              </div>
            </details>
          </section>

          <details className="rounded-lg border border-zinc-200 bg-white p-3.5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
              Billing &amp; Plan Actions
            </summary>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-[var(--iseya-gold)]/50 bg-[#FFF8E6] px-3 py-1 text-[var(--iseya-navy)]">
                    Current Plan: {currentPlanLabel}
                  </span>
                  <span className="rounded-full bg-[var(--iseya-navy)] px-3 py-1 text-white">
                    Status: {currentSubscriptionStatusLabel}
                  </span>
                </div>
                {organizationName ? (
                  <p className="mt-3 text-xs font-medium text-slate-600">
                    Access provided through {organizationName}.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/pricing"
                  className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                >
                  View Plans
                </Link>
                <button
                  type="button"
                  disabled
                  className={`${secondaryButtonClass} ${buttonSizeSmClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Manage Billing
                </button>
              </div>
            </div>
          </details>

          <section className="rounded-lg border border-zinc-200 bg-white p-3.5 shadow-sm">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
                {canUseSubscriptionFeature(subscriptionPlan, "savedVersions") ? "" : "🔒 "}
                Version History
              </summary>
              <div className="mt-4 space-y-5">
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--iseya-navy)]">
                        Saved Resume Versions
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Save role-specific drafts, restore older versions, or duplicate a version for a new target.
                      </p>
                    </div>
                    <FeedbackButton
                      onClick={saveCurrentVersion}
                      activeLabel="Saving..."
                      doneLabel="Saved"
                      disabled={!result || !canSaveAnotherVersion}
                      className={`${primaryButtonClass} ${buttonSizeSmClass}`}
                    >
                      {canUseSubscriptionFeature(subscriptionPlan, "savedVersions")
                        ? "Save Version"
                        : "🔒 Save Version"}
                    </FeedbackButton>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <span>{activeSavedVersionsCount} saved</span>
                      <span>
                        {Number.isFinite(savedVersionLimit)
                          ? `${savedVersionLimit} max`
                          : "Unlimited"}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-[var(--iseya-gold)]"
                        style={{ width: `${savedVersionProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                {!canUseSubscriptionFeature(subscriptionPlan, "savedVersions") ? (
                  <div className="rounded-md border border-[var(--iseya-gold)]/30 bg-[#FFF8E6] p-3 text-xs font-medium text-[var(--iseya-navy)]">
                    Saved versions are unlocked with Plus and Pro plans.
                    <Link href="/pricing" className="ml-2 font-bold underline">
                      Upgrade
                    </Link>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <FeedbackButton
                    onClick={() => loadVersion(selectedVersion)}
                    doneLabel="Loaded"
                    disabled={!selectedVersion}
                    className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                  >
                    Load Version
                  </FeedbackButton>
                  <FeedbackButton
                    onClick={() => duplicateVersion(selectedVersion)}
                    doneLabel="Duplicated"
                    disabled={!selectedVersion}
                    className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                  >
                    Duplicate Version
                  </FeedbackButton>
                  <FeedbackButton
                    onClick={() => renameVersion(selectedVersion)}
                    doneLabel="Renamed"
                    disabled={!selectedVersion}
                    className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                  >
                    Rename Version
                  </FeedbackButton>
                  <FeedbackButton
                    onClick={() => deleteVersion(selectedVersion)}
                    doneLabel="Removed"
                    disabled={!selectedVersion}
                    className={`${dangerButtonClass} ${buttonSizeSmClass}`}
                  >
                    Delete Version
                  </FeedbackButton>
                  <FeedbackButton
                    onClick={() =>
                      selectedVersion
                        ? toggleCompareVersion(selectedVersion.id)
                        : setVersionStatus("Select a saved version to compare.")
                    }
                    doneLabel="Updated"
                    disabled={!selectedVersion}
                    className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                  >
                    Compare Versions
                  </FeedbackButton>
                </div>

                {versionStatus ? (
                  <p className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs font-medium text-zinc-700">
                    {versionStatus}
                  </p>
                ) : null}

                {savedVersions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid max-h-96 gap-3 overflow-auto pr-1">
                      {savedVersions.map((version, versionIndex) => (
                        <div
                          key={`${version.id}-${versionIndex}`}
                          className={`block cursor-pointer rounded-xl border p-4 transition ${
                            selectedVersionId === version.id
                              ? "border-[var(--iseya-gold)] bg-[#FFF8E6] shadow-sm"
                              : "border-zinc-200 bg-white hover:border-[var(--iseya-gold)]/60"
                          }`}
                          onClick={() => setSelectedVersionId(version.id)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="saved-version"
                              checked={selectedVersionId === version.id}
                              onChange={() => setSelectedVersionId(version.id)}
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[var(--iseya-navy)]">
                                    {version.name}
                                  </p>
                                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                                    {templates[version.template].label}
                                  </p>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                  {formatVersionDate(version.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-5 text-zinc-600">
                                {version.targetRole} |{" "}
                                {readableIndustryName(version.industryTarget)}
                                {version.companyName
                                  ? ` | ${version.companyName}`
                                  : ""}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Score {Math.round(version.matchScore)}% |{" "}
                                {version.theme
                                  .split("-")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() + word.slice(1),
                                  )
                                  .join(" ")}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Updated {formatVersionDate(version.updatedAt)}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    loadVersion(version);
                                  }}
                                  className={`${primaryButtonClass} ${buttonSizeSmClass}`}
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    renameVersion(version);
                                  }}
                                  className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    duplicateVersion(version);
                                  }}
                                  className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                                >
                                  Duplicate
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteVersion(version);
                                  }}
                                  className={`${dangerButtonClass} ${buttonSizeSmClass}`}
                                >
                                  Delete
                                </button>
                              </div>
                              <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
                                <input
                                  type="checkbox"
                                  checked={compareVersionIds.includes(version.id)}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={() => toggleCompareVersion(version.id)}
                                />
                                Compare Versions
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {comparedVersions.length > 0 ? (
                      <div className="rounded-md border border-zinc-200 bg-white p-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                          Compare Versions
                        </h3>
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          {comparedVersions.map((version, versionIndex) => (
                            <div
                              key={`${version.id}-${versionIndex}`}
                              className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
                            >
                              <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                                {version.name}
                              </p>
                              <dl className="mt-2 space-y-1 text-xs leading-5 text-zinc-600">
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Target role
                                  </dt>
                                  <dd>{version.targetRole}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Industry
                                  </dt>
                                  <dd>{readableIndustryName(version.industryTarget)}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Match score
                                  </dt>
                                  <dd>{Math.round(version.matchScore)}%</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Strongest keywords
                                  </dt>
                                  <dd>
                                    {safeStringArray(
                                      version.result.coach?.topStrengths,
                                      version.result.matchedKeywords,
                                    )
                                      .slice(0, 5)
                                      .join(", ") || "None saved"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Missing keywords
                                  </dt>
                                  <dd>
                                    {safeStringArray(version.result.missingKeywords)
                                      .slice(0, 5)
                                      .join(", ") || "No major gaps saved"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Summary preview
                                  </dt>
                                  <dd>{version.result.summary.slice(0, 180)}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Template and theme
                                  </dt>
                                  <dd>
                                    {templates[version.template].label} |{" "}
                                    {version.theme
                                      .split("-")
                                      .map(
                                        (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1),
                                      )
                                      .join(" ")}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-zinc-800">
                                    Last updated
                                  </dt>
                                  <dd>{new Date(version.updatedAt).toLocaleString()}</dd>
                                </div>
                              </dl>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-zinc-500">
                    No saved versions yet. Tailor a resume, then save it here.
                  </p>
                )}
              </div>
            </details>
          </section>

          <div className="hidden">
            <label
              htmlFor="legacy-job-description"
              className="block text-sm font-semibold text-[var(--iseya-navy)]"
            >
              Job Description
            </label>
            <textarea
              id="legacy-job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="mt-3 min-h-[300px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              placeholder="Paste the job description here..."
            />
          </div>
          <div className="hidden">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
              Optimization Tips
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--iseya-navy)]">
              {[
                "Add a clear professional summary",
                "Include quantifiable achievements",
                "Match keywords from the job description",
                "Keep formatting clean and consistent",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--iseya-gold)]" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => runWithFeedback("tailor", "Optimizing...", "Optimized", tailorResume)}
              disabled={!canTailor || isTailoring}
              className={`${primaryButtonClass} ${buttonSizeMdClass} mt-5 w-full`}
            >
              {isTailoring ? "Optimizing..." : "Optimize Resume"}
            </button>
          </div>
        </div>

      </section>

      {tailorError ? (
        <section className="mx-auto max-w-[96rem] px-5 pb-4 sm:px-8">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {tailorError}
          </div>
        </section>
      ) : null}

      {systemStatus ? (
        <section className="mx-auto max-w-[96rem] px-5 pb-4 sm:px-8">
          <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-700">
            {systemStatus}
          </div>
        </section>
      ) : null}

      {workspaceResult ? (
        <section id="active-document-workspace" className="mx-auto max-w-[112rem] scroll-mt-24 overflow-x-hidden px-4 pb-8 sm:px-8">
          <div className="mb-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--iseya-navy)]">
                  Active document workspace
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {isStarterWorkflowPreview
                    ? "Starter preview. Upgrade to personalize advanced documents, save versions, and unlock optimization."
                    : cloudSaveStatus ||
                      "Autosaved in your workspace. Editing updates the active document immediately."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOutput("preview")}
                  className={`${secondaryButtonClass} ${buttonSizeMdClass}`}
                >
                  Templates
                </button>
                <details className="relative">
                  <summary className={`${primaryButtonClass} ${buttonSizeMdClass} cursor-pointer list-none`}>
                    {actionFeedback.exportMenu ?? "Export"}
                  </summary>
	                  <div className="absolute right-0 z-30 mt-2 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadResumePdf)}
                      className={`${menuItemClass} text-sm`}
                    >
                      {starterResumeExportUsed ? "🔒 Resume PDF" : "Resume PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadResumeDocx)}
                      className={`${menuItemClass} text-sm`}
                    >
                      {starterResumeExportUsed ? "🔒 Resume DOCX" : "Resume DOCX"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadCoverLetterPdf)}
                      disabled={!hasCoverLetterAccess}
                      className={`${menuItemClass} text-sm disabled:cursor-not-allowed disabled:opacity-55`}
                    >
                      {hasCoverLetterAccess ? "Cover Letter PDF" : "🔒 Cover Letter PDF"}
                    </button>
	                    <button
	                      type="button"
	                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadCoverLetterDocx)}
                      disabled={!hasCoverLetterAccess}
                      className={`${menuItemClass} text-sm disabled:cursor-not-allowed disabled:opacity-55`}
                    >
	                      {hasCoverLetterAccess ? "Cover Letter DOCX" : "🔒 Cover Letter DOCX"}
	                    </button>
	                    <button
	                      type="button"
	                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadCoverLetterTxt)}
                        disabled={!hasCoverLetterAccess}
	                      className={`${menuItemClass} text-sm disabled:cursor-not-allowed disabled:opacity-55`}
	                    >
	                      {hasCoverLetterAccess ? "Cover Letter TXT" : "🔒 Cover Letter TXT"}
	                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadLinkedInKitPdf)}
                      disabled={!hasLinkedInAccess}
                      className={`${menuItemClass} text-sm disabled:cursor-not-allowed disabled:opacity-55`}
                    >
                      {hasLinkedInAccess ? "LinkedIn Kit PDF" : "🔒 LinkedIn Kit PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadLinkedInKitDocx)}
                      disabled={!hasLinkedInAccess}
                      className={`${menuItemClass} text-sm disabled:cursor-not-allowed disabled:opacity-55`}
                    >
                      {hasLinkedInAccess ? "LinkedIn Kit DOCX" : "🔒 LinkedIn Kit DOCX"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadApplicationKitPdf)}
                      disabled={!hasApplicationKitAccess}
                      className={`${menuItemClass} text-sm disabled:cursor-not-allowed disabled:opacity-55`}
                    >
                      {hasApplicationKitAccess ? "Application Kit PDF" : "🔒 Application Kit PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadApplicationKitDocx)}
                      disabled={!hasApplicationKitAccess}
                      className={`${menuItemClass} text-sm disabled:cursor-not-allowed disabled:opacity-55`}
                    >
                      {hasApplicationKitAccess ? "Application Kit DOCX" : "🔒 Application Kit DOCX"}
                    </button>
                  </div>
                </details>
                <button
                  type="button"
                  onClick={() => runWithFeedback("saveVersion", "Saving...", "Saved", saveCurrentVersion)}
                  disabled={!canSaveAnotherVersion}
                  className={`${primaryButtonClass} ${buttonSizeMdClass}`}
                >
                  {actionFeedback.saveVersion ??
                    (canUseSubscriptionFeature(subscriptionPlan, "savedVersions")
                      ? "Save Version"
                      : "🔒 Save Version")}
                </button>
	              </div>
            </div>
          </div>

	          <div className="grid gap-3 xl:grid-cols-[352px_minmax(0,1fr)]">
	            <aside className="order-2 xl:order-1">
	              <div className="space-y-2 xl:sticky xl:top-20">
                <WorkspaceNavigation
                  activeOutput={activeOutput}
                  onOpen={openOutputTab}
                  hasCoverLetterAccess={hasCoverLetterAccess}
                  hasLinkedInAccess={hasLinkedInAccess}
                  hasApplicationKitAccess={hasApplicationKitAccess}
                  atsScore={safeMatchBreakdown(workspaceResult.matchBreakdown, safeScore(workspaceResult.score, 0)).atsReadability}
                  roleFit={safeMatchBreakdown(workspaceResult.matchBreakdown, safeScore(workspaceResult.score, 0)).roleFit}
                  onOptimize={() => runWithFeedback("tailor", "Optimizing...", "Optimized", tailorResume)}
                />
                {isStarterWorkflowPreview ? <StarterWorkspacePreviewNotice /> : null}
                <CompactAiSidebar result={workspaceResult} />
                <div id="career-intelligence" className="scroll-mt-24">
                  <AdvancedIntelligencePanel
                    analysis={workspaceResult.advancedAnalysis}
                    onReplaceBullet={
                      isStarterWorkflowPreview
                        ? () => setSystemStatus("Upgrade to unlock advanced bullet rewriting.")
                        : replaceBulletWithVersion
                    }
                  />
                </div>
              </div>
            </aside>

	            <section className="order-1 min-w-0 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] sm:p-3 xl:order-2">
                <nav className="mb-3 flex gap-5 border-b border-slate-200 px-2 text-sm font-semibold text-slate-500" aria-label="Resume workflow">
                  <button
                    type="button"
                    onClick={() => setActiveOutput("resume")}
                    className={`px-2 pb-3 transition ${
                      activeOutput === "resume"
                        ? "border-b-2 border-[var(--iseya-gold)] text-[var(--iseya-gold)]"
                        : "hover:text-[var(--iseya-navy)]"
                    }`}
                  >
                    Tailor
                  </button>
                  <button type="button" onClick={() => runWithFeedback("tailor", "Optimizing...", "Optimized", tailorResume)} className="px-2 pb-3 transition hover:text-[var(--iseya-navy)]">
                    Optimize
                  </button>
                  <a href="#career-intelligence" className="px-2 pb-3 transition hover:text-[var(--iseya-navy)]">
                    Analyze
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveOutput("preview")}
                    className={`px-2 pb-3 transition ${
                      activeOutput === "preview"
                        ? "border-b-2 border-[var(--iseya-gold)] text-[var(--iseya-gold)]"
                        : "hover:text-[var(--iseya-navy)]"
                    }`}
                  >
                    Preview
                  </button>
                </nav>
	              <div className="mx-auto max-w-6xl">
                {activeOutput === "resume" ? (
                  <DocumentFrame title="Let's tailor your resume" subtitle="Resume editor">
                    <div className="mb-4 space-y-2">
                      <details open className="rounded-lg border border-slate-200 bg-slate-50/55 p-3">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--iseya-navy)]">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-xs font-bold text-[var(--iseya-navy)]">1</span>
                          Target Role &amp; Job Description
                        </summary>
                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Target Role / Job Title
                            <input
                              value={targetRole}
                              onChange={(event) => setTargetRole(event.target.value)}
                              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                              placeholder="Example: Product Manager"
                            />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">
                            Target Industry
                            <select
                              value={industryTarget}
                              onChange={(event) => setIndustryTarget(event.target.value as IndustryTarget)}
                              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                            >
                              {industryTargets.map((industry) => (
                                <option key={industry} value={industry}>{industry}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="mt-3 block text-xs font-semibold text-slate-700">
                          Job Description
                          <textarea
                            value={jobDescription}
                            onChange={(event) => setJobDescription(event.target.value)}
                            className="mt-1.5 min-h-40 w-full resize-y rounded-md border border-slate-300 bg-white p-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                            placeholder="Paste the target job description here..."
                          />
                        </label>
                      </details>

                      <details open className="rounded-lg border border-slate-200 bg-slate-50/55 p-3">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--iseya-navy)]">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-xs font-bold text-[var(--iseya-navy)]">2</span>
                          Personal Information
                        </summary>
                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                          <ContactField label="Full Name" value={workspaceBranding.fullName} onChange={(value) => updatePersonalBranding("fullName", value)} />
                          <ContactField label="Professional Title" value={workspaceBranding.professionalTitle} onChange={(value) => updatePersonalBranding("professionalTitle", value)} />
                          <ContactField label="Email" value={workspaceBranding.email} onChange={(value) => updatePersonalBranding("email", value)} />
                          <ContactField label="Phone" value={workspaceBranding.phone} onChange={(value) => updatePersonalBranding("phone", value)} />
                          <ContactField label="Location" value={workspaceBranding.location} onChange={(value) => updatePersonalBranding("location", value)} />
                          <ContactField label="LinkedIn URL" value={workspaceBranding.linkedInUrl} onChange={(value) => updatePersonalBranding("linkedInUrl", value)} />
                          <ContactField label="Portfolio URL" value={workspaceBranding.portfolioUrl} onChange={(value) => updatePersonalBranding("portfolioUrl", value)} />
                          <ContactField label="Website URL" value={workspaceBranding.websiteUrl} onChange={(value) => updatePersonalBranding("websiteUrl", value)} />
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <label className={`${secondaryButtonClass} ${buttonSizeSmClass} cursor-pointer`}>
                            Optional Profile Image
                            <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="sr-only" onChange={(event) => handleProfileImage(event.target.files?.[0])} />
                          </label>
                          {workspaceBranding.profileImageDataUrl ? (
                            <button type="button" onClick={() => updatePersonalBranding("profileImageDataUrl", "")} className={`${secondaryButtonClass} ${buttonSizeSmClass}`}>
                              Remove Image
                            </button>
                          ) : null}
                        </div>
                      </details>

                      <details id="source-materials" className="scroll-mt-24 rounded-lg border border-slate-200 bg-slate-50/55 p-3">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--iseya-navy)]">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-xs font-bold text-[var(--iseya-navy)]">3</span>
                          Source Materials
                        </summary>
                        <p className="mt-2.5 text-xs leading-5 text-slate-500">
                          Paste a resume or upload supporting material for accurate tailoring.
                        </p>
                        <textarea
                          value={masterResume}
                          onChange={(event) => setMasterResume(event.target.value)}
                          className="mt-2.5 min-h-72 w-full resize-y rounded-md border border-slate-300 bg-white p-2.5 text-xs leading-5 text-slate-700 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                          placeholder="Paste your source resume here..."
                        />
                        <label htmlFor="workspace-source-file-upload" className={`${secondaryButtonClass} ${buttonSizeSmClass} mt-2.5 cursor-pointer`}>
                          Upload Files
                        </label>
                        <input
                          ref={uploadInputRef}
                          id="workspace-source-file-upload"
                          type="file"
                          multiple
                          accept={acceptedSourceFileTypes}
                          onChange={(event) => handleSourceFiles(event.target.files)}
                          className="sr-only"
                        />
                        {uploadedFiles.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {uploadedFiles.map((file) => (
                              <div key={file.id} className="rounded-md border border-slate-200 bg-white p-3 text-xs">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-[var(--iseya-navy)]">{file.name}</p>
                                    <p className="mt-1 text-slate-500">
                                      {extractionStatusLabel(file.extractionStatus)} | {(file.extractedText?.length ?? 0).toLocaleString()} chars
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="button" onClick={() => setPreviewSourceFileId((current) => current === file.id ? "" : file.id)} disabled={!file.extractedText} className={`${secondaryButtonClass} ${buttonSizeSmClass}`}>
                                      Preview
                                    </button>
                                    <FeedbackButton onClick={() => removeSourceFile(file.id)} doneLabel="Removed" className={`${dangerButtonClass} ${buttonSizeSmClass}`}>
                                      Remove
                                    </FeedbackButton>
                                  </div>
                                </div>
                                {previewSourceFileId === file.id && file.extractedText ? (
                                  <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600">
                                    {file.extractedText}
                                  </pre>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </details>

                      <details id="optimization-settings" className="scroll-mt-24 rounded-lg border border-slate-200 bg-slate-50/55 p-3">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--iseya-navy)]">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-xs font-bold text-[var(--iseya-navy)]">4</span>
                          Optimization Settings
                        </summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Positioning Mode
                            <select
                              value={aiSettings.positioningMode}
                              onChange={(event) => setAiSettings((current) => ({ ...current, positioningMode: event.target.value as PositioningMode }))}
                              className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-[var(--iseya-gold)]"
                            >
                              {positioningModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-semibold text-slate-700">
                            Tone Style
                            <select
                              value={aiSettings.toneStyle}
                              onChange={(event) => setAiSettings((current) => ({ ...current, toneStyle: event.target.value }))}
                              className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-[var(--iseya-gold)]"
                            >
                              <option value="Executive concise">Executive concise</option>
                              <option value="Technical precise">Technical precise</option>
                              <option value="Consulting polished">Consulting polished</option>
                              <option value="Academic evidence-based">Academic evidence-based</option>
                            </select>
                          </label>
                          <label className="text-xs font-semibold text-slate-700">
                            Creativity: {aiSettings.creativity}
                            <input type="range" min="0" max="100" value={aiSettings.creativity} onChange={(event) => setAiSettings((current) => ({ ...current, creativity: Number(event.target.value) }))} className="mt-3 w-full" />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">
                            ATS Strictness: {aiSettings.atsStrictness}
                            <input type="range" min="0" max="100" value={aiSettings.atsStrictness} onChange={(event) => setAiSettings((current) => ({ ...current, atsStrictness: Number(event.target.value) }))} className="mt-3 w-full" />
                          </label>
                          <label className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={aiSettings.aggressiveOptimization} onChange={(event) => setAiSettings((current) => ({ ...current, aggressiveOptimization: event.target.checked }))} />
                            Aggressive optimization
                          </label>
                        </div>
                      </details>
                    </div>
                    {isStarterWorkflowPreview ? (
                      <div className="space-y-5">
                        <PremiumPreviewBanner />
                        <div className="space-y-5">
                          <div id="resume-editor" className="min-w-0 scroll-mt-28">
                            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                                    Resume tab
                                  </p>
                                  <h3 className="mt-2 text-base font-semibold text-[var(--iseya-navy)]">
                                    Manual editing is available on Starter
                                  </h3>
                                </div>
                                <Link href="/pricing" className={`${secondaryButtonClass} ${buttonSizeSmClass}`}>
                                  Upgrade to unlock optimization
                                </Link>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-600">
                                Edit your resume manually, preview the final document, and use your one included resume export. Premium optimization actions, saved versions, and advanced document exports unlock on Plus or Pro.
                              </p>
                            </div>
                            <WeakBulletEditor
                              bullets={workspaceResult.coach.weakBullets}
                              onApply={() => setSystemStatus("Upgrade to unlock advanced bullet rewriting.")}
                            />
                            <ModularResumeEditor
                              resumeText={workspaceResult.rewrittenResume}
                              resetSourceText={starterPreviewSourceText || masterResume}
                              masterResume={starterPreviewSourceText || masterResume}
                              jobDescription={jobDescription}
                              targetRole={targetRole}
                              industryTarget={industryTarget}
                              uploadedFiles={uploadedFiles}
                              aiSettings={aiSettings}
                              personalBranding={workspaceBranding}
                              onPersonalBrandingChange={updatePersonalBranding}
                              onProfileImage={handleProfileImage}
                              onResumeTextChange={updateWorkspaceResumeOutput}
                              persistedDraft={editableResumeSession}
                              onDraftPersist={persistEditableResumeDraft}
                              canUseAiOptimization={false}
                              onUpgradeRequired={() =>
                                requireOptimizationAccess("section optimization")
                              }
                              onOptimizationUsed={() => undefined}
                            />
                          </div>
                          <div className="hidden">
                            <ResumePreviewControls
                              template={template}
                              theme={theme}
                              onTemplateChange={(nextTemplate) => {
                                if (requireTemplateAccess(nextTemplate)) {
                                  setTemplate(nextTemplate);
                                }
                              }}
                              onThemeChange={setTheme}
                              onPreview={() => setActiveOutput("preview")}
                              onEdit={() => setActiveOutput("resume")}
                            />
                            <ResumePreview
                              resumeText={workspaceResult.rewrittenResume}
                              theme={previewTheme}
                              template={template}
                              branding={workspaceBranding}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
	                    <div>
                      <WeakBulletEditor
                        bullets={workspaceResult.coach.weakBullets}
                        onApply={rewriteSuggestedBullet}
                      />
	                      <div className="mt-5 space-y-5">
	                        <div id="resume-editor" className="min-w-0 scroll-mt-28">
                          <ModularResumeEditor
                            resumeText={workspaceResult.rewrittenResume}
                            resetSourceText={masterResume}
                            masterResume={masterResume}
                            jobDescription={jobDescription}
                            targetRole={targetRole}
                            industryTarget={industryTarget}
                            uploadedFiles={uploadedFiles}
                            aiSettings={aiSettings}
                            personalBranding={workspaceBranding}
                            onPersonalBrandingChange={updatePersonalBranding}
                            onProfileImage={handleProfileImage}
                            onResumeTextChange={updateWorkspaceResumeOutput}
                            persistedDraft={editableResumeSession}
                            onDraftPersist={persistEditableResumeDraft}
                            canUseAiOptimization={
                              canUseSubscriptionFeature(subscriptionPlan, "aiGenerations") &&
                              optimizationCreditsRemaining > 0
                            }
                            onUpgradeRequired={() =>
                              requireOptimizationAccess("section optimization")
                            }
                            onOptimizationUsed={() => trackUsage("optimizationCreditsUsed")}
                          />
                        </div>
	                        <div
	                          id="resume-preview"
	                          className={`hidden ${
                              isPremiumTemplate(template) && isStarterPlan(subscriptionPlan)
                                ? "blur-[1.5px]"
                                : ""
                            }`}
	                          >
                          <ResumePreviewControls
                            template={template}
                            theme={theme}
                            onTemplateChange={(nextTemplate) => {
                              if (requireTemplateAccess(nextTemplate)) {
                                setTemplate(nextTemplate);
                              }
                            }}
                            onThemeChange={setTheme}
                            onPreview={() => setActiveOutput("preview")}
                            onEdit={() => setActiveOutput("resume")}
                          />
                          <ResumePreview
                            resumeText={workspaceResult.rewrittenResume}
                            theme={previewTheme}
                            template={template}
                            branding={workspaceBranding}
                          />
                        </div>
                      </div>
                    </div>
                    )}
                  </DocumentFrame>
	                ) : activeOutput === "cover" ? (
	                  <DocumentFrame title="Cover Letter" subtitle="Editable letter">
                      {!hasCoverLetterAccess ? <PremiumPreviewBanner /> : null}
	                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          runWithFeedback("coverPanelGenerate", "Generating...", "Done", generateCoverLetter)
                        }
                        disabled={!hasCoverLetterAccess}
                        className={`${primaryButtonClass} ${buttonSizeSmClass}`}
                      >
	                        {actionFeedback.coverPanelGenerate ??
                          (hasCoverLetterAccess ? "Generate Cover Letter" : "🔒 Generate Cover Letter")}
	                      </button>
                      {hasCoverLetterAccess ? (
	                      <details className="relative">
	                        <summary className={`${secondaryButtonClass} ${buttonSizeSmClass} cursor-pointer list-none`}>
	                          {actionFeedback.coverExport ?? "Export Cover Letter"}
	                        </summary>
	                        <div className="absolute left-0 z-20 mt-2 w-44 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
	                          <button type="button" onClick={() => runWithFeedback("coverExport", "Exporting...", "Exported", downloadCoverLetterPdf)} className={`${menuItemClass} text-xs`}>
	                            PDF
	                          </button>
	                          <button type="button" onClick={() => runWithFeedback("coverExport", "Exporting...", "Exported", downloadCoverLetterDocx)} className={`${menuItemClass} text-xs`}>
	                            DOCX
	                          </button>
	                          <button type="button" onClick={() => runWithFeedback("coverExport", "Exporting...", "Exported", downloadCoverLetterTxt)} className={`${menuItemClass} text-xs`}>
	                            TXT
	                          </button>
	                        </div>
	                      </details>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                        >
                          🔒 Export Cover Letter
                        </button>
                      )}
                    </div>
                    <textarea
                      value={panelCoverLetter}
                      readOnly={!hasCoverLetterAccess}
                      onChange={(event) => {
                        if (hasCoverLetterAccess) {
                          updateCoverLetter(event.target.value);
                        }
                      }}
                      className={`min-h-[640px] w-full resize-y rounded-xl border border-slate-200 p-5 text-sm leading-7 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6] ${
                        hasCoverLetterAccess
                          ? "bg-white text-slate-800"
                          : "cursor-not-allowed bg-slate-50 text-slate-600"
                      }`}
                    />
                  </DocumentFrame>
                ) : activeOutput === "linkedin" ? (
                  <DocumentFrame title="LinkedIn Optimizer" subtitle="Profile kit">
                    {!hasLinkedInAccess ? <PremiumPreviewBanner /> : null}
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          runWithFeedback("linkedinPanelGenerate", "Generating...", "Done", generateLinkedInProfile)
                        }
                        disabled={!hasLinkedInAccess}
                        className={`${primaryButtonClass} ${buttonSizeSmClass}`}
                      >
                        {actionFeedback.linkedinPanelGenerate ??
                          (hasLinkedInAccess ? "Generate LinkedIn Profile" : "🔒 Generate LinkedIn Profile")}
                      </button>
                      {hasLinkedInAccess ? (
                        <>
                          <CopyTextButton label="Copy Headline" text={panelLinkedIn.headline} />
                          <CopyTextButton label="Copy About" text={panelLinkedIn.about} />
                          <CopyTextButton
                            label="Copy Recruiter Message"
                            text={panelLinkedIn.recruiterOutreachMessage}
                          />
                        </>
                      ) : null}
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <EditableField disabled={!hasLinkedInAccess} label="LinkedIn Headline" value={panelLinkedIn.headline} onChange={(value) => updateLinkedIn("headline", value)} />
                      <EditableField disabled={!hasLinkedInAccess} label="Open-To-Work Positioning" value={panelLinkedIn.openToWorkPositioning} onChange={(value) => updateLinkedIn("openToWorkPositioning", value)} />
                      <EditableField disabled={!hasLinkedInAccess} label="LinkedIn About Section" value={panelLinkedIn.about} onChange={(value) => updateLinkedIn("about", value)} tall />
                      <EditableField disabled={!hasLinkedInAccess} label="Featured Projects Summary" value={panelLinkedIn.featuredProjects} onChange={(value) => updateLinkedIn("featuredProjects", value)} tall />
                      <EditableField disabled={!hasLinkedInAccess} label="Top Skills List" value={panelLinkedIn.topSkills.join(", ")} onChange={(value) => updateLinkedIn("topSkills", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                      <EditableField disabled={!hasLinkedInAccess} label="Recruiter Keyword List" value={panelLinkedIn.recruiterKeywords.join(", ")} onChange={(value) => updateLinkedIn("recruiterKeywords", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                      <EditableField disabled={!hasLinkedInAccess} label="Short Networking Message" value={panelLinkedIn.networkingMessage} onChange={(value) => updateLinkedIn("networkingMessage", value)} />
                      <EditableField disabled={!hasLinkedInAccess} label="Recruiter Outreach Message" value={panelLinkedIn.recruiterOutreachMessage} onChange={(value) => updateLinkedIn("recruiterOutreachMessage", value)} />
                    </div>
                  </DocumentFrame>
                ) : activeOutput === "preview" ? (
                      <DocumentFrame title="Resume Preview" subtitle="Template & theme">
                    <div className="mb-4 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveOutput("preview")}
                        className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
                      >
                        Templates
                      </button>
                      <details className="relative">
                        <summary className={`${secondaryButtonClass} ${buttonSizeSmClass} cursor-pointer list-none`}>
                          Export
                        </summary>
                        <div className="absolute right-0 z-30 mt-2 w-44 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                          <button type="button" onClick={() => runWithFeedback("previewExport", "Exporting...", "Exported", downloadResumePdf)} className={`${menuItemClass} text-xs`}>
                            Resume PDF
                          </button>
                          <button type="button" onClick={() => runWithFeedback("previewExport", "Exporting...", "Exported", downloadResumeDocx)} className={`${menuItemClass} text-xs`}>
                            Resume DOCX
                          </button>
                        </div>
                      </details>
                      <button
                        type="button"
                        onClick={() => runWithFeedback("saveVersion", "Saving...", "Saved", saveCurrentVersion)}
                        disabled={!canSaveAnotherVersion}
                        className={`${primaryButtonClass} ${buttonSizeSmClass}`}
                      >
                        {actionFeedback.saveVersion ?? "Save Version"}
                      </button>
                    </div>
                    <ResumePreviewControls
                      template={template}
                      theme={theme}
                      onTemplateChange={(nextTemplate) => {
                        if (requireTemplateAccess(nextTemplate)) {
                          setTemplate(nextTemplate);
                        }
                      }}
                      onThemeChange={setTheme}
                      onPreview={() => setActiveOutput("preview")}
                      onEdit={() => setActiveOutput("resume")}
                    />
                    <div className="rounded-2xl bg-slate-200/70 px-3 py-6 sm:px-6 lg:px-10">
                      <ResumePreview
                        resumeText={workspaceResult.rewrittenResume}
                        theme={previewTheme}
                        template={template}
                        branding={workspaceBranding}
                        fullPage
                      />
                    </div>
                  </DocumentFrame>
                ) : (
                  <DocumentFrame title="Application Kit" subtitle="Outreach package">
                    {!hasApplicationKitAccess ? <PremiumPreviewBanner /> : null}
                    <div className="grid gap-4 lg:grid-cols-2">
                      <EditableField disabled={!hasApplicationKitAccess} label="Short Recruiter Email" value={panelApplicationKit.recruiterEmail} onChange={(value) => updateApplicationKit("recruiterEmail", value)} copy />
                      <EditableField disabled={!hasApplicationKitAccess} label="Follow-Up Email" value={panelApplicationKit.followUpEmail} onChange={(value) => updateApplicationKit("followUpEmail", value)} copy />
                      <EditableField disabled={!hasApplicationKitAccess} label="Referral Request Message" value={panelApplicationKit.referralRequest} onChange={(value) => updateApplicationKit("referralRequest", value)} copy />
                      <EditableField disabled={!hasApplicationKitAccess} label="LinkedIn Connection Request" value={panelApplicationKit.connectionRequest} onChange={(value) => updateApplicationKit("connectionRequest", value)} copy />
                      <EditableField disabled={!hasApplicationKitAccess} label="Interview Introduction Pitch" value={panelApplicationKit.interviewIntroPitch} onChange={(value) => updateApplicationKit("interviewIntroPitch", value)} copy />
                      <EditableField disabled={!hasApplicationKitAccess} label="30-Second Tell Me About Yourself" value={panelApplicationKit.tellMeAboutYourself} onChange={(value) => updateApplicationKit("tellMeAboutYourself", value)} copy />
                    </div>
                  </DocumentFrame>
                )}
              </div>
            </section>

          </div>
        </section>
      ) : null}
        </>
      ) : null}
      <IseyaFooter />
    </main>
  );
}

function IseyaFooter() {
  const footerColumns = [
    {
      title: "Platform",
      links: [
        ["Career Workspace", "/workspace"],
        ["Jobs", "/jobs"],
        ["Career Co-pilots", "/workspace"],
      ],
    },
    {
      title: "For You",
      links: [
        ["Build Resume", "/workspace"],
        ["Browse Jobs", "/jobs"],
        ["Career Assets", "/workspace"],
        ["Dashboard", "/workspace"],
      ],
    },
    {
      title: "Resources",
      links: [
        ["Insights", "/insights"],
        ["Career Guides", "/guides"],
        ["Contact", "/contact"],
      ],
    },
    {
      title: "Legal",
      links: [
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
      ],
    },
  ];

  return (
    <footer className="border-t border-white/10 bg-[var(--iseya-navy)] text-white">
      <div className="mx-auto max-w-[92rem] px-5 py-7 sm:px-8 sm:py-9">
        <div className="grid gap-7 lg:grid-cols-[1.05fr_2fr] lg:gap-14">
          <div>
            <Image
              src="/brand/iseya-logo.png"
              alt="ISEYA"
              width={180}
              height={90}
              className="h-auto w-[122px] object-contain"
            />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Beyond Resume. Positioning.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/90">{column.title}</p>
                <div className="mt-3 grid gap-2.5">
                  {column.links.map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      className="rounded-sm text-sm text-white/72 transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-white/65">
          <p>© 2026 ISEYA. All rights reserved.</p>
          <div className="shrink-0 rounded-md border border-[var(--iseya-gold)]/70 px-3 py-1.5 font-semibold text-[var(--iseya-gold)]">
            English
          </div>
        </div>
      </div>
    </footer>
  );
}

function CopyTextButton({ label, text }: { label: string; text: string }) {
  const [status, setStatus] = useState(label);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
      window.setTimeout(() => setStatus(label), 1500);
    } catch {
      setStatus("Copy failed");
      window.setTimeout(() => setStatus(label), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={copyText}
      className={`${secondaryButtonClass} ${buttonSizeMdClass}`}
    >
      {status}
    </button>
  );
}

function PremiumPreviewBanner() {
  return (
    <div className="mb-5 rounded-xl border border-[var(--iseya-gold)]/45 bg-[#FFF8E6] p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--iseya-navy)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
          Premium Preview
        </span>
        <p className="text-sm font-semibold text-[var(--iseya-navy)]">
          Preview only. Upgrade to Plus or Pro to personalize, copy, and export this material.
        </p>
      </div>
      <Link
        href="/pricing"
        className={`${primaryButtonClass} ${buttonSizeSmClass} mt-3`}
      >
        Upgrade to personalize and export
      </Link>
    </div>
  );
}

function StarterWorkspacePreviewNotice() {
  return (
    <div className="rounded-xl border border-[var(--iseya-gold)]/45 bg-[#FFF8E6] p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[var(--iseya-navy)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
          Starter Preview
        </span>
        <span className="text-sm" aria-hidden="true">
          🔒
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[var(--iseya-navy)]">
        Full workflow visibility
      </h3>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        You can preview the Career Workspace, diagnostics, career intelligence, cover letter, LinkedIn, and application kit experience. Upgrade to unlock personalization, generation, exports, and saved versions.
      </p>
      <Link href="/pricing" className={`${primaryButtonClass} ${buttonSizeSmClass} mt-3`}>
        Upgrade to unlock
      </Link>
    </div>
  );
}

function FeedbackButton({
  children,
  doneLabel = "Done",
  activeLabel,
  className,
  onClick,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode;
  doneLabel?: string;
  activeLabel?: string;
  onClick?: () => void | Promise<void>;
}) {
  const [status, setStatus] = useState<ReactNode>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  function flash(label: ReactNode, duration = 1600) {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    setStatus(label);
    timerRef.current = window.setTimeout(() => setStatus(null), duration);
  }

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!onClick || props.disabled) {
          return;
        }

        if (activeLabel) {
          flash(activeLabel, 30000);
        }

        try {
          await onClick();
          flash(doneLabel);
        } catch {
          flash("Try again");
        }
      }}
      className={className}
    >
      {status ?? children}
    </button>
  );
}

function MiniAnalyticsCard({
  label,
  value,
  detail,
  progress,
  tone = "gold",
}: {
  label: string;
  value: string;
  detail: string;
  progress?: number;
  tone?: "gold" | "green" | "blue";
}) {
  const progressClass =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "blue"
        ? "bg-blue-500"
        : "bg-[var(--iseya-gold)]";

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-[0_5px_18px_rgb(15_23_42_/_0.035)] transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 truncate text-2xl font-semibold text-[var(--iseya-navy)]">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
      {typeof progress === "number" ? (
        <div className="mt-2.5 h-1.5 rounded-full bg-slate-200">
          <div
            className={`h-1.5 rounded-full transition-all ${progressClass}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function WorkspaceNavigation({
  activeOutput,
  onOpen,
  hasCoverLetterAccess,
  hasLinkedInAccess,
  hasApplicationKitAccess,
  atsScore,
  roleFit,
  onOptimize,
}: {
  activeOutput: OutputTab;
  onOpen: (tab: OutputTab) => void;
  hasCoverLetterAccess: boolean;
  hasLinkedInAccess: boolean;
  hasApplicationKitAccess: boolean;
  atsScore: number;
  roleFit: number;
  onOptimize: () => void;
}) {
  const tabs: Array<{ id: OutputTab; label: string; icon: typeof FileText; locked?: boolean }> = [
    { id: "resume", label: "Resume", icon: FileText },
    { id: "cover", label: "Cover Letter", icon: ClipboardList, locked: !hasCoverLetterAccess },
    { id: "linkedin", label: "LinkedIn Profile", icon: UsersRound, locked: !hasLinkedInAccess },
    { id: "application", label: "Application Kit", icon: BriefcaseBusiness, locked: !hasApplicationKitAccess },
  ];

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
      <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Workspace
      </p>
      <nav className="mt-1 grid grid-cols-2 gap-1" aria-label="Career workspace">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onOpen(tab.id)}
            className={`flex min-h-9 items-center justify-between rounded-md px-2.5 text-left text-xs font-semibold transition ${
              activeOutput === tab.id
                ? "border-l-2 border-[var(--iseya-gold)] bg-[var(--iseya-navy)] text-[var(--iseya-gold)]"
                : "text-slate-700 hover:bg-[#FFF8E6] hover:text-[var(--iseya-navy)]"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <tab.icon className="h-4 w-4" strokeWidth={1.8} />
              {tab.label}
            </span>
            {tab.locked ? <span className="text-xs" aria-label="Premium preview">🔒</span> : null}
          </button>
        ))}
        <a href="#career-intelligence" className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-[#FFF8E6] hover:text-[var(--iseya-navy)]">
          <ClipboardList className="h-4 w-4" strokeWidth={1.8} /> Interview Prep
        </a>
        <Link href="/applications" className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-[#FFF8E6] hover:text-[var(--iseya-navy)]">
          <BriefcaseBusiness className="h-4 w-4" strokeWidth={1.8} /> Job Tracker
        </Link>
        <a href="#source-materials" className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-[#FFF8E6] hover:text-[var(--iseya-navy)]">
          <FileText className="h-4 w-4" strokeWidth={1.8} /> Documents
        </a>
        <a href="#optimization-settings" className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-[#FFF8E6] hover:text-[var(--iseya-navy)]">
          <Settings className="h-4 w-4" strokeWidth={1.8} /> Settings
        </a>
      </nav>
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Readiness Snapshot
        </p>
        <div className="mt-2 space-y-1.5">
          <ScoreBar label="ATS Readiness" score={atsScore} tone="green" />
          <ScoreBar label="Role Fit" score={roleFit} tone="blue" />
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Quick Actions
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs font-semibold">
          <a href="#career-intelligence" className="rounded-md border border-slate-200 px-3 py-2 text-slate-700 transition hover:border-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]">
            Run ATS Check
          </a>
          <a href="#career-intelligence" className="rounded-md border border-slate-200 px-3 py-2 text-slate-700 transition hover:border-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]">
            Keyword Match
          </a>
          <button type="button" onClick={onOptimize} className="col-span-2 rounded-md border border-slate-200 px-3 py-2 text-left text-slate-700 transition hover:border-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]">
            Optimize Full Resume
          </button>
        </div>
      </div>
    </section>
  );
}

function ContactField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
      />
    </label>
  );
}

function EditableField({
  label,
  value,
  onChange,
  tall = false,
  copy = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tall?: boolean;
  copy?: boolean;
  disabled?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-[var(--iseya-navy)]">{label}</h4>
        {copy && !disabled ? <CopyTextButton label="Copy" text={value} /> : null}
      </div>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => {
          if (!disabled) {
            onChange(event.target.value);
          }
        }}
        className={`mt-3 w-full resize-y rounded-md border border-zinc-300 p-4 text-sm leading-6 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6] ${
          tall ? "min-h-56" : "min-h-32"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-600"
            : "bg-white text-zinc-800"
        }`}
      />
    </section>
  );
}

function DocumentFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--iseya-navy)]">
            {title}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </article>
  );
}

function ResumePreviewControls({
  template,
  theme,
  onTemplateChange,
  onThemeChange,
  onPreview,
  onEdit,
}: {
  template: TemplateId;
  theme: ThemeId;
  onTemplateChange: (template: TemplateId) => void;
  onThemeChange: (theme: ThemeId) => void;
  onPreview: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-navy)]">
        Template &amp; Theme
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex rounded-md bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button type="button" onClick={onPreview} className="rounded-sm bg-white px-3 py-2 text-[var(--iseya-navy)] shadow-sm">
            Preview
          </button>
          <a href="#career-intelligence" className="rounded-sm px-3 py-2 transition hover:text-[var(--iseya-navy)]">
            ATS Report
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a href="#resume-editor" className={`${secondaryButtonClass} ${buttonSizeSmClass}`}>
            Sections
          </a>
          <button type="button" onClick={onEdit} className={`${secondaryButtonClass} ${buttonSizeSmClass}`}>
            Edit Sections
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Template
          <select
            value={template}
            onChange={(event) => onTemplateChange(event.target.value as TemplateId)}
            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-[var(--iseya-navy)] outline-none focus:border-[var(--iseya-gold)]"
          >
            {Object.entries(templates).map(([id, profile]) => (
              <option key={id} value={id}>{profile.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Theme
          <select
            value={theme}
            onChange={(event) => onThemeChange(event.target.value as ThemeId)}
            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-[var(--iseya-navy)] outline-none focus:border-[var(--iseya-gold)]"
          >
            <option value="deep-navy">Deep Navy</option>
            <option value="modern-teal">Modern Teal</option>
            <option value="royal-blue">Royal Blue</option>
            <option value="emerald">Emerald</option>
            <option value="slate-gray">Slate Gray</option>
            <option value="minimal-black">Minimal Black</option>
            <option value="purple-executive">Purple Executive</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function editorEntryId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pipeSeparatedParts(value: string) {
  return value
    .split(/\s+\|\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function editableProjectEntries(items: string[]): EditableProjectEntry[] {
  return items.map((item, index) => {
    const [name = "", ...details] = pipeSeparatedParts(item);

    return {
      id: `project-${index}`,
      name,
      context: "",
      tools: "",
      details: details.join(" | "),
    };
  });
}

function editableEducationEntries(items: string[]): EditableEducationEntry[] {
  return items.map((item, index) => {
    const [school = "", degree = "", ...metadata] = pipeSeparatedParts(item);
    const dateIndex = metadata.findIndex((value) =>
      /\b(?:19|20)\d{2}\b|\b(?:present|current)\b/i.test(value),
    );
    const dates = dateIndex >= 0 ? metadata[dateIndex] : "";
    const location = dateIndex > 0 ? metadata.slice(0, dateIndex).join(" | ") : "";
    const details = dateIndex >= 0 ? metadata.slice(dateIndex + 1) : metadata;

    return {
      id: `education-${index}`,
      school,
      degree,
      location,
      dates,
      details: details.join(" | "),
    };
  });
}

function editableCertificationEntries(items: string[]): EditableCertificationEntry[] {
  return items.map((item, index) => {
    const segments = item.split(",").map((part) => part.trim()).filter(Boolean);
    const possibleYear = segments.at(-1) ?? "";
    const year = /\b(?:19|20)\d{2}\b/.test(possibleYear) ? segments.pop() ?? "" : "";

    return {
      id: `certification-${index}`,
      name: segments.shift() ?? "",
      issuer: segments.join(", "),
      year,
    };
  });
}

function editableResumeDraftFromText(resumeText: string): EditableResumeDraft {
  const structured = structuredResumeFromText(resumeText);

  return {
    header: structured.header,
    summaryText: structured.summary,
    skillsText: structured.skills.join(" | "),
    experience: structured.experience.map((entry) => ({
      ...entry,
      bulletsText: entry.bullets.join("\n"),
    })),
    projects: editableProjectEntries(structured.projects),
    education: editableEducationEntries(structured.education),
    certifications: editableCertificationEntries(structured.certifications),
    publicationsText: structured.publications.join("\n"),
    leadership: structured.leadership,
    awards: structured.awards,
    volunteerExperience: structured.volunteerExperience,
    toolsText: structured.tools.join(" | "),
    additionalSections: structured.additionalSections,
    unmatchedSections: structured.unmatchedSections,
  };
}

function structuredResumeFromEditableDraft(draft: EditableResumeDraft): StructuredResume {
  return {
    header: draft.header,
    summary: draft.summaryText,
    skills: splitResumeList(draft.skillsText),
    experience: draft.experience.map((entry) => ({
      id: entry.id,
      title: entry.title,
      company: entry.company,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      isCurrent: entry.isCurrent,
      bullets: entry.bulletsText.split(/\r?\n/).filter((bullet) => bullet.trim().length > 0),
    })),
    projects: draft.projects
      .map((project) =>
        [project.name, project.context, project.tools, project.details.replace(/\r?\n/g, " / ")]
          .filter((value) => value.trim().length > 0)
          .join(" | "),
      )
      .filter(Boolean),
    education: draft.education
      .map((education) =>
        [
          education.school,
          education.degree,
          education.location,
          education.dates,
          education.details.replace(/\r?\n/g, " / "),
        ]
          .filter((value) => value.trim().length > 0)
          .join(" | "),
      )
      .filter(Boolean),
    certifications: draft.certifications
      .map((certification) =>
        [certification.name, certification.issuer, certification.year]
          .filter((value) => value.trim().length > 0)
          .join(", "),
      )
      .filter(Boolean),
    publications: draft.publicationsText.split(/\r?\n/).filter((item) => item.trim().length > 0),
    leadership: draft.leadership,
    awards: draft.awards,
    volunteerExperience: draft.volunteerExperience,
    tools: splitResumeList(draft.toolsText),
    additionalSections: draft.additionalSections,
    unmatchedSections: draft.unmatchedSections,
  };
}

function createEditableExperience(): EditableExperienceEntry {
  return {
    ...createEmptyExperience(),
    bulletsText: "",
  };
}

function ModularResumeEditor({
  resumeText,
  resetSourceText,
  masterResume,
  jobDescription,
  targetRole,
  industryTarget,
  uploadedFiles,
  aiSettings,
  personalBranding,
  onPersonalBrandingChange,
  onProfileImage,
  onResumeTextChange,
  persistedDraft,
  onDraftPersist,
  canUseAiOptimization,
  onUpgradeRequired,
  onOptimizationUsed,
}: {
  resumeText: string;
  resetSourceText: string;
  masterResume: string;
  jobDescription: string;
  targetRole: string;
  industryTarget: IndustryTarget;
  uploadedFiles: UploadedSourceFile[];
  aiSettings: AiSettings;
  personalBranding: PersonalBranding;
  onPersonalBrandingChange: (field: keyof PersonalBranding, value: string) => void;
  onProfileImage: (file: File | undefined) => void;
  onResumeTextChange: (value: string) => void;
  persistedDraft: EditableResumeSession | null;
  onDraftPersist: (draft: EditableResumeDraft, resumeText: string) => void;
  canUseAiOptimization: boolean;
  onUpgradeRequired: () => boolean;
  onOptimizationUsed: () => void;
}) {
  const [optimizingKey, setOptimizingKey] = useState("");
  const [optimizationStatus, setOptimizationStatus] = useState("");
  const [editableResume, setEditableResume] = useState<EditableResumeDraft>(() =>
    persistedDraft?.resumeText === resumeText
      ? persistedDraft.draft
      : editableResumeDraftFromText(resumeText),
  );
  const editableResumeRef = useRef(editableResume);
  const lastEmittedResumeTextRef = useRef(resumeText);
  const lastLoadedResumeTextRef = useRef(resumeText);
  const resetEditableResume = useMemo(
    () => editableResumeDraftFromText(resetSourceText),
    [resetSourceText],
  );
  const unmatchedReviewSections = resetEditableResume.additionalSections.filter(
    (section) =>
      !isSourceArtifactHeading(section.heading) &&
      [...section.body, ...section.bullets].some((item) => cleanEditorText(item)),
  );

  useEffect(() => {
    if (
      resumeText === lastEmittedResumeTextRef.current ||
      resumeText === lastLoadedResumeTextRef.current
    ) {
      return;
    }

    lastLoadedResumeTextRef.current = resumeText;
    const nextDraft = editableResumeDraftFromText(resumeText);
    const timer = window.setTimeout(() => {
      editableResumeRef.current = nextDraft;
      setEditableResume(nextDraft);
      onDraftPersist(nextDraft, resumeText);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [onDraftPersist, resumeText]);

  function commitDraft(next: EditableResumeDraft) {
    editableResumeRef.current = next;
    setEditableResume(next);
    const output = serializeStructuredResume(
      structuredResumeFromEditableDraft(next),
      personalBranding,
      { preserveEmptySections: true },
    );
    lastEmittedResumeTextRef.current = output;
    lastLoadedResumeTextRef.current = output;
    onDraftPersist(next, output);
    onResumeTextChange(output);
  }

  function commitStructured(next: StructuredResume) {
    const output = serializeStructuredResume(next, personalBranding, {
      preserveEmptySections: true,
    });
    const nextDraft = editableResumeDraftFromText(output);
    lastEmittedResumeTextRef.current = output;
    lastLoadedResumeTextRef.current = output;
    editableResumeRef.current = nextDraft;
    setEditableResume(nextDraft);
    onDraftPersist(nextDraft, output);
    onResumeTextChange(output);
  }

  function patchDraft(patch: Partial<EditableResumeDraft>) {
    commitDraft({ ...editableResumeRef.current, ...patch });
  }

  async function optimizeWithBackend({
    key,
    action,
    sectionName,
    sectionText,
  }: {
    key: string;
    action: AiOptimizationAction;
    sectionName: string;
    sectionText: string;
  }) {
    const cleaned = sectionText.trim();

    if (!cleaned) {
      setOptimizationStatus("Add content before optimizing this section.");
      return "";
    }

    if (!canUseAiOptimization) {
      onUpgradeRequired();
      setOptimizationStatus("Section optimization is prepared for ISEYA Pro.");
      return "";
    }

    setOptimizingKey(key);
    setOptimizationStatus(`Optimizing ${sectionName.toLowerCase()}...`);

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterResume,
          jobDescription,
          targetRole,
          industryTarget,
          uploadedSourceMaterials: uploadedFiles.map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            extractionStatus: file.extractionStatus,
            warnings: file.warnings,
            extractedText: file.extractedText,
          })),
          currentEditedResume: resumeText,
          aiSettings,
          optimizationRequest: {
            action,
            sectionName,
            sectionText: cleaned,
            fullResumeText: resumeText,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Section optimization failed.");
      }

      const data = (await response.json()) as {
        optimizedText?: string;
        warnings?: string[];
      };
      const optimizedText =
        data.optimizedText?.trim() || optimizationFallbackText(cleaned, action);
      const warning = safeStringArray(data.warnings)[0];

      setOptimizationStatus(
        warning
          ? `${sectionName} updated. ${warning}`
          : `${sectionName} updated. Verify before use if new scope or metrics were inferred.`,
      );
      onOptimizationUsed();
      return optimizedText;
    } catch {
      const fallback = optimizationFallbackText(cleaned, action);
      setOptimizationStatus(
        `${sectionName} updated with local fallback. Verify before use.`,
      );
      onOptimizationUsed();
      return fallback;
    } finally {
      setOptimizingKey("");
    }
  }

  function resetSection(
    field:
      | "summary"
      | "skills"
      | "experience"
      | "projects"
      | "education"
      | "certifications"
      | "publications"
      | "tools",
  ) {
    const next = { ...editableResumeRef.current };

    if (field === "summary") next.summaryText = resetEditableResume.summaryText;
    if (field === "skills") next.skillsText = resetEditableResume.skillsText;
    if (field === "experience") next.experience = resetEditableResume.experience;
    if (field === "projects") next.projects = resetEditableResume.projects;
    if (field === "education") next.education = resetEditableResume.education;
    if (field === "certifications") next.certifications = resetEditableResume.certifications;
    if (field === "publications") next.publicationsText = resetEditableResume.publicationsText;
    if (field === "tools") next.toolsText = resetEditableResume.toolsText;

    commitDraft(next);
  }

  async function applySummaryAiAction(action: AiOptimizationAction) {
    const optimized = await optimizeWithBackend({
      key: `summary-${action}`,
      action,
      sectionName: "Professional Summary",
      sectionText: editableResume.summaryText,
    });

    if (optimized) {
      patchDraft({ summaryText: optimized.replace(/\n+/g, " ") });
    }
  }

  async function applySkillsAiAction(action: AiOptimizationAction) {
    const optimized = await optimizeWithBackend({
      key: `skills-${action}`,
      action,
      sectionName: "Core Skills",
      sectionText: editableResume.skillsText,
    });

    if (optimized) {
      patchDraft({ skillsText: optimized });
    }
  }

  async function applyListAiAction(
    field: "publications" | "tools",
    title: string,
    action: AiOptimizationAction,
  ) {
    const sourceText =
      field === "publications" ? editableResume.publicationsText : editableResume.toolsText;
    const optimized = await optimizeWithBackend({
      key: `${field}-${action}`,
      action,
      sectionName: title,
      sectionText: sourceText,
    });

    if (optimized) {
      commitDraft(
        field === "publications"
          ? { ...editableResumeRef.current, publicationsText: optimized }
          : { ...editableResumeRef.current, toolsText: optimized },
      );
    }
  }

  async function applyEntryListAiAction(
    field: "projects" | "education" | "certifications",
    title: string,
    action: AiOptimizationAction,
  ) {
    const source = structuredResumeFromEditableDraft(editableResume)[field];
    const optimized = await optimizeWithBackend({
      key: `${field}-${action}`,
      action,
      sectionName: title,
      sectionText: source.join("\n"),
    });

    if (!optimized) {
      return;
    }

    const items = optimized
      .split(/\r?\n/)
      .map((item) => item.replace(/^[-*]\s+/, "").trim())
      .filter(Boolean);

    if (field === "projects") {
      patchDraft({ projects: editableProjectEntries(items) });
    } else if (field === "education") {
      patchDraft({ education: editableEducationEntries(items) });
    } else {
      patchDraft({ certifications: editableCertificationEntries(items) });
    }
  }

  async function applyExperienceAiAction(action: AiOptimizationAction) {
    const optimized = await optimizeWithBackend({
      key: `experience-${action}`,
      action,
      sectionName: "Professional Experience",
      sectionText: editableResume.experience
        .flatMap((entry) => [
          [entry.title, entry.company].filter(Boolean).join(" - "),
          [
            entry.location,
            [entry.startDate, entry.isCurrent ? "Present" : entry.endDate]
              .filter(Boolean)
              .join(" - "),
          ]
            .filter(Boolean)
            .join(" | "),
          entry.bulletsText,
        ])
        .filter(Boolean)
        .join("\n"),
    });

    if (optimized) {
      const optimizedExperience = structuredResumeFromText(
        `PROFESSIONAL EXPERIENCE\n${optimized}`,
      ).experience;

      if (optimizedExperience.length > 0) {
        patchDraft({
          experience: optimizedExperience.map((entry) => ({
            ...entry,
            bulletsText: entry.bullets.join("\n"),
          })),
        });
      }
    }
  }

  async function applySingleExperienceAiAction(
    entryIndex: number,
    action: AiOptimizationAction,
  ) {
    const entry = editableResume.experience[entryIndex];

    if (!entry) {
      return;
    }

    const optimized = await optimizeWithBackend({
      key: `experience-${entryIndex}-${action}`,
      action,
      sectionName: entry.title || entry.company || "Experience",
      sectionText: [
        [entry.title, entry.company].filter(Boolean).join(" - "),
        [entry.location, [entry.startDate, entry.isCurrent ? "Present" : entry.endDate].filter(Boolean).join(" - ")]
          .filter(Boolean)
          .join(" | "),
        entry.bulletsText,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (optimized) {
      const currentIndex = editableResumeRef.current.experience.findIndex(
        (currentEntry) => currentEntry.id === entry.id,
      );

      if (currentIndex >= 0) {
        updateExperience(currentIndex, { bulletsText: optimized });
      }
    }
  }

  async function applyAdditionalSectionAiAction(
    sectionIndex: number,
    action: AiOptimizationAction,
  ) {
    const section = editableResume.additionalSections[sectionIndex];

    if (!section) {
      return;
    }

    const optimized = await optimizeWithBackend({
      key: `additional-${sectionIndex}-${action}`,
      action,
      sectionName: section.heading || "Additional Section",
      sectionText: [...section.body, ...section.bullets].join("\n"),
    });

    if (optimized) {
      updateAdditionalSection(sectionIndex, {
        body: optimized.split(/\r?\n/).map(cleanEditorText).filter(Boolean),
        bullets: [],
      });
    }
  }

  function updateExperience(index: number, patch: Partial<EditableExperienceEntry>) {
    const current = editableResumeRef.current;
    commitDraft({
      ...current,
      experience: current.experience.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    });
  }

  function removeExperience(index: number) {
    const current = editableResumeRef.current;
    commitDraft({
      ...current,
      experience: current.experience.filter((_, entryIndex) => entryIndex !== index),
    });
  }

  function updateAdditionalSection(
    sectionIndex: number,
    patch: Partial<ResumeSection>,
  ) {
    const current = editableResumeRef.current;
    commitDraft({
      ...current,
      additionalSections: current.additionalSections.map((section, index) =>
        index === sectionIndex ? { ...section, ...patch } : section,
      ),
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--iseya-gold)]/25 bg-[#FFF8E6]/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-[var(--iseya-navy)]">
              Continuous Optimization
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Improve one section or achievement at a time. Inferred suggestions should be verified before use.
            </p>
          </div>
          <EditorActionButton
            onClick={async () => {
              const optimized = await optimizeWithBackend({
                key: "full-resume-Optimize this section",
                action: "Optimize this section",
                sectionName: "Full Resume",
                sectionText: resumeText,
              });

              if (optimized) {
                commitStructured(structuredResumeFromText(optimized));
              }
            }}
          >
            Optimize Full Resume
          </EditorActionButton>
        </div>
        {optimizationStatus ? (
          <p className="mt-3 rounded-md border border-[var(--iseya-gold)]/25 bg-white px-3 py-2 text-xs font-medium text-slate-700">
            {optimizationStatus}
          </p>
        ) : null}
      </section>

      <div className="hidden">
      <ModularSection title="Personal Branding & Contact">
        <div className="grid gap-3 md:grid-cols-2">
          <ContactField label="Full Name" value={personalBranding.fullName} onChange={(value) => onPersonalBrandingChange("fullName", value)} />
          <ContactField label="Professional Title" value={personalBranding.professionalTitle} onChange={(value) => onPersonalBrandingChange("professionalTitle", value)} />
          <ContactField label="Email" value={personalBranding.email} onChange={(value) => onPersonalBrandingChange("email", value)} />
          <ContactField label="Phone" value={personalBranding.phone} onChange={(value) => onPersonalBrandingChange("phone", value)} />
          <ContactField label="Location" value={personalBranding.location} onChange={(value) => onPersonalBrandingChange("location", value)} />
          <ContactField label="LinkedIn URL" value={personalBranding.linkedInUrl} onChange={(value) => onPersonalBrandingChange("linkedInUrl", value)} />
          <ContactField label="Portfolio URL" value={personalBranding.portfolioUrl} onChange={(value) => onPersonalBrandingChange("portfolioUrl", value)} />
          <ContactField label="Website URL" value={personalBranding.websiteUrl} onChange={(value) => onPersonalBrandingChange("websiteUrl", value)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className={`${secondaryButtonClass} ${buttonSizeSmClass} cursor-pointer`}>
            Optional Profile Image
            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              className="sr-only"
              onChange={(event) => onProfileImage(event.target.files?.[0])}
            />
          </label>
          {personalBranding.profileImageDataUrl ? (
            <button
              type="button"
              onClick={() => onPersonalBrandingChange("profileImageDataUrl", "")}
              className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
            >
              Remove Image
            </button>
          ) : null}
        </div>
      </ModularSection>
      </div>

      <ModularSection
        title="Professional Summary"
        onOptimize={() => applySummaryAiAction("Optimize Summary")}
        onReset={() => resetSection("summary")}
        onAiAction={applySummaryAiAction}
        isOptimizing={optimizingKey.startsWith("summary-")}
      >
        <textarea
          value={editableResume.summaryText}
          onChange={(event) =>
            patchDraft({ summaryText: event.target.value })
          }
          className="min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
        />
      </ModularSection>

      <ModularSection
        title="Core Skills"
        onOptimize={() => applySkillsAiAction("Improve Skills")}
        onReset={() => resetSection("skills")}
        onAiAction={applySkillsAiAction}
        isOptimizing={optimizingKey.startsWith("skills-")}
      >
        <textarea
          value={editableResume.skillsText}
          onChange={(event) =>
            patchDraft({ skillsText: event.target.value })
          }
          className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
        />
      </ModularSection>

      <ModularSection
        title="Professional Experience"
        onOptimize={() => applyExperienceAiAction("Optimize this section")}
        onReset={() => resetSection("experience")}
        onAiAction={applyExperienceAiAction}
        isOptimizing={optimizingKey.startsWith("experience-")}
      >
	        <div className="space-y-3">
	          <div className="flex flex-wrap items-center justify-between gap-3">
	            <p className="text-sm font-medium text-slate-600">
	              {editableResume.experience.length > 0
	                ? "Edit each role directly. Changes update the preview and exports immediately."
	                : "No experience added yet. Add your first role."}
	            </p>
	            <FeedbackButton
	              doneLabel="Added"
	              onClick={() =>
	                patchDraft({
	                  experience: [...editableResume.experience, createEditableExperience()],
	                })
	              }
	              className={`${primaryButtonClass} ${buttonSizeSmClass}`}
	            >
	              Add Experience
	            </FeedbackButton>
	          </div>
	          {editableResume.experience.map((entry, entryIndex) => (
	            <div
	              key={entry.id}
	              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
	            >
	              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
	                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
	                  Experience {entryIndex + 1}
	                </p>
	                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
	                  <details className="relative">
	                    <summary className={`${primaryButtonClass} ${buttonSizeSmClass} cursor-pointer list-none`}>
	                      {optimizingKey.startsWith(`experience-${entryIndex}-`) ? "Optimizing..." : "Optimize"}
	                    </summary>
	                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
	                      {[
	                        ["Make More Executive", "Make more executive"],
	                        ["Make More Technical", "Make more technical"],
	                        ["Make More ATS-Friendly", "Improve ATS language"],
	                        ["Strengthen Metrics", "Strengthen metrics"],
	                        ["Shorten", "Shorten achievements"],
	                        ["Tailor to Industry", "Tailor to selected industry"],
	                      ].map(([action, label], actionIndex) => (
	                        <button
	                          key={`${entry.id}-${action}-${actionIndex}`}
	                          type="button"
	                          onClick={(event) => {
	                            event.preventDefault();
	                            applySingleExperienceAiAction(entryIndex, action as AiOptimizationAction);
	                          }}
	                          className={`${menuItemClass} text-xs`}
	                        >
	                          {label}
	                        </button>
	                      ))}
	                    </div>
	                  </details>
	                  <EditorActionButton
	                    onClick={() =>
	                      updateExperience(
	                        entryIndex,
	                        resetEditableResume.experience[entryIndex] ?? createEditableExperience(),
	                      )
	                    }
	                  >
	                    Reset
	                  </EditorActionButton>
	                  <EditorActionButton
	                    onClick={() => removeExperience(entryIndex)}
	                    variant="danger"
	                  >
	                    Remove
	                  </EditorActionButton>
	                </div>
	              </div>
	              <div className="grid gap-3 md:grid-cols-2">
	                <ContactField label="Role / Title" value={entry.title} onChange={(value) => updateExperience(entryIndex, { title: value })} />
	                <ContactField label="Company" value={entry.company} onChange={(value) => updateExperience(entryIndex, { company: value })} />
	                <ContactField label="Location" value={entry.location} onChange={(value) => updateExperience(entryIndex, { location: value })} />
	                <ContactField label="Start Date" value={entry.startDate} onChange={(value) => updateExperience(entryIndex, { startDate: value })} />
	                <ContactField label="End Date" value={entry.isCurrent ? "" : entry.endDate} onChange={(value) => updateExperience(entryIndex, { endDate: value, isCurrent: false })} />
	                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
	                  <input
	                    type="checkbox"
	                    checked={entry.isCurrent}
	                    onChange={(event) =>
	                      updateExperience(entryIndex, {
	                        isCurrent: event.target.checked,
	                        endDate: event.target.checked ? "" : entry.endDate,
	                      })
	                    }
	                  />
	                  Current role
	                </label>
	              </div>
	              <div className="mt-3 space-y-2">
	                <label className="block text-xs font-semibold text-slate-700">
	                  Bullets / Achievements
	                  <textarea
	                    value={entry.bulletsText}
	                    onChange={(event) =>
	                      updateExperience(entryIndex, { bulletsText: event.target.value })
	                    }
	                    placeholder="One achievement per line"
	                    className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
	                  />
	                </label>
              </div>
            </div>
          ))}
	        </div>
      </ModularSection>

      <EditableProjectsSection
        projects={editableResume.projects}
        onChange={(projects) => patchDraft({ projects })}
        onReset={() => resetSection("projects")}
        onAiAction={(action) => applyEntryListAiAction("projects", "Projects", action)}
        isOptimizing={optimizingKey.startsWith("projects-")}
      />
      <EditableEducationSection
        education={editableResume.education}
        onChange={(education) => patchDraft({ education })}
        onReset={() => resetSection("education")}
        onAiAction={(action) => applyEntryListAiAction("education", "Education", action)}
        isOptimizing={optimizingKey.startsWith("education-")}
      />
      <EditableCertificationsSection
        certifications={editableResume.certifications}
        onChange={(certifications) => patchDraft({ certifications })}
        onReset={() => resetSection("certifications")}
        onAiAction={(action) => applyEntryListAiAction("certifications", "Certifications", action)}
        isOptimizing={optimizingKey.startsWith("certifications-")}
      />
      <ModularListSection title="Publications / Research" value={editableResume.publicationsText} onChange={(value) => patchDraft({ publicationsText: value })} onOptimize={() => applyListAiAction("publications", "Publications / Research", "Optimize this section")} onReset={() => resetSection("publications")} onAiAction={(action) => applyListAiAction("publications", "Publications / Research", action)} isOptimizing={optimizingKey.startsWith("publications-")} />
      <ModularListSection title="Tools / Technologies" value={editableResume.toolsText} onChange={(value) => patchDraft({ toolsText: value })} onOptimize={() => applyListAiAction("tools", "Tools / Technologies", "Optimize this section")} onReset={() => resetSection("tools")} onAiAction={(action) => applyListAiAction("tools", "Tools / Technologies", action)} isOptimizing={optimizingKey.startsWith("tools-")} />

      {unmatchedReviewSections.length > 0 ? (
        <ModularSection title="Review unmatched content">
          <p className="mb-3 text-xs leading-5 text-slate-600">
            These source lines were not added to the final resume preview. Move only relevant, truthful details into the appropriate editable section.
          </p>
          <div className="space-y-2">
            {unmatchedReviewSections.map((section, sectionIndex) => (
              <div
                key={`${section.heading}-${sectionIndex}`}
                className="rounded-lg border border-amber-200 bg-amber-50/60 p-3"
              >
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-navy)]">
                  {section.heading}
                </p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
                  {[...section.body, ...section.bullets]
                    .map(cleanEditorText)
                    .filter(Boolean)
                    .slice(0, 8)
                    .map((item, itemIndex) => (
                      <li key={`${section.heading}-${itemIndex}`}>
                        {item}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </ModularSection>
      ) : null}

      <ModularSection
        title="Optional Additional Sections"
        onOptimize={() => applyAdditionalSectionAiAction(0, "Optimize this section")}
        onAiAction={(action) => applyAdditionalSectionAiAction(0, action)}
        onReset={() =>
          patchDraft({ additionalSections: resetEditableResume.additionalSections })
        }
        isOptimizing={optimizingKey.startsWith("additional-")}
      >
        <div className="space-y-3">
          {editableResume.additionalSections.map((section, sectionIndex) => (
            <div
              key={`${section.heading}-${sectionIndex}`}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <ContactField
                label="Section Heading"
                value={section.heading}
                onChange={(value) => updateAdditionalSection(sectionIndex, { heading: value })}
              />
              <textarea
                value={[...section.body, ...section.bullets].join("\n")}
                onChange={(event) =>
                  updateAdditionalSection(sectionIndex, {
                    body: event.target.value.split(/\r?\n/),
                    bullets: [],
                  })
                }
                className="mt-3 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              />
            </div>
          ))}
          <FeedbackButton
            doneLabel="Added"
            onClick={() =>
              patchDraft({
                additionalSections: [
                  ...editableResume.additionalSections,
                  { heading: "ADDITIONAL INFORMATION", body: [], bullets: [] },
                ],
              })
            }
            className={`${secondaryButtonClass} ${buttonSizeSmClass}`}
          >
            Add Section
          </FeedbackButton>
        </div>
      </ModularSection>
    </div>
  );
}

function ModularSection({
  title,
  children,
  onOptimize,
  onReset,
  onAiAction,
  isOptimizing = false,
}: {
  title: string;
  children: ReactNode;
  onOptimize?: () => void;
  onReset?: () => void;
  onAiAction?: (action: AiOptimizationAction) => void;
  isOptimizing?: boolean;
}) {
  return (
    <details open className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-[var(--iseya-navy)]">{title}</h4>
          </div>
          <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
            <span className={`${secondaryButtonClass} ${buttonSizeSmClass}`}>
              Edit
            </span>
            {onOptimize ? (
              <AiActionsMenu
                isOptimizing={isOptimizing}
                showAdvanced={Boolean(onAiAction)}
                onSelect={(action) => {
                  if (action === "Optimize this section") {
                    onOptimize();
                    return;
                  }

                  onAiAction?.(action);
                }}
              />
            ) : null}
            {onReset ? (
              <EditorActionButton onClick={onReset}>Reset</EditorActionButton>
            ) : null}
          </div>
        </div>
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function AiActionsMenu({
  isOptimizing,
  showAdvanced,
  onSelect,
}: {
  isOptimizing: boolean;
  showAdvanced: boolean;
  onSelect: (action: AiOptimizationAction) => void;
}) {
  const actions: AiOptimizationAction[] = showAdvanced
    ? [
        "Optimize this section",
        "Rewrite this section",
        "Improve for selected industry",
        "Make More Executive",
        "Make More Technical",
        "Make More ATS-Friendly",
        "Shorten",
        "Strengthen Metrics",
        "Improve Recruiter Readability",
      ]
    : ["Optimize this section"];

  return (
    <details className="relative">
      <summary
        className={`${secondaryButtonClass} ${buttonSizeSmClass} cursor-pointer list-none`}
        onClick={(event) => event.stopPropagation()}
      >
        {isOptimizing ? "Optimizing..." : "Optimization Actions"}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
        {actions.map((action, actionIndex) => (
          <button
            key={`${action}-${actionIndex}`}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onSelect(action);
            }}
            className={`${menuItemClass} text-xs`}
          >
            {action}
          </button>
        ))}
      </div>
    </details>
  );
}

function ModularListSection({
  title,
  value,
  onChange,
  onOptimize,
  onReset,
  onAiAction,
  isOptimizing,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onOptimize: () => void;
  onReset: () => void;
  onAiAction?: (action: AiOptimizationAction) => void;
  isOptimizing?: boolean;
}) {
  return (
    <ModularSection
      title={title}
      onOptimize={onOptimize}
      onReset={onReset}
      onAiAction={onAiAction}
      isOptimizing={isOptimizing}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
      />
    </ModularSection>
  );
}

function EditableProjectsSection({
  projects,
  onChange,
  onReset,
  onAiAction,
  isOptimizing,
}: {
  projects: EditableProjectEntry[];
  onChange: (projects: EditableProjectEntry[]) => void;
  onReset: () => void;
  onAiAction: (action: AiOptimizationAction) => void;
  isOptimizing: boolean;
}) {
  function updateEntry(index: number, patch: Partial<EditableProjectEntry>) {
    onChange(projects.map((project, entryIndex) => (
      entryIndex === index ? { ...project, ...patch } : project
    )));
  }

  return (
    <ModularSection
      title="Projects"
      onOptimize={() => onAiAction("Optimize this section")}
      onReset={onReset}
      onAiAction={onAiAction}
      isOptimizing={isOptimizing}
    >
      <div className="space-y-3">
        {projects.map((project, index) => (
          <div key={project.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Project {index + 1}
              </p>
              <EditorActionButton
                variant="danger"
                onClick={() => onChange(projects.filter((_, entryIndex) => entryIndex !== index))}
              >
                Remove Project
              </EditorActionButton>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ContactField label="Project Name" value={project.name} onChange={(value) => updateEntry(index, { name: value })} />
              <ContactField label="Role / Context optional" value={project.context} onChange={(value) => updateEntry(index, { context: value })} />
              <ContactField label="Tools optional" value={project.tools} onChange={(value) => updateEntry(index, { tools: value })} />
            </div>
            <label className="mt-3 block text-xs font-semibold text-slate-700">
              Description / Bullets
              <textarea
                value={project.details}
                onChange={(event) => updateEntry(index, { details: event.target.value })}
                className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              />
            </label>
          </div>
        ))}
        <FeedbackButton
          doneLabel="Added"
          onClick={() => onChange([
            ...projects,
            { id: editorEntryId("project"), name: "", context: "", tools: "", details: "" },
          ])}
          className={`${primaryButtonClass} ${buttonSizeSmClass}`}
        >
          Add Project
        </FeedbackButton>
      </div>
    </ModularSection>
  );
}

function EditableEducationSection({
  education,
  onChange,
  onReset,
  onAiAction,
  isOptimizing,
}: {
  education: EditableEducationEntry[];
  onChange: (education: EditableEducationEntry[]) => void;
  onReset: () => void;
  onAiAction: (action: AiOptimizationAction) => void;
  isOptimizing: boolean;
}) {
  function updateEntry(index: number, patch: Partial<EditableEducationEntry>) {
    onChange(education.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, ...patch } : entry
    )));
  }

  return (
    <ModularSection
      title="Education"
      onOptimize={() => onAiAction("Optimize this section")}
      onReset={onReset}
      onAiAction={onAiAction}
      isOptimizing={isOptimizing}
    >
      <div className="space-y-3">
        {education.map((entry, index) => (
          <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Education {index + 1}
              </p>
              <EditorActionButton
                variant="danger"
                onClick={() => onChange(education.filter((_, entryIndex) => entryIndex !== index))}
              >
                Remove Education
              </EditorActionButton>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ContactField label="School" value={entry.school} onChange={(value) => updateEntry(index, { school: value })} />
              <ContactField label="Degree / Program" value={entry.degree} onChange={(value) => updateEntry(index, { degree: value })} />
              <ContactField label="Location" value={entry.location} onChange={(value) => updateEntry(index, { location: value })} />
              <ContactField label="Start/End or Graduation Year" value={entry.dates} onChange={(value) => updateEntry(index, { dates: value })} />
            </div>
            <label className="mt-3 block text-xs font-semibold text-slate-700">
              Details / Honors optional
              <textarea
                value={entry.details}
                onChange={(event) => updateEntry(index, { details: event.target.value })}
                className="mt-2 min-h-20 w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              />
            </label>
          </div>
        ))}
        <FeedbackButton
          doneLabel="Added"
          onClick={() => onChange([
            ...education,
            { id: editorEntryId("education"), school: "", degree: "", location: "", dates: "", details: "" },
          ])}
          className={`${primaryButtonClass} ${buttonSizeSmClass}`}
        >
          Add Education
        </FeedbackButton>
      </div>
    </ModularSection>
  );
}

function EditableCertificationsSection({
  certifications,
  onChange,
  onReset,
  onAiAction,
  isOptimizing,
}: {
  certifications: EditableCertificationEntry[];
  onChange: (certifications: EditableCertificationEntry[]) => void;
  onReset: () => void;
  onAiAction: (action: AiOptimizationAction) => void;
  isOptimizing: boolean;
}) {
  function updateEntry(index: number, patch: Partial<EditableCertificationEntry>) {
    onChange(certifications.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, ...patch } : entry
    )));
  }

  return (
    <ModularSection
      title="Certifications"
      onOptimize={() => onAiAction("Optimize this section")}
      onReset={onReset}
      onAiAction={onAiAction}
      isOptimizing={isOptimizing}
    >
      <div className="space-y-3">
        {certifications.map((entry, index) => (
          <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Certification {index + 1}
              </p>
              <EditorActionButton
                variant="danger"
                onClick={() => onChange(certifications.filter((_, entryIndex) => entryIndex !== index))}
              >
                Remove Certification
              </EditorActionButton>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <ContactField label="Certification Name" value={entry.name} onChange={(value) => updateEntry(index, { name: value })} />
              <ContactField label="Issuer" value={entry.issuer} onChange={(value) => updateEntry(index, { issuer: value })} />
              <ContactField label="Year optional" value={entry.year} onChange={(value) => updateEntry(index, { year: value })} />
            </div>
          </div>
        ))}
        <FeedbackButton
          doneLabel="Added"
          onClick={() => onChange([
            ...certifications,
            { id: editorEntryId("certification"), name: "", issuer: "", year: "" },
          ])}
          className={`${primaryButtonClass} ${buttonSizeSmClass}`}
        >
          Add Certification
        </FeedbackButton>
      </div>
    </ModularSection>
  );
}

function EditorActionButton({
  children,
  onClick,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick: () => void | Promise<void>;
  variant?: "secondary" | "danger";
}) {
  const className =
    variant === "danger"
      ? `${dangerButtonClass} ${buttonSizeSmClass}`
      : `${secondaryButtonClass} ${buttonSizeSmClass}`;

  return (
    <FeedbackButton
      doneLabel={variant === "danger" ? "Removed" : "Updated"}
      onClick={onClick}
      className={className}
    >
      {children}
    </FeedbackButton>
  );
}

function CompactAiSidebar({ result }: { result: TailoringResult }) {
  const score = safeScore(result.score, 0);
  const breakdown = safeMatchBreakdown(result.matchBreakdown, score);
  const coach = normalizeCoachData(result.coach, {
    score,
    breakdown,
    positioningStrategy: result.positioningStrategy || "",
    missingKeywords: safeStringArray(result.missingKeywords),
    improvementNotes: safeStringArray(result.improvementNotes),
    riskFlags: safeStringArray(result.riskFlags),
    rewrittenResume: result.rewrittenResume || "",
    coverLetter: result.coverLetter || "",
  });
  const simulation = result.advancedAnalysis.recruiterSimulation;
  const quickCritiques = [
    ...safeStringArray(coach.topStrengths).slice(0, 2).map((item) => `Strength: ${item}`),
    ...safeStringArray(coach.topGaps).slice(0, 2).map((item) => `Gap: ${item}`),
  ];
  const sectionCritiques = [
    ["Header", coach.sectionCritique.headerContact],
    ["Summary", coach.sectionCritique.professionalSummary],
    ["Skills", coach.sectionCritique.skills],
    ["Experience", coach.sectionCritique.experience],
    ["Projects", coach.sectionCritique.projects],
    ["Education", coach.sectionCritique.educationCertifications],
    ["Cover Letter", coach.sectionCritique.coverLetter],
  ] as const;

  return (
    <div className="space-y-2">
      <section className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
        <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">
          Career Insights
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Get smart suggestions to strengthen your resume.
        </p>
        <ul className="mt-2 space-y-1.5 text-[11px] font-medium leading-4 text-slate-700">
          {[
            ["Add measurable achievements", "bg-emerald-50 text-emerald-600"],
            ["Strengthen your summary", "bg-blue-50 text-blue-600"],
            ["Improve keyword alignment", "bg-[#FFF8E6] text-[var(--iseya-gold)]"],
            ["Enhance impact and clarity", "bg-slate-100 text-[var(--iseya-navy)]"],
          ].map(([label, color]) => (
            <li key={label} className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50/60 px-2 py-1.5">
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
              <span className="min-w-0 break-words">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Insights Center
        </p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-xl font-semibold tracking-tight text-[var(--iseya-navy)]">
            {Math.round(score)}
          </span>
          <span className="pb-1 text-sm font-semibold text-slate-500">/100</span>
        </div>
        <div className="mt-1.5 space-y-1.5">
          <ScoreBar label="Readability score" score={breakdown.atsReadability} tone="green" />
          <ScoreBar label="Alignment score" score={breakdown.roleFit} tone="blue" />
          <ScoreBar label="Evidence strength" score={breakdown.metricStrength} tone="gold" />
        </div>
      </section>

      <details className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
          Recruiter Simulation
        </summary>
        <div className="mt-2 space-y-1.5">
          <ScoreBar label="ATS screen" score={simulation.atsScreening.score} tone="green" />
          <ScoreBar label="Recruiter" score={simulation.recruiterReview.score} tone="blue" />
          <ScoreBar label="Hiring manager" score={simulation.hiringManagerReview.score} tone="gold" />
        </div>
      </details>

      <details className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
          Content Feedback
        </summary>
        <CoachInlineList items={quickCritiques} />
        <div className="mt-2 space-y-1.5">
          {sectionCritiques.map(([title, items], sectionIndex) => (
            <details
              key={`${title}-${sectionIndex}`}
              className="rounded-md border border-slate-200 bg-slate-50 p-2"
            >
              <summary className="cursor-pointer list-none">
                <p className="text-xs font-semibold text-[var(--iseya-navy)]">{title}</p>
                <p className="mt-1 break-words text-[11px] leading-4 text-slate-500">
                  {safeStringArray(items)[0] || "No detail yet."}
                </p>
              </summary>
              <CoachInlineList items={items} />
            </details>
          ))}
        </div>
      </details>

      <details className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
          Resume Integrity
        </summary>
        <CoachInlineList items={safeStringArray(result.riskFlags).map(userFacingGuidance)} />
      </details>

      <details className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
          Industry Alignment
        </summary>
        <CoachInlineList items={[coach.industryAlignment, result.industryFit]} />
      </details>
    </div>
  );
}

function WeakBulletEditor({
  bullets,
  onApply,
}: {
  bullets: WeakBulletSuggestion[];
  onApply: (original: string, strongerVersion: string) => void;
}) {
  const visibleBullets = safeWeakBullets(bullets).slice(0, 4);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedBullet =
    selectedIndex === null ? null : visibleBullets[selectedIndex] ?? null;

  if (visibleBullets.length === 0) {
    return null;
  }

  return (
    <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-amber-950">
            Achievement Suggestions
          </h3>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Review suggested rewrites before applying them to the editable resume.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          {visibleBullets.map((bullet, bulletIndex) => (
            <button
              key={`${bullet.original}-${bulletIndex}`}
              type="button"
              onClick={() => setSelectedIndex(bulletIndex)}
              className={`block w-full rounded-md border p-3 text-left transition ${
                selectedIndex === bulletIndex
                  ? "border-amber-400 bg-white"
                  : "border-amber-200 bg-amber-100/60 hover:bg-white"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                {bullet.issueType.replace(/_/g, " ")}
              </p>
              <p className="mt-1 max-h-12 overflow-hidden text-sm leading-6 text-amber-950">
                {bullet.original}
              </p>
            </button>
          ))}
        </div>
        <div className="rounded-md border border-amber-200 bg-white p-4">
          {selectedBullet ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                Improved achievement
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {selectedBullet.issue}
              </p>
              <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-900">
                {selectedBullet.strongerVersion}
              </p>
              <FeedbackButton
                onClick={() => {
                  onApply(selectedBullet.original, selectedBullet.strongerVersion);
                  setSelectedIndex(null);
                }}
                doneLabel="Updated"
                className={`mt-3 ${primaryButtonClass} ${buttonSizeSmClass}`}
              >
                Apply to Resume
              </FeedbackButton>
            </>
          ) : (
            <p className="text-sm leading-6 text-zinc-500">
              Select an achievement to preview the improved version.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function CoachInlineList({ items = [] }: { items?: readonly string[] | null }) {
  const safeItems = Array.isArray(items) ? items : [];
  const visibleItems = safeItems.filter(Boolean);

  if (visibleItems.length === 0) {
    return (
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        No specific critique yet.
      </p>
    );
  }

  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
      {visibleItems.map((item, itemIndex) => (
        <li key={`${item}-${itemIndex}`}>{userFacingGuidance(item)}</li>
      ))}
    </ul>
  );
}

function CoachBlock({
  title,
  items = [],
}: {
  title: string;
  items?: readonly string[] | null;
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const visibleItems = safeItems.filter(Boolean);

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
        {title}
      </h3>
      {visibleItems.length > 0 ? (
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          {visibleItems.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{userFacingGuidance(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          No specific guidance yet.
        </p>
      )}
    </section>
  );
}

function AdvancedIntelligencePanel({
  analysis,
  onReplaceBullet,
}: {
  analysis: AdvancedAnalysis;
  onReplaceBullet: (original: string, replacement: string) => void;
}) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--iseya-navy)]">
        Career Intelligence
      </summary>
      <div className="mt-2 space-y-1.5">
        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            Interview Preparation
          </summary>
          <div className="mt-3 space-y-4">
            <CoachBlock
              title="Why You Fit This Role"
              items={[analysis.interviewPrep.whyYouFitThisRole]}
            />
            <CoachBlock title="Likely Questions" items={analysis.interviewPrep.likelyQuestions} />
            <CoachBlock
              title="Behavioral Questions"
              items={analysis.interviewPrep.behavioralQuestions}
            />
            <CoachBlock
              title="Technical Questions"
              items={analysis.interviewPrep.technicalQuestions}
            />
            <CoachBlock
              title="Executive Questions"
              items={analysis.interviewPrep.executiveQuestions}
            />
            <CoachBlock
              title="Industry-Specific Questions"
              items={analysis.interviewPrep.industrySpecificQuestions}
            />
            <CoachBlock
              title="Potential Recruiter Objections"
              items={analysis.interviewPrep.potentialRecruiterObjections}
            />
          </div>
        </details>

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            Gap Analysis
          </summary>
          <div className="mt-3 space-y-4">
            <CoachBlock title="Missing Keywords" items={analysis.gapAnalysis.missingKeywords} />
            <CoachBlock
              title="Weak Experience Areas"
              items={analysis.gapAnalysis.weakExperienceAreas}
            />
            <CoachBlock title="Seniority Gaps" items={analysis.gapAnalysis.seniorityGaps} />
            <CoachBlock title="Leadership Gaps" items={analysis.gapAnalysis.leadershipGaps} />
            <CoachBlock title="Technical Gaps" items={analysis.gapAnalysis.technicalGaps} />
            <CoachBlock
              title="Education Alignment"
              items={analysis.gapAnalysis.educationAlignment}
            />
            <CoachBlock
              title="Certification Alignment"
              items={analysis.gapAnalysis.certificationAlignment}
            />
            <CoachBlock title="Recommendations" items={analysis.gapAnalysis.recommendations} />
            <CoachBlock title="Wording Changes" items={analysis.gapAnalysis.wordingChanges} />
          </div>
        </details>

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            Job Description Intelligence
          </summary>
          <div className="mt-3 space-y-4">
            <CoachBlock
              title="Required Skills"
              items={analysis.jobDescriptionIntelligence.requiredSkills}
            />
            <CoachBlock
              title="Preferred Skills"
              items={analysis.jobDescriptionIntelligence.preferredSkills}
            />
            <CoachBlock
              title="Hidden Priorities"
              items={analysis.jobDescriptionIntelligence.hiddenPriorities}
            />
            <CoachBlock
              title="Likely Hiring Goals"
              items={analysis.jobDescriptionIntelligence.likelyHiringGoals}
            />
            <CoachBlock
              title="Leadership Expectations"
              items={analysis.jobDescriptionIntelligence.leadershipExpectations}
            />
            <CoachBlock
              title="Seniority Signals"
              items={analysis.jobDescriptionIntelligence.senioritySignals}
            />
            <CoachBlock
              title="Keyword Map"
              items={analysis.jobDescriptionIntelligence.keywordMap}
            />
            <CoachBlock
              title="Role Strategy"
              items={[
                analysis.jobDescriptionIntelligence.alignmentSummary,
                analysis.jobDescriptionIntelligence.roleStrategy,
              ]}
            />
          </div>
        </details>

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            Achievement Improvement
          </summary>
          <div className="mt-3 space-y-3">
            {analysis.bulletImprovements.length > 0 ? (
              analysis.bulletImprovements.map((bullet, bulletIndex) => (
                <div
                  key={`${bullet.original}-${bulletIndex}`}
                  className="rounded-md border border-zinc-200 bg-white p-3"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Improve Achievement
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Current achievement: {bullet.original}
                  </p>
                  <BulletVariantButton
                    label="Stronger"
                    value={bullet.strongerVersion}
                    original={bullet.original}
                    onReplaceBullet={onReplaceBullet}
                  />
                  <BulletVariantButton
                    label="ATS Optimized"
                    value={bullet.atsOptimizedVersion}
                    original={bullet.original}
                    onReplaceBullet={onReplaceBullet}
                  />
                  <BulletVariantButton
                    label="Executive"
                    value={bullet.executiveVersion}
                    original={bullet.original}
                    onReplaceBullet={onReplaceBullet}
                  />
                  <BulletVariantButton
                    label="Concise"
                    value={bullet.conciseVersion}
                    original={bullet.original}
                    onReplaceBullet={onReplaceBullet}
                  />
                  <BulletVariantButton
                    label="Metric-Focused"
                    value={bullet.metricFocusedVersion}
                    original={bullet.original}
                    onReplaceBullet={onReplaceBullet}
                  />
                  <CoachBlock title="Suggested Metrics" items={bullet.suggestedMetrics} />
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No experience achievements detected yet.</p>
            )}
          </div>
        </details>

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            Optimization Suggestions
          </summary>
          <CoachBlock title="Smart Suggestions" items={analysis.aiSuggestions} />
        </details>
      </div>
    </details>
  );
}

function ScoreBar({
  label,
  score,
  tone = "gold",
  helperText,
}: {
  label: string;
  score: number;
  tone?: "green" | "blue" | "gold";
  helperText?: string;
}) {
  const safeScoreValue = clampPercent(score, 0);
  const progressClass =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "blue"
        ? "bg-blue-500"
        : "bg-[var(--iseya-gold)]";

  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-2">
      <p className="break-words text-[11px] font-semibold leading-4 text-[var(--iseya-navy)]">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold leading-5 text-[var(--iseya-navy)]">
        {safeScoreValue}<span className="text-xs font-medium text-slate-500">/100</span>
      </p>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-200">
        <div
          className={`h-1.5 rounded-full ${progressClass}`}
          style={{ width: `${safeScoreValue}%` }}
        />
      </div>
      {helperText ? (
        <p className="mt-1.5 break-words text-[11px] leading-4 text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

function BulletVariantButton({
  label,
  value,
  original,
  onReplaceBullet,
}: {
  label: string;
  value: string;
  original: string;
  onReplaceBullet: (original: string, replacement: string) => void;
}) {
  return (
    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-800">{value}</p>
      <FeedbackButton
        onClick={() => onReplaceBullet(original, value)}
        doneLabel="Updated"
        className={`mt-3 ${secondaryButtonClass} ${buttonSizeSmClass}`}
      >
        Replace Achievement
      </FeedbackButton>
    </div>
  );
}

function previewSectionItems(section: ResumeSection) {
  return [...section.body, ...section.bullets]
    .map((item) => cleanExportBullet(item))
    .filter(Boolean);
}

function previewEntryParts(item: string) {
  return item
    .split(/\s+\|\s+/)
    .map((part) => cleanEditorText(part))
    .filter(Boolean);
}

function previewExperienceIdentity(line: string) {
  const parts = line
    .split(/\s+(?:-|–|—|\|)\s+/)
    .map((part) => cleanEditorText(part))
    .filter(Boolean);

  if (parts.length < 2) {
    return { company: "", title: line };
  }

  const [first, ...remaining] = parts;
  const second = remaining.join(" | ");
  const firstLooksCompany = companySignalRegex().test(first);
  const secondLooksCompany = companySignalRegex().test(second);

  return firstLooksCompany && !secondLooksCompany
    ? { company: first, title: second }
    : { company: second, title: first };
}

function ResumePreviewSectionContent({ section }: { section: ResumeSection }) {
  if (section.heading === "CORE SKILLS") {
    const skills = splitResumeList(previewSectionItems(section).join(" | "));

    return skills.length > 0 ? (
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-medium text-zinc-700">
        {skills.map((skill) => (
          <span key={skill} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            {skill}
          </span>
        ))}
      </div>
    ) : null;
  }

  if (/PROJECTS$/.test(section.heading)) {
    return (
      <div className="mt-3 space-y-3">
        {previewSectionItems(section).map((project, projectIndex) => {
          const [title, ...details] = previewEntryParts(project);

          return (
            <div key={`${project}-${projectIndex}`} className="break-inside-avoid">
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              {details.length > 0 ? (
                <p className="mt-1 text-sm leading-6 text-zinc-700">{details.join(" | ")}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (section.heading === "EDUCATION") {
    return (
      <div className="mt-3 space-y-3">
        {previewSectionItems(section).map((education, educationIndex) => {
          const [institution, ...credentialDetails] = previewEntryParts(education);

          return (
            <div key={`${education}-${educationIndex}`} className="break-inside-avoid">
              <p className="text-sm font-semibold text-zinc-900">{institution}</p>
              {credentialDetails.length > 0 ? (
                <p className="mt-1 text-sm leading-6 text-zinc-700">
                  {credentialDetails.join(" | ")}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (section.heading === "CERTIFICATIONS") {
    return (
      <div className="mt-3 space-y-1.5 text-sm leading-6 text-zinc-700">
        {previewSectionItems(section).map((certification, certificationIndex) => (
          <p key={`${certification}-${certificationIndex}`}>{certification}</p>
        ))}
      </div>
    );
  }

  if (section.heading !== "PROFESSIONAL EXPERIENCE") {
    return (
      <>
        {section.body.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {section.body.map((paragraph, paragraphIndex) => (
              <p key={`${paragraph}-${paragraphIndex}`} className="text-sm leading-6 text-zinc-700">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
        {section.bullets.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-zinc-700">
            {section.bullets.map((bullet, bulletIndex) => (
              <li key={`${bullet}-${bulletIndex}`}>{cleanExportBullet(bullet)}</li>
            ))}
          </ul>
        ) : null}
      </>
    );
  }

  const lines = section.lines ?? [
    ...section.body,
    ...section.bullets.map((bullet) => `- ${bullet}`),
  ];
  const entries: Array<{ role: string; meta: string; bullets: string[] }> = [];
  let current: { role: string; meta: string; bullets: string[] } | null = null;

  for (const rawLine of lines) {
    const line = cleanEditorText(rawLine);

    if (!line) {
      continue;
    }

    if (/^[-*•]\s+/.test(rawLine.trim())) {
      current?.bullets.push(cleanExportBullet(line.replace(/^[-*•]\s+/, "")));
      continue;
    }

    if (!current || (current.meta && current.bullets.length > 0)) {
      current = { role: line, meta: "", bullets: [] };
      entries.push(current);
    } else if (current.meta && line.length > 34 && /[.!?]$/.test(line)) {
      current.bullets.push(cleanExportBullet(line));
    } else {
      current.meta = line;
    }
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-4">
      {entries.map((entry, entryIndex) => {
        const metadata = entry.meta.split(/\s+\|\s+/).filter(Boolean);
        const dateIndex = metadata.findIndex((item) =>
          /\b(?:present|current|\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(item),
        );
        let date = dateIndex >= 0 ? metadata.splice(dateIndex, 1)[0] : "";
        let location = metadata.join(" | ");
        let identity = previewExperienceIdentity(entry.role);

        if (!entry.meta && /\s+\|\s+/.test(entry.role)) {
          const inlineMetadata = entry.role.split(/\s+\|\s+/).filter(Boolean);
          const inlineDateIndex = inlineMetadata.findIndex((item) =>
            /\b(?:present|current|\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(item),
          );

          date = inlineDateIndex >= 0 ? inlineMetadata.splice(inlineDateIndex, 1)[0] : date;
          identity = previewExperienceIdentity(inlineMetadata.slice(0, 2).join(" | "));
          location = inlineMetadata.slice(2).join(" | ");
        }

        return (
          <div key={`${entry.role}-${entryIndex}`} className="break-inside-avoid">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <p className="text-sm font-bold text-zinc-900">
                {identity.company || identity.title || entry.role}
              </p>
              {location ? <p className="shrink-0 text-xs text-zinc-500">{location}</p> : null}
            </div>
            <div className="mt-0.5 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              {identity.company && identity.title ? (
                <p className="text-sm font-medium text-zinc-800">{identity.title}</p>
              ) : null}
              {date ? <p className="shrink-0 text-xs font-semibold text-zinc-500">{date}</p> : null}
            </div>
            {entry.bullets.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700 marker:text-zinc-500">
                {entry.bullets.map((bullet, bulletIndex) => (
                  <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ResumePreview({
  resumeText,
  theme,
  template,
  branding,
  fullPage = false,
}: {
  resumeText: string;
  theme: (typeof previewThemes)[ThemeId];
  template: TemplateId;
  branding?: PersonalBranding;
  fullPage?: boolean;
}) {
  const resume = parseResumePreview(resumeText);
  const contact = mergeBrandingWithResume(resumeText, branding);
  const contactItems = [
    contact.email,
    contact.phone,
    contact.linkedIn,
    contact.portfolio,
    contact.website,
    contact.location,
  ].filter((item): item is string => Boolean(item));
  const profile = templateProfile(template);
  const family = profile.family;
  const isExecutive = family === "executive";
  const orderedSections = preparedPreviewSections(resume.sections, template);
  const bodyClassByFamily: Record<TemplateFamily, string> = {
    ats: fullPage ? "space-y-4 px-10 py-8" : "space-y-4 p-6",
    executive: fullPage ? "space-y-5 px-12 py-9" : "space-y-5 p-7",
    consulting: fullPage ? "space-y-4 px-11 py-9" : "space-y-4 p-7",
    academic: fullPage ? "space-y-4 px-12 py-9" : "space-y-5 p-7",
    finance: fullPage ? "space-y-4 px-11 py-9" : "space-y-5 p-7",
    healthcare: fullPage ? "space-y-4 px-11 py-9" : "space-y-5 p-7",
    creative: fullPage ? "space-y-5 px-10 py-9" : "space-y-6 p-7",
    legal: fullPage ? "space-y-4 px-12 py-9" : "space-y-5 p-7",
    product: fullPage ? "space-y-5 px-11 py-9" : "space-y-5 p-7",
    technical: fullPage ? "space-y-4 px-10 py-8" : "space-y-5 p-6",
  };
  const bodyClass = bodyClassByFamily[family];
  const headerClassByFamily: Record<TemplateFamily, string> = {
    ats: `border-b border-zinc-300 bg-white ${fullPage ? "px-10 py-6" : "px-6 py-4"} text-zinc-950`,
    executive: `border-b border-zinc-200 ${fullPage ? "px-12 py-9" : "px-8 py-7"} ${theme.headerBg} ${theme.headerText}`,
    consulting: `border-b-2 bg-white ${fullPage ? "px-11 py-7" : "px-7 py-5"} text-zinc-950 ${theme.accentBorder}`,
    academic: `border-b border-zinc-300 bg-white ${fullPage ? "px-12 py-7" : "px-7 py-5"} font-serif text-zinc-950`,
    finance: `border-b border-zinc-200 ${fullPage ? "px-11 py-7" : "px-7 py-5"} ${theme.headerBg} ${theme.headerText}`,
    healthcare: `border-b-4 bg-white ${fullPage ? "px-11 py-7" : "px-7 py-5"} text-zinc-950 ${theme.accentBorder}`,
    creative: `border-b border-zinc-200 bg-white ${fullPage ? "px-10 py-8" : "px-7 py-6"} text-zinc-950 ${theme.accentBorder}`,
    legal: `border-y-4 bg-white ${fullPage ? "px-12 py-7" : "px-7 py-5"} font-serif text-zinc-950 ${theme.accentBorder}`,
    product: `border-b border-zinc-200 bg-white ${fullPage ? "px-10 py-7" : "px-6 py-5"} text-zinc-950 ${theme.accentBorder}`,
    technical: `border-b border-zinc-200 bg-white ${fullPage ? "px-10 py-6" : "px-6 py-4"} text-zinc-950`,
  };
  const headerClass = headerClassByFamily[family];
  const subtitleClass = isExecutive || family === "finance"
    ? `mt-1 text-sm font-medium ${theme.subheadText}`
    : `mt-1 text-sm font-medium ${theme.accentText}`;
  const nameClass = isExecutive || family === "finance"
    ? ""
    : theme.accentText;
  const sectionClassByFamily: Record<TemplateFamily, string> = {
    ats: "break-inside-avoid",
    executive: "break-inside-avoid",
    consulting: "break-inside-avoid",
    academic: "break-inside-avoid font-serif",
    finance: "break-inside-avoid",
    healthcare: "break-inside-avoid",
    creative: "break-inside-avoid",
    legal: "break-inside-avoid font-serif",
    product: "break-inside-avoid",
    technical: "break-inside-avoid",
  };
  const headingClassByFamily: Record<TemplateFamily, string> = {
    ats: `border-b pb-1 text-[11px] font-bold uppercase ${theme.accentText} ${theme.accentBorder}`,
    executive: `border-b pb-2 text-xs font-bold uppercase tracking-[0.16em] ${theme.accentText} ${theme.accentBorder}`,
    consulting: `border-b-2 pb-2 text-xs font-bold uppercase tracking-[0.14em] ${theme.accentText} ${theme.accentBorder}`,
    academic: `border-b pb-2 text-sm font-bold tracking-normal ${theme.accentText} ${theme.accentBorder}`,
    finance: `border-b pb-2 text-xs font-bold uppercase tracking-[0.12em] ${theme.accentText} ${theme.accentBorder}`,
    healthcare: `border-b pb-2 text-xs font-bold uppercase tracking-[0.12em] ${theme.accentText} ${theme.accentBorder}`,
    creative: `pb-2 text-xs font-bold uppercase tracking-[0.18em] ${theme.accentText}`,
    legal: `border-b pb-2 text-sm font-bold uppercase tracking-[0.08em] ${theme.accentText} ${theme.accentBorder}`,
    product: `border-b pb-2 text-xs font-bold uppercase tracking-[0.16em] ${theme.accentText} ${theme.accentBorder}`,
    technical: `border-b pb-2 text-xs font-bold uppercase tracking-[0.12em] ${theme.accentText} ${theme.accentBorder}`,
  };

  return (
    <article
      className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white text-zinc-850 shadow-sm ${
        fullPage
          ? "min-h-[11in] w-full max-w-[8.5in] print:shadow-none"
          : ""
      }`}
    >
      <header className={headerClass}>
        <div className="flex items-start gap-4">
          {shouldShowProfileImage(template, contact.profileImageDataUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contact.profileImageDataUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white/70"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            {contact.name ? (
              <h4
                className={`font-semibold tracking-tight ${nameClass} ${
                  family === "executive"
                    ? "text-3xl"
                    : family === "ats"
                      ? "text-xl"
                      : "text-2xl"
                }`}
              >
                {contact.name}
              </h4>
            ) : null}
            {contact.title ? <p className={subtitleClass}>{contact.title}</p> : null}
            {contactItems.length > 0 ? (
              <p
                className={`mt-3 break-words text-xs leading-5 ${
                  isExecutive || family === "finance" ? theme.subheadText : "text-zinc-600"
                }`}
              >
                {contactItems.map((item, itemIndex) => (
                  <span key={`${item}-${itemIndex}`}>
                    {isUrlLike(item) ? (
                      <a
                        href={normalizeUrl(item)}
                        className="underline decoration-current/40 underline-offset-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item}
                      </a>
                    ) : (
                      item
                    )}
                    {itemIndex < contactItems.length - 1 ? " | " : ""}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className={bodyClass}>
        {orderedSections.map((section, sectionIndex) => (
          <section
            key={`${section.heading}-${sectionIndex}`}
            className={sectionClassByFamily[family]}
          >
            <h5 className={headingClassByFamily[family]}>
              {section.heading}
            </h5>
            <ResumePreviewSectionContent section={section} />
          </section>
        ))}
      </div>
    </article>
  );
}
