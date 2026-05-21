"use client";

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Json } from "@/lib/database.types";
import {
  canUseSubscriptionFeature,
  isProPlan,
  isStarterPlan,
  planDownloadLimit,
  planOptimizationLimit,
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
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  projects: string[];
  education: string[];
  certifications: string[];
  publications: string[];
  tools: string[];
  additionalSections: ResumeSection[];
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

type ExtractionStatus = "extracted" | "metadata_only" | "unsupported" | "failed";

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
};

const storageKey = "resume-agent-state-v2";
const versionStorageKey = "iseya_resume_versions";
const usageStorageKey = "iseya_usage_stats";
const acceptedSourceFileTypes = ".pdf,.docx,.txt,.png,.jpg,.jpeg";
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
  model: "gpt-4o-mini",
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

const sampleResume = `Jordan Taylor
Product Manager
jordan@example.com | 555-0100 | City, State

SUMMARY
Write a 3-4 line professional summary here...

EXPERIENCE
Role Title - Company Name
City, State | Start Month Year - End Month Year
- Add 3-5 measurable achievements for this role.
- Describe the scope, tools, stakeholders, and outcomes.
- Replace this placeholder with a concise impact statement.
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

const templates: Record<TemplateId, TemplateProfile> = {
  "executive-navy": {
    label: "Executive Navy",
    description: "Formal preview with a strong navy header and classic spacing.",
    family: "executive",
    allowImage: true,
    headingLabel: "Leadership-first",
    sectionOrder: ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "CERTIFICATIONS"],
  },
  "modern-product": {
    label: "Modern Product",
    description: "Product-focused preview with clean section rhythm.",
    family: "product",
    allowImage: false,
    headingLabel: "Product outcomes",
    sectionOrder: ["SUMMARY", "SKILLS", "PROJECTS", "EXPERIENCE", "TOOLS", "EDUCATION"],
  },
  "ats-clean": {
    label: "ATS Clean",
    description: "Minimal preview optimized for straightforward scanning.",
    family: "ats",
    allowImage: false,
    headingLabel: "Parser-friendly",
    sectionOrder: ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "CERTIFICATIONS"],
  },
  "consulting-classic": {
    label: "Consulting Classic",
    description: "Traditional consulting-style preview with crisp section rules.",
    family: "consulting",
    allowImage: false,
    headingLabel: "Consulting impact",
    sectionOrder: ["SUMMARY", "EXPERIENCE", "SKILLS", "PROJECTS", "EDUCATION", "CERTIFICATIONS"],
  },
  "tech-minimal": {
    label: "Tech Minimal",
    description: "Lean technical preview with compact spacing and clear hierarchy.",
    family: "technical",
    allowImage: false,
    headingLabel: "Technical clarity",
    sectionOrder: ["SUMMARY", "TOOLS", "SKILLS", "PROJECTS", "EXPERIENCE", "EDUCATION"],
  },
  "bold-leadership": {
    label: "Bold Leadership",
    description: "High-impact preview with a stronger leadership-oriented header.",
    family: "executive",
    allowImage: true,
    headingLabel: "Executive scope",
    sectionOrder: ["SUMMARY", "EXPERIENCE", "SKILLS", "PROJECTS", "EDUCATION", "CERTIFICATIONS"],
  },
  "ats-professional": {
    label: "ATS Professional",
    description: "Plain parser-friendly layout with simple headings, tight spacing, and no image.",
    family: "ats",
    allowImage: false,
    headingLabel: "Parser-friendly",
    sectionOrder: ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "TOOLS", "EDUCATION", "CERTIFICATIONS"],
  },
  "executive-modern": {
    label: "Executive Modern",
    description: "Premium leadership hierarchy with a strong header, open spacing, and executive emphasis.",
    family: "executive",
    allowImage: true,
    headingLabel: "Leadership-first",
    sectionOrder: ["SUMMARY", "EXPERIENCE", "SKILLS", "PROJECTS", "EDUCATION", "CERTIFICATIONS"],
  },
  "academic-research": {
    label: "Academic Research",
    description: "Research-first hierarchy emphasizing publications, teaching, methods, and credentials.",
    family: "academic",
    allowImage: false,
    headingLabel: "Research-first",
    sectionOrder: ["SUMMARY", "PUBLICATIONS", "RESEARCH", "PROJECTS", "EDUCATION", "CERTIFICATIONS", "SKILLS", "EXPERIENCE"],
  },
  "finance-fintech": {
    label: "Finance / Fintech",
    description: "Metrics-forward structure for impact, risk, compliance, controls, and financial systems.",
    family: "finance",
    allowImage: false,
    headingLabel: "Impact and controls",
    sectionOrder: ["SUMMARY", "EXPERIENCE", "SKILLS", "PROJECTS", "TOOLS", "EDUCATION", "CERTIFICATIONS"],
  },
  "healthcare-health-it": {
    label: "Healthcare / Health IT",
    description: "Credential and workflow-oriented layout for compliance, systems integration, and care operations.",
    family: "healthcare",
    allowImage: false,
    headingLabel: "Systems and compliance",
    sectionOrder: ["SUMMARY", "CERTIFICATIONS", "SKILLS", "EXPERIENCE", "PROJECTS", "TOOLS", "EDUCATION"],
  },
  "creative-portfolio": {
    label: "Creative Portfolio",
    description: "Portfolio-led preview with optional image, visual accents, and stronger link presentation.",
    family: "creative",
    allowImage: true,
    headingLabel: "Portfolio-led",
    sectionOrder: ["SUMMARY", "PROJECTS", "SKILLS", "TOOLS", "EXPERIENCE", "EDUCATION", "CERTIFICATIONS"],
  },
  "legal-policy": {
    label: "Legal / Policy",
    description: "Formal hierarchy for governance, policy, publications, compliance, and advisory work.",
    family: "legal",
    allowImage: false,
    headingLabel: "Formal governance",
    sectionOrder: ["SUMMARY", "EXPERIENCE", "PUBLICATIONS", "RESEARCH", "EDUCATION", "CERTIFICATIONS", "SKILLS"],
  },
  "product-saas": {
    label: "Product / SaaS",
    description: "Product outcomes layout emphasizing roadmap, users, APIs, experiments, and business metrics.",
    family: "product",
    allowImage: false,
    headingLabel: "Product outcomes",
    sectionOrder: ["SUMMARY", "SKILLS", "PROJECTS", "EXPERIENCE", "TOOLS", "EDUCATION", "CERTIFICATIONS"],
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
      `AI/ML project relevance: ${Math.round(aiScore * 10)}/10`,
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
            "AI suggestion - verify before use: number of stakeholders involved.",
            "AI suggestion - verify before use: number of projects, launches, users, or workflows affected.",
            "AI suggestion - verify before use: time saved, revenue influenced, cost reduced, or quality improved.",
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
  const keywordGroups = inferJobKeywordGroups(jobDescription);
  const jobKeywords = dedupeKeywords([
    ...keywordGroups.required,
    ...keywordGroups.preferred,
  ]);
  const resumeKeywords = extractKeywords(masterResume);
  const matchedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !resumeKeywords.includes(keyword),
  );
  const scoreResult = scoreResume(
    masterResume,
    jobDescription,
    matchedKeywords,
    keywordGroups.required,
    keywordGroups.preferred,
    targetRole,
  );
  const role = titleCase(
    targetRole || firstMeaningfulLine(jobDescription, "Target Role"),
  );
  const strongestKeywords = matchedKeywords.slice(0, 12);
  const skills = Array.from(
    new Set([
      ...strongestKeywords,
      "Product Requirements",
      "Stakeholder Alignment",
      "Delivery Planning",
      "Resume Keyword Optimization",
    ]),
  );
  const summary = `${role} with experience aligning business goals, user needs, and technical delivery. Brings hands-on strengths in ${strongestKeywords
    .slice(0, 6)
    .join(", ")} while translating complex requirements into clear roadmaps, launch plans, and measurable outcomes.`;
  const bullets = [
    `Repositioned product and delivery experience around ${role} responsibilities, emphasizing the keywords and outcomes requested in the job description.`,
    "Translated stakeholder goals into requirements, prioritized delivery plans, and launch-ready workflows for technical and business teams.",
    "Applied analytics, customer context, and quality review to improve product decisions, implementation readiness, and post-launch iteration.",
    missingKeywords.length > 0
      ? `Strengthened alignment with role expectations by weaving in ${missingKeywords
          .slice(0, 5)
          .join(", ")} where supported by the master resume.`
      : "Preserved strong keyword coverage while tightening the language for ATS scanning and recruiter readability.",
  ];
  const candidateName = firstMeaningfulLine(masterResume, "");
  const rewrittenResume = `${candidateName}
