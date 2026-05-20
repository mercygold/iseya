"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { isSupabaseBrowserConfigured } from "@/lib/supabaseClient";

type TemplateId =
  | "executive-navy"
  | "modern-product"
  | "ats-clean"
  | "consulting-classic"
  | "tech-minimal"
  | "bold-leadership";
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
  dates: string;
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

type UsageStats = {
  date: string;
  aiGenerations: number;
  exportsCreated: number;
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
const hasSupabaseConfig = isSupabaseBrowserConfigured();
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

const sampleResume = `ANU MERCYGOLD JOSHUA
Technical Product Manager | IT Project Manager

SUMMARY
Senior IT Project Manager and Technical Product Manager with 8+ years of experience across SaaS, fintech, AI/ML, enterprise platforms, and digital transformation. Skilled in product strategy, Agile delivery, stakeholder management, analytics, CRM, API integrations, and growth systems.

EXPERIENCE
Principal Product Manager / IT Project Lead - Jormp LLC
- Led digital platform and automation projects for SMB, SaaS, and service-based clients.
- Managed product requirements, stakeholder communication, QA, implementation, and launch.
- Built growth systems involving analytics, attribution, websites, CRM, and automation workflows.

Technical Product Owner - Investofly
- Developed AI-powered investment assistant and equity crowdfunding product concepts.
- Translated business goals into product requirements, user journeys, and delivery milestones.

Product Manager - Japaul Gold & Ventures PLC
- Supported blockchain/fintech product initiative connected to a $20M+ capital raise.
- Coordinated stakeholders across technical, business, and executive teams.

EDUCATION
M.S. Innovation & Entrepreneurship - University of California, Irvine
B.Tech. Transport Management & Technology - Federal University of Technology, Akure

CERTIFICATIONS
Advanced Certified ScrumMaster, Google Project Management Certificate, AI Product Development, AI Ethics`;

const sampleJob = `AI Product Manager

We are looking for an AI Product Manager to lead the development of AI-powered workflow automation products. The ideal candidate has experience with SaaS products, Agile delivery, stakeholder management, analytics, customer discovery, roadmap planning, API integrations, and cross-functional collaboration. Experience with LLMs, prompt engineering, responsible AI, product metrics, and enterprise software is preferred.`;

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

const templates: Record<TemplateId, { label: string; description: string }> = {
  "executive-navy": {
    label: "Executive Navy",
    description: "Formal preview with a strong navy header and classic spacing.",
  },
  "modern-product": {
    label: "Modern Product",
    description: "Product-focused preview with clean section rhythm.",
  },
  "ats-clean": {
    label: "ATS Clean",
    description: "Minimal preview optimized for straightforward scanning.",
  },
  "consulting-classic": {
    label: "Consulting Classic",
    description: "Traditional consulting-style preview with crisp section rules.",
  },
  "tech-minimal": {
    label: "Tech Minimal",
    description: "Lean technical preview with compact spacing and clear hierarchy.",
  },
  "bold-leadership": {
    label: "Bold Leadership",
    description: "High-impact preview with a stronger leadership-oriented header.",
  },
};

function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && value in templates;
}

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in previewThemes;
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
  const candidateName = firstMeaningfulLine(resumeText, "Candidate Name");
  const role = titleCase(
    targetRole || firstMeaningfulLine(jobDescription, "Target Role"),
  );
  const resumeKeywords = extractKeywords(resumeText);
  const jobKeywords = extractKeywords(jobDescription);
  const alignedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const primaryStrengths =
    alignedKeywords.slice(0, 5).join(", ") ||
    resumeKeywords.slice(0, 5).join(", ") ||
    "product leadership, stakeholder alignment, and technical delivery";
  const impactLine =
    findResumeLine(resumeText, [
      /\$?\d[\d,.]*\+?%?/,
      /\b(led|launched|built|delivered|improved|managed|automated|coordinated)\b/i,
    ]) ??
    "I have led cross-functional work from requirements through delivery, aligning business goals with practical implementation.";
  const jobFocus =
    firstMeaningfulLine(jobDescription, role).replace(/[.。]\s*$/, "");

  return `Dear Hiring Team,

I am writing to express my interest in the ${role} role. Your need for ${jobFocus} aligns closely with my background in ${primaryStrengths}.

${impactLine} This experience has strengthened my ability to turn ambiguous business needs into clear priorities, collaborate with technical and non-technical stakeholders, and deliver work that is ready for launch and iteration.

I would welcome the opportunity to bring this mix of product judgment, execution discipline, and practical technical fluency to your team.

Sincerely,
${candidateName}`;
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
      strongerVersion: `${base}, clarifying ownership, scope, and outcome with source-backed detail.`,
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
        "Prioritize bullets with action, scope, and verified outcome.",
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
        : ["Prioritize bullets that show action, scope, and measurable outcome."],
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
          ? "This bullet would be stronger with a supported outcome, scope, or measurable result."
          : "This bullet can lead with impact more clearly.",
        strongerVersion: line
          .replace(/^responsible for\s+/i, "Owned ")
          .replace(/^helped\s+/i, "Contributed to ")
          .replace(/^worked on\s+/i, "Advanced ")
          .replace(/^assisted\s+/i, "Supported ")
          .replace(/^handled\s+/i, "Managed ")
          .replace(/^participated in\s+/i, "Collaborated on ")
          .replace(/\.$/, "") +
          (lacksMetric
            ? ", clarifying scope, stakeholders, and outcome using only verified source details."
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
  const tailoredResume = response.tailoredResume || "";
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
  const candidateName = firstMeaningfulLine(masterResume, "Candidate Name");
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
      "Position the candidate as a practical technical product leader who can translate business needs into delivery-ready product work.",
    improvementNotes: [
      "Add quantified outcomes where the source resume supports them.",
      "Keep role-specific keywords in the summary, skills, and experience sections.",
      "Make each bullet show action, scope, and business impact.",
    ],
    riskFlags:
      missingKeywords.length > 0
        ? [
            `Only include ${missingKeywords.slice(0, 3).join(", ")} if supported by real experience.`,
          ]
        : ["No major unsupported-claim risks detected from the provided text."],
    topStrengths: matchedKeywords.slice(0, 6),
    gapsToFix: missingKeywords.slice(0, 6),
    bulletImprovementSuggestions: [
      "Convert responsibility bullets into outcome bullets with scope, metric, or launch result.",
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

function parseExperienceLine(line: string) {
  const cleaned = cleanEditorText(line);
  const [left, ...dateParts] = cleaned.split(/\s+[|–-]\s+/);
  const dates = dateParts.join(" - ").trim();
  const atMatch = left.match(/^(.+?)\s+at\s+(.+)$/i);
  const dashParts = left.split(/\s+-\s+/);

  if (atMatch) {
    return {
      title: atMatch[1].trim(),
      company: atMatch[2].trim(),
      dates,
    };
  }

  if (dashParts.length >= 2) {
    return {
      title: dashParts[0].trim(),
      company: dashParts.slice(1).join(" - ").trim(),
      dates,
    };
  }

  return {
    title: cleaned,
    company: "",
    dates,
  };
}

function parseExperienceEntries(section?: ResumeSection): ExperienceEntry[] {
  if (!section) {
    return [];
  }

  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | null = null;

  for (const line of section.body) {
    const parsed = parseExperienceLine(line);

    current = {
      id: `experience-${entries.length}`,
      title: parsed.title || "Experience",
      company: parsed.company,
      location: "",
      dates: parsed.dates,
      bullets: [],
    };
    entries.push(current);
  }

  if (!current) {
    current = {
      id: "experience-0",
      title: section.heading.includes("HIGHLIGHT")
        ? "Experience Highlights"
        : "Professional Experience",
      company: "",
      location: "",
      dates: "",
      bullets: [],
    };
    entries.push(current);
  }

  current.bullets = section.bullets.map(cleanEditorText).filter(Boolean);

  return entries;
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

  const experience = structured.experience.filter(
    (entry) =>
      cleanEditorText(entry.title) ||
      cleanEditorText(entry.company) ||
      entry.bullets.some((bullet) => cleanEditorText(bullet)),
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
      const metaLine = [cleanEditorText(entry.location), cleanEditorText(entry.dates)]
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
  return Boolean(
    imageDataUrl &&
      template !== "ats-clean" &&
      template !== "tech-minimal",
  );
}

function fileNameForRole(targetRole: string, extension: "pdf" | "docx") {
  const roleSlug =
    targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "tailored-resume";

  return `${roleSlug}.${extension}`;
}

function coverLetterFileName(targetRole: string, extension: "pdf" | "docx") {
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
        warnings: ["Used browser TXT fallback because backend extraction was unavailable."],
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
  const isAts = template === "ats-clean";
  const hasHeaderBand =
    template === "executive-navy" || template === "bold-leadership";
  const isModern =
    template === "modern-product" || template === "tech-minimal";
  const pagePadding = template === "tech-minimal" || isAts ? 32 : 40;
  const styles = StyleSheet.create({
    page: {
      padding: pagePadding,
      color: theme.textHex,
      fontFamily: "Helvetica",
      fontSize: isAts ? 9.5 : 10,
      lineHeight: 1.45,
    },
    header: {
      backgroundColor: hasHeaderBand ? theme.headerHex : "#ffffff",
      borderBottomColor: theme.accentHex,
      borderBottomWidth: hasHeaderBand ? 0 : 2,
      marginBottom: 18,
      padding: hasHeaderBand ? 16 : 0,
    },
    name: {
      color: hasHeaderBand ? "#ffffff" : theme.textHex,
      fontSize: template === "bold-leadership" ? 24 : 20,
      fontWeight: 700,
      marginBottom: 4,
    },
    title: {
      color: hasHeaderBand ? "#e5e7eb" : theme.accentHex,
      fontSize: 10,
      fontWeight: 600,
    },
    contact: {
      color: hasHeaderBand ? "#e5e7eb" : theme.textHex,
      fontSize: 8.5,
      marginTop: 5,
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
      borderLeftWidth: isModern ? 2 : 0,
      marginBottom: isAts ? 10 : 13,
      paddingLeft: isModern ? 8 : 0,
    },
    heading: {
      borderBottomColor: theme.accentHex,
      borderBottomWidth: 1,
      color: theme.accentHex,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 0.8,
      marginBottom: 6,
      paddingBottom: 3,
      textTransform: "uppercase",
    },
    paragraph: {
      marginBottom: 4,
    },
    bullet: {
      marginBottom: 3,
      paddingLeft: 8,
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
                          `${item}${itemIndex < contactLines.length - 1 ? " | " : ""}`,
                        )
                      : `${item}${itemIndex < contactLines.length - 1 ? " | " : ""}`,
                  ),
                )
              : null,
          ),
        ),
      ),
      ...resume.sections.map((section, sectionIndex) =>
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
              `- ${bullet}`,
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
  const hasHeaderBand =
    template === "executive-navy" || template === "bold-leadership";
  const isModern =
    template === "modern-product" || template === "tech-minimal";
  const accentColor = stripHash(theme.accentHex);
  const headerColor = stripHash(theme.headerHex);
  const textColor = stripHash(theme.textHex);
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
          size: template === "bold-leadership" ? 34 : 30,
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
      spacing: { after: 260 },
      children: [
        new TextRun({
          text: contact.title,
          bold: true,
          color: hasHeaderBand ? "FFFFFF" : accentColor,
          size: 21,
        }),
      ],
    }),
  ];

  if (contactLines.length > 0) {
    const contactRuns = contactLines.flatMap((item, itemIndex) => {
      const suffix =
        itemIndex < contactLines.length - 1
          ? [new TextRun({ text: " | ", color: textColor, size: 18 })]
          : [];

      if (isUrlLike(item)) {
        return [
          new ExternalHyperlink({
            link: normalizeUrl(item),
            children: [
              new TextRun({
                text: item,
                color: accentColor,
                size: 18,
                underline: {},
              }),
            ],
          }),
          ...suffix,
        ];
      }

      return [new TextRun({ text: item, color: textColor, size: 18 }), ...suffix];
    });

    children.push(
      new Paragraph({
        spacing: { after: 220 },
        children: contactRuns,
      }),
    );
  }

  for (const section of resume.sections) {
    children.push(
      new Paragraph({
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            color: accentColor,
            size: isModern ? 8 : 6,
            space: 1,
          },
        },
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            color: accentColor,
            size: 19,
          }),
        ],
      }),
    );

    for (const paragraph of section.body) {
      children.push(
        new Paragraph({
          spacing: { after: 90 },
          children: [new TextRun({ text: paragraph, color: textColor, size: 21 })],
        }),
      );
    }

    for (const bullet of section.bullets) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 70 },
          children: [new TextRun({ text: bullet, color: textColor, size: 21 })],
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
  const hasHeaderBand =
    template === "executive-navy" || template === "bold-leadership";
  const isModern =
    template === "modern-product" || template === "tech-minimal";
  const isAts = template === "ats-clean";
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const styles = StyleSheet.create({
    page: {
      padding: isAts || template === "tech-minimal" ? 42 : 48,
      color: theme.textHex,
      fontFamily: "Helvetica",
      fontSize: 10.5,
      lineHeight: 1.55,
    },
    header: {
      backgroundColor: hasHeaderBand ? theme.headerHex : "#ffffff",
      borderBottomColor: theme.accentHex,
      borderBottomWidth: hasHeaderBand ? 0 : 2,
      marginBottom: 22,
      padding: hasHeaderBand ? 16 : 0,
    },
    name: {
      color: hasHeaderBand ? "#ffffff" : theme.textHex,
      fontSize: template === "bold-leadership" ? 24 : 21,
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
  const hasHeaderBand =
    template === "executive-navy" || template === "bold-leadership";
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
          size: template === "bold-leadership" ? 34 : 30,
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
  const [targetRole, setTargetRole] = useState("AI Product Manager");
  const [personalBranding, setPersonalBranding] = useState<PersonalBranding>(() =>
    brandingFromResumeText(sampleResume),
  );
  const [industryTarget, setIndustryTarget] =
    useState<IndustryTarget>("AI / Technology");
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
  const [coverCopyStatus, setCoverCopyStatus] = useState("Copy Cover Letter");
  const [activeOutput, setActiveOutput] = useState<OutputTab>("resume");
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const previewTheme = previewThemes[theme];

  useEffect(() => {
    window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);

        if (saved) {
          const parsed = JSON.parse(saved) as Partial<SavedState>;
          setMasterResume(parsed.masterResume ?? sampleResume);
          setPersonalBranding(
            parsed.personalBranding
              ? normalizePersonalBranding(parsed.personalBranding)
              : brandingFromResumeText(parsed.masterResume ?? sampleResume),
          );
          setJobDescription(parsed.jobDescription ?? sampleJob);
          setTargetRole(parsed.targetRole ?? "AI Product Manager");
          setIndustryTarget(
            isIndustryTarget(parsed.industryTarget)
              ? parsed.industryTarget
              : "AI / Technology",
          );
          setTemplate(
            isTemplateId(parsed.template)
              ? parsed.template
              : "executive-navy",
          );
          setTheme(isThemeId(parsed.theme) ? parsed.theme : "deep-navy");
          setAiSettings({
            ...defaultAiSettings,
            ...(parsed.aiSettings ?? {}),
            positioningMode: positioningModes.includes(
              parsed.aiSettings?.positioningMode ?? defaultAiSettings.positioningMode,
            )
              ? parsed.aiSettings?.positioningMode ?? defaultAiSettings.positioningMode
              : defaultAiSettings.positioningMode,
          });
          setResult(
            ensureTailoringResult(
              parsed.result ?? null,
              isIndustryTarget(parsed.industryTarget)
                ? parsed.industryTarget
                : "AI / Technology",
              parsed.aiSettings?.positioningMode ?? defaultAiSettings.positioningMode,
            ),
          );
          setUploadedFiles(parsed.uploadedFiles ?? []);
        }

        const savedVersionData = window.localStorage.getItem(versionStorageKey);

        if (savedVersionData) {
          const parsedVersions = JSON.parse(savedVersionData) as Array<
            Partial<SavedResumeVersion>
          >;
          const normalizedVersions = parsedVersions
            .map(normalizeSavedVersion)
            .filter((version): version is SavedResumeVersion => Boolean(version));

          setSavedVersions(normalizedVersions);
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
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const savedState: SavedState = {
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
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(versionStorageKey, JSON.stringify(savedVersions));
    } catch {
      // Keep the in-memory version list active even if browser storage rejects it.
    }
  }, [hydrated, savedVersions]);

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

  function trackUsage(kind: "aiGenerations" | "exportsCreated") {
    setUsageStats((current) => {
      const normalized =
        current.date === usageDateKey() ? current : defaultUsageStats();

      return {
        ...normalized,
        [kind]: normalized[kind] + 1,
      };
    });
  }

  function handleAccountPlaceholder(action: "Sign in" | "Sign up" | "Sign out") {
    setAccountStatus(
      hasSupabaseConfig
        ? `${action} is ready for Supabase Auth wiring in the next phase.`
        : `${action} will be enabled after Supabase environment variables are configured.`,
    );
  }

  function openMyResumesPlaceholder() {
    setAccountStatus(
      hasSupabaseConfig
        ? "My Resumes cloud sync is prepared. Local saved versions are still active in this phase."
        : "My Resumes is using local saved versions until Supabase is configured.",
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

  function saveCurrentVersion() {
    const snapshot = currentVersionSnapshot();

    if (!snapshot) {
      setVersionStatus("Tailor a resume before saving a version.");
      return;
    }

    setSavedVersions((current) => [snapshot, ...current]);
    setSelectedVersionId(snapshot.id);
    setVersionStatus("Current resume version saved.");
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
    setCoverCopyStatus("Copy Cover Letter");
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
      trackUsage("aiGenerations");
    } catch {
      setTailorError(
        "AI tailoring could not complete. This can happen when the API key is missing or the AI service is unavailable, so I used the local resume generator fallback.",
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
      trackUsage("aiGenerations");
    } finally {
      setIsTailoring(false);
    }
  }

  function generateCoverLetter() {
    setCoverCopyStatus("Copy Cover Letter");
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
    trackUsage("aiGenerations");
  }

  function generateLinkedInProfile() {
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
    trackUsage("aiGenerations");
  }

  function resetSavedResume() {
    skipNextSave.current = true;
    window.localStorage.removeItem(storageKey);
    setMasterResume(sampleResume);
    setPersonalBranding(brandingFromResumeText(sampleResume));
    setJobDescription(sampleJob);
    setTargetRole("AI Product Manager");
    setIndustryTarget("AI / Technology");
    setTemplate("executive-navy");
    setTheme("deep-navy");
    setResult(null);
    setTailorError("");
    setUploadedFiles([]);
    setPreviewSourceFileId("");
    setActiveOutput("resume");
    setCoverCopyStatus("Copy Cover Letter");
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

  async function copyCoverLetter() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.coverLetter);
      setCoverCopyStatus("Copied");
      window.setTimeout(() => setCoverCopyStatus("Copy Cover Letter"), 1500);
    } catch {
      setCoverCopyStatus("Copy failed");
      window.setTimeout(() => setCoverCopyStatus("Copy Cover Letter"), 1500);
    }
  }

  async function downloadCoverLetterPdf() {
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

  async function downloadResumePdf() {
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
    <main className="min-h-screen bg-[#f7f8fa] text-zinc-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[112rem] flex-col gap-7 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              ISEYA
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              AI career documents, tailored for the role.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              Iseya helps you tailor resumes, cover letters, LinkedIn profiles,
              and application kits with AI.
            </p>
          </div>
          <div className="flex max-w-2xl flex-col gap-3">
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => handleAccountPlaceholder("Sign in")}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Login / Sign up
              </button>
                <button
                  type="button"
                  onClick={openMyResumesPlaceholder}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  My Resumes
                </button>
            </div>
            {accountStatus ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
                {accountStatus}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
            <button
              type="button"
              onClick={resetSavedResume}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Reset Saved Resume
            </button>
            <button
              type="button"
              onClick={generateCoverLetter}
              disabled={!canTailor}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              Generate Cover Letter
            </button>
            <button
              type="button"
              onClick={generateLinkedInProfile}
              disabled={!canTailor}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              Generate LinkedIn Profile
            </button>
            <button
              type="button"
              onClick={tailorResume}
              disabled={!canTailor || isTailoring}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {isTailoring ? "AI is tailoring your resume..." : "Tailor Resume"}
            </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[112rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(360px,0.92fr)_minmax(420px,1.08fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="master-resume"
            className="text-sm font-semibold text-zinc-900"
          >
            Master Resume
          </label>
          <textarea
            id="master-resume"
            value={masterResume}
            onChange={(event) => setMasterResume(event.target.value)}
            className="mt-3 min-h-[420px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="Paste your master resume here..."
          />

          <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Personal Branding & Contact
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These fields control the resume preview and exports without
                  inserting placeholder values.
                </p>
              </div>
              {personalBranding.profileImageDataUrl ? (
                <button
                  type="button"
                  onClick={() => updatePersonalBranding("profileImageDataUrl", "")}
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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
              <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
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
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Upload Resume / Supporting Files
            </label>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Accepts PDF, DOCX, TXT, PNG, JPG, and JPEG. TXT, DOCX, and
              readable PDF files are extracted now; images are saved as source
              metadata until OCR is connected.
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
                        <p className="text-sm font-semibold text-zinc-900">
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
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                        >
                          Preview Extracted Text
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSourceFile(file.id)}
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                        >
                          Remove
                        </button>
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
            <h2 className="text-sm font-semibold text-zinc-900">
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
                          <button
                            type="button"
                            onClick={() => removeSourceFile(file.id)}
                            className="inline-flex min-h-8 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Remove
                          </button>
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
              className="text-sm font-semibold text-zinc-900"
            >
              Target Role
            </label>
            <input
              id="target-role"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-4 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              placeholder="Example: AI Product Manager"
            />

            <label
              htmlFor="industry-target"
              className="mt-5 block text-sm font-semibold text-zinc-900"
            >
              Industry Target
            </label>
            <select
              id="industry-target"
              value={industryTarget}
              onChange={(event) =>
                setIndustryTarget(event.target.value as IndustryTarget)
              }
              className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            >
              {industryTargets.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-zinc-900">
                Template
                <select
                  value={template}
                  onChange={(event) => setTemplate(event.target.value as TemplateId)}
                  className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                >
                  {Object.entries(templates).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-zinc-900">
                Theme
                <select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as ThemeId)}
                  className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
            </p>
          </div>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                AI Model Settings
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-zinc-900">
                  Model
                  <select
                    value={aiSettings.model}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        model: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-zinc-900">
                  Positioning Mode
                  <select
                    value={aiSettings.positioningMode}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        positioningMode: event.target.value as PositioningMode,
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  >
                    {positioningModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-zinc-900">
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
                <label className="text-sm font-semibold text-zinc-900">
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
                <label className="text-sm font-semibold text-zinc-900">
                  Tone Style
                  <select
                    value={aiSettings.toneStyle}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        toneStyle: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="Executive concise">Executive concise</option>
                    <option value="Technical precise">Technical precise</option>
                    <option value="Consulting polished">Consulting polished</option>
                    <option value="Academic evidence-based">
                      Academic evidence-based
                    </option>
                  </select>
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold text-zinc-900">
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
            <h2 className="text-sm font-semibold text-zinc-900">Usage</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  AI generations used today
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {usageStats.aiGenerations}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Exports created
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {usageStats.exportsCreated}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Saved versions
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {savedVersions.length}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Usage is tracked locally for now and can be moved to Supabase
              usage events when accounts are enabled.
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <details open>
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                Saved Resume Versions
              </summary>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveCurrentVersion}
                    disabled={!result}
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    Save Current Version
                  </button>
                  <button
                    type="button"
                    onClick={() => loadVersion(selectedVersion)}
                    disabled={!selectedVersion}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    Load Version
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateVersion(selectedVersion)}
                    disabled={!selectedVersion}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    Duplicate Version
                  </button>
                  <button
                    type="button"
                    onClick={() => renameVersion(selectedVersion)}
                    disabled={!selectedVersion}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    Rename Version
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteVersion(selectedVersion)}
                    disabled={!selectedVersion}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    Delete Version
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectedVersion
                        ? toggleCompareVersion(selectedVersion.id)
                        : setVersionStatus("Select a saved version to compare.")
                    }
                    disabled={!selectedVersion}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    Compare Versions
                  </button>
                </div>

                {versionStatus ? (
                  <p className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs font-medium text-zinc-700">
                    {versionStatus}
                  </p>
                ) : null}

                {savedVersions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="max-h-80 space-y-2 overflow-auto pr-1">
                      {savedVersions.map((version, versionIndex) => (
                        <div
                          key={`${version.id}-${versionIndex}`}
                          className={`block cursor-pointer rounded-md border p-3 transition ${
                            selectedVersionId === version.id
                              ? "border-teal-300 bg-teal-50"
                              : "border-zinc-200 bg-zinc-50 hover:bg-white"
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
                              <p className="truncate text-sm font-semibold text-zinc-900">
                                {version.name}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-zinc-600">
                                {version.targetRole} |{" "}
                                {readableIndustryName(version.industryTarget)}
                                {version.companyName
                                  ? ` | ${version.companyName}`
                                  : ""}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Score {Math.round(version.matchScore)}% |{" "}
                                {templates[version.template].label} |{" "}
                                {version.theme
                                  .split("-")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() + word.slice(1),
                                  )
                                  .join(" ")}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Created {formatVersionDate(version.createdAt)} |
                                Updated {formatVersionDate(version.updatedAt)}
                              </p>
                              <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
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
                              <p className="text-sm font-semibold text-zinc-900">
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
              className="block text-sm font-semibold text-zinc-900"
            >
              Job Description
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="mt-3 min-h-[300px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
                <h2 className="text-base font-semibold text-slate-950">
                  AI Workspace
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Autosaved locally · Editing updates the active document immediately
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["resume", "Resume"],
                  ["cover", "Cover Letter"],
                  ["linkedin", "LinkedIn"],
                  ["application", "Application Kit"],
                  ["preview", "Preview"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setActiveOutput(id as OutputTab)
                    }
                    className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                      activeOutput === id
                        ? "bg-slate-950 text-white hover:bg-slate-800"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveOutput("resume")}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit Resume
                </button>
                <details className="relative">
                  <summary className="inline-flex min-h-10 cursor-pointer list-none items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
                    Export
                  </summary>
                  <div className="absolute right-0 z-30 mt-2 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                    <button
                      type="button"
                      onClick={downloadResumePdf}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Resume PDF
                    </button>
                    <button
                      type="button"
                      onClick={downloadResumeDocx}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Resume DOCX
                    </button>
                    <button
                      type="button"
                      onClick={downloadCoverLetterPdf}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cover Letter PDF
                    </button>
                    <button
                      type="button"
                      onClick={downloadCoverLetterDocx}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cover Letter DOCX
                    </button>
                    <button
                      type="button"
                      onClick={downloadLinkedInKitPdf}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      LinkedIn Kit PDF
                    </button>
                    <button
                      type="button"
                      onClick={downloadLinkedInKitDocx}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      LinkedIn Kit DOCX
                    </button>
                    <button
                      type="button"
                      onClick={downloadApplicationKitPdf}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Application Kit PDF
                    </button>
                    <button
                      type="button"
                      onClick={downloadApplicationKitDocx}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Application Kit DOCX
                    </button>
                  </div>
                </details>
                <button
                  type="button"
                  onClick={saveCurrentVersion}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Save Version
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[370px_minmax(0,1fr)]">
            <aside className="order-2 lg:order-1">
              <div className="space-y-3 lg:sticky lg:top-24">
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
                      <div id="resume-editor" className="min-w-0 scroll-mt-28">
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
                        />
                      </div>
                      <div
                        id="resume-preview"
                        className="min-w-0 scroll-mt-28 xl:sticky xl:top-24 xl:self-start"
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
                        onClick={generateCoverLetter}
                        className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Generate Cover Letter
                      </button>
                      <button
                        type="button"
                        onClick={copyCoverLetter}
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {coverCopyStatus}
                      </button>
                    </div>
                    <textarea
                      value={result.coverLetter}
                      onChange={(event) => updateCoverLetter(event.target.value)}
                      className="min-h-[640px] w-full resize-y rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                    />
                  </DocumentFrame>
                ) : activeOutput === "linkedin" ? (
                  <DocumentFrame title="LinkedIn Optimizer" subtitle="Profile kit">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={generateLinkedInProfile}
                        className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Generate LinkedIn Profile
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
    </main>
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
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
    >
      {status}
    </button>
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
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
        <h4 className="text-sm font-semibold text-zinc-900">{label}</h4>
        {copy ? <CopyTextButton label="Copy" text={value} /> : null}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-3 w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 ${
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
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            {subtitle}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          Autosaved
        </span>
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
}) {
  const [optimizingKey, setOptimizingKey] = useState("");
  const [optimizationStatus, setOptimizationStatus] = useState("");
  const structured = structuredResumeFromText(resumeText);
  const resetStructured = structuredResumeFromText(resetSourceText);

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
      return optimizedText;
    } catch {
      const fallback = optimizationFallbackText(cleaned, action);
      setOptimizationStatus(
        `${sectionName} updated with local fallback. Verify before use.`,
      );
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
          [entry.location, entry.dates].filter(Boolean).join(" | "),
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
            title: "Professional Experience",
            company: "",
            location: "",
            dates: "",
            bullets: optimized
              .split(/\r?\n/)
              .map((line) => line.replace(/^[-*]\s+/, "").trim())
              .filter(Boolean),
          },
        ],
      });
    }
  }

  async function applyBulletAiAction(
    entryIndex: number,
    bulletIndex: number,
    action: AiOptimizationAction,
  ) {
    const entry = structured.experience[entryIndex];
    const bullet = entry?.bullets[bulletIndex] || "";
    const optimized = await optimizeWithBackend({
      key: `bullet-${entryIndex}-${bulletIndex}-${action}`,
      action,
      sectionName: "Experience Bullet",
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
    commit({
      ...structured,
      experience: structured.experience.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    });
  }

  function updateExperienceBullet(entryIndex: number, bulletIndex: number, value: string) {
    const entry = structured.experience[entryIndex];

    if (!entry) {
      return;
    }

    updateExperience(entryIndex, {
      bullets: entry.bullets.map((bullet, index) =>
        index === bulletIndex ? value : bullet,
      ),
    });
  }

  function moveExperienceBullet(entryIndex: number, bulletIndex: number, direction: -1 | 1) {
    const entry = structured.experience[entryIndex];
    const nextIndex = bulletIndex + direction;

    if (!entry || nextIndex < 0 || nextIndex >= entry.bullets.length) {
      return;
    }

    const nextBullets = [...entry.bullets];
    const [movedBullet] = nextBullets.splice(bulletIndex, 1);
    nextBullets.splice(nextIndex, 0, movedBullet);
    updateExperience(entryIndex, { bullets: nextBullets });
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
      <section className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-950">
              Continuous AI Optimization
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Improve one section or bullet at a time. Inferred suggestions should be verified before use.
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
          <p className="mt-3 rounded-md border border-teal-100 bg-white px-3 py-2 text-xs font-medium text-slate-700">
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
          <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
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
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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
          className="min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
          className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
          {structured.experience.map((entry, entryIndex) => (
            <div
              key={`${entry.id}-${entryIndex}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ContactField label="Role / Title" value={entry.title} onChange={(value) => updateExperience(entryIndex, { title: value })} />
                <ContactField label="Company" value={entry.company} onChange={(value) => updateExperience(entryIndex, { company: value })} />
                <ContactField label="Location" value={entry.location} onChange={(value) => updateExperience(entryIndex, { location: value })} />
                <ContactField label="Dates" value={entry.dates} onChange={(value) => updateExperience(entryIndex, { dates: value })} />
              </div>
              <div className="mt-3 space-y-2">
                {entry.bullets.map((bullet, bulletIndex) => (
                  <div
                    key={`${entry.id}-bullet-${bulletIndex}`}
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
                      className="min-h-20 w-full resize-y rounded-md border border-slate-200 bg-white p-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <EditorActionButton onClick={() => applyBulletAiAction(entryIndex, bulletIndex, "Rewrite Bullet")}>
                        Rewrite Bullet
                      </EditorActionButton>
                      <EditorActionButton onClick={() => applyBulletAiAction(entryIndex, bulletIndex, "Strengthen Metrics")}>
                        Strengthen Metrics
                      </EditorActionButton>
                      <EditorActionButton onClick={() => applyBulletAiAction(entryIndex, bulletIndex, "Make More ATS-Friendly")}>
                        Make ATS-Friendly
                      </EditorActionButton>
                      <EditorActionButton onClick={() => moveExperienceBullet(entryIndex, bulletIndex, -1)}>
                        Move Up
                      </EditorActionButton>
                      <EditorActionButton onClick={() => moveExperienceBullet(entryIndex, bulletIndex, 1)}>
                        Move Down
                      </EditorActionButton>
                      <EditorActionButton
                        onClick={() =>
                          updateExperience(entryIndex, {
                            bullets: entry.bullets.filter((_, index) => index !== bulletIndex),
                          })
                        }
                      >
                        Delete Bullet
                      </EditorActionButton>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateExperience(entryIndex, {
                      bullets: [...entry.bullets, "Add a truthful impact bullet."],
                    })
                  }
                  className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Add Bullet
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              commit({
                ...structured,
                experience: [
                  ...structured.experience,
                  {
                    id: `experience-${structured.experience.length}`,
                    title: "",
                    company: "",
                    location: "",
                    dates: "",
                    bullets: [],
                  },
                ],
              })
            }
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Add Experience
          </button>
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
                className="mt-3 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <EditorActionButton onClick={() => applyAdditionalSectionAiAction(sectionIndex, "Optimize this section")}>
                  Optimize this section
                </EditorActionButton>
                <EditorActionButton onClick={() => applyAdditionalSectionAiAction(sectionIndex, "Rewrite this section")}>
                  Rewrite this section
                </EditorActionButton>
                <EditorActionButton onClick={() => applyAdditionalSectionAiAction(sectionIndex, "Improve for selected industry")}>
                  Improve for selected industry
                </EditorActionButton>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              commit({
                ...structured,
                additionalSections: [
                  ...structured.additionalSections,
                  { heading: "ADDITIONAL INFORMATION", body: [], bullets: [] },
                ],
              })
            }
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Add Section
          </button>
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
    <details open className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Autosaved
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onOptimize ? (
              <EditorActionButton onClick={onOptimize}>
                {isOptimizing ? "Optimizing..." : "Optimize this section"}
              </EditorActionButton>
            ) : null}
            {onAiAction ? (
              <>
                <EditorActionButton onClick={() => onAiAction("Rewrite this section")}>
                  Rewrite this section
                </EditorActionButton>
                <EditorActionButton onClick={() => onAiAction("Improve for selected industry")}>
                  Improve for selected industry
                </EditorActionButton>
              </>
            ) : null}
            {onReset ? (
              <EditorActionButton onClick={onReset}>Reset Section</EditorActionButton>
            ) : null}
          </div>
        </div>
      </summary>
      {onAiAction ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          {[
            "Make More Executive",
            "Make More Technical",
            "Make More ATS-Friendly",
            "Shorten",
            "Strengthen Metrics",
            "Tailor to Industry",
            "Improve Recruiter Readability",
          ].map((action, actionIndex) => (
            <EditorActionButton
              key={`${action}-${actionIndex}`}
              onClick={() => onAiAction(action as AiOptimizationAction)}
            >
              {action}
            </EditorActionButton>
          ))}
        </div>
      ) : null}
      <div className="mt-4">{children}</div>
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
        className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      />
    </ModularSection>
  );
}

function EditorActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
    >
      {children}
    </button>
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
          <span className="text-4xl font-semibold tracking-tight text-slate-950">
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
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Recruiter Simulation
        </summary>
        <div className="mt-3 space-y-2">
          <ScoreBar label="ATS screen" score={simulation.atsScreening.score} />
          <ScoreBar label="Recruiter" score={simulation.recruiterReview.score} />
          <ScoreBar label="Hiring manager" score={simulation.hiringManagerReview.score} />
        </div>
      </details>

      <details open className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
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
                <p className="text-xs font-semibold text-slate-900">{title}</p>
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
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Truth / Risk Flags
        </summary>
        <CoachInlineList items={safeStringArray(result.riskFlags)} />
      </details>

      <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
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
            Weak Bullet Detection
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
                Improved bullet
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {selectedBullet.issue}
              </p>
              <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-900">
                {selectedBullet.strongerVersion}
              </p>
              <button
                type="button"
                onClick={() => {
                  onApply(selectedBullet.original, selectedBullet.strongerVersion);
                  setSelectedIndex(null);
                }}
                className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Apply to Resume
              </button>
            </>
          ) : (
            <p className="text-sm leading-6 text-zinc-500">
              Select a weak bullet to preview the improved version.
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
        <li key={`${item}-${itemIndex}`}>{item}</li>
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
            <li key={`${item}-${itemIndex}`}>{item}</li>
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
      <h2 className="text-sm font-semibold text-slate-900">
        Advanced Intelligence
      </h2>
      <div className="mt-4 space-y-3">
        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
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
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
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
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
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
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
            AI Bullet Improvement Engine
          </summary>
          <div className="mt-3 space-y-3">
            {analysis.bulletImprovements.length > 0 ? (
              analysis.bulletImprovements.map((bullet, bulletIndex) => (
                <div
                  key={`${bullet.original}-${bulletIndex}`}
                  className="rounded-md border border-zinc-200 bg-white p-3"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Improve Bullet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Current: {bullet.original}
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
              <p className="text-sm text-zinc-500">No experience bullets detected yet.</p>
            )}
          </div>
        </details>

        <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
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
          className="h-2 rounded-full bg-teal-700"
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
      <button
        type="button"
        onClick={() => onReplaceBullet(original, value)}
        className="mt-3 inline-flex min-h-8 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100"
      >
        Replace Bullet
      </button>
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
  const isExecutive = template === "executive-navy";
  const isModern = template === "modern-product";
  const bodyClass =
    template === "ats-clean"
      ? fullPage
        ? "space-y-4 px-10 py-8"
        : "space-y-5 p-6"
      : isModern
        ? fullPage
          ? "space-y-5 px-11 py-9"
          : "space-y-6 p-7"
        : fullPage
          ? "space-y-5 px-11 py-9"
          : "space-y-6 p-7";
  const headerClass = isExecutive
    ? `border-b border-zinc-200 ${fullPage ? "px-11 py-8" : "px-7 py-6"} ${theme.headerBg} ${theme.headerText}`
    : isModern
      ? `border-b border-zinc-200 border-l-4 bg-white ${fullPage ? "px-10 py-7" : "px-6 py-5"} text-zinc-950 ${theme.accentBorder}`
      : `border-b border-zinc-200 bg-white ${fullPage ? "px-10 py-7" : "px-6 py-4"} text-zinc-950`;
  const subtitleClass = isExecutive
    ? `mt-1 text-sm font-medium ${theme.subheadText}`
    : "mt-1 text-sm font-medium text-zinc-500";

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
              <h4 className="text-2xl font-semibold tracking-tight">
                {contact.name}
              </h4>
            ) : null}
            {contact.title ? <p className={subtitleClass}>{contact.title}</p> : null}
            {contactItems.length > 0 ? (
              <p
                className={`mt-3 text-xs leading-5 ${
                  isExecutive ? theme.subheadText : "text-zinc-600"
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
        {resume.sections.map((section, sectionIndex) => (
          <section
            key={`${section.heading}-${sectionIndex}`}
            className={`${isModern ? "border-l-2 border-zinc-100 pl-4" : ""} break-inside-avoid`}
          >
            <h5
              className={`border-b pb-2 text-xs font-bold uppercase tracking-[0.16em] ${theme.accentText} ${theme.accentBorder}`}
            >
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
                  <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