${role}

PROFESSIONAL SUMMARY
${summary}

CORE SKILLS
${skills.join(" | ")}

EXPERIENCE HIGHLIGHTS
${bullets.map((bullet) => `- ${bullet}`).join("\n")}

TAILORING NOTES
- Matched keywords: ${matchedKeywords.length > 0 ? matchedKeywords.join(", ") : "None found yet"}
- Keywords to strengthen: ${missingKeywords.length > 0 ? missingKeywords.join(", ") : "No major gaps found"}

SOURCE RESUME EXCERPT
${masterResume.trim()}`;
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
  const lines = resumeText.split(/\r?\n/);
  const name = lines[0]?.trim() || "";
  const title = lines[1]?.trim() || "";
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  const contact = extractContactInfoFromText(resumeText);

  for (const rawLine of lines.slice(2)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const cleanedLine = line.replace(/^#{1,6}\s*/, "").replace(/^\*+\s*/, "");

    if (isLikelyContactLine(cleanedLine, contact)) {
      continue;
    }

    const isHeading =
      cleanedLine === cleanedLine.toUpperCase() &&
      /^[A-Z0-9 &/+-]+$/.test(cleanedLine) &&
      !cleanedLine.startsWith("-");

    if (isHeading) {
      currentSection = {
        heading: cleanedLine,
        body: [],
        bullets: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = {
        heading: "PROFILE",
        body: [],
        bullets: [],
      };
      sections.push(currentSection);
    }

    if (/^[-*]\s+/.test(cleanedLine)) {
      currentSection.bullets.push(cleanedLine.replace(/^[-*]\s+/, ""));
    } else {
      currentSection.body.push(cleanedLine);
    }
  }

  return { name, title, sections };
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
    new Set(items.map((item) => cleanEditorText(item)).filter(Boolean)),
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
    .replace(/\*\*/g, "")
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
      .map((bullet) => cleanExportBullet(bullet.replace(/^[-*]\s+/, "")))
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

function parseExperienceLine(line: string) {
  const cleaned = cleanEditorText(line);
  const parts = cleaned.split(/\s+\|\s+/).map(cleanEditorText).filter(Boolean);
  const roleCompany = parts[0] || cleaned;
  const datePart = parts.find((part) => /\d{4}|present|current|now/i.test(part)) || "";
  const location = parts.find((part) => part !== roleCompany && part !== datePart) || "";
  const atMatch = roleCompany.match(/^(.+?)\s+at\s+(.+)$/i);
  const dashParts = roleCompany.split(/\s+-\s+/);
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
    return {
      title: dashParts[0].trim(),
      company: dashParts.slice(1).join(" - ").trim(),
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
  const hasBullets = normalized.bullets.length > 0;

  if (!hasIdentity && !hasBullets) {
    return null;
  }

  if (
    normalized.title &&
    normalized.company &&
    normalized.title.toLowerCase() === normalized.company.toLowerCase()
  ) {
    normalized.title = "";
  }

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
  const bodyLines = section.body.map(cleanEditorText).filter(Boolean);
  const isHighlightsOnly = /HIGHLIGHT/i.test(section.heading);

  for (const line of bodyLines) {
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

  if (entries.length === 0 && section.bullets.length > 0) {
    const fallback = normalizeExperience(
      {
        id: "experience-0",
        title: "",
        company: "",
        bullets: section.bullets,
      },
      0,
    );

    return fallback ? [fallback] : [];
  }

  if (current) {
    current.bullets = cleanBullets([...current.bullets, ...section.bullets]);
  }

  return dedupeExperience(
    entries
      .map((entry, index) => normalizeExperience(entry, index))
      .filter((entry): entry is ExperienceEntry => Boolean(entry)),
  );
}

function structuredResumeFromText(resumeText: string): StructuredResume {
  const { sections } = parseResumePreview(resumeText);
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
    "AI & AUTOMATION PROJECTS",
    "AI PROJECTS",
    "PROJECTS",
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
    ]
      .filter(Boolean)
      .map((section) => section?.heading),
  );

  return {
    summary: sectionItems(summarySection).join(" "),
    skills: splitResumeList(sectionItems(skillsSection).join(", ")),
    experience: parseExperienceEntries(experienceSection),
    projects: sectionItems(projectSection),
    education: sectionItems(educationSection),
    certifications: sectionItems(certificationSection),
    publications: sectionItems(publicationSection),
    tools: splitResumeList(sectionItems(toolsSection).join(", ")),
    additionalSections: sections.filter((section) => !knownSections.has(section.heading)),
  };
}

function serializeStructuredResume(
  structured: StructuredResume,
  branding: PersonalBranding,
) {
  const lines: string[] = [];
  const contact = normalizePersonalBranding(branding);

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

    if (!cleaned) {
      return;
    }

    lines.push("", heading, cleaned);
  }

  function pushListSection(heading: string, items: string[]) {
    const cleanedItems = uniqueStrings(items);

    if (cleanedItems.length === 0) {
      return;
    }

    lines.push("", heading, ...cleanedItems.map((item) => `- ${item}`));
  }

  pushTextSection("PROFESSIONAL SUMMARY", structured.summary);

  if (structured.skills.length > 0) {
    lines.push("", "CORE SKILLS", uniqueStrings(structured.skills).join(" | "));
  }

  const experience = dedupeExperience(
    structured.experience
      .map((entry, index) => normalizeExperience(entry, index))
      .filter((entry): entry is ExperienceEntry => Boolean(entry)),
  );

  if (experience.length > 0) {
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

  pushListSection("AI & AUTOMATION PROJECTS", structured.projects);
  pushListSection("EDUCATION", structured.education);
  pushListSection("CERTIFICATIONS", structured.certifications);
  pushListSection("PUBLICATIONS / RESEARCH", structured.publications);

  if (structured.tools.length > 0) {
    lines.push("", "TOOLS / TECHNOLOGIES", uniqueStrings(structured.tools).join(" | "));
  }

  for (const section of structured.additionalSections) {
    const heading = cleanEditorText(section.heading).toUpperCase();
    const body = section.body.map(cleanEditorText).filter(Boolean);
    const bullets = uniqueStrings(section.bullets);

    if (!heading || (body.length === 0 && bullets.length === 0)) {
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

function formatSectionText(items: string[]) {
  return items.map(cleanEditorText).filter(Boolean).join("\n");
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
      "AI suggestion - verify before use: add only supported metric, scope, or outcome details.",
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
        warnings: ["TXT text was added as source material."],
      };
    }

    return {
      ...baseFile,
      extractionStatus: "failed",
      warnings: ["Text extraction failed. File metadata was saved for source tracking."],
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
	  const orderedSections = orderedResumeSections(resume.sections, template);
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
  const orderedSections = orderedResumeSections(resume.sections, template);
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

export default function Home() {
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
  const [activeOutput, setActiveOutput] = useState<OutputTab>("resume");
  const [hydrated, setHydrated] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const authLoaded = !authLoading;
  const [cloudResumeId, setCloudResumeId] = useState<string | null>(null);
  const [cloudSaveStatus, setCloudSaveStatus] = useState("");
  const [cloudLoadedForUser, setCloudLoadedForUser] = useState("");
  const skipNextSave = useRef(false);
  const skipNextCloudSave = useRef(false);
  const lastAuthUserIdRef = useRef<string | null>(null);
  const cloudLoadInFlightUserRef = useRef<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimers = useRef<Record<string, number>>({});
  const previewTheme = previewThemes[theme];
  const currentPlanLabel = subscriptionLabel(subscriptionPlan);
  const currentSubscriptionStatusLabel =
    subscriptionPlan === "free"
      ? "Active"
      : subscriptionStatus
          .split("_")
          .filter(Boolean)
          .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
          .join(" ") || "Active";
  const subscriptionRenewalLabel =
    subscriptionPlan === "plus"
      ? "One-time credit pack"
      : subscriptionPlan === "pro_monthly"
        ? "Monthly renewal"
        : subscriptionPlan === "pro_annual"
          ? "Annual renewal"
          : "No renewal";
  const subscriptionCardTone =
    subscriptionPlan === "free"
      ? "border-zinc-200 bg-white"
      : "border-[var(--iseya-gold)]/60 bg-[#FFF8E6]";
  const downloadLimit = planDownloadLimit(subscriptionPlan);
  const optimizationLimit = planOptimizationLimit(subscriptionPlan);
  const effectiveDownloadsUsed = authUser ? downloadsUsed : usageStats.downloadsUsed;
  const effectiveOptimizationCreditsUsed = authUser
    ? optimizationCreditsUsed
    : usageStats.optimizationCreditsUsed;
  const downloadProgressPercent = Number.isFinite(downloadLimit)
    ? Math.min(100, Math.round((effectiveDownloadsUsed / Math.max(1, downloadLimit)) * 100))
    : 100;
  const optimizationProgressPercent = Number.isFinite(optimizationLimit)
    ? Math.min(100, Math.round((effectiveOptimizationCreditsUsed / Math.max(1, optimizationLimit)) * 100))
    : 100;
  const activeSavedVersionsCount = authUser ? savedVersionsCount : savedVersions.length;
  const savedVersionLimit = isProPlan(subscriptionPlan)
    ? Infinity
    : subscriptionPlan === "plus"
      ? 5
      : 0;
  const savedVersionProgressPercent = Number.isFinite(savedVersionLimit)
    ? Math.min(100, Math.round((activeSavedVersionsCount / Math.max(1, savedVersionLimit)) * 100))
    : 100;
  const canSaveAnotherVersion =
    canUseSubscriptionFeature(subscriptionPlan, "savedVersions") &&
    (isProPlan(subscriptionPlan) || savedVersions.length < savedVersionLimit);
  const dashboardActivity = [
    savedVersions.length > 0
      ? `Last version saved: ${savedVersions[0].name}`
      : "",
    effectiveDownloadsUsed > 0
      ? `${effectiveDownloadsUsed} resume download${effectiveDownloadsUsed === 1 ? "" : "s"} used`
      : "",
    effectiveOptimizationCreditsUsed > 0
      ? `${effectiveOptimizationCreditsUsed} optimization credit${effectiveOptimizationCreditsUsed === 1 ? "" : "s"} used`
      : "",
    result ? `Active document score: ${Math.round(result.score)}%` : "",
  ].filter(Boolean);

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
        fullName: "Jordan Taylor",
        professionalTitle: "Product Manager",
        email: "jordan@example.com",
        phone: "555-0100",
        location: "City, State",
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
    if (!authLoaded || !supabase || !authUser) {
      window.setTimeout(() => {
        setSubscriptionPlan("free");
        setSubscriptionStatus("free");
        setResumeDownloadCredits(0);
        setOptimizationCredits(0);
        setDownloadsUsed(0);
        setOptimizationCreditsUsed(0);
        setSavedVersionsCount(0);
      }, 0);
      return;
    }

    let cancelled = false;
    const activeSupabase = supabase;
    const activeUserId = authUser.id;

    async function loadSubscriptionProfile() {
      const { data, error } = await activeSupabase
        .from("profiles")
        .select(
          "subscription_plan, subscription_status, resume_download_credits, optimization_credits, downloads_used, optimization_credits_used, saved_versions_count",
        )
        .eq("id", activeUserId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        setSubscriptionPlan("free");
        setSubscriptionStatus("free");
        setResumeDownloadCredits(0);
        setOptimizationCredits(0);
        setDownloadsUsed(0);
        setOptimizationCreditsUsed(0);
        setSavedVersionsCount(0);
        return;
      }

      setSubscriptionPlan(normalizeSubscriptionPlan(data?.subscription_plan));
      setSubscriptionStatus(data?.subscription_status || "free");
      setResumeDownloadCredits(data?.resume_download_credits ?? 0);
      setOptimizationCredits(data?.optimization_credits ?? 0);
      setDownloadsUsed(data?.downloads_used ?? 0);
      setOptimizationCreditsUsed(data?.optimization_credits_used ?? 0);
      setSavedVersionsCount(data?.saved_versions_count ?? 0);
    }

    loadSubscriptionProfile();
    const refreshInterval = window.setInterval(loadSubscriptionProfile, 7000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [authLoaded, authUser, supabase]);

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

    if (isProPlan(subscriptionPlan)) {
      return true;
    }

    if (subscriptionPlan === "plus") {
      if (resumeDownloadCredits > 0) {
        return true;
      }

      setSystemStatus("You have used your Plus downloads. Upgrade to Pro for unlimited downloads.");
      return false;
    }

    if (effectiveDownloadsUsed < 1) {
      return true;
    }

    setSystemStatus("Starter includes 1 free resume download. Upgrade to Plus or Pro for more downloads.");
    return false;
  }

  function requireOptimizationAccess(label: string) {
    if (isProPlan(subscriptionPlan)) {
      return true;
    }

    if (subscriptionPlan === "plus") {
      if (optimizationCredits > 0) {
        return true;
      }

      setSystemStatus("You have used your Plus optimization credits. Upgrade to Pro for unlimited optimization.");
      return false;
    }

    setSystemStatus(`${label} is locked on Starter. Upgrade to Plus or Pro to unlock AI optimization.`);
    return false;
  }

  function openOutputTab(tab: OutputTab) {
    if (tab === "cover" && !requireSubscriptionFeature("coverLetter", "Cover letters")) {
      return;
    }

    if (tab === "linkedin" && !requireSubscriptionFeature("linkedinProfile", "LinkedIn profiles")) {
      return;
    }

    if (tab === "application" && !requireSubscriptionFeature("applicationKit", "Application kits")) {
      return;
    }

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
        ...(typeof next.downloadsUsed === "number" ? { downloads_used: next.downloadsUsed } : {}),
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
      const nextCredits = subscriptionPlan === "plus" ? Math.max(0, resumeDownloadCredits - 1) : resumeDownloadCredits;
      setDownloadsUsed(nextDownloadsUsed);
      setResumeDownloadCredits(nextCredits);
      syncProfileUsage({ downloadsUsed: nextDownloadsUsed, resumeDownloadCredits: nextCredits });
    }

    if (kind === "optimizationCreditsUsed") {
      const nextOptimizationUsed = optimizationCreditsUsed + 1;
      const nextCredits = subscriptionPlan === "plus" ? Math.max(0, optimizationCredits - 1) : optimizationCredits;
      setOptimizationCreditsUsed(nextOptimizationUsed);
      setOptimizationCredits(nextCredits);
      syncProfileUsage({
        optimizationCreditsUsed: nextOptimizationUsed,
        optimizationCredits: nextCredits,
      });
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
          ? "Plus includes up to 5 saved versions. Delete one or upgrade to Pro for unlimited history."
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
          ? "Plus includes up to 5 saved versions. Delete one or upgrade to Pro before duplicating."
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
    if (!requireOptimizationAccess("AI resume tailoring")) {
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
        throw new Error("AI tailoring is unavailable right now.");
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
        "AI tailoring could not complete, so I used a safe resume generation fallback and kept your draft editable.",
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

    const nextFiles = await Promise.all(Array.from(files).map(extractUploadedFile));

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

    if (nextFiles.some((file) => file.extractionStatus === "failed")) {
      setSystemStatus(
        "One or more files could not be fully extracted. Metadata was still saved for source tracking.",
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
            summary: structured.summary || current.summary,
            skills: structured.skills.length > 0 ? structured.skills : current.skills,
          }
        : current,
    );
  }

  function updateCoverLetter(value: string) {
    setResult((current) =>
      current
        ? {
            ...current,
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

    if (!result) {
      return;
    }

    try {
      const blob = await createResumePdfBlob(
        result.rewrittenResume,
        template,
        previewTheme,
        personalBranding,
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

    if (!result) {
      return;
    }

    try {
      const blob = await createResumeDocxBlob(
        result.rewrittenResume,
        template,
        previewTheme,
        personalBranding,
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
      current
        ? {
            ...current,
            linkedin: {
              ...current.linkedin,
              [field]: value,
            },
          }
        : current,
    );
  }

  function updateApplicationKit(field: keyof ApplicationKit, value: string) {
    setResult((current) =>
      current
        ? {
            ...current,
            applicationKit: {
              ...current.applicationKit,
              [field]: value,
            },
          }
        : current,
    );
  }

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="iseya-header">
        <div className="mx-auto flex max-w-[112rem] flex-col gap-5 px-5 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-5xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Image
                src="/brand/iseya-logo2.png"
                alt="ISEYA"
                width={280}
                height={140}
                priority
                className="h-auto w-[160px] object-contain sm:w-[240px] lg:w-[270px]"
              />
              <p className="border-l-0 border-[var(--iseya-gold)] text-sm font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)] sm:border-l sm:pl-4 sm:text-base">
                Beyond Resume. Positioning.
              </p>
            </div>
            <p className="mt-3 max-w-none text-base leading-7 text-white/85 lg:whitespace-nowrap">
              Iseya helps you tailor resumes, cover letters, LinkedIn profiles, and career application materials.
            </p>
          </div>
          <div className="flex max-w-2xl flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              {authUser ? (
                <button
                  type="button"
                  onClick={() =>
                    setAccountStatus(
                      `Signed in as ${authUser.email ?? "your ISEYA account"}.`,
                    )
                  }
                  className={`border border-white/40 bg-transparent text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] ${buttonBaseClass} ${buttonSizeMdClass}`}
                >
                  My Account
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`border border-white/40 bg-transparent text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] ${buttonBaseClass} ${buttonSizeMdClass}`}
                >
                  Login / Sign up
                </Link>
              )}
                <button
                  type="button"
                  onClick={openMyResumesPlaceholder}
                className={`border border-white/40 bg-transparent text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] ${buttonBaseClass} ${buttonSizeMdClass}`}
                >
                  My Resumes
                </button>
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
            </div>
            {accountStatus ? (
              <div className="rounded-md border border-white/15 bg-white/10 p-3 text-xs font-medium text-white/80">
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
        </div>
      </section>

      <section className="mx-auto max-w-[112rem] px-5 pt-6 sm:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                Workspace Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-3xl">
                Career document command center
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Track your plan, usage, saved resume versions, and document readiness from one workspace.
              </p>
            </div>
            <div className="rounded-full border border-[var(--iseya-gold)]/40 bg-[#FFF8E6] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-navy)]">
              {cloudSaveStatus || "Live workspace"}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniAnalyticsCard
              label="Active plan"
              value={currentPlanLabel}
              detail={currentSubscriptionStatusLabel}
            />
            <MiniAnalyticsCard
              label="Downloads used"
              value={String(effectiveDownloadsUsed)}
              detail={Number.isFinite(downloadLimit) ? `${downloadLimit} included` : "Unlimited"}
              progress={downloadProgressPercent}
            />
            <MiniAnalyticsCard
              label="Credits remaining"
              value={isProPlan(subscriptionPlan) ? "Unlimited" : String(optimizationCredits)}
              detail={Number.isFinite(optimizationLimit) ? `${effectiveOptimizationCreditsUsed} used` : "Unlimited optimization"}
              progress={optimizationProgressPercent}
            />
            <MiniAnalyticsCard
              label="Saved versions"
              value={String(activeSavedVersionsCount)}
              detail={Number.isFinite(savedVersionLimit) ? `${savedVersionLimit} max` : "Unlimited"}
              progress={savedVersionProgressPercent}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">
                Recent Activity
              </h2>
              {authLoading || (authUser && cloudSaveStatus.toLowerCase().includes("loading")) ? (
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-3/5 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
                </div>
              ) : dashboardActivity.length > 0 ? (
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                  {dashboardActivity.map((activity, index) => (
                    <li
                      key={`${activity}-${index}`}
                      className="rounded-lg border border-white bg-white p-3 shadow-sm"
                    >
                      {activity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
                  No recent activity yet. Tailor a resume, export a document, or save a version to start building your history.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">
                Optimization Usage
              </h2>
              {effectiveOptimizationCreditsUsed > 0 ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{effectiveOptimizationCreditsUsed} used</span>
                    <span>{Number.isFinite(optimizationLimit) ? `${optimizationLimit} included` : "Unlimited"}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-[var(--iseya-gold)] transition-all"
                      style={{ width: `${optimizationProgressPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
                  No optimization history yet. Use Tailor Resume or AI Actions to spend credits.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[112rem] gap-6 px-5 py-6 sm:px-8 lg:py-8 xl:grid-cols-[minmax(360px,0.92fr)_minmax(420px,1.08fr)]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition sm:p-6">
          <label
            htmlFor="master-resume"
            className="text-base font-semibold text-[var(--iseya-navy)]"
          >
            Master Resume
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Paste your source resume or start from the neutral starter draft.
          </p>
          <textarea
            id="master-resume"
            value={masterResume}
            onChange={(event) => setMasterResume(event.target.value)}
            className="mt-4 min-h-[360px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6] lg:min-h-[460px]"
            placeholder="Paste your master resume here..."
          />

          <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">
                  Personal Branding & Contact
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

          <div className="mt-4 border-t border-zinc-200 pt-4">
            <input
              ref={uploadInputRef}
              id="source-file-upload"
              type="file"
              multiple
              accept={acceptedSourceFileTypes}
              onChange={(event) => handleSourceFiles(event.target.files)}
              className="sr-only"
            />
            <label
              htmlFor="source-file-upload"
              className={`${secondaryButtonClass} ${buttonSizeMdClass} cursor-pointer`}
            >
              Upload Resume / Supporting Files
            </label>
	            <p className="mt-2 text-xs leading-5 text-zinc-500">
	              Accepts PDF, DOCX, TXT, PNG, JPG, and JPEG. TXT, DOCX, and
	              readable PDF files can be reviewed as source material; images are
	              saved for your workspace.
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

          <section className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
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

        <div className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <label
              htmlFor="target-role"
              className="text-sm font-semibold text-[var(--iseya-navy)]"
            >
              Target Role
            </label>
            <input
              id="target-role"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-4 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              placeholder="Example: AI Product Manager"
            />

            <label
              htmlFor="industry-target"
              className="mt-5 block text-sm font-semibold text-[var(--iseya-navy)]"
            >
              Industry Target
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

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

            <p className="mt-3 text-sm text-zinc-500">
              {templates[template].description}
              {isPremiumTemplate(template) && isStarterPlan(subscriptionPlan)
                ? " Premium preview locked on Starter."
                : ""}
            </p>
          </div>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
                AI Model Settings
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[var(--iseya-navy)]">
                  Model
                  <select
                    value={aiSettings.model}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        model: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                  </select>
                </label>
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

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className={`mb-5 rounded-xl border p-5 shadow-sm ${subscriptionCardTone}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                      Subscription
                    </p>
                    <span className="rounded-full border border-[var(--iseya-gold)]/50 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--iseya-navy)]">
                      Active Plan
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-[var(--iseya-navy)]">
                    {currentPlanLabel}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-[var(--iseya-navy)] px-3 py-1 text-white">
                      {currentSubscriptionStatusLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                      {subscriptionRenewalLabel}
                    </span>
                  </div>
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
              {subscriptionPlan === "free" ? (
                <div className="mt-5 border-t border-[var(--iseya-gold)]/30 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-navy)]">
                    Allowance
                  </p>
                  <ul className="mt-2 space-y-1 text-xs font-medium text-slate-700">
                    <li>✓ 1 free resume download included</li>
                    <li>✓ Basic resume editing available</li>
                    <li>✓ Neutral starter workspace available</li>
                  </ul>
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    Upgrade for LinkedIn optimization, cover letters, saved versions, and more downloads.
                  </p>
                </div>
              ) : (
                <div className="mt-5 border-t border-[var(--iseya-gold)]/30 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-navy)]">
                    Available Credits
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/70 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Downloads remaining
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[var(--iseya-navy)]">
                        {isProPlan(subscriptionPlan) ? "Unlimited" : resumeDownloadCredits}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/70 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Optimization credits remaining
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[var(--iseya-navy)]">
                        {isProPlan(subscriptionPlan) ? "Unlimited" : optimizationCredits}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Billing history coming soon.
              </p>
            </div>
            <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">Usage</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Optimization credits used
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {effectiveOptimizationCreditsUsed}
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-[var(--iseya-gold)]"
                    style={{ width: `${optimizationProgressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  {Number.isFinite(optimizationLimit) ? `${optimizationLimit} included` : "Unlimited"}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Resume downloads used
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {effectiveDownloadsUsed}
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-[var(--iseya-gold)]"
                    style={{ width: `${downloadProgressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  {Number.isFinite(downloadLimit) ? `${downloadLimit} included` : "Unlimited"}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Saved versions
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {activeSavedVersionsCount}
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-[var(--iseya-gold)]"
                    style={{ width: `${savedVersionProgressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  {Number.isFinite(savedVersionLimit)
                    ? `${savedVersionLimit} included`
                    : "Unlimited"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Your activity and saved versions are managed in your workspace.
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <details open>
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

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <label
              htmlFor="job-description"
              className="block text-sm font-semibold text-[var(--iseya-navy)]"
            >
              Job Description
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="mt-3 min-h-[300px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
              placeholder="Paste the job description here..."
            />
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

      {result ? (
        <section className="mx-auto max-w-[118rem] px-4 pb-10 sm:px-6 xl:px-8">
          <div className="sticky top-0 z-30 mb-5 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--iseya-gold)]">
                  AI Workspace
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {cloudSaveStatus ||
                    "Autosaved in your workspace. Editing updates the active document immediately."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["resume", "Resume"],
                  ["cover", "Cover Letter"],
                  ["linkedin", "LinkedIn"],
                  ["application", "Application Kit"],
                  ["preview", "Preview"],
                ].map(([id, label]) => {
                  const locked =
                    (id === "cover" && !canUseSubscriptionFeature(subscriptionPlan, "coverLetter")) ||
                    (id === "linkedin" && !canUseSubscriptionFeature(subscriptionPlan, "linkedinProfile")) ||
                    (id === "application" && !canUseSubscriptionFeature(subscriptionPlan, "applicationKit"));

                  return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => openOutputTab(id as OutputTab)}
                    className={`${buttonBaseClass} ${buttonSizeMdClass} ${
                      activeOutput === id
                        ? "border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
                        : "border border-[var(--iseya-border)] bg-[var(--iseya-white)] text-[var(--iseya-navy)] hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]"
                    }`}
                  >
                    {locked ? "🔒 " : ""}{label}
                  </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setActiveOutput("resume")}
                  className={`${secondaryButtonClass} ${buttonSizeMdClass}`}
                >
                  Edit Resume
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
                      Resume PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadResumeDocx)}
                      className={`${menuItemClass} text-sm`}
                    >
                      Resume DOCX
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadCoverLetterPdf)}
                      className={`${menuItemClass} text-sm`}
                    >
                      Cover Letter PDF
                    </button>
	                    <button
	                      type="button"
	                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadCoverLetterDocx)}
                      className={`${menuItemClass} text-sm`}
                    >
	                      Cover Letter DOCX
	                    </button>
	                    <button
	                      type="button"
	                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadCoverLetterTxt)}
	                      className={`${menuItemClass} text-sm`}
	                    >
	                      Cover Letter TXT
	                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadLinkedInKitPdf)}
                      className={`${menuItemClass} text-sm`}
                    >
                      LinkedIn Kit PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadLinkedInKitDocx)}
                      className={`${menuItemClass} text-sm`}
                    >
                      LinkedIn Kit DOCX
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadApplicationKitPdf)}
                      className={`${menuItemClass} text-sm`}
                    >
                      Application Kit PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => runWithFeedback("exportMenu", "Exporting...", "Exported", downloadApplicationKitDocx)}
                      className={`${menuItemClass} text-sm`}
                    >
                      Application Kit DOCX
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

	          <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[370px_minmax(0,1fr)]">
	            <aside className="order-2 lg:order-1">
	              <div className="space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto lg:pr-1">
                <CompactAiSidebar result={result} />
                <AdvancedIntelligencePanel
                  analysis={result.advancedAnalysis}
                  onReplaceBullet={replaceBulletWithVersion}
                />
              </div>
            </aside>

	            <section className="order-1 min-w-0 rounded-2xl border border-slate-200 bg-slate-100/70 p-4 shadow-sm lg:order-2">
	              <div className="mx-auto max-w-6xl">
                {activeOutput === "resume" ? (
                  <DocumentFrame title="Editable Resume" subtitle="Section editor">
                    <WeakBulletEditor
                      bullets={result.coach.weakBullets}
                      onApply={rewriteSuggestedBullet}
                    />
	                    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
	                      <div id="resume-editor" className="min-w-0 scroll-mt-28 xl:max-h-[calc(100vh-9rem)] xl:overflow-auto xl:pr-1">
                        <ModularResumeEditor
                          resumeText={result.rewrittenResume}
                          resetSourceText={masterResume}
                          masterResume={masterResume}
                          jobDescription={jobDescription}
                          targetRole={targetRole}
                          industryTarget={industryTarget}
                          uploadedFiles={uploadedFiles}
                          aiSettings={aiSettings}
                          personalBranding={personalBranding}
                          onPersonalBrandingChange={updatePersonalBranding}
                          onProfileImage={handleProfileImage}
                          onResumeTextChange={updateResumeOutput}
                          canUseAiOptimization={
                            isProPlan(subscriptionPlan) ||
                            (subscriptionPlan === "plus" && optimizationCredits > 0)
                          }
                          onUpgradeRequired={() =>
                            requireOptimizationAccess("AI section optimization")
                          }
                          onOptimizationUsed={() => trackUsage("optimizationCreditsUsed")}
                        />
                      </div>
                      <div
	                        id="resume-preview"
	                        className={`min-w-0 scroll-mt-28 xl:sticky xl:top-24 xl:max-h-[calc(100vh-9rem)] xl:self-start xl:overflow-auto xl:pr-1 ${
                            isPremiumTemplate(template) && isStarterPlan(subscriptionPlan)
                              ? "blur-[1.5px]"
                              : ""
                          }`}
	                      >
                        <ResumePreview
                          resumeText={result.rewrittenResume}
                          theme={previewTheme}
                          template={template}
                          branding={personalBranding}
                        />
                      </div>
                    </div>
                  </DocumentFrame>
	                ) : activeOutput === "cover" ? (
	                  <DocumentFrame title="Cover Letter" subtitle="Editable letter">
	                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          runWithFeedback("coverPanelGenerate", "Generating...", "Done", generateCoverLetter)
                        }
                        className={`${primaryButtonClass} ${buttonSizeSmClass}`}
                      >
	                        {actionFeedback.coverPanelGenerate ?? "Generate Cover Letter"}
	                      </button>
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
                    </div>
                    <textarea
                      value={result.coverLetter}
                      onChange={(event) => updateCoverLetter(event.target.value)}
                      className="min-h-[640px] w-full resize-y rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                    />
                  </DocumentFrame>
                ) : activeOutput === "linkedin" ? (
                  <DocumentFrame title="LinkedIn Optimizer" subtitle="Profile kit">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          runWithFeedback("linkedinPanelGenerate", "Generating...", "Done", generateLinkedInProfile)
                        }
                        className={`${primaryButtonClass} ${buttonSizeSmClass}`}
                      >
                        {actionFeedback.linkedinPanelGenerate ?? "Generate LinkedIn Profile"}
                      </button>
                      <CopyTextButton label="Copy Headline" text={result.linkedin.headline} />
                      <CopyTextButton label="Copy About" text={result.linkedin.about} />
                      <CopyTextButton
                        label="Copy Recruiter Message"
                        text={result.linkedin.recruiterOutreachMessage}
                      />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <EditableField label="LinkedIn Headline" value={result.linkedin.headline} onChange={(value) => updateLinkedIn("headline", value)} />
                      <EditableField label="Open-To-Work Positioning" value={result.linkedin.openToWorkPositioning} onChange={(value) => updateLinkedIn("openToWorkPositioning", value)} />
                      <EditableField label="LinkedIn About Section" value={result.linkedin.about} onChange={(value) => updateLinkedIn("about", value)} tall />
                      <EditableField label="Featured Projects Summary" value={result.linkedin.featuredProjects} onChange={(value) => updateLinkedIn("featuredProjects", value)} tall />
                      <EditableField label="Top Skills List" value={result.linkedin.topSkills.join(", ")} onChange={(value) => updateLinkedIn("topSkills", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                      <EditableField label="Recruiter Keyword List" value={result.linkedin.recruiterKeywords.join(", ")} onChange={(value) => updateLinkedIn("recruiterKeywords", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                      <EditableField label="Short Networking Message" value={result.linkedin.networkingMessage} onChange={(value) => updateLinkedIn("networkingMessage", value)} />
                      <EditableField label="Recruiter Outreach Message" value={result.linkedin.recruiterOutreachMessage} onChange={(value) => updateLinkedIn("recruiterOutreachMessage", value)} />
                    </div>
                  </DocumentFrame>
                ) : activeOutput === "preview" ? (
                  <DocumentFrame title="Resume Preview" subtitle="Download layout">
                    <div className="rounded-2xl bg-slate-200/70 px-3 py-6 sm:px-6 lg:px-10">
                      <ResumePreview
                        resumeText={result.rewrittenResume}
                        theme={previewTheme}
                        template={template}
                        branding={personalBranding}
                        fullPage
                      />
                    </div>
                  </DocumentFrame>
                ) : (
                  <DocumentFrame title="Application Kit" subtitle="Outreach package">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <EditableField label="Short Recruiter Email" value={result.applicationKit.recruiterEmail} onChange={(value) => updateApplicationKit("recruiterEmail", value)} copy />
                      <EditableField label="Follow-Up Email" value={result.applicationKit.followUpEmail} onChange={(value) => updateApplicationKit("followUpEmail", value)} copy />
                      <EditableField label="Referral Request Message" value={result.applicationKit.referralRequest} onChange={(value) => updateApplicationKit("referralRequest", value)} copy />
                      <EditableField label="LinkedIn Connection Request" value={result.applicationKit.connectionRequest} onChange={(value) => updateApplicationKit("connectionRequest", value)} copy />
                      <EditableField label="Interview Introduction Pitch" value={result.applicationKit.interviewIntroPitch} onChange={(value) => updateApplicationKit("interviewIntroPitch", value)} copy />
                      <EditableField label="30-Second Tell Me About Yourself" value={result.applicationKit.tellMeAboutYourself} onChange={(value) => updateApplicationKit("tellMeAboutYourself", value)} copy />
                    </div>
                  </DocumentFrame>
                )}
              </div>
            </section>

          </div>
        </section>
      ) : null}
      <IseyaFooter />
    </main>
  );
}

function IseyaFooter() {
  const footerLinks = [
    ["About", "/about"],
    ["Privacy Policy", "/privacy"],
    ["Terms of Use", "/terms"],
    ["Contact", "/contact"],
  ];

  return (
    <footer className="border-t border-[color-mix(in_srgb,var(--iseya-gold)_28%,var(--iseya-navy))] bg-[var(--iseya-navy)] text-white">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-5 px-5 py-6 text-center sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <div className="flex flex-col items-center gap-2 lg:items-start">
          <Image
            src="/brand/iseya-logo.png"
            alt="ISEYA"
            width={180}
            height={90}
            className="h-auto w-[120px] object-contain sm:w-[160px] lg:w-[180px]"
          />
          <p className="text-sm font-medium text-white/85">
            AI-powered career positioning by Jormp LLC.
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            California, USA
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 lg:items-end">
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-2 lg:justify-end">
            {footerLinks.map(([label, href]) => {
              const isExternal = href.startsWith("http");

              return (
                <a
                  key={label}
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="text-sm font-semibold text-white/85 transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]"
                >
                  {label}
                </a>
              );
            })}
          </nav>
          <p className="text-xs text-white/65">
            © 2026 Jormp LLC. All rights reserved.
          </p>
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
}: {
  label: string;
  value: string;
  detail: string;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 truncate text-2xl font-semibold text-[var(--iseya-navy)]">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
      {typeof progress === "number" ? (
        <div className="mt-3 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-[var(--iseya-gold)] transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tall?: boolean;
  copy?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-[var(--iseya-navy)]">{label}</h4>
        {copy ? <CopyTextButton label="Copy" text={value} /> : null}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-3 w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6] ${
          tall ? "min-h-56" : "min-h-32"
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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
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
  canUseAiOptimization: boolean;
  onUpgradeRequired: () => boolean;
  onOptimizationUsed: () => void;
}) {
  const [optimizingKey, setOptimizingKey] = useState("");
  const [optimizationStatus, setOptimizationStatus] = useState("");
  const [draftExperiences, setDraftExperiences] = useState<ExperienceEntry[]>([]);
  const [draftBulletsByExperience, setDraftBulletsByExperience] = useState<Record<string, string[]>>({});
  const structured = structuredResumeFromText(resumeText);
  const resetStructured = structuredResumeFromText(resetSourceText);
  const displayedExperience = [...structured.experience, ...draftExperiences];

  function commit(next: StructuredResume) {
    onResumeTextChange(serializeStructuredResume(next, personalBranding));
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
      setOptimizationStatus("AI section optimization is prepared for ISEYA Pro.");
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

  function updateListField(field: keyof Pick<StructuredResume, "projects" | "education" | "certifications" | "publications" | "tools">, value: string) {
    commit({
      ...structured,
      [field]: splitResumeList(value),
    });
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
    commit({
      ...structured,
      [field]: resetStructured[field],
    });
  }

  async function applySummaryAiAction(action: AiOptimizationAction) {
    const optimized = await optimizeWithBackend({
      key: `summary-${action}`,
      action,
      sectionName: "Professional Summary",
      sectionText: structured.summary,
    });

    if (optimized) {
      commit({ ...structured, summary: optimized.replace(/\n+/g, " ") });
    }
  }

  async function applySkillsAiAction(action: AiOptimizationAction) {
    const optimized = await optimizeWithBackend({
      key: `skills-${action}`,
      action,
      sectionName: "Core Skills",
      sectionText: structured.skills.join(", "),
    });

    if (optimized) {
      commit({ ...structured, skills: splitResumeList(optimized) });
    }
  }

  async function applyListAiAction(
    field: keyof Pick<
      StructuredResume,
      "projects" | "education" | "certifications" | "publications" | "tools"
    >,
    title: string,
    action: AiOptimizationAction,
  ) {
    const optimized = await optimizeWithBackend({
      key: `${field}-${action}`,
      action,
      sectionName: title,
      sectionText: formatSectionText(structured[field]),
    });

    if (optimized) {
      commit({ ...structured, [field]: splitResumeList(optimized) });
    }
  }

  async function applyExperienceAiAction(action: AiOptimizationAction) {
    const optimized = await optimizeWithBackend({
      key: `experience-${action}`,
      action,
      sectionName: "Professional Experience",
      sectionText: structured.experience
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
          ...entry.bullets,
        ])
        .filter(Boolean)
        .join("\n"),
    });

    if (optimized) {
      commit({
        ...structured,
      experience: [
          {
            id: "experience-0",
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            bullets: optimized
              .split(/\r?\n/)
              .map((line) => line.replace(/^[-*]\s+/, "").trim())
              .filter(Boolean),
          },
        ],
      });
    }
  }

  async function applySingleExperienceAiAction(
    entryIndex: number,
    action: AiOptimizationAction,
  ) {
    const entry = displayedExperience[entryIndex];

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
        ...entry.bullets,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (optimized) {
      updateExperience(entryIndex, {
        bullets: optimized
          .split(/\r?\n/)
          .map((line) => line.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean),
      });
    }
  }

  async function applyBulletAiAction(
    entryIndex: number,
    bulletIndex: number,
    action: AiOptimizationAction,
  ) {
    const entry = displayedExperience[entryIndex];
    const bullet = entry?.bullets[bulletIndex] || "";
    const optimized = await optimizeWithBackend({
      key: `bullet-${entryIndex}-${bulletIndex}-${action}`,
      action,
      sectionName: "Experience Achievement",
      sectionText: bullet,
    });

    if (optimized) {
      updateExperienceBullet(
        entryIndex,
        bulletIndex,
        optimized.split(/\r?\n/).filter(Boolean)[0] || optimized,
      );
    }
  }

  async function applyAdditionalSectionAiAction(
    sectionIndex: number,
    action: AiOptimizationAction,
  ) {
    const section = structured.additionalSections[sectionIndex];

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

  function updateExperience(index: number, patch: Partial<ExperienceEntry>) {
    if (index >= structured.experience.length) {
      const draftIndex = index - structured.experience.length;
      const nextDrafts = draftExperiences.map((entry, entryIndex) =>
        entryIndex === draftIndex ? { ...entry, ...patch } : entry,
      );
      const updatedDraft = nextDrafts[draftIndex];
      const normalized = normalizeExperience(updatedDraft, index);

      if (normalized) {
        commit({
          ...structured,
          experience: dedupeExperience([...structured.experience, normalized]),
        });
        setDraftExperiences((current) =>
          current.filter((_, entryIndex) => entryIndex !== draftIndex),
        );
        return;
      }

      setDraftExperiences(nextDrafts);
      return;
    }

    commit({
      ...structured,
      experience: dedupeExperience(
        structured.experience
          .map((entry, entryIndex) =>
            entryIndex === index ? { ...entry, ...patch } : entry,
          )
          .map((entry, entryIndex) => normalizeExperience(entry, entryIndex))
          .filter((entry): entry is ExperienceEntry => Boolean(entry)),
      ),
    });
  }

  function removeExperience(index: number) {
    const entry = displayedExperience[index];

    if (index >= structured.experience.length) {
      const draftIndex = index - structured.experience.length;
      setDraftExperiences((current) =>
        current.filter((_, entryIndex) => entryIndex !== draftIndex),
      );
      if (entry) {
        setDraftBulletsByExperience((current) => {
          const next = { ...current };
          delete next[entry.id];
          return next;
        });
      }
      return;
    }

    commit({
      ...structured,
      experience: structured.experience.filter((_, entryIndex) => entryIndex !== index),
    });
    if (entry) {
      setDraftBulletsByExperience((current) => {
        const next = { ...current };
        delete next[entry.id];
        return next;
      });
    }
  }

  function updateExperienceBullet(entryIndex: number, bulletIndex: number, value: string) {
    const entry = displayedExperience[entryIndex];

    if (!entry) {
      return;
    }

    if (bulletIndex >= entry.bullets.length) {
      const draftIndex = bulletIndex - entry.bullets.length;
      const drafts = draftBulletsByExperience[entry.id] ?? [];
      const nextDrafts = drafts.map((bullet, index) =>
        index === draftIndex ? value : bullet,
      );

      if (!nextDrafts[draftIndex]) {
        nextDrafts[draftIndex] = value;
      }

      if (cleanEditorText(value)) {
        updateExperience(entryIndex, {
          bullets: [...entry.bullets, value],
        });
        setDraftBulletsByExperience((current) => ({
          ...current,
          [entry.id]: nextDrafts.filter((_, index) => index !== draftIndex),
        }));
        return;
      }

      setDraftBulletsByExperience((current) => ({
        ...current,
        [entry.id]: nextDrafts,
      }));
      return;
    }

    updateExperience(entryIndex, {
      bullets: entry.bullets.map((bullet, index) =>
        index === bulletIndex ? value : bullet,
      ),
    });
  }

  function removeExperienceBullet(entryIndex: number, bulletIndex: number) {
    const entry = displayedExperience[entryIndex];

    if (!entry) {
      return;
    }

    if (bulletIndex >= entry.bullets.length) {
      const draftIndex = bulletIndex - entry.bullets.length;
      setDraftBulletsByExperience((current) => ({
        ...current,
        [entry.id]: (current[entry.id] ?? []).filter((_, index) => index !== draftIndex),
      }));
      return;
    }

    updateExperience(entryIndex, {
      bullets: entry.bullets.filter((_, index) => index !== bulletIndex),
    });
  }

  function updateAdditionalSection(
    sectionIndex: number,
    patch: Partial<ResumeSection>,
  ) {
    commit({
      ...structured,
      additionalSections: structured.additionalSections.map((section, index) =>
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
              Continuous AI Optimization
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
                onResumeTextChange(optimized);
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

      <ModularSection
        title="Professional Summary"
        onOptimize={() => applySummaryAiAction("Optimize Summary")}
        onReset={() => resetSection("summary")}
        onAiAction={applySummaryAiAction}
        isOptimizing={optimizingKey.startsWith("summary-")}
      >
        <textarea
          value={structured.summary}
          onChange={(event) =>
            commit({ ...structured, summary: event.target.value })
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
          value={structured.skills.join(", ")}
          onChange={(event) =>
            commit({ ...structured, skills: splitResumeList(event.target.value) })
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
	              {displayedExperience.length > 0
	                ? "Edit each role directly. Changes update the preview and exports immediately."
	                : "No experience added yet. Add your first role."}
	            </p>
	            <FeedbackButton
	              doneLabel="Added"
	              onClick={() =>
	                setDraftExperiences((current) => [
	                  ...current,
	                  createEmptyExperience(current.length + structured.experience.length),
	                ])
	              }
	              className={`${primaryButtonClass} ${buttonSizeSmClass}`}
	            >
	              Add Experience
	            </FeedbackButton>
	          </div>
	          {displayedExperience.map((entry, entryIndex) => (
	            <div
	              key={`${entry.id}-${entryIndex}`}
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
	                        resetStructured.experience[entryIndex] ?? createEmptyExperience(entryIndex),
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
	                {[...entry.bullets, ...(draftBulletsByExperience[entry.id] ?? [])].map((bullet, bulletIndex) => (
	                  <div
	                    key={`${entry.id}-achievement-${bulletIndex}`}
                    className="rounded-lg border border-slate-200 bg-white p-2"
                  >
                    <textarea
                      value={bullet}
                      onChange={(event) =>
                        updateExperienceBullet(
                          entryIndex,
                          bulletIndex,
                          event.target.value,
                        )
                      }
                      className="min-h-20 w-full resize-y rounded-md border border-slate-200 bg-white p-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-4 focus:ring-[#FFF8E6]"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <EditorActionButton onClick={() => applyBulletAiAction(entryIndex, bulletIndex, "Rewrite Bullet")}>
                        Improve
                      </EditorActionButton>
                      <EditorActionButton
                        onClick={() => removeExperienceBullet(entryIndex, bulletIndex)}
                        variant="danger"
                      >
                        Remove
                      </EditorActionButton>
                    </div>
                  </div>
                ))}
	                <FeedbackButton
	                  doneLabel="Added"
	                  onClick={() =>
	                    setDraftBulletsByExperience((current) => ({
	                      ...current,
	                      [entry.id]: [...(current[entry.id] ?? []), ""],
	                    }))
	                  }
	                  className={`${primaryButtonClass} ${buttonSizeSmClass}`}
	                >
	                  Add Achievement
	                </FeedbackButton>
              </div>
            </div>
          ))}
	        </div>
      </ModularSection>

      <ModularListSection title="AI & Automation Projects" value={structured.projects.join("\n")} onChange={(value) => updateListField("projects", value)} onOptimize={() => applyListAiAction("projects", "AI & Automation Projects", "Optimize this section")} onReset={() => resetSection("projects")} onAiAction={(action) => applyListAiAction("projects", "AI & Automation Projects", action)} isOptimizing={optimizingKey.startsWith("projects-")} />
      <ModularListSection title="Education" value={structured.education.join("\n")} onChange={(value) => updateListField("education", value)} onOptimize={() => applyListAiAction("education", "Education", "Optimize this section")} onReset={() => resetSection("education")} onAiAction={(action) => applyListAiAction("education", "Education", action)} isOptimizing={optimizingKey.startsWith("education-")} />
      <ModularListSection title="Certifications" value={structured.certifications.join("\n")} onChange={(value) => updateListField("certifications", value)} onOptimize={() => applyListAiAction("certifications", "Certifications", "Optimize this section")} onReset={() => resetSection("certifications")} onAiAction={(action) => applyListAiAction("certifications", "Certifications", action)} isOptimizing={optimizingKey.startsWith("certifications-")} />
      <ModularListSection title="Publications / Research" value={structured.publications.join("\n")} onChange={(value) => updateListField("publications", value)} onOptimize={() => applyListAiAction("publications", "Publications / Research", "Optimize this section")} onReset={() => resetSection("publications")} onAiAction={(action) => applyListAiAction("publications", "Publications / Research", action)} isOptimizing={optimizingKey.startsWith("publications-")} />
      <ModularListSection title="Tools / Technologies" value={structured.tools.join(", ")} onChange={(value) => updateListField("tools", value)} onOptimize={() => applyListAiAction("tools", "Tools / Technologies", "Optimize this section")} onReset={() => resetSection("tools")} onAiAction={(action) => applyListAiAction("tools", "Tools / Technologies", action)} isOptimizing={optimizingKey.startsWith("tools-")} />

      <ModularSection
        title="Optional Additional Sections"
        onOptimize={() => applyAdditionalSectionAiAction(0, "Optimize this section")}
        onAiAction={(action) => applyAdditionalSectionAiAction(0, action)}
        onReset={() =>
          commit({
            ...structured,
            additionalSections: resetStructured.additionalSections,
          })
        }
        isOptimizing={optimizingKey.startsWith("additional-")}
      >
        <div className="space-y-3">
          {structured.additionalSections.map((section, sectionIndex) => (
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
                    body: event.target.value
                      .split(/\r?\n/)
                      .map(cleanEditorText)
                      .filter(Boolean),
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
              commit({
                ...structured,
                additionalSections: [
                  ...structured.additionalSections,
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
        {isOptimizing ? "Optimizing..." : "AI Actions"}
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
    <div className="space-y-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          ATS Scores
        </p>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-semibold tracking-tight text-[var(--iseya-navy)]">
            {Math.round(score)}
          </span>
          <span className="pb-1 text-sm font-semibold text-slate-500">/100</span>
        </div>
        <div className="mt-3 grid gap-2">
          <ScoreBar label="ATS readiness" score={breakdown.atsReadability} />
          <ScoreBar label="Role fit" score={breakdown.roleFit} />
          <ScoreBar label="Metrics" score={breakdown.metricStrength} />
        </div>
      </section>

      <details open className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
          Recruiter Simulation
        </summary>
        <div className="mt-3 space-y-2">
          <ScoreBar label="ATS screen" score={simulation.atsScreening.score} />
          <ScoreBar label="Recruiter" score={simulation.recruiterReview.score} />
          <ScoreBar label="Hiring manager" score={simulation.hiringManagerReview.score} />
        </div>
      </details>

      <details open className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
          Quick Critique
        </summary>
        <CoachInlineList items={quickCritiques} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {sectionCritiques.map(([title, items], sectionIndex) => (
            <details
              key={`${title}-${sectionIndex}`}
              className="rounded-md border border-slate-200 bg-slate-50 p-2"
            >
              <summary className="cursor-pointer list-none">
                <p className="text-xs font-semibold text-[var(--iseya-navy)]">{title}</p>
                <p className="mt-1 truncate text-[11px] leading-4 text-slate-500">
                  {safeStringArray(items)[0] || "No detail yet."}
                </p>
              </summary>
              <CoachInlineList items={items} />
            </details>
          ))}
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
          Resume Integrity
        </summary>
        <CoachInlineList items={safeStringArray(result.riskFlags).map(userFacingGuidance)} />
      </details>

      <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-[var(--iseya-navy)]">
        Career Intelligence
      </h2>
      <div className="mt-4 space-y-3">
        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            AI Interview Prep
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

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
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

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
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

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            AI Achievement Improvement Engine
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

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--iseya-navy)]">
            AI Suggestions
          </summary>
          <CoachBlock title="Smart Suggestions" items={analysis.aiSuggestions} />
        </details>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const safeScoreValue = clampPercent(score, 0);

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className="font-semibold text-zinc-950">{safeScoreValue}/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-zinc-200">
        <div
          className="h-2 rounded-full bg-[var(--iseya-gold)]"
          style={{ width: `${safeScoreValue}%` }}
        />
      </div>
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
  const orderedSections = orderedResumeSections(resume.sections, template);
  const bodyClassByFamily: Record<TemplateFamily, string> = {
    ats: fullPage ? "space-y-3 px-10 py-8" : "space-y-4 p-6",
    executive: fullPage ? "space-y-6 px-12 py-10" : "space-y-7 p-8",
    consulting: fullPage ? "space-y-4 px-11 py-9" : "space-y-5 p-7",
    academic: fullPage ? "space-y-4 px-12 py-9" : "space-y-5 p-7",
    finance: fullPage ? "space-y-4 px-11 py-9" : "space-y-5 p-7",
    healthcare: fullPage ? "space-y-4 px-11 py-9" : "space-y-5 p-7",
    creative: fullPage ? "space-y-5 px-10 py-9" : "space-y-6 p-7",
    legal: fullPage ? "space-y-4 px-12 py-9" : "space-y-5 p-7",
    product: fullPage ? "space-y-5 px-11 py-9" : "space-y-6 p-7",
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
    creative: `border-b border-zinc-200 border-l-8 bg-white ${fullPage ? "px-10 py-8" : "px-7 py-6"} text-zinc-950 ${theme.accentBorder}`,
    legal: `border-y-4 bg-white ${fullPage ? "px-12 py-7" : "px-7 py-5"} font-serif text-zinc-950 ${theme.accentBorder}`,
    product: `border-b border-zinc-200 border-l-4 bg-white ${fullPage ? "px-10 py-7" : "px-6 py-5"} text-zinc-950 ${theme.accentBorder}`,
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
    executive: "break-inside-avoid rounded-sm border-l-4 border-zinc-100 pl-4",
    consulting: "break-inside-avoid border border-zinc-100 p-3",
    academic: "break-inside-avoid font-serif",
    finance: "break-inside-avoid border-l-4 border-zinc-100 pl-4",
    healthcare: "break-inside-avoid rounded-md border border-zinc-100 bg-zinc-50/40 p-3",
    creative: "break-inside-avoid rounded-lg border border-zinc-100 p-3",
    legal: "break-inside-avoid font-serif",
    product: "break-inside-avoid border-l-2 border-zinc-100 pl-4",
    technical: "break-inside-avoid border-l-2 border-zinc-100 pl-4",
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
      className={`mx-auto rounded-xl border border-slate-200 bg-white text-zinc-850 shadow-sm ${
        fullPage
          ? "min-h-[11in] w-full max-w-[8.5in] overflow-hidden print:shadow-none"
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
                className={`mt-3 text-xs leading-5 ${
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
            {section.body.length > 0 ? (
              <div className="mt-3 space-y-2">
                {section.body.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${paragraph}-${paragraphIndex}`}
                    className="text-sm leading-7 text-zinc-700"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            {section.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
	                {section.bullets.map((bullet, bulletIndex) => (
	                  <li key={`${bullet}-${bulletIndex}`}>
	                    {cleanExportBullet(bullet)}
	                  </li>
	                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
