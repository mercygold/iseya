"use client";

import {
  Document as PdfDocument,
  Page as PdfPage,
  StyleSheet,
  Text as PdfText,
  View as PdfView,
  pdf,
} from "@react-pdf/renderer";
import {
  AlignmentType,
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import type { PDFPageProxy } from "pdfjs-dist";
import { type ReactNode, useEffect, useMemo, useState } from "react";

type ScoreBreakdown = {
  keywordMatch: number;
  roleAlignment: number;
  impactMetrics: number;
  atsReadability: number;
  structure: number;
  formattingRisk: number;
  academicFit: number;
  technicalFit: number;
  requiredKeywords: number;
  preferredKeywords: number;
  metricsImpact: number;
  aiProjectRelevance: number;
};

type TailoringIntelligence = {
  targetType: string;
  careerMode: string;
  sectionPriority: string[];
  templateRecommendation: string;
  requiredSkills: string[];
  preferredSkills: string[];
  institutionalFocus: string[];
  domainFocus: string[];
  leadershipExpectations: string[];
  technicalExpectations: string[];
  researchExpectations: string[];
  missingEvidence: string[];
  positioningAngle: string;
  suggestedImprovements: string[];
  warnings: string[];
};

type AtsSimulation = {
  warnings: string[];
  subScores: ScoreBreakdown;
};

type AchievementSuggestion = {
  original: string;
  category: AchievementSuggestionCategory;
  missing: string[];
  improved: string;
  metricPrompt: string;
};

type AchievementSuggestionCategory =
  | "Add Metric"
  | "Strengthen Action Verb"
  | "Clarify Scope"
  | "Add Result"
  | "Improve Role Alignment";

type TailoringResult = {
  score: number;
  rawScore?: number;
  scoreWarning?: string;
  scoreBreakdown: ScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  skills: string[];
  bullets: string[];
  rewrittenResume: string;
  intelligence: TailoringIntelligence;
  atsSimulation: AtsSimulation;
  achievementSuggestions: AchievementSuggestion[];
};

type ResumeScoreLabel = "Tailored Resume Score" | "Optimized Resume Score";
type ReadinessScore = ReturnType<typeof calculateReadinessScore>;
type ContactDisplayStyle = "labels" | "icons" | "minimal" | "centered";
type TemplateDensity = "compact" | "balanced" | "spacious";
type AtsRisk = "low" | "medium" | "high";

type ResumeSection = {
  heading: string;
  body: string[];
  bullets: string[];
};

type ParsedResume = ReturnType<typeof parseResumePreview>;
type ContactItem = {
  key: "email" | "phone" | "location" | "linkedIn" | "portfolio" | "website";
  label: string;
  value: string;
};

type EditableResume = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  portfolio: string;
  website: string;
  summary: string;
  coreSkills: string;
  experience: string;
  projects: string;
  research: string;
  education: string;
  certifications: string;
  publications: string;
  teaching: string;
  conferences: string;
  awards: string;
};

type CoverLetterTone =
  | "professional"
  | "warm-confident"
  | "executive"
  | "academic"
  | "legal-policy"
  | "concise";

type CoverLetterLength = "short" | "standard" | "detailed";

type CoverLetterState = {
  organizationName: string;
  contactName: string;
  targetTitle: string;
  tone: CoverLetterTone;
  length: CoverLetterLength;
  extraNotes: string;
  body: string;
  fileName: string;
};

type ActionState =
  | "tailor"
  | "optimize"
  | "cover-letter"
  | "apply-suggestion"
  | "apply-all"
  | "txt"
  | "pdf"
  | "docx"
  | "cover-txt"
  | "cover-pdf"
  | "cover-docx"
  | "save-version"
  | "restore-version";

type SavedResumeState = {
  masterResume: string;
  masterUploads: UploadedFileText[];
  jobDescription: string;
  targetRole: string;
  careerMode: CareerModeId;
  customCareerField: string;
  editableResume: EditableResume | null;
  selectedTemplate: TemplateId;
  selectedTheme: ThemeId;
  downloadFileName: string;
  coverLetter: CoverLetterState;
  outputScoreLabel: ResumeScoreLabel;
  contactDisplayStyle: ContactDisplayStyle;
};

type SavedVersion = {
  id: string;
  versionName: string;
  targetOrganization: string;
  targetRoleProgram: string;
  tailoredResume: string;
  uploadedFileTextSummary: string;
  targetDescription: string;
  careerModeLabel: string;
  coverLetter: string;
  companySchoolName: string;
  template: TemplateId;
  theme: ThemeId;
  dateCreated: string;
  templateUsed: TemplateId;
  colorThemeUsed: ThemeId;
  score: number;
  notes: string;
  state: SavedResumeState;
};

type UploadState = {
  fileName: string;
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

type TextExtractionResult = {
  text: string;
  method: "native" | "ocr" | "hybrid";
  confidence: "high" | "medium" | "low";
  warning?: string;
};

type UploadedFileText = {
  id: string;
  fileName: string;
  text: string;
  status: "loading" | "success" | "error";
  message: string;
};

type TemplateId = string;
type ThemeId = string;
type CareerModeId =
  | "general-professional"
  | "product-program-project"
  | "ai-data-technology"
  | "law-legal-policy"
  | "finance-investment-banking"
  | "healthcare-medical-public-health"
  | "academia-phd-research"
  | "consulting-strategy"
  | "operations-supply-chain"
  | "marketing-growth-communications"
  | "architecture-design-real-estate"
  | "engineering-technical"
  | "education-teaching"
  | "nonprofit-international-development"
  | "government-public-sector"
  | "creative-media-production"
  | "custom";

type TemplateDefinition = {
  id: TemplateId;
  label: string;
  category: string;
  bestFor: string;
  recommendedCareerModes: CareerModeId[];
  visualStyle: string;
  sectionOrder: string[];
  density: TemplateDensity;
  atsRisk: AtsRisk;
};

type CareerModeProfile = {
  id: CareerModeId;
  label: string;
  targetType: string;
  signals: string[];
  keywords: string[];
  actionVerbs: string[];
  sectionPriority: string[];
  suggestedLanguage: string[];
  achievementExamples: string[];
  templateRecommendation: TemplateId;
  positioningAngle: string;
};

const targetResumeTitle = "AI/ML Project Manager | Technical Program Lead";
const savedResumeKey = "resume-tailoring-agent:v3";
const savedVersionsKey = "resume-tailoring-agent:versions:v1";
const appBrand = {
  primary: "#10224C",
  accent: "#F28A00",
  light: "#F8FAFC",
  text: "#0F172A",
  border: "#D9E1EC",
  muted: "#64748B",
};
const editableResumeFields: Array<keyof EditableResume> = [
  "name",
  "title",
  "email",
  "phone",
  "location",
  "linkedIn",
  "portfolio",
  "website",
  "summary",
  "coreSkills",
  "experience",
  "projects",
  "research",
  "education",
  "certifications",
  "publications",
  "teaching",
  "conferences",
  "awards",
];

const templateCategoryNames = [
  "Corporate / ATS",
  "Technology / Product",
  "Finance / VC / Consulting",
  "Legal / Policy / Government",
  "Healthcare / Medical",
  "Creative / Media / Fashion",
  "Architecture / Real Estate / Design",
  "Manufacturing / Operations / Supply Chain",
  "Academic / Research",
];

const templates: TemplateDefinition[] = [
  { id: "ats-clean", label: "ATS Clean", category: "Corporate / ATS", bestFor: "high-volume applicant tracking systems", recommendedCareerModes: ["general-professional", "government-public-sector", "healthcare-medical-public-health"], visualStyle: "single-column, restrained, recruiter-first", sectionOrder: ["Summary", "Core Skills", "Professional Experience", "Projects", "Education", "Certifications"], density: "compact", atsRisk: "low" },
  { id: "classic-executive", label: "Classic Executive", category: "Corporate / ATS", bestFor: "senior operators and executives", recommendedCareerModes: ["general-professional", "consulting-strategy", "finance-investment-banking"], visualStyle: "formal header, strong dividers, executive tone", sectionOrder: ["Summary", "Leadership Skills", "Professional Experience", "Selected Impact", "Education", "Certifications"], density: "balanced", atsRisk: "low" },
  { id: "minimal-professional", label: "Minimal Professional", category: "Corporate / ATS", bestFor: "clean general applications", recommendedCareerModes: ["general-professional", "education-teaching", "nonprofit-international-development"], visualStyle: "quiet, spacious, highly readable", sectionOrder: ["Summary", "Skills", "Experience", "Projects", "Education", "Certifications"], density: "balanced", atsRisk: "low" },
  { id: "one-page-recruiter", label: "One-Page Recruiter", category: "Corporate / ATS", bestFor: "fast recruiter review", recommendedCareerModes: ["general-professional", "product-program-project", "operations-supply-chain"], visualStyle: "compact hierarchy with tight section rhythm", sectionOrder: ["Summary", "Skills", "Experience", "Selected Projects", "Education"], density: "compact", atsRisk: "low" },
  { id: "product-leadership", label: "Product Leadership", category: "Technology / Product", bestFor: "product owners, PMs, and product leaders", recommendedCareerModes: ["product-program-project", "marketing-growth-communications"], visualStyle: "modern leadership header, product impact sections", sectionOrder: ["Professional Summary", "Product Skills", "Product Experience", "Launches / Projects", "Education", "Certifications"], density: "balanced", atsRisk: "low" },
  { id: "technical-program", label: "Technical Program", category: "Technology / Product", bestFor: "TPM, delivery governance, and platform roles", recommendedCareerModes: ["product-program-project", "ai-data-technology", "engineering-technical"], visualStyle: "structured delivery, clear project evidence", sectionOrder: ["Technical Summary", "Technical Skills", "Program Experience", "Technology Projects", "Education", "Certifications"], density: "compact", atsRisk: "low" },
  { id: "ai-data-professional", label: "AI/Data Professional", category: "Technology / Product", bestFor: "AI, data, analytics, and automation roles", recommendedCareerModes: ["ai-data-technology", "engineering-technical"], visualStyle: "technical polish with skills-forward structure", sectionOrder: ["Technical Summary", "AI / Data Skills", "Technology Experience", "AI / Data Projects", "Education", "Certifications"], density: "balanced", atsRisk: "low" },
  { id: "startup-operator", label: "Startup Operator", category: "Technology / Product", bestFor: "founder, operator, growth, and scale-up roles", recommendedCareerModes: ["product-program-project", "marketing-growth-communications", "operations-supply-chain"], visualStyle: "lean operating narrative, outcome-heavy", sectionOrder: ["Profile", "Operating Skills", "Experience", "Growth / Operations Projects", "Education"], density: "compact", atsRisk: "medium" },
  { id: "finance-analyst", label: "Finance Analyst", category: "Finance / VC / Consulting", bestFor: "analyst and associate applications", recommendedCareerModes: ["finance-investment-banking"], visualStyle: "precise, numbers-forward, conservative", sectionOrder: ["Summary", "Investment / Finance Skills", "Finance Experience", "Deals / Market Research", "Education", "Certifications"], density: "compact", atsRisk: "low" },
  { id: "vc-associate", label: "VC Associate", category: "Finance / VC / Consulting", bestFor: "venture, investing, and startup ecosystem roles", recommendedCareerModes: ["finance-investment-banking", "consulting-strategy"], visualStyle: "market thesis and diligence oriented", sectionOrder: ["Summary", "Investment Skills", "Experience", "Deals / Market Research", "Education"], density: "balanced", atsRisk: "medium" },
  { id: "strategy-consultant", label: "Strategy Consultant", category: "Finance / VC / Consulting", bestFor: "consulting and strategy roles", recommendedCareerModes: ["consulting-strategy", "finance-investment-banking"], visualStyle: "client-ready with engagement blocks", sectionOrder: ["Summary", "Strategy Skills", "Consulting Experience", "Selected Engagements", "Education"], density: "balanced", atsRisk: "low" },
  { id: "investment-professional", label: "Investment Professional", category: "Finance / VC / Consulting", bestFor: "investment, banking, and capital markets", recommendedCareerModes: ["finance-investment-banking"], visualStyle: "executive finance polish", sectionOrder: ["Summary", "Finance Skills", "Investment Experience", "Transactions / Projects", "Education", "Certifications"], density: "compact", atsRisk: "low" },
  { id: "legal-professional", label: "Legal Professional", category: "Legal / Policy / Government", bestFor: "legal, compliance, and counsel-track roles", recommendedCareerModes: ["law-legal-policy"], visualStyle: "formal legal hierarchy", sectionOrder: ["Summary", "Legal Skills", "Legal Experience", "Research / Writing", "Education", "Admissions / Certifications"], density: "balanced", atsRisk: "low" },
  { id: "policy-analyst", label: "Policy Analyst", category: "Legal / Policy / Government", bestFor: "policy research and analysis roles", recommendedCareerModes: ["law-legal-policy", "government-public-sector", "nonprofit-international-development"], visualStyle: "research-forward public policy layout", sectionOrder: ["Summary", "Policy Skills", "Policy Experience", "Research / Publications", "Education"], density: "balanced", atsRisk: "low" },
  { id: "government-resume", label: "Government Resume", category: "Legal / Policy / Government", bestFor: "public sector and agency roles", recommendedCareerModes: ["government-public-sector"], visualStyle: "compliance-aware, explicit experience blocks", sectionOrder: ["Summary", "Public Sector Skills", "Government Experience", "Programs / Compliance", "Education"], density: "spacious", atsRisk: "low" },
  { id: "international-development", label: "International Development", category: "Legal / Policy / Government", bestFor: "NGO, donor, and development roles", recommendedCareerModes: ["nonprofit-international-development", "law-legal-policy"], visualStyle: "mission impact and program evidence", sectionOrder: ["Summary", "Development Skills", "Program Experience", "Grants / Partnerships", "Education"], density: "balanced", atsRisk: "low" },
  { id: "healthcare-operations", label: "Healthcare Operations", category: "Healthcare / Medical", bestFor: "health systems and operations roles", recommendedCareerModes: ["healthcare-medical-public-health", "operations-supply-chain"], visualStyle: "quality and workflow centered", sectionOrder: ["Summary", "Healthcare Skills", "Healthcare Experience", "Quality / Compliance Projects", "Licenses / Certifications", "Education"], density: "balanced", atsRisk: "low" },
  { id: "health-informatics", label: "Health Informatics", category: "Healthcare / Medical", bestFor: "EHR, data, workflow, and informatics roles", recommendedCareerModes: ["healthcare-medical-public-health", "ai-data-technology"], visualStyle: "clinical systems and data emphasis", sectionOrder: ["Summary", "Informatics Skills", "Healthcare / Technology Experience", "Systems Projects", "Certifications", "Education"], density: "balanced", atsRisk: "low" },
  { id: "clinical-professional", label: "Clinical Professional", category: "Healthcare / Medical", bestFor: "clinical and care delivery roles", recommendedCareerModes: ["healthcare-medical-public-health"], visualStyle: "licenses-forward, patient impact oriented", sectionOrder: ["Summary", "Clinical Skills", "Clinical Experience", "Licenses / Certifications", "Education"], density: "spacious", atsRisk: "low" },
  { id: "public-health", label: "Public Health", category: "Healthcare / Medical", bestFor: "population health and public health programs", recommendedCareerModes: ["healthcare-medical-public-health", "government-public-sector"], visualStyle: "program, compliance, and community impact", sectionOrder: ["Summary", "Public Health Skills", "Program Experience", "Research / Quality Projects", "Education"], density: "balanced", atsRisk: "low" },
  { id: "creative-director", label: "Creative Director", category: "Creative / Media / Fashion", bestFor: "creative leadership and brand direction", recommendedCareerModes: ["creative-media-production", "marketing-growth-communications"], visualStyle: "portfolio-forward, bold accent", sectionOrder: ["Profile", "Creative Skills", "Selected Campaigns / Portfolio", "Experience", "Tools", "Education"], density: "spacious", atsRisk: "medium" },
  { id: "media-producer", label: "Media Producer", category: "Creative / Media / Fashion", bestFor: "production, editorial, and media roles", recommendedCareerModes: ["creative-media-production"], visualStyle: "campaign and production credits emphasis", sectionOrder: ["Profile", "Production Skills", "Productions / Campaigns", "Experience", "Tools", "Education"], density: "balanced", atsRisk: "medium" },
  { id: "fashion-professional", label: "Fashion Professional", category: "Creative / Media / Fashion", bestFor: "fashion, retail, styling, and merchandising", recommendedCareerModes: ["creative-media-production", "marketing-growth-communications"], visualStyle: "noir editorial polish with ATS restraint", sectionOrder: ["Profile", "Fashion / Brand Skills", "Portfolio", "Experience", "Tools", "Education"], density: "spacious", atsRisk: "medium" },
  { id: "brand-marketing", label: "Brand & Marketing", category: "Creative / Media / Fashion", bestFor: "brand, campaign, and growth marketing", recommendedCareerModes: ["marketing-growth-communications", "creative-media-production"], visualStyle: "campaign performance and brand narrative", sectionOrder: ["Summary", "Brand Skills", "Campaigns / Portfolio", "Experience", "Tools", "Education"], density: "balanced", atsRisk: "low" },
  { id: "architecture-portfolio", label: "Architecture Portfolio", category: "Architecture / Real Estate / Design", bestFor: "architecture and design portfolios", recommendedCareerModes: ["architecture-design-real-estate"], visualStyle: "project portfolio hierarchy", sectionOrder: ["Profile", "Design Skills", "Portfolio Projects", "Professional Experience", "Tools", "Licenses", "Education"], density: "spacious", atsRisk: "medium" },
  { id: "real-estate-professional", label: "Real Estate Professional", category: "Architecture / Real Estate / Design", bestFor: "brokerage, development, and real estate operations", recommendedCareerModes: ["architecture-design-real-estate", "finance-investment-banking"], visualStyle: "client, transaction, and market evidence", sectionOrder: ["Profile", "Real Estate Skills", "Transactions / Projects", "Experience", "Licenses", "Education"], density: "balanced", atsRisk: "low" },
  { id: "interior-landscape-design", label: "Interior / Landscape Design", category: "Architecture / Real Estate / Design", bestFor: "interior, landscape, and environmental design", recommendedCareerModes: ["architecture-design-real-estate", "creative-media-production"], visualStyle: "design portfolio with tool fluency", sectionOrder: ["Profile", "Design Skills", "Portfolio Projects", "Experience", "Tools", "Education"], density: "spacious", atsRisk: "medium" },
  { id: "construction-project-manager", label: "Construction Project Manager", category: "Architecture / Real Estate / Design", bestFor: "construction delivery and project controls", recommendedCareerModes: ["architecture-design-real-estate", "operations-supply-chain"], visualStyle: "delivery, compliance, and field coordination", sectionOrder: ["Summary", "Project Skills", "Construction Experience", "Projects", "Certifications", "Education"], density: "compact", atsRisk: "low" },
  { id: "operations-leader", label: "Operations Leader", category: "Manufacturing / Operations / Supply Chain", bestFor: "plant, service, and business operations", recommendedCareerModes: ["operations-supply-chain"], visualStyle: "throughput and process improvement focused", sectionOrder: ["Summary", "Operations Skills", "Operations Experience", "Process Improvement Projects", "Certifications", "Education"], density: "compact", atsRisk: "low" },
  { id: "manufacturing-supervisor", label: "Manufacturing Supervisor", category: "Manufacturing / Operations / Supply Chain", bestFor: "manufacturing leadership and shift supervision", recommendedCareerModes: ["operations-supply-chain", "engineering-technical"], visualStyle: "safety, quality, and production evidence", sectionOrder: ["Summary", "Manufacturing Skills", "Production Experience", "Safety / Quality Projects", "Certifications", "Education"], density: "compact", atsRisk: "low" },
  { id: "logistics-manager", label: "Logistics Manager", category: "Manufacturing / Operations / Supply Chain", bestFor: "logistics, fulfillment, and distribution roles", recommendedCareerModes: ["operations-supply-chain"], visualStyle: "flow, cost, vendor, and service metrics", sectionOrder: ["Summary", "Logistics Skills", "Logistics Experience", "Process Improvement Projects", "Certifications", "Education"], density: "compact", atsRisk: "low" },
  { id: "supply-chain-professional", label: "Supply Chain Professional", category: "Manufacturing / Operations / Supply Chain", bestFor: "procurement, planning, and supply chain roles", recommendedCareerModes: ["operations-supply-chain", "consulting-strategy"], visualStyle: "planning and vendor performance emphasis", sectionOrder: ["Summary", "Supply Chain Skills", "Supply Chain Experience", "Projects", "Certifications", "Education"], density: "balanced", atsRisk: "low" },
  { id: "academic-cv", label: "Academic CV", category: "Academic / Research", bestFor: "academic, doctoral, and faculty-track CVs", recommendedCareerModes: ["academia-phd-research", "law-legal-policy"], visualStyle: "CV structure with research-first evidence", sectionOrder: ["Research Interests", "Education", "Publications", "Research Experience", "Teaching", "Conferences", "Awards / Grants", "Skills"], density: "spacious", atsRisk: "low" },
  { id: "research-fellow", label: "Research Fellow", category: "Academic / Research", bestFor: "fellowship, lab, and research roles", recommendedCareerModes: ["academia-phd-research", "healthcare-medical-public-health"], visualStyle: "research experience and methods emphasis", sectionOrder: ["Research Interests", "Education", "Research Experience", "Publications", "Conferences", "Awards / Grants", "Skills"], density: "balanced", atsRisk: "low" },
  { id: "phd-applicant", label: "PhD Applicant", category: "Academic / Research", bestFor: "doctoral and graduate applications", recommendedCareerModes: ["academia-phd-research"], visualStyle: "education and fit oriented", sectionOrder: ["Research Interests", "Education", "Research Experience", "Publications", "Teaching", "Awards", "Skills"], density: "spacious", atsRisk: "low" },
  { id: "publications-first-cv", label: "Publications-First CV", category: "Academic / Research", bestFor: "research-heavy academic profiles", recommendedCareerModes: ["academia-phd-research", "law-legal-policy"], visualStyle: "publications above experience", sectionOrder: ["Research Interests", "Publications", "Education", "Research Experience", "Teaching", "Conferences", "Awards / Grants", "Skills"], density: "spacious", atsRisk: "low" },
];

const careerModeOptions: { id: CareerModeId; label: string }[] = [
  { id: "general-professional", label: "General Professional" },
  { id: "product-program-project", label: "Product / Program / Project Management" },
  { id: "ai-data-technology", label: "AI / Data / Technology" },
  { id: "law-legal-policy", label: "Law / Legal / Policy" },
  { id: "finance-investment-banking", label: "Finance / VC / Investment / Banking" },
  { id: "healthcare-medical-public-health", label: "Healthcare / Medical / Public Health" },
  { id: "academia-phd-research", label: "Academia / Research" },
  { id: "consulting-strategy", label: "Consulting / Strategy" },
  { id: "operations-supply-chain", label: "Operations / Supply Chain" },
  { id: "marketing-growth-communications", label: "Marketing / Growth / Communications" },
  { id: "architecture-design-real-estate", label: "Architecture / Design / Real Estate" },
  { id: "engineering-technical", label: "Engineering / Technical" },
  { id: "education-teaching", label: "Education / Teaching" },
  { id: "government-public-sector", label: "Government / Public Sector" },
  { id: "nonprofit-international-development", label: "Nonprofit / International Development" },
  { id: "creative-media-production", label: "Creative / Media / Production" },
  { id: "custom", label: "Custom" },
];

const themes: { id: ThemeId; label: string }[] = [
  { id: "executive-navy", label: "Executive Navy" },
  { id: "modern-blue", label: "Modern Blue" },
  { id: "corporate-black", label: "Corporate Black" },
  { id: "burgundy-academic", label: "Burgundy Academic" },
  { id: "emerald-professional", label: "Emerald Professional" },
  { id: "slate-minimal", label: "Slate Minimal" },
  { id: "gold-executive", label: "Gold Executive" },
  { id: "creative-purple", label: "Creative Purple" },
  { id: "healthcare-teal", label: "Healthcare Teal" },
  { id: "real-estate-green", label: "Real Estate Green" },
  { id: "manufacturing-steel", label: "Manufacturing Steel" },
  { id: "fashion-noir", label: "Fashion Noir" },
];

const coverLetterToneOptions: { id: CoverLetterTone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "warm-confident", label: "Warm and Confident" },
  { id: "executive", label: "Executive" },
  { id: "academic", label: "Academic" },
  { id: "legal-policy", label: "Legal / Policy" },
  { id: "concise", label: "Concise" },
];

const coverLetterLengthOptions: { id: CoverLetterLength; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "standard", label: "Standard" },
  { id: "detailed", label: "Detailed" },
];

const themePalette: Record<
  ThemeId,
  { primary: string; accent: string; light: string; text: string; border: string; heading: string; sectionLine: string; bullet: string; skillPill: string }
> = {
  "executive-navy": {
    primary: appBrand.primary,
    accent: appBrand.accent,
    light: appBrand.light,
    text: appBrand.text,
    border: appBrand.border,
    heading: appBrand.primary,
    sectionLine: appBrand.primary,
    bullet: appBrand.accent,
    skillPill: "#EEF3FA",
  },
  "modern-blue": {
    primary: "#1D4ED8",
    accent: "#2563EB",
    light: "#EFF6FF",
    text: "#111827",
    border: "#BFDBFE",
    heading: "#1E3A8A",
    sectionLine: "#93C5FD",
    bullet: "#2563EB",
    skillPill: "#DBEAFE",
  },
  "corporate-black": {
    primary: "#18181b",
    accent: "#52525b",
    light: "#f4f4f5",
    text: "#18181b",
    border: "#d4d4d8",
    heading: "#18181B",
    sectionLine: "#71717A",
    bullet: "#27272A",
    skillPill: "#F4F4F5",
  },
  "burgundy-academic": {
    primary: "#7F1D1D",
    accent: "#991B1B",
    light: "#FEF2F2",
    text: "#111827",
    border: "#FECACA",
    heading: "#7F1D1D",
    sectionLine: "#B91C1C",
    bullet: "#991B1B",
    skillPill: "#FEE2E2",
  },
  "emerald-professional": {
    primary: "#065F46",
    accent: "#047857",
    light: "#ECFDF5",
    text: "#0F172A",
    border: "#A7F3D0",
    heading: "#065F46",
    sectionLine: "#34D399",
    bullet: "#047857",
    skillPill: "#D1FAE5",
  },
  "slate-minimal": {
    primary: "#334155",
    accent: "#475569",
    light: "#F8FAFC",
    text: "#0F172A",
    border: "#CBD5E1",
    heading: "#1E293B",
    sectionLine: "#94A3B8",
    bullet: "#475569",
    skillPill: "#E2E8F0",
  },
  "gold-executive": {
    primary: "#4A3418",
    accent: "#C9A15B",
    light: "#FFFBEB",
    text: "#111827",
    border: "#FDE68A",
    heading: "#4A3418",
    sectionLine: "#C9A15B",
    bullet: "#B45309",
    skillPill: "#FEF3C7",
  },
  "creative-purple": {
    primary: "#5B21B6",
    accent: "#8B5CF6",
    light: "#F5F3FF",
    text: "#1F1F1F",
    border: "#DDD6FE",
    heading: "#4C1D95",
    sectionLine: "#A78BFA",
    bullet: "#7C3AED",
    skillPill: "#EDE9FE",
  },
  "healthcare-teal": {
    primary: "#0F766E",
    accent: "#14B8A6",
    light: "#F0FDFA",
    text: "#0F172A",
    border: "#99F6E4",
    heading: "#115E59",
    sectionLine: "#2DD4BF",
    bullet: "#0D9488",
    skillPill: "#CCFBF1",
  },
  "real-estate-green": {
    primary: "#166534",
    accent: "#65A30D",
    light: "#F7FEE7",
    text: "#0F172A",
    border: "#BEF264",
    heading: "#14532D",
    sectionLine: "#84CC16",
    bullet: "#4D7C0F",
    skillPill: "#ECFCCB",
  },
  "manufacturing-steel": {
    primary: "#374151",
    accent: "#64748B",
    light: "#F1F5F9",
    text: "#111827",
    border: "#CBD5E1",
    heading: "#1F2937",
    sectionLine: "#94A3B8",
    bullet: "#475569",
    skillPill: "#E5E7EB",
  },
  "fashion-noir": {
    primary: "#09090B",
    accent: "#A21CAF",
    light: "#FAFAFA",
    text: "#111111",
    border: "#D4D4D8",
    heading: "#09090B",
    sectionLine: "#A21CAF",
    bullet: "#A21CAF",
    skillPill: "#F4F4F5",
  },
};

function getTemplateDefinition(templateId: TemplateId) {
  return templates.find((template) => template.id === templateId) || templates[0];
}

function getThemePalette(themeId: ThemeId) {
  return themePalette[themeId] || themePalette["executive-navy"];
}

function labelForTemplate(templateId: TemplateId) {
  return getTemplateDefinition(templateId).label;
}

function detectSeniority(text: string) {
  if (/\b(chief|cxo|vp|vice president|head of|director|executive|principal|senior manager)\b/i.test(text)) {
    return "senior";
  }

  if (/\b(intern|assistant|coordinator|junior|entry|associate)\b/i.test(text)) {
    return "early";
  }

  return "mid";
}

function recommendTemplateChoice(
  careerProfile: CareerModeProfile,
  jobDescription: string,
  targetRole: string,
  userGoal = "premium recruiter-ready export",
) {
  const context = `${targetRole} ${jobDescription}`;
  const seniority = detectSeniority(context);
  const normalized = normalizeText(context);
  const categoryScores = templateCategoryNames.map((category) => {
    const categorySignals = normalizeText(category).split(/\s+/).filter((word) => word.length > 2);
    return {
      category,
      score: categorySignals.filter((word) => normalized.includes(word)).length,
    };
  });
  const bestCategory = categoryScores.sort((a, b) => b.score - a.score)[0]?.score
    ? categoryScores[0].category
    : undefined;
  const candidates = templates.filter((template) =>
    template.recommendedCareerModes.includes(careerProfile.id) ||
    template.category === bestCategory,
  );
  const ranked = (candidates.length > 0 ? candidates : templates)
    .map((template) => {
      const lowRiskBonus = template.atsRisk === "low" ? 3 : template.atsRisk === "medium" ? 1 : 0;
      const compactBonus = seniority === "early" && template.density === "compact" ? 2 : 0;
      const spaciousBonus = seniority === "senior" && template.density !== "compact" ? 2 : 0;
      const modeBonus = template.recommendedCareerModes.includes(careerProfile.id) ? 5 : 0;
      const categoryBonus = template.category === bestCategory ? 2 : 0;

      return {
        template,
        score: modeBonus + categoryBonus + lowRiskBonus + compactBonus + spaciousBonus,
      };
    })
    .sort((a, b) => b.score - a.score);
  const template = ranked[0]?.template || templates[0];
  const themeByCareer: Partial<Record<CareerModeId, ThemeId>> = {
    "finance-investment-banking": "gold-executive",
    "law-legal-policy": "burgundy-academic",
    "healthcare-medical-public-health": "healthcare-teal",
    "academia-phd-research": "burgundy-academic",
    "creative-media-production": "fashion-noir",
    "architecture-design-real-estate": "real-estate-green",
    "operations-supply-chain": "manufacturing-steel",
    "ai-data-technology": "modern-blue",
    "product-program-project": "modern-blue",
    "consulting-strategy": "corporate-black",
    "marketing-growth-communications": "creative-purple",
  };
  const theme = themeByCareer[careerProfile.id] || "executive-navy";
  const reasonFocus = careerProfile.suggestedLanguage.slice(0, 3).join(", ");

  return {
    category: template.category,
    template,
    density: template.density,
    theme,
    reason: `Recommended because this role emphasizes ${reasonFocus || careerProfile.label.toLowerCase()} and the goal is ${userGoal}.`,
  };
}

const baseImpactTerms = [
  "led",
  "launched",
  "managed",
  "built",
  "created",
  "developed",
  "delivered",
  "improved",
  "increased",
  "reduced",
  "growth",
  "revenue",
  "metrics",
  "targets",
  "stakeholders",
];

const careerModeProfiles: Record<CareerModeId, CareerModeProfile> = {
  "general-professional": {
    id: "general-professional",
    label: "General Professional",
    targetType: "General professional role",
    signals: ["leadership", "stakeholder", "operations", "analysis", "project", "communication"],
    keywords: ["leadership", "stakeholder", "project management", "operations", "analysis", "communication", "process improvement", "reporting", "team leadership", "strategy"],
    actionVerbs: ["led", "managed", "improved", "delivered", "coordinated", "supported"],
    sectionPriority: ["Professional Summary", "Core Skills", "Professional Experience", "Projects", "Education", "Certifications"],
    suggestedLanguage: ["cross-functional leadership", "measurable outcomes", "stakeholder communication", "operational execution"],
    achievementExamples: ["Improved a core process by clarifying ownership, coordinating stakeholders, and tracking measurable results."],
    templateRecommendation: "ats-clean",
    positioningAngle: "Position the resume around transferable strengths, clear scope, measurable outcomes, and role-specific evidence.",
  },
  "product-program-project": {
    id: "product-program-project",
    label: "Product / Program / Project Management",
    targetType: "Product, program, or project role",
    signals: ["product", "program", "project", "roadmap", "agile", "scrum", "stakeholder", "delivery"],
    keywords: ["product strategy", "roadmap", "requirements", "Agile", "Scrum", "stakeholder management", "delivery governance", "launch", "user research", "prioritization", "metrics"],
    actionVerbs: ["owned", "led", "prioritized", "launched", "aligned", "delivered"],
    sectionPriority: ["Professional Summary", "Core Skills", "Product/Program Experience", "Selected Projects", "Education", "Certifications"],
    suggestedLanguage: ["roadmap ownership", "delivery governance", "cross-functional execution", "launch readiness"],
    achievementExamples: ["Led a roadmap workstream from discovery through launch, aligning technical teams and stakeholders around measurable adoption goals."],
    templateRecommendation: "product-leadership",
    positioningAngle: "Position the resume around ownership, delivery discipline, stakeholder alignment, roadmap decisions, and measurable launch outcomes.",
  },
  "ai-data-technology": {
    id: "ai-data-technology",
    label: "AI / Data / Technology",
    targetType: "AI, data, or technology role",
    signals: ["ai", "ml", "data", "analytics", "software", "cloud", "api", "platform", "automation", "llm"],
    keywords: ["AI", "LLM", "machine learning", "data", "analytics", "API", "cloud", "platform", "automation", "model", "responsible AI", "technical architecture"],
    actionVerbs: ["built", "implemented", "automated", "analyzed", "integrated", "optimized"],
    sectionPriority: ["Professional Summary", "Technical Skills", "Technology Experience", "Projects", "Education", "Certifications"],
    suggestedLanguage: ["technical execution", "data-driven decision making", "platform integration", "model/product impact"],
    achievementExamples: ["Built a data or automation workflow that improved quality, speed, visibility, or decision-making for a defined user group."],
    templateRecommendation: "technical-program",
    positioningAngle: "Position the resume around technical fluency, systems thinking, data evidence, implementation credibility, and measurable product or operational impact.",
  },
  "law-legal-policy": {
    id: "law-legal-policy",
    label: "Law / Legal / Policy",
    targetType: "Legal, policy, or advocacy role",
    signals: ["legal", "law", "policy", "regulatory", "compliance", "governance", "advocacy", "contract", "litigation", "public interest"],
    keywords: ["legal research", "policy analysis", "regulatory knowledge", "writing", "advocacy", "compliance", "governance", "international law", "corporate law", "intellectual property", "public interest"],
    actionVerbs: ["researched", "drafted", "analyzed", "advised", "advocated", "reviewed"],
    sectionPriority: ["Education", "Legal/Policy Experience", "Research/Publications", "Writing", "Leadership", "Skills"],
    suggestedLanguage: ["legal research", "policy analysis", "regulatory compliance", "written advocacy", "governance"],
    achievementExamples: ["Drafted a policy or legal memo synthesizing statutory, regulatory, or case materials into clear recommendations for stakeholders."],
    templateRecommendation: "academic-cv",
    positioningAngle: "Position the resume around legal reasoning, policy judgment, writing quality, research depth, advocacy, compliance, and governance exposure.",
  },
  "finance-investment-banking": {
    id: "finance-investment-banking",
    label: "Finance / Investment / Banking",
    targetType: "Finance, investment, or banking role",
    signals: ["finance", "investment", "banking", "valuation", "modeling", "portfolio", "capital markets", "risk", "equity", "debt"],
    keywords: ["financial analysis", "valuation", "modeling", "risk analysis", "investment research", "capital markets", "portfolio analysis", "compliance", "stakeholder reporting", "forecasting"],
    actionVerbs: ["modeled", "valued", "analyzed", "forecasted", "reported", "assessed"],
    sectionPriority: ["Professional Summary", "Finance Experience", "Deals/Projects", "Technical Skills", "Certifications", "Education"],
    suggestedLanguage: ["financial modeling", "valuation analysis", "risk assessment", "investment research", "capital markets exposure"],
    achievementExamples: ["Built a model, investment memo, or reporting package that improved decision quality, risk visibility, or stakeholder confidence."],
    templateRecommendation: "investment-professional",
    positioningAngle: "Position the resume around analytical rigor, valuation or modeling depth, risk judgment, market awareness, compliance, and high-quality reporting.",
  },
  "healthcare-medical-public-health": {
    id: "healthcare-medical-public-health",
    label: "Healthcare / Medical / Public Health",
    targetType: "Healthcare, clinical, or public health role",
    signals: ["healthcare", "medical", "clinical", "patient", "public health", "hipaa", "ehr", "emr", "quality improvement", "population health"],
    keywords: ["patient care", "healthcare operations", "clinical workflows", "compliance", "HIPAA", "health informatics", "quality improvement", "EMR", "EHR", "population health"],
    actionVerbs: ["coordinated", "improved", "documented", "implemented", "monitored", "supported"],
    sectionPriority: ["Summary", "Clinical/Healthcare Experience", "Certifications/Licensure", "Technical Skills", "Education", "Projects"],
    suggestedLanguage: ["clinical workflow", "patient-centered operations", "HIPAA-aware documentation", "quality improvement", "health informatics"],
    achievementExamples: ["Improved a clinical, operational, or reporting workflow while maintaining compliance, documentation quality, and patient or population health focus."],
    templateRecommendation: "ats-clean",
    positioningAngle: "Position the resume around patient or population impact, clinical workflow understanding, compliance, quality improvement, and healthcare systems fluency.",
  },
  "academia-phd-research": {
    id: "academia-phd-research",
    label: "Academia / PhD / Research",
    targetType: "Academic, doctoral, or research role",
    signals: ["phd", "sjd", "cv", "research", "publication", "journal", "conference", "faculty", "doctoral", "methodology", "ssrn", "doi", "working paper", "teaching"],
    keywords: ["research agenda", "publications", "methodology", "teaching", "conferences", "grants", "academic fit", "faculty", "doctoral", "working paper"],
    actionVerbs: ["researched", "published", "presented", "taught", "analyzed", "investigated"],
    sectionPriority: ["Education", "Research Interests", "Publications", "Research Experience", "Teaching", "Conferences", "Awards", "Skills"],
    suggestedLanguage: ["research agenda", "methodological fit", "publication potential", "teaching preparation", "faculty alignment"],
    achievementExamples: ["Presented or developed research using a clear methodology, scholarly contribution, and fit with the target department or program."],
    templateRecommendation: "academic-cv",
    positioningAngle: "Position the CV around research fit, publication potential, methodology, teaching, conferences, grants, and institutional contribution.",
  },
  "consulting-strategy": {
    id: "consulting-strategy",
    label: "Consulting / Strategy",
    targetType: "Consulting or strategy role",
    signals: ["consulting", "strategy", "client", "market analysis", "transformation", "operating model", "business case"],
    keywords: ["structured problem solving", "client impact", "market analysis", "operating model", "transformation", "stakeholder management", "measurable business outcomes", "business case", "competitive analysis"],
    actionVerbs: ["diagnosed", "analyzed", "recommended", "transformed", "facilitated", "delivered"],
    sectionPriority: ["Professional Summary", "Consulting/Strategy Experience", "Selected Engagements", "Business Impact", "Education", "Skills"],
    suggestedLanguage: ["structured problem solving", "client-ready recommendations", "market analysis", "operating model design", "transformation outcomes"],
    achievementExamples: ["Diagnosed a business problem, synthesized market or operating data, and delivered recommendations that changed a decision or outcome."],
    templateRecommendation: "strategy-consultant",
    positioningAngle: "Position the resume around structured problem solving, client impact, analytical depth, transformation, and measurable business outcomes.",
  },
  "operations-supply-chain": {
    id: "operations-supply-chain",
    label: "Operations / Supply Chain",
    targetType: "Operations or supply chain role",
    signals: ["operations", "supply chain", "logistics", "procurement", "inventory", "vendor", "process improvement", "fulfillment"],
    keywords: ["operations", "supply chain", "logistics", "procurement", "inventory management", "vendor management", "process improvement", "forecasting", "quality", "cost reduction"],
    actionVerbs: ["optimized", "coordinated", "reduced", "standardized", "forecasted", "managed"],
    sectionPriority: ["Summary", "Operations Experience", "Process Improvements", "Technical Skills", "Certifications", "Education"],
    suggestedLanguage: ["process improvement", "cost reduction", "vendor coordination", "operational visibility", "cycle time"],
    achievementExamples: ["Reduced cost, delay, waste, or handoff friction by improving a workflow, vendor process, inventory model, or reporting cadence."],
    templateRecommendation: "ats-clean",
    positioningAngle: "Position the resume around operational reliability, process improvement, cost, quality, vendor coordination, and measurable execution results.",
  },
  "marketing-growth-communications": {
    id: "marketing-growth-communications",
    label: "Marketing / Growth / Communications",
    targetType: "Marketing, growth, or communications role",
    signals: ["marketing", "growth", "campaign", "brand", "content", "seo", "conversion", "lifecycle", "communications"],
    keywords: ["demand generation", "campaign performance", "analytics", "conversion", "content strategy", "SEO", "lifecycle marketing", "brand positioning", "communications", "marketing automation"],
    actionVerbs: ["grew", "launched", "optimized", "positioned", "converted", "analyzed"],
    sectionPriority: ["Summary", "Marketing/Growth Experience", "Campaigns", "Analytics/Tools", "Portfolio", "Education"],
    suggestedLanguage: ["campaign performance", "conversion improvement", "content strategy", "lifecycle marketing", "brand positioning"],
    achievementExamples: ["Improved campaign, funnel, or content performance through segmentation, testing, analytics, and clear brand or conversion strategy."],
    templateRecommendation: "brand-marketing",
    positioningAngle: "Position the resume around growth outcomes, campaign performance, analytics, content strategy, conversion, SEO, lifecycle, and brand clarity.",
  },
  "architecture-design-real-estate": {
    id: "architecture-design-real-estate",
    label: "Architecture / Design / Real Estate",
    targetType: "Architecture, design, or real estate role",
    signals: ["architecture", "design", "real estate", "portfolio", "site", "construction", "planning", "cad", "revit", "project delivery"],
    keywords: ["design development", "portfolio", "site planning", "project delivery", "construction documentation", "Revit", "AutoCAD", "client presentation", "real estate analysis", "zoning", "design coordination"],
    actionVerbs: ["designed", "coordinated", "documented", "presented", "planned", "delivered"],
    sectionPriority: ["Design Summary", "Design / Architecture Skills", "Professional Experience", "Selected Projects / Portfolio", "Tools", "Education", "Certifications"],
    suggestedLanguage: ["design development", "portfolio quality", "site and stakeholder coordination", "documentation discipline"],
    achievementExamples: ["Delivered a design, planning, documentation, or real estate workstream with clear stakeholder needs, constraints, tools, and project outcome."],
    templateRecommendation: "architecture-portfolio",
    positioningAngle: "Position the resume around design judgment, portfolio evidence, technical tools, client or stakeholder coordination, documentation quality, and delivery outcomes.",
  },
  "engineering-technical": {
    id: "engineering-technical",
    label: "Engineering / Technical",
    targetType: "Engineering or technical role",
    signals: ["engineering", "software", "systems", "architecture", "infrastructure", "api", "testing", "security", "devops"],
    keywords: ["engineering", "software development", "systems design", "architecture", "API", "testing", "security", "DevOps", "cloud", "reliability", "technical documentation"],
    actionVerbs: ["designed", "built", "implemented", "tested", "debugged", "deployed"],
    sectionPriority: ["Technical Summary", "Technical Skills", "Engineering Experience", "Projects", "Education", "Certifications"],
    suggestedLanguage: ["systems design", "implementation quality", "reliability", "technical documentation", "cross-functional engineering"],
    achievementExamples: ["Designed, implemented, or improved a technical system with clearer reliability, performance, security, or maintainability outcomes."],
    templateRecommendation: "technical-program",
    positioningAngle: "Position the resume around technical depth, implementation quality, systems judgment, collaboration, reliability, and measurable engineering outcomes.",
  },
  "education-teaching": {
    id: "education-teaching",
    label: "Education / Teaching",
    targetType: "Education or teaching role",
    signals: ["teacher", "teaching", "curriculum", "instruction", "student", "assessment", "classroom", "learning"],
    keywords: ["instruction", "curriculum design", "student outcomes", "assessment", "classroom management", "differentiated instruction", "learning objectives", "advising", "education technology"],
    actionVerbs: ["taught", "designed", "assessed", "mentored", "facilitated", "improved"],
    sectionPriority: ["Summary", "Teaching Experience", "Education", "Certifications/Licensure", "Curriculum/Projects", "Skills"],
    suggestedLanguage: ["student outcomes", "curriculum design", "assessment strategy", "differentiated instruction", "learning support"],
    achievementExamples: ["Designed or delivered instruction that improved student engagement, assessment results, access, or learning outcomes."],
    templateRecommendation: "minimal-professional",
    positioningAngle: "Position the resume around teaching effectiveness, student outcomes, curriculum design, assessment, advising, and inclusive learning support.",
  },
  "nonprofit-international-development": {
    id: "nonprofit-international-development",
    label: "Nonprofit / International Development",
    targetType: "Nonprofit or international development role",
    signals: ["nonprofit", "ngo", "international development", "grant", "donor", "program", "community", "impact", "monitoring"],
    keywords: ["program management", "community impact", "grants", "donor reporting", "monitoring and evaluation", "partnerships", "stakeholder engagement", "capacity building", "advocacy"],
    actionVerbs: ["mobilized", "coordinated", "implemented", "reported", "partnered", "evaluated"],
    sectionPriority: ["Summary", "Program/Impact Experience", "Grants/Partnerships", "Monitoring & Evaluation", "Education", "Skills"],
    suggestedLanguage: ["community impact", "grant reporting", "partner coordination", "monitoring and evaluation", "capacity building"],
    achievementExamples: ["Managed a program, partner, grant, or community initiative with clear outputs, reporting discipline, and beneficiary impact."],
    templateRecommendation: "international-development",
    positioningAngle: "Position the resume around mission fit, program delivery, community impact, grants, partnerships, reporting, and measurable outcomes.",
  },
  "government-public-sector": {
    id: "government-public-sector",
    label: "Government / Public Sector",
    targetType: "Government or public sector role",
    signals: ["government", "public sector", "public policy", "agency", "compliance", "grant", "community", "program", "reporting"],
    keywords: ["policy implementation", "stakeholder coordination", "compliance", "public programs", "reporting", "community impact", "grants", "public administration", "interagency coordination"],
    actionVerbs: ["implemented", "coordinated", "reported", "administered", "monitored", "evaluated"],
    sectionPriority: ["Summary", "Public Sector Experience", "Programs/Policy", "Compliance/Reporting", "Education", "Skills"],
    suggestedLanguage: ["policy implementation", "public program delivery", "compliance", "stakeholder coordination", "community impact"],
    achievementExamples: ["Supported a public program or policy workflow through implementation, compliance tracking, reporting, and stakeholder coordination."],
    templateRecommendation: "ats-clean",
    positioningAngle: "Position the resume around policy implementation, public program delivery, compliance, reporting, grants, stakeholder coordination, and community impact.",
  },
  "creative-media-production": {
    id: "creative-media-production",
    label: "Creative / Media / Production",
    targetType: "Creative, media, or production role",
    signals: ["creative", "media", "production", "video", "content", "campaign", "studio", "post-production", "audience", "brand"],
    keywords: ["content strategy", "production management", "campaign execution", "audience insights", "creative operations", "brand storytelling", "post-production", "launch coordination", "performance reporting", "stakeholder reviews"],
    actionVerbs: ["produced", "launched", "directed", "coordinated", "edited", "managed"],
    sectionPriority: ["Creative Summary", "Creative / Production Skills", "Production Experience", "Campaigns / Portfolio", "Tools", "Education", "Certifications"],
    suggestedLanguage: ["creative operations", "audience insights", "campaign execution", "launch coordination"],
    achievementExamples: ["Led a production, campaign, or content workstream from concept through delivery while coordinating stakeholders, timelines, assets, and performance signals."],
    templateRecommendation: "media-producer",
    positioningAngle: "Position the resume around creative execution, production discipline, audience insight, campaign outcomes, stakeholder reviews, and portfolio-ready work.",
  },
  custom: {
    id: "custom",
    label: "Custom",
    targetType: "Custom career field",
    signals: [],
    keywords: [],
    actionVerbs: ["led", "built", "improved", "delivered", "analyzed", "coordinated"],
    sectionPriority: ["Summary", "Relevant Experience", "Selected Projects", "Skills", "Education", "Certifications"],
    suggestedLanguage: ["field-specific evidence", "measurable outcomes", "stakeholder value", "relevant tools and methods"],
    achievementExamples: ["Translate each achievement into the field's preferred language, evidence standard, and measurable success criteria."],
    templateRecommendation: "ats-clean",
    positioningAngle: "Position the resume around the custom field's language, evidence standard, section norms, and measurable outcomes.",
  },
};

const keywordBank = [
  "AI",
  "LLM",
  "machine learning",
  "research",
  "publication",
  "methodology",
  "policy",
  "legal",
  "economics",
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
  "faculty",
  "teaching",
  "conference",
  "governance",
  "platform",
  "delivery",
  ...Object.values(careerModeProfiles).flatMap((profile) => profile.keywords),
];

const roleTerms = [
  "ai",
  "ml",
  "product",
  "manager",
  "project",
  "program",
  "technical",
  "lead",
  "owner",
  "automation",
];

const aiProjectTerms = [
  "ai",
  "ml",
  "llm",
  "prompt engineering",
  "responsible ai",
  "automation",
  "workflow",
  "analytics",
  "model",
  "agent",
];

const impactTerms = baseImpactTerms;

const academicSignals = [
  "phd",
  "sjd",
  "cv",
  "research",
  "publication",
  "journal",
  "conference",
  "faculty",
  "doctoral",
  "methodology",
  "ssrn",
  "doi",
  "working paper",
  "teaching",
];

const technicalSignals = [
  "ai",
  "ml",
  "api",
  "platform",
  "technical",
  "engineering",
  "data",
  "analytics",
  "automation",
  "cloud",
  "llm",
  "model",
];

function detectCareerMode(context: string): CareerModeId {
  const scores = careerModeOptions
    .map((option) => option.id)
    .filter((id): id is Exclude<CareerModeId, "general-professional" | "custom"> =>
      id !== "general-professional" && id !== "custom",
    )
    .map((id) => ({
      id,
      score: scoreSignalFit(context, careerModeProfiles[id].signals),
    }))
    .sort((a, b) => b.score - a.score);

  return scores[0] && scores[0].score >= 18 ? scores[0].id : "general-professional";
}

function resolveCareerProfile(
  selectedMode: CareerModeId,
  customCareerField: string,
  targetRole: string,
  jobDescription: string,
): CareerModeProfile {
  if (selectedMode === "custom") {
    const customLabel = customCareerField.trim() || "Custom Career Field";
    const customTerms = customLabel
      .split(/[\/,&+-]|\s{2,}/)
      .map((term) => term.trim())
      .filter(Boolean);

    return {
      ...careerModeProfiles.custom,
      label: customLabel,
      targetType: `${customLabel} target`,
      signals: customTerms,
      keywords: uniqueTerms([
        ...customTerms,
        ...extractKeywords(`${targetRole} ${jobDescription}`).slice(0, 10),
        "relevant experience",
        "measurable outcomes",
        "stakeholder value",
      ]),
      positioningAngle: `Position the resume around ${customLabel} expectations, field-specific language, evidence quality, section norms, and measurable outcomes.`,
    };
  }

  const detectedMode =
    selectedMode === "general-professional"
      ? detectCareerMode(`${targetRole} ${jobDescription}`)
      : selectedMode;

  return careerModeProfiles[detectedMode];
}

function isAcademicCareer(profile: CareerModeProfile) {
  return profile.id === "academia-phd-research" || profile.id === "law-legal-policy";
}

function hasSpecializedProjectEvidence(sourceText: string, careerProfile: CareerModeProfile) {
  const normalized = normalizeText(sourceText);
  const evidenceTerms = uniqueTerms([...careerProfile.signals, ...careerProfile.keywords]).slice(0, 16);

  return evidenceTerms.filter((term) => normalized.includes(normalizeText(term))).length >= 2;
}

function getDynamicProjectHeading(careerProfile: CareerModeProfile, sourceText: string) {
  if (!hasSpecializedProjectEvidence(sourceText, careerProfile)) {
    return "Projects";
  }

  switch (careerProfile.id) {
    case "ai-data-technology":
    case "engineering-technical":
      return "AI & Technology Projects";
    case "product-program-project":
      return "Product & Delivery Projects";
    case "finance-investment-banking":
      return "Investment, Market, or Finance Projects";
    case "law-legal-policy":
      return "Legal, Policy, or Research Projects";
    case "healthcare-medical-public-health":
      return "Healthcare Operations or Clinical Projects";
    case "architecture-design-real-estate":
      return "Design / Architecture Projects";
    case "marketing-growth-communications":
      return "Campaigns / Growth Projects";
    default:
      return "Projects";
  }
}

function getCareerSectionHeadings(careerProfile: CareerModeProfile, sourceText: string) {
  const projectHeading = getDynamicProjectHeading(careerProfile, sourceText);

  switch (careerProfile.id) {
    case "product-program-project":
      return {
        summary: "Professional Summary",
        skills: "Core Skills",
        experience: "Professional Experience",
        projects: projectHeading === "Projects" ? "Selected Projects" : projectHeading,
        research: "Research / Publications",
        education: "Education",
        certifications: "Certifications",
      };
    case "ai-data-technology":
    case "engineering-technical":
      return {
        summary: "Technical Summary",
        skills: "Technical Skills",
        experience: careerProfile.id === "engineering-technical" ? "Engineering Experience" : "AI / Data / Technology Experience",
        projects: projectHeading,
        research: "Publications / Research",
        education: "Education",
        certifications: "Certifications",
      };
    case "finance-investment-banking":
      return {
        summary: "Investment / Finance Summary",
        skills: "Core Finance Skills",
        experience: "Finance / Investment Experience",
        projects: "Deals / Market Research / Portfolio Projects",
        research: "Research / Publications",
        education: "Education",
        certifications: "Certifications",
      };
    case "law-legal-policy":
      return {
        summary: "Legal / Policy Summary",
        skills: "Legal & Policy Skills",
        experience: "Legal / Policy Experience",
        projects: projectHeading,
        research: "Research / Publications",
        education: "Education",
        certifications: "Certifications",
      };
    case "healthcare-medical-public-health":
      return {
        summary: "Healthcare Summary",
        skills: "Healthcare / Clinical / Operations Skills",
        experience: "Healthcare Experience",
        projects: "Quality / Compliance / Informatics Projects",
        research: "Research / Publications",
        education: "Education",
        certifications: "Licenses / Certifications",
      };
    case "creative-media-production":
    case "marketing-growth-communications":
      return {
        summary: careerProfile.id === "creative-media-production" ? "Profile" : "Marketing Summary",
        skills: careerProfile.id === "creative-media-production" ? "Creative Skills" : "Brand / Marketing Skills",
        experience: "Professional Experience",
        projects: careerProfile.id === "creative-media-production" ? "Selected Campaigns / Productions / Portfolio" : "Campaigns / Growth Projects",
        research: "Tools",
        education: "Education",
        certifications: "Certifications",
      };
    case "academia-phd-research":
      return {
        summary: "Research Interests",
        skills: "Skills",
        experience: "Research Experience",
        projects: "Professional Experience",
        research: "Publications / Working Papers",
        education: "Education",
        certifications: "Professional Affiliations / Certifications",
      };
    case "architecture-design-real-estate":
      return {
        summary: "Profile",
        skills: "Design / Real Estate Skills",
        experience: "Professional Experience",
        projects: projectHeading === "Projects" ? "Selected Projects / Portfolio" : projectHeading,
        research: "Tools",
        education: "Education",
        certifications: "Certifications",
      };
    case "operations-supply-chain":
      return {
        summary: "Operations Summary",
        skills: "Operations Skills",
        experience: "Production / Process Improvement Experience",
        projects: "Safety / Compliance / Quality Projects",
        research: "Tools / Systems",
        education: "Education",
        certifications: "Certifications",
      };
    case "consulting-strategy":
      return {
        summary: "Strategy Summary",
        skills: "Strategy / Consulting Skills",
        experience: "Consulting / Strategy Experience",
        projects: "Selected Engagements",
        research: "Market Research / Analysis",
        education: "Education",
        certifications: "Certifications",
      };
    case "government-public-sector":
    case "nonprofit-international-development":
      return {
        summary: "Public Service Summary",
        skills: "Policy / Program Skills",
        experience: "Program / Public Sector Experience",
        projects: "Programs / Grants / Partnerships",
        research: "Research / Reporting",
        education: "Education",
        certifications: "Certifications",
      };
    default:
      return {
        summary: "Professional Summary",
        skills: "Core Skills",
        experience: "Professional Experience",
        projects: projectHeading,
        research: "Research / Publications",
        education: "Education",
        certifications: "Certifications",
      };
  }
}

function getDefaultSavedResumeState(): SavedResumeState {
  const candidateName = firstMeaningfulLine(sampleResume, "Candidate Name");

  return {
    masterResume: sampleResume,
    masterUploads: [],
    jobDescription: sampleJob,
    targetRole: targetResumeTitle,
    careerMode: "general-professional",
    customCareerField: "",
    editableResume: null,
    selectedTemplate: "classic-executive",
    selectedTheme: "executive-navy",
    downloadFileName: buildDefaultResumeFileName(
      candidateName,
      targetResumeTitle,
    ),
    coverLetter: createDefaultCoverLetterState(candidateName, targetResumeTitle),
    outputScoreLabel: "Tailored Resume Score",
    contactDisplayStyle: "labels",
  };
}

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

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function extractKeywords(text: string) {
  const normalized = normalizeText(text);

  return uniqueTerms(keywordBank).filter((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    return normalized.includes(normalizedKeyword);
  });
}

function extractJobKeywordGroups(jobDescription: string, careerProfile?: CareerModeProfile) {
  const sentences = jobDescription
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const preferredSentences = sentences.filter((sentence) =>
    /\b(preferred|nice to have|plus|bonus|ideal)\b/i.test(sentence),
  );
  const preferredKeywords = extractKeywords(preferredSentences.join(" "));
  const jobKeywords = uniqueTerms([
    ...extractKeywords(jobDescription),
    ...(careerProfile?.keywords.filter((keyword) =>
      normalizeText(jobDescription).includes(normalizeText(keyword)),
    ) ?? []),
  ]);
  const requiredKeywords = jobKeywords.filter(
    (keyword) => !preferredKeywords.includes(keyword),
  );

  return {
    requiredKeywords:
      requiredKeywords.length > 0 ? requiredKeywords : jobKeywords.slice(0, 8),
    preferredKeywords,
    allKeywords: jobKeywords,
  };
}

function percentMatched(source: string, keywords: string[]) {
  if (keywords.length === 0) {
    return 100;
  }

  const sourceKeywords = extractKeywords(source);
  const matchedCount = keywords.filter((keyword) =>
    sourceKeywords.includes(keyword),
  ).length;

  return Math.round((matchedCount / keywords.length) * 100);
}

function scoreRoleAlignment(
  resumeText: string,
  jobDescription: string,
  targetRole: string,
  careerProfile: CareerModeProfile,
) {
  const normalized = normalizeText(
    `${targetRole} ${firstMeaningfulLine(jobDescription, "")} ${resumeText
      .split(/\r?\n/)
      .slice(0, 8)
      .join(" ")}`,
  );
  const targetTerms = uniqueTerms([...roleTerms, ...careerProfile.signals.slice(0, 10)]).filter((term) =>
    normalized.includes(normalizeText(term)),
  );

  return Math.min(100, Math.round((targetTerms.length / Math.min(8, Math.max(4, targetTerms.length + 2))) * 100));
}

function scoreMetricsImpact(resumeText: string) {
  const normalized = normalizeText(resumeText);
  const numericSignals = resumeText.match(/(\$?\d+[\d,.]*\+?%?|\d+\s*(?:m|k)\+?)/gi)
    ?.length ?? 0;
  const impactSignals = impactTerms.filter((term) => normalized.includes(term)).length;

  return Math.min(100, Math.round(numericSignals * 12 + impactSignals * 7));
}

function scoreAiProjectRelevance(resumeText: string, jobDescription: string) {
  const normalized = normalizeText(`${resumeText} ${jobDescription}`);
  const matchedSignals = aiProjectTerms.filter((term) =>
    normalized.includes(normalizeText(term)),
  ).length;

  return Math.min(100, Math.round((matchedSignals / 7) * 100));
}

function scoreCareerRelevance(resumeText: string, jobDescription: string, careerProfile: CareerModeProfile) {
  const normalized = normalizeText(`${resumeText} ${jobDescription}`);
  const signals = uniqueTerms([...careerProfile.signals, ...careerProfile.keywords]).slice(0, 16);
  const matchedSignals = signals.filter((term) =>
    normalized.includes(normalizeText(term)),
  ).length;

  return Math.min(100, Math.round((matchedSignals / Math.max(4, Math.min(10, signals.length))) * 100));
}

function scoreSignalFit(text: string, signals: string[]) {
  const normalized = normalizeText(text);
  const matchedSignals = signals.filter((term) =>
    normalized.includes(normalizeText(term)),
  ).length;

  return Math.min(100, Math.round((matchedSignals / Math.max(1, signals.length)) * 100));
}

function scoreAtsReadability(resumeText: string) {
  const lines = resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasBullets = lines.some((line) => /^[-*•]\s+/.test(line));
  const hasContact = /@|phone|linkedin|location/i.test(resumeText);
  const hasClearSections = /(experience|education|skills|summary|certifications)/i.test(
    resumeText,
  );
  const longBullets = lines.filter((line) => /^[-*•]\s+/.test(line) && line.length > 220);

  return Math.max(
    0,
    Math.min(
      100,
      40 + (hasBullets ? 20 : 0) + (hasContact ? 20 : 0) + (hasClearSections ? 20 : 0) - longBullets.length * 6,
    ),
  );
}

function scoreStructure(resumeText: string, careerProfile: CareerModeProfile) {
  const expected = careerProfile.sectionPriority.map((section) => section.toLowerCase());
  const normalized = normalizeText(resumeText);
  const matched = expected.filter((item) =>
    item
      .split(/[\/&]/)
      .some((part) => normalized.includes(normalizeText(part))),
  ).length;

  return Math.round((matched / expected.length) * 100);
}

function scoreFormattingRisk(resumeText: string) {
  const riskSignals = [/\|{3,}/, /\t{2,}/, /<table/i, /\[image\]/i].filter((pattern) =>
    pattern.test(resumeText),
  ).length;
  const longLines = resumeText.split(/\r?\n/).filter((line) => line.length > 260).length;

  return Math.max(0, 100 - riskSignals * 18 - longLines * 5);
}

function calculateReadinessScore(
  resumeText: string,
  jobDescription: string,
  targetRole: string,
  careerProfile: CareerModeProfile,
) {
  const { requiredKeywords, preferredKeywords, allKeywords } =
    extractJobKeywordGroups(jobDescription, careerProfile);
  const requiredScore = percentMatched(resumeText, requiredKeywords);
  const preferredScore = percentMatched(resumeText, preferredKeywords);
  const roleAlignment = scoreRoleAlignment(resumeText, jobDescription, targetRole, careerProfile);
  const metricsImpact = scoreMetricsImpact(resumeText);
  const aiProjectRelevance = scoreAiProjectRelevance(resumeText, jobDescription);
  const careerRelevance = scoreCareerRelevance(resumeText, jobDescription, careerProfile);
  const targetContext = `${targetRole} ${jobDescription}`;
  const isAcademic = isAcademicCareer(careerProfile);
  const keywordMatch = Math.round(requiredScore * 0.65 + preferredScore * 0.35);
  const atsReadability = scoreAtsReadability(resumeText);
  const structure = scoreStructure(resumeText, careerProfile);
  const formattingRisk = scoreFormattingRisk(resumeText);
  const academicFit = scoreSignalFit(`${resumeText} ${targetContext}`, academicSignals);
  const technicalFit = scoreSignalFit(`${resumeText} ${targetContext}`, technicalSignals);
  const score = Math.min(
    100,
    Math.round(
      keywordMatch * 0.25 +
        roleAlignment * 0.2 +
        metricsImpact * 0.15 +
        atsReadability * 0.12 +
        structure * 0.1 +
        formattingRisk * 0.08 +
        (isAcademic ? academicFit : careerRelevance || technicalFit) * 0.1,
    ),
  );
  const resumeKeywords = extractKeywords(resumeText);
  const matchedKeywords = allKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const missingKeywords = allKeywords.filter(
    (keyword) => !resumeKeywords.includes(keyword),
  );

  return {
    score,
    scoreBreakdown: {
      keywordMatch,
      requiredKeywords: requiredScore,
      preferredKeywords: preferredScore,
      roleAlignment,
      impactMetrics: metricsImpact,
      metricsImpact,
      aiProjectRelevance,
      atsReadability,
      structure,
      formattingRisk,
      academicFit,
      technicalFit,
    },
    matchedKeywords,
    missingKeywords,
  };
}

function applyScoreGuardrails<T extends { score: number; scoreBreakdown: ScoreBreakdown }>(
  candidate: T,
  baseline: ReadinessScore | null,
  label: ResumeScoreLabel,
): T & { rawScore?: number; scoreWarning?: string } {
  if (!baseline) {
    return candidate;
  }

  const before = baseline.scoreBreakdown;
  const after = candidate.scoreBreakdown;
  const coreImproved =
    after.keywordMatch >= before.keywordMatch &&
    after.roleAlignment >= before.roleAlignment &&
    after.structure >= before.structure;
  const qualityWorsened =
    after.atsReadability < before.atsReadability - 8 ||
    after.structure < before.structure - 8 ||
    after.formattingRisk < before.formattingRisk - 10;
  const guardedScore =
    coreImproved && !qualityWorsened && candidate.score < baseline.score
      ? baseline.score
      : candidate.score;
  const scoreWarning =
    candidate.score < baseline.score
      ? qualityWorsened
        ? `${label} decreased because readability, structure, or formatting risk worsened.`
        : coreImproved
          ? `${label} matched the source score floor because target alignment improved without a clear quality loss.`
          : `${label} decreased because keyword match, role alignment, or section structure did not improve enough.`
      : undefined;

  return {
    ...candidate,
    score: guardedScore,
    rawScore: candidate.score,
    scoreWarning,
  };
}

function uniqueTerms(terms: string[]) {
  return Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function analyzeTailoringIntelligence(
  resumeText: string,
  jobDescription: string,
  targetRole: string,
  careerProfile: CareerModeProfile,
): TailoringIntelligence {
  const context = `${targetRole} ${jobDescription}`;
  const normalizedContext = normalizeText(context);
  const normalizedResume = normalizeText(resumeText);
  const { requiredKeywords, preferredKeywords } = extractJobKeywordGroups(jobDescription, careerProfile);
  const isAcademic = isAcademicCareer(careerProfile);
  const headings = getCareerSectionHeadings(careerProfile, resumeText);
  const domainFocus = uniqueTerms(
    [...careerProfile.keywords, ...keywordBank]
      .filter((term) => normalizedContext.includes(normalizeText(term)))
      .slice(0, 10),
  );
  const leadershipExpectations = [
    normalizedContext.includes("stakeholder") ? "Stakeholder alignment" : "",
    normalizedContext.includes("roadmap") ? "Roadmap ownership" : "",
    normalizedContext.includes("governance") || normalizedContext.includes("delivery")
      ? "Delivery governance"
      : "",
    normalizedContext.includes("cross functional") || normalizedContext.includes("cross-functional")
      ? "Cross-functional leadership"
      : "",
  ];
  const technicalExpectations = [
    normalizedContext.includes("ai") || normalizedContext.includes("ml") ? "AI/ML delivery" : "",
    normalizedContext.includes("api") ? "API/platform collaboration" : "",
    normalizedContext.includes("data") || normalizedContext.includes("analytics") ? "Data and analytics fluency" : "",
    normalizedContext.includes("responsible ai") ? "Responsible AI practices" : "",
  ];
  const researchExpectations = [
    normalizedContext.includes("research") ? "Clear research agenda" : "",
    normalizedContext.includes("methodology") ? "Methodological fit" : "",
    normalizedContext.includes("faculty") ? "Faculty/program alignment" : "",
    normalizedContext.includes("publication") || normalizedContext.includes("journal")
      ? "Publication evidence"
      : "",
  ];
  const missingEvidence = [...requiredKeywords, ...preferredKeywords]
    .filter((term) => !normalizedResume.includes(normalizeText(term)))
    .slice(0, 8);

  return {
    targetType: careerProfile.targetType,
    careerMode: careerProfile.label,
    sectionPriority:
      careerProfile.id === "academia-phd-research"
        ? [
            headings.summary,
            headings.education,
            headings.research,
            headings.experience,
            "Teaching Experience",
            "Conferences / Presentations",
            "Grants / Awards",
            headings.projects,
            headings.skills,
          ]
        : [
            headings.summary,
            headings.skills,
            headings.experience,
            headings.projects,
            headings.research,
            headings.education,
            headings.certifications,
          ],
    templateRecommendation: labelForTemplate(careerProfile.templateRecommendation),
    requiredSkills: requiredKeywords,
    preferredSkills: preferredKeywords,
    institutionalFocus: isAcademic
      ? ["Academic fit", "Research agenda", "Faculty alignment", "Policy/legal/economic relevance"]
      : ["Business outcomes", "Execution credibility", "Stakeholder trust", "Operational maturity"],
    domainFocus,
    leadershipExpectations: uniqueTerms(leadershipExpectations),
    technicalExpectations: uniqueTerms(technicalExpectations),
    researchExpectations: uniqueTerms(researchExpectations),
    missingEvidence,
    positioningAngle: careerProfile.positioningAngle,
    suggestedImprovements: [
      "Add the target title near the header or summary when accurate.",
      "Use required skills naturally in experience bullets instead of stacking keywords.",
      `Use ${careerProfile.label.toLowerCase()} language such as ${careerProfile.suggestedLanguage.slice(0, 3).join(", ")}.`,
      "Attach measurable scope, business value, research output, client value, patient/community impact, or other field-appropriate evidence to the strongest bullets.",
      isAcademic
        ? "Move research interests, publications, education, and teaching above industry experience."
        : `Prioritize sections in this order: ${careerProfile.sectionPriority.slice(0, 5).join(", ")}.`,
    ],
    warnings: [
      "Avoid keyword stuffing; each keyword should be tied to evidence.",
      "Do not invent metrics. Add a metric prompt where the exact number is not known.",
    ],
  };
}

function buildAtsWarnings(
  resumeText: string,
  jobDescription: string,
  targetRole: string,
  breakdown: ScoreBreakdown,
  careerProfile: CareerModeProfile,
) {
  const warnings: string[] = [];
  const lines = resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bullets = lines.filter((line) => /^[-*•]\s+/.test(line));
  const weakVerbPattern = /^[-*•]\s*(worked on|helped|responsible for|did|used|made)\b/i;

  if (!/@/.test(resumeText) || !/phone|linkedin|location|\d{3}/i.test(resumeText)) {
    warnings.push("Missing or incomplete contact details.");
  }
  if (targetRole && !normalizeText(resumeText.slice(0, 300)).includes(normalizeText(targetRole).split(" ")[0])) {
    warnings.push("Missing target role title near the top of the resume.");
  }
  if (scoreMetricsImpact(resumeText) < 45) {
    warnings.push(`Missing field-appropriate evidence for ${careerProfile.label.toLowerCase()} achievements.`);
  }
  if (bullets.filter((bullet) => bullet.length > 210).length > 0) {
    warnings.push("Very long bullets may reduce scan quality.");
  }
  if (bullets.filter((bullet) => weakVerbPattern.test(bullet)).length > 0) {
    warnings.push("Weak action verbs detected in some bullets.");
  }
  if (extractJobKeywordGroups(jobDescription, careerProfile).allKeywords.some((keyword) => !normalizeText(resumeText).includes(normalizeText(keyword)))) {
    warnings.push("Missing required or preferred skills from the job description.");
  }
  if (breakdown.structure < 70) {
    warnings.push("Unclear or incomplete section structure.");
  }
  if (breakdown.formattingRisk < 80) {
    warnings.push("Too many graphics, tables, long lines, or unusual formatting may create ATS risk.");
  }
  if (isAcademicCareer(careerProfile) && !/publication|research interests|teaching|conference|writing|legal|policy/i.test(resumeText)) {
    warnings.push("Poor academic structure for PhD/CV use case.");
  }

  return warnings.length > 0 ? warnings : ["No major ATS warnings detected."];
}

function buildAchievementSuggestions(
  resumeText: string,
  careerProfile: CareerModeProfile,
): AchievementSuggestion[] {
  const weakBullets = uniqueTerms(resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => normalizeBulletText(line))
    .filter((bullet) => {
      const normalized = normalizeText(bullet);
      const hasMetric = /(\$?\d+[\d,.]*\+?%?|\d+\s*(?:m|k)\+?)/i.test(bullet);
      const hasAction = impactTerms.some((term) => normalized.includes(term));
      const hasResult = /\b(result|growth|reduced|increased|improved|launched|delivered|outcome|efficiency)\b/i.test(bullet);

      return !hasMetric || !hasAction || !hasResult || bullet.length < 70;
    }))
    .slice(0, 5);

  return weakBullets.map((bullet) => {
    const normalized = normalizeText(bullet);
    const hasAction = impactTerms.some((term) => normalized.includes(term));
    const hasMetric = /(\$?\d+[\d,.]*\+?%?|\d+\s*(?:m|k)\+?)/i.test(bullet);
    const hasResult = /\b(result|growth|reduced|increased|improved|launched|delivered|outcome|efficiency)\b/i.test(bullet);
    const hasRoleAlignment = careerProfile.keywords.some((term) => normalized.includes(normalizeText(term)));
    const category: AchievementSuggestionCategory = !hasMetric
      ? "Add Metric"
      : !hasAction
        ? "Strengthen Action Verb"
        : bullet.length < 70
          ? "Clarify Scope"
          : !hasResult
            ? "Add Result"
            : !hasRoleAlignment
              ? "Improve Role Alignment"
              : "Clarify Scope";
    const missing = [
      hasAction ? "" : "action",
      bullet.length > 80 ? "" : "scope",
      /\busing|through|with|by\b/i.test(bullet) ? "" : "method",
      hasMetric ? "" : "metric",
      hasResult ? "" : "result",
      hasRoleAlignment ? "" : "role alignment",
    ].filter(Boolean);

    return {
      original: bullet,
      category,
      missing,
      improved: improveBulletForCareer(bullet, careerProfile),
      metricPrompt:
        `Add ${careerProfile.label.toLowerCase()} evidence if available: ${careerProfile.achievementExamples[0] || "scope, method, stakeholder value, quality signal, or measurable outcome"}`,
    };
  }).filter((suggestion) => suggestion.improved !== suggestion.original);
}

function improveBulletForCareer(bullet: string, careerProfile: CareerModeProfile) {
  const cleaned = bullet.replace(/\.$/, "");
  const normalized = normalizeText(cleaned);
  const startsWeak = /^(worked on|helped|responsible for|did|used|made|handled|assisted with)\b/i.test(cleaned);
  const actionVerb = titleCase(careerProfile.actionVerbs[0] || "led");
  const actionFramed = startsWeak
    ? cleaned.replace(/^(worked on|helped|responsible for|did|used|made|handled|assisted with)\b/i, actionVerb)
    : /^[A-Z][a-z]+ed\b/.test(cleaned)
      ? cleaned
      : `${actionVerb} ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
  const rolePhrase = careerProfile.suggestedLanguage.find((phrase) =>
    !normalized.includes(normalizeText(phrase)),
  );
  const methodPhrase = /\b(using|through|with|by)\b/i.test(actionFramed)
    ? ""
    : ` through ${rolePhrase || "structured execution"}`;

  return `${actionFramed}${methodPhrase}.`;
}

function extractResumeBullets(sourceText: string) {
  return cleanResumeText(sourceText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map(normalizeBulletText)
    .filter((line) => line.length > 12);
}

function selectRelevantBullets(sourceText: string, jobDescription: string, careerProfile: CareerModeProfile, limit: number) {
  const priorityTerms = uniqueTerms([
    ...extractKeywords(jobDescription),
    ...careerProfile.keywords,
    ...careerProfile.signals,
  ]);

  return extractResumeBullets(sourceText)
    .map((line) => {
      const normalizedLine = normalizeText(line);
      const keywordScore = priorityTerms.filter((term) =>
        normalizedLine.includes(normalizeText(term)),
      ).length;
      const metricScore = /(\$?\d+[\d,.]*\+?%?|\d+\s*(?:m|k)\+?)/i.test(line) ? 3 : 0;

      return { line, score: keywordScore * 2 + metricScore + Math.min(2, line.length / 90) };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.line)
    .slice(0, limit);
}

function extractSectionText(sourceText: string, patterns: RegExp[]) {
  const parsed = parseResumePreview(sourceText);
  return sectionToEditableText(findSectionMatching(parsed, patterns));
}

function extractAcademicSignals(resumeText: string) {
  const academicLines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      /\b(ssrn|publication|paper|research|doi|journal|conference|working paper)\b/i.test(
        line,
      ),
    );

  return academicLines.join("\n");
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function firstMeaningfulLine(text: string, fallback: string) {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? fallback
  );
}

function normalizeIndustryLanguage(text: string) {
  const protectedPattern =
    /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|https?:\/\/\S+|www\.\S+|linkedin\.com\/\S+)/gi;
  const protectedValues: string[] = [];
  let normalized = text.replace(protectedPattern, (match) => {
    protectedValues.push(match);
    return `__PROTECTED_${protectedValues.length - 1}__`;
  });

  const replacements: Array<[RegExp, string]> = [
    [/\bmanaged(\s+\d+\+?)\s+staff\b/gi, "managed$1 cross-functional team members"],
    [/\bstaff\b/gi, "team members"],
    [/\bhelped connect\b/gi, "aligned"],
    [/\bhelped\b/gi, "supported"],
    [/\bworked on\b/gi, "contributed to"],
    [/\bresponsible for\b/gi, "led"],
    [/\bdid\b/gi, "executed"],
    [/\bused\b/gi, "applied"],
    [/\bmade\b/gi, "developed"],
    [/\bhandled\b/gi, "managed"],
    [/\bassisted with\b/gi, "supported"],
  ];

  for (const [pattern, replacement] of replacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  return protectedValues.reduce(
    (current, value, index) => current.replace(`__PROTECTED_${index}__`, value),
    normalized,
  );
}

function normalizeResumeLine(rawLine: string) {
  return normalizeIndustryLanguage(rawLine)
    .replace(/\u2022/g, "•")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBulletText(rawLine: string) {
  return normalizeResumeLine(rawLine)
    .replace(/^[-*•]+\s*/, "")
    .replace(/^[-*•]+$/, "")
    .trim();
}

function cleanResumeText(resumeText: string) {
  return normalizeIndustryLanguage(resumeText)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((rawLine) => {
      const trimmed = rawLine.trim();

      if (/^[-*•]+\s*$/.test(trimmed)) {
        return "";
      }

      if (/^[-*]\s+/.test(trimmed)) {
        return `- ${normalizeBulletText(trimmed)}`;
      }

      if (/^•\s+/.test(trimmed)) {
        return `- ${normalizeBulletText(trimmed)}`;
      }

      return normalizeResumeLine(trimmed);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildTailoredResume(
  masterResume: string,
  jobDescription: string,
  targetRole: string,
  careerProfile: CareerModeProfile,
): TailoringResult {
  const sourceResume = cleanResumeText(masterResume);
  const initialScore = calculateReadinessScore(
    sourceResume,
    jobDescription,
    targetRole,
    careerProfile,
  );
  const role = titleCase(targetRole || targetResumeTitle);
  const headings = getCareerSectionHeadings(careerProfile, sourceResume);
  const strongestKeywords = [
    ...initialScore.matchedKeywords,
    ...initialScore.missingKeywords.slice(0, 4),
  ].slice(0, 12);
  const skills = Array.from(
    new Set([
      ...strongestKeywords,
      ...careerProfile.keywords.slice(0, 8),
      ...careerProfile.suggestedLanguage.slice(0, 5),
      "Stakeholder Alignment",
      "Cross-Functional Collaboration",
      "Measurable Outcomes",
    ]),
  );
  const relevantBullets = selectRelevantBullets(sourceResume, jobDescription, careerProfile, 9);
  const bullets = (relevantBullets.length > 0
    ? relevantBullets
    : careerProfile.achievementExamples)
    .slice(0, 6)
    .map((bullet) => improveBulletForCareer(bullet, careerProfile));
  const candidateName = firstMeaningfulLine(sourceResume, "Candidate Name");
  const sourceParsed = parseResumePreview(sourceResume);
  const candidateTitle = role || sourceParsed.title;
  const contactLine = sourceParsed.contact || "";
  const education = extractSectionText(sourceResume, [/EDUCATION/]);
  const certifications = extractSectionText(sourceResume, [/CERTIFICATIONS?/, /LICENSES?/]);
  const research = extractSectionText(sourceResume, [/RESEARCH/, /PUBLICATIONS?/, /WRITING/, /CONFERENCES?/]);
  const projectEvidence = selectRelevantBullets(sourceResume, `${jobDescription} project portfolio campaign research market design`, careerProfile, 4)
    .filter((bullet) => !bullets.some((existing) => normalizeText(existing).includes(normalizeText(bullet).slice(0, 40))));
  const summary = `${candidateTitle} with evidence across ${careerProfile.suggestedLanguage.slice(0, 3).join(", ") || careerProfile.label.toLowerCase()} and transferable experience aligned to ${careerProfile.label.toLowerCase()} priorities. Brings documented strengths in ${skills.slice(0, 5).join(", ")} while preserving only facts supported by the source resume and uploaded documents.`;
  const experienceHeading = headings.experience.toUpperCase();
  const projectsHeading = headings.projects.toUpperCase();
  const skillsHeading = headings.skills.toUpperCase();
  const summaryHeading = headings.summary.toUpperCase();
  const researchHeading = headings.research.toUpperCase();
  const educationHeading = headings.education.toUpperCase();
  const certificationHeading = headings.certifications.toUpperCase();
  const rewrittenResume = `${candidateName}
${candidateTitle}
${contactLine}

${summaryHeading}
${summary}

${skillsHeading}
${skills.join(" | ")}

${experienceHeading}
${bullets.map((bullet) => `- ${bullet}`).join("\n")}

${projectsHeading}
- ${(projectEvidence[0] ? improveBulletForCareer(projectEvidence[0], careerProfile) : careerProfile.achievementExamples[0]).replace(/\.$/, ".")}
${projectEvidence.slice(1, 3).map((bullet) => `- ${improveBulletForCareer(bullet, careerProfile)}`).join("\n")}

${research ? `${researchHeading}\n${research}\n` : ""}

${education ? `${educationHeading}\n${education}\n` : ""}

${certifications ? `${certificationHeading}\n${certifications}` : ""}`;
  const cleanedRewrittenResume = cleanResumeText(rewrittenResume);
  const finalScore = calculateReadinessScore(
    cleanedRewrittenResume,
    jobDescription,
    targetRole,
    careerProfile,
  );
  const intelligence = analyzeTailoringIntelligence(
    cleanedRewrittenResume,
    jobDescription,
    targetRole,
    careerProfile,
  );

  return applyScoreGuardrails({
    score: finalScore.score,
    scoreBreakdown: finalScore.scoreBreakdown,
    matchedKeywords: finalScore.matchedKeywords,
    missingKeywords: finalScore.missingKeywords,
    summary,
    skills,
    bullets,
    rewrittenResume: cleanedRewrittenResume,
    intelligence,
    atsSimulation: {
      subScores: finalScore.scoreBreakdown,
      warnings: buildAtsWarnings(
        cleanedRewrittenResume,
        jobDescription,
        targetRole,
        finalScore.scoreBreakdown,
        careerProfile,
      ),
    },
    achievementSuggestions: buildAchievementSuggestions(cleanedRewrittenResume, careerProfile),
  }, initialScore, "Tailored Resume Score");
}

function parseResumePreview(resumeText: string) {
  const lines = cleanResumeText(resumeText).split(/\r?\n/);
  const name = lines[0]?.trim() || "Candidate Name";
  const contactLineIndex = lines.findIndex((line, index) =>
    index > 0 &&
    index < 8 &&
    /@|linkedin|phone|mobile|location|\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/i.test(line),
  );
  const title = lines
    .slice(1, Math.max(2, contactLineIndex > -1 ? contactLineIndex : 2))
    .find((line) => line.trim() && !/@|linkedin|phone|mobile|location|\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/i.test(line))
    ?.trim() || "Target Role";
  const contact = contactLineIndex > -1 ? lines[contactLineIndex].trim() : "";
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (const rawLine of lines.filter((_, index) => index > 0 && index !== contactLineIndex && rawLineIndexIsNotTitle(index, title, lines))) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const cleanedLine = line.replace(/^#{1,6}\s*/, "").replace(/^\*+\s*/, "");
    const isHeading = isResumeSectionHeading(cleanedLine);

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

    if (/^[-*•]\s+/.test(cleanedLine)) {
      const bullet = normalizeBulletText(cleanedLine);

      if (bullet) {
        currentSection.bullets.push(bullet);
      }
    } else {
      const normalizedLine = normalizeResumeLine(cleanedLine);

      if (normalizedLine) {
        currentSection.body.push(normalizedLine);
      }
    }
  }

  return {
    name,
    title,
    contact,
    sections: sections.filter(
      (section) => section.body.length > 0 || section.bullets.length > 0,
    ),
  };
}

function rawLineIndexIsNotTitle(index: number, title: string, lines: string[]) {
  return index !== lines.findIndex((line) => line.trim() === title);
}

function isResumeSectionHeading(line: string) {
  const cleaned = line.replace(/:$/, "").trim();
  const knownHeading =
    /^(summary|professional summary|profile|objective|skills|core skills|technical skills|experience|professional experience|work experience|employment|projects|selected projects|education|certifications|licenses|publications|research|research experience|publications \/ research|publications \/ working papers|teaching experience|conferences|conferences \/ presentations|grants \/ awards|awards)$/i.test(cleaned);
  const uppercaseHeading =
    cleaned === cleaned.toUpperCase() &&
    /^[A-Z0-9 &/+-]+$/.test(cleaned) &&
    cleaned.length <= 60;

  return !cleaned.startsWith("-") && (knownHeading || uppercaseHeading);
}

function findSectionMatching(resume: ParsedResume, patterns: RegExp[]) {
  return resume.sections.find((section) =>
    patterns.some((pattern) => pattern.test(section.heading)),
  );
}

function sectionToEditableText(section: ResumeSection | undefined) {
  if (!section) {
    return "";
  }

  return [
    ...section.body,
    ...section.bullets.map((bullet) => `- ${bullet}`),
  ].join("\n");
}

function extractContactValue(contact: string, label: string, fallback: string) {
  const match = contact.match(new RegExp(`${label}:\\s*([^|]+)`, "i"));

  return match?.[1]?.trim() || fallback;
}

function parseContactItems(contact: string): ContactItem[] {
  const parts = contact.split("|").map((part) => part.trim()).filter(Boolean);
  const values = {
    email: extractContactValue(contact, "Email", "") || parts.find((part) => /@/.test(part)) || "",
    phone: extractContactValue(contact, "Phone", "") || parts.find((part) => /\d{3}/.test(part) && !/@/.test(part)) || "",
    location: extractContactValue(contact, "Location", ""),
    linkedIn: extractContactValue(contact, "LinkedIn", "") || parts.find((part) => /linkedin/i.test(part)) || "",
    portfolio: extractContactValue(contact, "Portfolio", "") || parts.find((part) => /portfolio|behance|dribbble|github/i.test(part)) || "",
    website: extractContactValue(contact, "Website", "") || parts.find((part) => /https?:\/\/|www\./i.test(part) && !/linkedin|portfolio|behance|dribbble|github/i.test(part)) || "",
  };

  return [
    { key: "email", label: "EMAIL", value: values.email },
    { key: "phone", label: "PHONE", value: values.phone },
    { key: "location", label: "LOCATION", value: values.location },
    { key: "linkedIn", label: "LINKEDIN", value: values.linkedIn },
    { key: "portfolio", label: "PORTFOLIO", value: values.portfolio },
    { key: "website", label: "WEBSITE", value: values.website },
  ].filter((item) => item.value.trim()) as ContactItem[];
}

function formatContactForDisplay(contact: string, style: ContactDisplayStyle) {
  const items = parseContactItems(contact);

  if (items.length === 0) {
    return contact;
  }

  if (style === "labels") {
    return items.map((item) => `${item.label}: ${item.value}`).join(" | ");
  }

  if (style === "minimal" || style === "centered") {
    return items.map((item) => item.value).join(" | ");
  }

  return items.map((item) => item.value).join(" | ");
}

function extractRegexValue(text: string, pattern: RegExp) {
  return text.match(pattern)?.[0]?.replace(/[),.;]+$/, "").trim() || "";
}

function cleanExtractedField(value: string) {
  return cleanResumeText(value)
    .replace(/^(name|title|email|phone|location|linkedin)\s*:\s*/i, "")
    .replace(/\s+\|\s+$/g, "")
    .trim();
}

function inferLocation(lines: string[]) {
  return (
    lines
      .slice(0, 8)
      .map((line) => line.replace(/.*location:\s*/i, "").trim())
      .find((line) =>
        /\b[A-Z][a-z]+,\s*[A-Z]{2}\b|\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b/.test(line) &&
        !/@|linkedin|github|portfolio/i.test(line),
      ) || ""
  );
}

function extractEditableResumeDetails(sourceText: string, targetRole: string): EditableResume {
  const cleaned = cleanResumeText(sourceText);
  const lines = cleaned.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed = parseResumePreview(cleaned);
  const email = extractRegexValue(cleaned, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = extractRegexValue(cleaned, /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/);
  const linkedIn = extractRegexValue(cleaned, /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|,)]+/i);
  const portfolio = extractRegexValue(cleaned, /(?:https?:\/\/)?(?:www\.)?(?:behance|dribbble|github)\.com\/[^\s|,)]+/i);
  const website = extractRegexValue(cleaned, /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s|,)]*)?/i);
  const firstNonContactLine =
    lines.find((line) => !/@|linkedin|github|portfolio|\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/i.test(line)) || "";
  const likelyName =
    firstNonContactLine &&
    firstNonContactLine.length <= 60 &&
    firstNonContactLine.split(/\s+/).length <= 5 &&
    !isResumeSectionHeading(firstNonContactLine)
      ? titleCase(firstNonContactLine)
      : "";
  const likelyTitle =
    parsed.title !== "Target Role" && parsed.title.length <= 90
      ? parsed.title
      : targetRole;
  const summarySection = findSectionMatching(parsed, [/SUMMARY/, /PROFILE/, /OBJECTIVE/, /RESEARCH INTERESTS/]);
  const skillsSection = findSectionMatching(parsed, [/SKILLS?/, /TOOLS?/, /TECHNICAL SKILLS?/]);

  return {
    name: cleanExtractedField(likelyName || parsed.name),
    title: cleanExtractedField(likelyTitle),
    email: cleanExtractedField(email || extractContactValue(parsed.contact, "Email", "")),
    phone: cleanExtractedField(phone || extractContactValue(parsed.contact, "Phone", "")),
    location: cleanExtractedField(extractContactValue(parsed.contact, "Location", "") || inferLocation(lines)),
    linkedIn: cleanExtractedField(linkedIn || extractContactValue(parsed.contact, "LinkedIn", "")),
    portfolio: cleanExtractedField(portfolio || extractContactValue(parsed.contact, "Portfolio", "")),
    website: cleanExtractedField((website && !/linkedin|behance|dribbble|github/i.test(website) ? website : "") || extractContactValue(parsed.contact, "Website", "")),
    summary: sectionToEditableText(summarySection),
    coreSkills: sectionToEditableText(skillsSection).replace(/\n/g, " | "),
    experience: sectionToEditableText(findSectionMatching(parsed, [/EXPERIENCE/, /EMPLOYMENT/, /ENGAGEMENTS?/, /PROGRAMS?/, /POLICY/, /CLINICAL/, /TECHNOLOGY/, /FINANCE/, /INVESTMENT/, /ENGINEERING/])),
    projects: sectionToEditableText(findSectionMatching(parsed, [/PROJECTS?/, /DEALS?/, /CAMPAIGNS?/, /PORTFOLIO/, /IMPACT/, /PROCESS/, /QUALITY/, /COMPLIANCE/, /INFORMATICS/, /MARKET/])),
    research: sectionToEditableText(findSectionMatching(parsed, [/RESEARCH/, /WRITING/, /TOOLS/])),
    education: sectionToEditableText(findSectionMatching(parsed, [/EDUCATION/])),
    certifications: sectionToEditableText(findSectionMatching(parsed, [/CERTIFICATIONS?/, /LICENSES?/])),
    publications: sectionToEditableText(findSectionMatching(parsed, [/PUBLICATIONS/, /WORKING PAPERS/])),
    teaching: sectionToEditableText(findSectionMatching(parsed, [/TEACHING/])),
    conferences: sectionToEditableText(findSectionMatching(parsed, [/CONFERENCES?/, /PRESENTATIONS?/])),
    awards: sectionToEditableText(findSectionMatching(parsed, [/GRANTS?/, /AWARDS?/])),
  };
}

function mergeExtractedResumeDetails(
  current: EditableResume | null,
  extracted: EditableResume,
  dirtyFields: Set<keyof EditableResume>,
) {
  if (!current) {
    return extracted;
  }

  const next = { ...current };

  for (const field of Object.keys(extracted) as Array<keyof EditableResume>) {
    if (!dirtyFields.has(field) && extracted[field].trim()) {
      next[field] = extracted[field];
    }
  }

  return next;
}

function parseEditableResume(resumeText: string): EditableResume {
  const extracted = extractEditableResumeDetails(resumeText, "");
  const resume = parseResumePreview(resumeText);
  const summarySection = findSectionMatching(resume, [/SUMMARY/, /RESEARCH INTERESTS/]);
  const skillsSection = findSectionMatching(resume, [/SKILLS?/, /TOOLS?/]);

  return {
    ...extracted,
    summary: summarySection?.body.join("\n") || extracted.summary,
    coreSkills: skillsSection?.body.join(" | ") || extracted.coreSkills,
  };
}

function normalizeEditableResume(resume: Partial<EditableResume> | null | undefined): EditableResume | null {
  if (!resume) {
    return null;
  }

  return {
    name: resume.name || "",
    title: resume.title || "",
    email: resume.email || "",
    phone: resume.phone || "",
    location: resume.location || "",
    linkedIn: resume.linkedIn || "",
    portfolio: resume.portfolio || "",
    website: resume.website || "",
    summary: resume.summary || "",
    coreSkills: resume.coreSkills || "",
    experience: resume.experience || "",
    projects: resume.projects || "",
    research: resume.research || "",
    education: resume.education || "",
    certifications: resume.certifications || "",
    publications: resume.publications || "",
    teaching: resume.teaching || "",
    conferences: resume.conferences || "",
    awards: resume.awards || "",
  };
}

function serializeEditableResume(
  resume: EditableResume,
  careerProfile: CareerModeProfile = careerModeProfiles["general-professional"],
  sourceText = "",
) {
  const headings = getCareerSectionHeadings(careerProfile, sourceText || [
    resume.summary,
    resume.coreSkills,
    resume.experience,
    resume.projects,
    resume.research,
  ].join("\n"));
  const sections = [
    [headings.summary.toUpperCase(), resume.summary],
    [headings.skills.toUpperCase(), resume.coreSkills],
    ...(careerProfile.id === "academia-phd-research"
      ? [
          ["EDUCATION", resume.education],
          [headings.research.toUpperCase(), resume.publications || resume.research],
          [headings.experience.toUpperCase(), resume.experience],
          ["TEACHING EXPERIENCE", resume.teaching],
          ["CONFERENCES / PRESENTATIONS", resume.conferences],
          ["GRANTS / AWARDS", resume.awards],
          [headings.projects.toUpperCase(), resume.projects],
        ]
      : [
          [headings.experience.toUpperCase(), resume.experience],
          [headings.projects.toUpperCase(), resume.projects],
          [headings.research.toUpperCase(), resume.research],
        ]),
    ["PUBLICATIONS", resume.publications],
    ["TEACHING EXPERIENCE", resume.teaching],
    ["CONFERENCES / PRESENTATIONS", resume.conferences],
    ["GRANTS / AWARDS", resume.awards],
    [headings.education.toUpperCase(), resume.education],
    [headings.certifications.toUpperCase(), resume.certifications],
  ]
    .map(([heading, body]) => [heading, cleanResumeText(body)] as [string, string])
    .filter(([, body]) => body.length > 0)
    .filter(([heading], index, allSections) =>
      allSections.findIndex(([candidateHeading]) => candidateHeading === heading) === index,
    )
    .map(([heading, body]) => `${heading}\n${body}`)
    .join("\n\n");
  const contact = [
    resume.email.trim() ? `Email: ${resume.email.trim()}` : "",
    resume.phone.trim() ? `Phone: ${resume.phone.trim()}` : "",
    resume.location.trim() ? `Location: ${resume.location.trim()}` : "",
    resume.linkedIn.trim() ? `LinkedIn: ${resume.linkedIn.trim()}` : "",
    resume.portfolio.trim() ? `Portfolio: ${resume.portfolio.trim()}` : "",
    resume.website.trim() ? `Website: ${resume.website.trim()}` : "",
  ].filter(Boolean).join(" | ");

  return cleanResumeText(`${resume.name.trim() || "Candidate Name"}
${resume.title.trim() || "Target Role"}
${contact}

${sections}`);
}

function formatResumeTextForExport(resumeText: string) {
  return cleanResumeText(resumeText).replace(/^(\s*)[-*]\s+/gm, "$1• ");
}

function buildResultFromEditedResume(
  resume: EditableResume,
  jobDescription: string,
  targetRole: string,
  careerProfile: CareerModeProfile,
  sourceText = "",
): TailoringResult {
  const rewrittenResume = cleanResumeText(serializeEditableResume(resume, careerProfile, sourceText));
  const readiness = calculateReadinessScore(
    rewrittenResume,
    jobDescription,
    targetRole,
    careerProfile,
  );
  const skills = resume.coreSkills
    .split("|")
    .map((skill) => skill.trim())
    .filter(Boolean);
  const bullets = resume.experience
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•]\s+/, ""))
    .filter(Boolean)
    .slice(0, 5);

  return {
    ...readiness,
    summary: resume.summary,
    skills,
    bullets,
    rewrittenResume,
    intelligence: analyzeTailoringIntelligence(
      rewrittenResume,
      jobDescription,
      targetRole,
      careerProfile,
    ),
    atsSimulation: {
      subScores: readiness.scoreBreakdown,
      warnings: buildAtsWarnings(
        rewrittenResume,
        jobDescription,
        targetRole,
        readiness.scoreBreakdown,
        careerProfile,
      ),
    },
    achievementSuggestions: buildAchievementSuggestions(rewrittenResume, careerProfile),
  };
}

function getInitialSavedResumeState(): SavedResumeState {
  const defaultState = getDefaultSavedResumeState();

  if (typeof window === "undefined") {
    return defaultState;
  }

  const saved = window.localStorage.getItem(savedResumeKey);

  if (!saved) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SavedResumeState>;
    const savedTemplate: TemplateId = templates.some(
      (template) => template.id === parsed.selectedTemplate,
    )
      ? (parsed.selectedTemplate as TemplateId)
      : "classic-executive";
    const savedTheme: ThemeId = themes.some(
      (theme) => theme.id === parsed.selectedTheme,
    )
      ? (parsed.selectedTheme as ThemeId)
      : "executive-navy";
    const savedCareerMode: CareerModeId = careerModeOptions.some(
      (option) => option.id === parsed.careerMode,
    )
      ? (parsed.careerMode as CareerModeId)
      : "general-professional";
    const candidateName =
      parsed.editableResume?.name ||
      firstMeaningfulLine(parsed.masterResume || sampleResume, "Candidate Name");
    const parsedCoverLetter: Partial<CoverLetterState> = parsed.coverLetter || {};
    const savedTone: CoverLetterTone = coverLetterToneOptions.some(
      (option) => option.id === parsedCoverLetter.tone,
    )
      ? (parsedCoverLetter.tone as CoverLetterTone)
      : "professional";
    const savedLength: CoverLetterLength = coverLetterLengthOptions.some(
      (option) => option.id === parsedCoverLetter.length,
    )
      ? (parsedCoverLetter.length as CoverLetterLength)
      : "standard";

    return {
      masterResume: parsed.masterResume || sampleResume,
      masterUploads: Array.isArray(parsed.masterUploads) ? parsed.masterUploads : [],
      jobDescription: parsed.jobDescription || sampleJob,
      targetRole: parsed.targetRole || targetResumeTitle,
      careerMode: savedCareerMode,
      customCareerField: parsed.customCareerField || "",
      editableResume: normalizeEditableResume(parsed.editableResume),
      selectedTemplate: savedTemplate,
      selectedTheme: savedTheme,
      downloadFileName:
        parsed.downloadFileName ||
        buildDefaultResumeFileName(
          candidateName,
          parsed.targetRole || targetResumeTitle,
        ),
      coverLetter: {
        organizationName: parsedCoverLetter.organizationName || "",
        contactName: parsedCoverLetter.contactName || "",
        targetTitle: parsedCoverLetter.targetTitle || parsed.targetRole || targetResumeTitle,
        tone: savedTone,
        length: savedLength,
        extraNotes: parsedCoverLetter.extraNotes || "",
        body: parsedCoverLetter.body || "",
        fileName:
          parsedCoverLetter.fileName ||
          buildDefaultCoverLetterFileName(
            candidateName,
            parsed.targetRole || targetResumeTitle,
          ),
      },
      outputScoreLabel:
        parsed.outputScoreLabel === "Optimized Resume Score"
          ? "Optimized Resume Score"
          : "Tailored Resume Score",
      contactDisplayStyle: ["labels", "icons", "minimal", "centered"].includes(parsed.contactDisplayStyle || "")
        ? (parsed.contactDisplayStyle as ContactDisplayStyle)
        : "labels",
    };
  } catch {
    window.localStorage.removeItem(savedResumeKey);
    return defaultState;
  }
}

function sanitizeResumeFileName(value: string) {
  const withoutExtension = value.replace(/\.(txt|pdf|docx)$/i, "");
  const sanitized = withoutExtension
    .trim()
    .replace(/[^a-zA-Z0-9 _-]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");

  return sanitized || "Tailored_Resume";
}

function buildDefaultResumeFileName(candidateName: string, targetRole: string) {
  return sanitizeResumeFileName(`${candidateName} ${targetRole} Resume`);
}

function buildResumeFileName(fileName: string, extension: string) {
  const baseName = sanitizeResumeFileName(fileName);

  return `${baseName}.${extension}`;
}

function createDefaultCoverLetterState(candidateName: string, targetRole: string): CoverLetterState {
  return {
    organizationName: "",
    contactName: "",
    targetTitle: targetRole,
    tone: "professional",
    length: "standard",
    extraNotes: "",
    body: "",
    fileName: buildDefaultCoverLetterFileName(candidateName, targetRole),
  };
}

function buildDefaultCoverLetterFileName(candidateName: string, targetRole: string) {
  return sanitizeResumeFileName(`${candidateName} ${targetRole} Cover Letter`);
}

function buildCoverLetterFileName(fileName: string, extension: string) {
  const baseName = sanitizeResumeFileName(fileName).replace(/_?Resume$/i, "_Cover_Letter");

  return `${baseName}.${extension}`;
}

function normalizeCoverLetterText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => normalizeResumeLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractStrongestAchievementLines(resumeText: string, jobDescription: string, careerProfile: CareerModeProfile) {
  const normalizedJob = normalizeText(jobDescription);
  const priorityTerms = uniqueTerms([
    ...extractKeywords(jobDescription),
    ...careerProfile.keywords,
    ...careerProfile.signals,
  ]);
  const lines = cleanResumeText(resumeText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map(normalizeBulletText)
    .filter((line) => line.length > 25);

  return lines
    .map((line) => {
      const normalizedLine = normalizeText(line);
      const keywordScore = priorityTerms.filter((term) =>
        normalizedLine.includes(normalizeText(term)),
      ).length;
      const metricScore = /(\$?\d+[\d,.]*\+?%?|\d+\s*(?:m|k)\+?)/i.test(line) ? 3 : 0;
      const jobPhraseScore = normalizedJob
        .split(/\s+/)
        .filter((word) => word.length > 5 && normalizedLine.includes(word)).length;

      return {
        line,
        score: keywordScore * 2 + metricScore + Math.min(4, jobPhraseScore),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.line);
}

function summarizeAchievementsForLetter(achievements: string[]) {
  if (achievements.length === 0) {
    return "";
  }

  const cleaned = achievements.map((achievement) =>
    achievement
      .replace(/\.$/, "")
      .replace(/\bI\b/g, "I")
      .trim(),
  );

  if (cleaned.length === 1) {
    return `My background includes ${cleaned[0].charAt(0).toLowerCase()}${cleaned[0].slice(1)}.`;
  }

  return `My most relevant experience includes ${cleaned
    .slice(0, 3)
    .map((line) => line.charAt(0).toLowerCase() + line.slice(1))
    .join("; ")}.`;
}

function getCoverLetterIndustryFrame(careerProfile: CareerModeProfile) {
  switch (careerProfile.id) {
    case "law-legal-policy":
      return "legal research, policy analysis, governance judgment, and clear written advocacy";
    case "finance-investment-banking":
      return "analytical rigor, market awareness, risk judgment, financial reporting, and decision-ready analysis";
    case "healthcare-medical-public-health":
      return "healthcare operations, compliance-aware workflows, quality improvement, and stakeholder coordination";
    case "academia-phd-research":
      return "research agenda fit, methodological discipline, scholarly writing, and contribution to the academic community";
    case "ai-data-technology":
    case "product-program-project":
    case "engineering-technical":
      return "technical fluency, product judgment, data-informed execution, roadmap clarity, and cross-functional delivery";
    case "consulting-strategy":
      return "structured problem solving, client-ready synthesis, business judgment, and implementation clarity";
    case "government-public-sector":
      return "public service orientation, policy implementation, compliance, reporting, and community impact";
    case "education-teaching":
      return "instructional design, learner support, assessment, and inclusive educational outcomes";
    case "marketing-growth-communications":
      return "audience insight, positioning, campaign performance, analytics, and growth execution";
    default:
      return careerProfile.suggestedLanguage.slice(0, 4).join(", ") || "role-specific judgment and measurable execution";
  }
}

function getCoverLetterSalutation(contactName: string) {
  return contactName.trim() ? `Dear ${contactName.trim()},` : "Dear Hiring Committee,";
}

function getToneGuidance(tone: CoverLetterTone) {
  switch (tone) {
    case "warm-confident":
      return "I am especially drawn to this opportunity because it calls for both credible execution and thoughtful collaboration.";
    case "executive":
      return "I bring senior ownership, judgment, and a practical record of moving complex priorities from ambiguity to execution.";
    case "academic":
      return "I am interested in the intellectual fit between my background and the program's research and professional priorities.";
    case "legal-policy":
      return "I am drawn to work that requires careful analysis, disciplined writing, sound judgment, and mission-aware advocacy.";
    case "concise":
      return "I offer a focused match for the role's core requirements and can contribute quickly.";
    default:
      return "I am interested in contributing experience that matches the role's priorities and the organization's needs.";
  }
}

function buildCoverLetter({
  masterResume,
  tailoredResume,
  jobDescription,
  targetRole,
  careerProfile,
  coverLetter,
  result,
}: {
  masterResume: string;
  tailoredResume: string;
  jobDescription: string;
  targetRole: string;
  careerProfile: CareerModeProfile;
  coverLetter: CoverLetterState;
  result: TailoringResult;
}) {
  const candidateName = firstMeaningfulLine(masterResume, "Candidate");
  const roleTitle = coverLetter.targetTitle.trim() || targetRole || "the opportunity";
  const organization = coverLetter.organizationName.trim();
  const organizationPhrase = organization ? ` at ${organization}` : "";
  const salutation = getCoverLetterSalutation(coverLetter.contactName);
  const isAcademic = careerProfile.id === "academia-phd-research";
  const isLegal = careerProfile.id === "law-legal-policy";
  const industryFrame = getCoverLetterIndustryFrame(careerProfile);
  const achievements = extractStrongestAchievementLines(
    `${tailoredResume}\n${masterResume}`,
    jobDescription,
    careerProfile,
  );
  const achievementSentence = summarizeAchievementsForLetter(achievements);
  const matchedSkills = uniqueTerms([
    ...result.matchedKeywords,
    ...result.skills,
    ...careerProfile.suggestedLanguage,
  ]).slice(0, coverLetter.length === "short" ? 4 : 7);
  const jobNeed = firstMeaningfulLine(jobDescription, roleTitle)
    .replace(roleTitle, "")
    .trim();
  const toneSentence = getToneGuidance(coverLetter.tone);
  const notesSentence = coverLetter.extraNotes.trim()
    ? `I have also taken into account your note to ${coverLetter.extraNotes.trim().replace(/\.$/, "")}.`
    : "";
  const fitSentence = organization
    ? `The opportunity${organizationPhrase} stands out because it emphasizes ${matchedSkills.join(", ") || industryFrame}, and my experience is strongest where those requirements meet practical execution.`
    : `The opportunity stands out because it emphasizes ${matchedSkills.join(", ") || industryFrame}, and my experience is strongest where those requirements meet practical execution.`;

  const opening = isAcademic
    ? `I am writing to express my interest in ${roleTitle}${organizationPhrase}. My background aligns with the program's emphasis on ${industryFrame}, and I am prepared to contribute a focused perspective shaped by research, professional execution, and interdisciplinary problem solving.`
    : isLegal
      ? `I am writing to express my interest in ${roleTitle}${organizationPhrase}. The role aligns with my interest in ${industryFrame}, and with experience that combines analysis, writing, stakeholder coordination, and accountable execution.`
      : `I am writing to apply for ${roleTitle}${organizationPhrase}. ${toneSentence}`;

  const middle = [
    achievementSentence ||
      `My experience aligns with the role through ${matchedSkills.join(", ") || industryFrame}, with emphasis on evidence, communication, and dependable delivery.`,
    `Across the resume I have tailored for this target, the strongest throughline is ${industryFrame}. ${
      jobNeed ? `That matches the job description's focus on ${jobNeed}.` : "That matches the job description without requiring generic keyword repetition."
    }`,
  ];

  const alignment = isAcademic
    ? `I would bring a clear contribution to the academic environment through disciplined research, careful writing, and readiness to engage with the program's intellectual priorities${organization ? ` at ${organization}` : ""}.`
    : isLegal
      ? `I would bring careful judgment, concise writing, and mission-aware analysis to the organization's legal and policy priorities${organization ? ` at ${organization}` : ""}.`
      : fitSentence;

  const closing = `Thank you for considering my application. I would welcome the opportunity to discuss how my background can support ${organization || "your team"} in ${roleTitle}.`;

  const paragraphs = [
    salutation,
    opening,
    ...middle,
    alignment,
    notesSentence,
    closing,
    `Sincerely,\n${candidateName}`,
  ].filter(Boolean);

  if (coverLetter.length === "short") {
    return normalizeCoverLetterText([
      salutation,
      opening,
      achievementSentence || alignment,
      closing,
      `Sincerely,\n${candidateName}`,
    ].filter(Boolean).join("\n\n"));
  }

  if (coverLetter.length === "standard") {
    return normalizeCoverLetterText([
      salutation,
      opening,
      middle[0],
      alignment,
      notesSentence,
      closing,
      `Sincerely,\n${candidateName}`,
    ].filter(Boolean).join("\n\n"));
  }

  return normalizeCoverLetterText(paragraphs.join("\n\n"));
}

function CoverLetterPdfDocument({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const styles = StyleSheet.create({
    page: {
      padding: 54,
      fontFamily: "Helvetica",
      color: "#18181b",
      fontSize: 11,
      lineHeight: 1.5,
    },
    paragraph: {
      marginBottom: 14,
      lineHeight: 1.5,
    },
  });

  return (
    <PdfDocument>
      <PdfPage size="LETTER" style={styles.page}>
        {paragraphs.map((paragraph, index) => (
          <PdfText key={`${paragraph}-${index}`} style={styles.paragraph}>
            {paragraph}
          </PdfText>
        ))}
      </PdfPage>
    </PdfDocument>
  );
}

async function exportCoverLetterPdf(text: string, fileName: string) {
  const blob = await pdf(<CoverLetterPdfDocument text={text} />).toBlob();
  saveAs(blob, buildCoverLetterFileName(fileName, "pdf"));
}

async function exportCoverLetterDocx(text: string, fileName: string) {
  const children = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) =>
      new Paragraph({
        spacing: { after: 220, line: 300 },
        widowControl: true,
        children: [new TextRun(paragraph)],
      }),
    );
  const document = new DocxDocument({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(document);

  saveAs(blob, buildCoverLetterFileName(fileName, "docx"));
}

function createPdfStyles(template: TemplateId, theme: ThemeId) {
  const palette = getThemePalette(theme);
  const isAts = template === "ats-clean";
  const templateDefinition = getTemplateDefinition(template);
  const isModern = ["Technology / Product", "Creative / Media / Fashion", "Architecture / Real Estate / Design"].includes(templateDefinition.category);
  const isAcademic = template === "academic-cv";
  const densityScale = templateDefinition.density === "compact" ? 0.88 : templateDefinition.density === "spacious" ? 1.14 : 1;

  return StyleSheet.create({
    page: {
      padding: isAts || isAcademic ? 42 : 40,
      fontFamily: "Helvetica",
      color: palette.text,
      fontSize: templateDefinition.density === "compact" ? 9.4 : 10,
      lineHeight: templateDefinition.density === "compact" ? 1.34 : 1.5,
    },
    header: {
      paddingBottom: isAts ? 12 : 14,
      marginBottom: isAts ? 4 : 2,
      borderBottomWidth: isAts ? 0 : 2,
      borderBottomColor: palette.sectionLine,
      backgroundColor: "#ffffff",
    },
    name: {
      fontSize: isModern ? 22 : isAcademic ? 20 : 24,
      fontWeight: 700,
      textTransform: "uppercase",
      color: palette.heading,
      lineHeight: 1.15,
    },
    title: {
      marginTop: 8,
      fontSize: 12,
      color: palette.accent,
      fontWeight: 700,
      lineHeight: 1.25,
    },
    contact: {
      marginTop: 7,
      fontSize: 8,
      color: "#52525b",
      textTransform: "uppercase",
      lineHeight: 1.35,
    },
    section: {
      marginTop: Math.round((isModern || isAcademic ? 14 : 16) * densityScale),
      marginBottom: 2,
      padding: isModern ? 8 : 0,
      borderWidth: isModern ? 1 : 0,
      borderColor: isModern ? palette.border : "#ffffff",
    },
    sectionKeepGroup: {
      marginBottom: 0,
    },
    heading: {
      borderBottomWidth: isAts ? 1 : 1.5,
      borderBottomColor: isAts ? "#d4d4d8" : palette.sectionLine,
      paddingBottom: 3,
      fontSize: 9,
      fontWeight: 700,
      color: palette.heading,
      textTransform: "uppercase",
    },
    roleBlock: {
      marginTop: 7,
    },
    paragraph: {
      marginTop: 7,
      lineHeight: 1.35,
    },
    roleLine: {
      fontWeight: 700,
      color: palette.text,
      lineHeight: 1.25,
    },
    detailLine: {
      marginTop: 2,
      color: "#52525b",
      lineHeight: 1.25,
    },
    bulletRow: {
      marginTop: 4,
      marginBottom: 4,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    bulletMarker: {
      width: 10,
      color: palette.bullet,
      fontSize: 10,
      lineHeight: 1.35,
    },
    bulletText: {
      flexGrow: 1,
      flexBasis: 0,
      lineHeight: 1.35,
    },
    chipText: {
      marginTop: 7,
      lineHeight: 1.35,
    },
  });
}

function PdfBodyLine({
  line,
  pdfStyles,
}: {
  line: string;
  pdfStyles: ReturnType<typeof createPdfStyles>;
}) {
  const parts = line.split("|").map((part) => part.trim());

  if (parts.length >= 3) {
    return (
      <PdfView style={pdfStyles.roleBlock} wrap={false}>
        <PdfText style={pdfStyles.roleLine}>{parts[0]}</PdfText>
        <PdfText style={pdfStyles.detailLine}>
          {parts.slice(1).join(" | ")}
        </PdfText>
      </PdfView>
    );
  }

  return (
    <PdfText style={pdfStyles.paragraph} orphans={3} widows={3}>
      {line}
    </PdfText>
  );
}

function PdfBulletLine({
  bullet,
  pdfStyles,
}: {
  bullet: string;
  pdfStyles: ReturnType<typeof createPdfStyles>;
}) {
  return (
    <PdfView style={pdfStyles.bulletRow} wrap={false}>
      <PdfText style={pdfStyles.bulletMarker}>•</PdfText>
      <PdfText style={pdfStyles.bulletText} orphans={3} widows={3}>
        {bullet}
      </PdfText>
    </PdfView>
  );
}

function ResumePdfDocument({
  resume,
  template,
  theme,
  contactStyle,
}: {
  resume: ParsedResume;
  template: TemplateId;
  theme: ThemeId;
  contactStyle: ContactDisplayStyle;
}) {
  const pdfStyles = createPdfStyles(template, theme);

  return (
    <PdfDocument>
      <PdfPage size="LETTER" style={pdfStyles.page}>
        <PdfView style={pdfStyles.header}>
          <PdfText style={pdfStyles.name}>{resume.name}</PdfText>
          <PdfText style={pdfStyles.title}>{resume.title}</PdfText>
          {resume.contact ? (
            <PdfText style={pdfStyles.contact}>{formatContactForDisplay(resume.contact, contactStyle)}</PdfText>
          ) : null}
        </PdfView>

        {resume.sections.map((section, sectionIndex) => {
          const isInlineSection = ["CORE SKILLS", "CERTIFICATIONS"].includes(
            section.heading,
          );
          const firstBodyLine = isInlineSection ? section.body.join(" | ") : section.body[0];
          const remainingBody = isInlineSection ? [] : section.body.slice(1);
          const firstBullets = firstBodyLine
            ? section.bullets.slice(0, 1)
            : section.bullets.slice(0, 2);
          const remainingBullets = section.bullets.slice(firstBullets.length);

          return (
            <PdfView
              key={`${section.heading}-${sectionIndex}`}
              style={pdfStyles.section}
              minPresenceAhead={48}
            >
              <PdfView style={pdfStyles.sectionKeepGroup} wrap={false}>
                <PdfText style={pdfStyles.heading} minPresenceAhead={36}>
                  {section.heading}
                </PdfText>
                {firstBodyLine ? (
                  isInlineSection ? (
                    <PdfText style={pdfStyles.chipText} orphans={3} widows={3}>
                      {firstBodyLine}
                    </PdfText>
                  ) : (
                    <PdfBodyLine line={firstBodyLine} pdfStyles={pdfStyles} />
                  )
                ) : null}
                {firstBullets.map((bullet, bulletIndex) => (
                  <PdfBulletLine
                    key={`${bullet}-${bulletIndex}`}
                    bullet={bullet}
                    pdfStyles={pdfStyles}
                  />
                ))}
              </PdfView>
              {remainingBody.map((line, lineIndex) => (
                <PdfBodyLine
                  key={`${line}-${lineIndex}`}
                  line={line}
                  pdfStyles={pdfStyles}
                />
              ))}
              {remainingBullets.map((bullet, bulletIndex) => (
                <PdfBulletLine
                  key={`${bullet}-${bulletIndex}`}
                  bullet={bullet}
                  pdfStyles={pdfStyles}
                />
              ))}
            </PdfView>
          );
        })}
      </PdfPage>
    </PdfDocument>
  );
}

async function exportResumePdf(
  resume: ParsedResume,
  fileName: string,
  template: TemplateId,
  theme: ThemeId,
  contactStyle: ContactDisplayStyle,
) {
  const blob = await pdf(
    <ResumePdfDocument resume={resume} template={template} theme={theme} contactStyle={contactStyle} />,
  ).toBlob();
  saveAs(blob, buildResumeFileName(fileName, "pdf"));
}

function createDocxBodyLine(line: string) {
  const parts = line.split("|").map((part) => part.trim());

  if (parts.length >= 3) {
    return new Paragraph({
      spacing: { before: 180, after: 60 },
      keepNext: true,
      keepLines: true,
      widowControl: true,
      children: [
        new TextRun({ text: parts[0], bold: true }),
        new TextRun({ text: ` | ${parts.slice(1).join(" | ")}`, color: "52525B" }),
      ],
    });
  }

  return new Paragraph({
    spacing: { before: 120, after: 60 },
    keepLines: true,
    widowControl: true,
    children: [new TextRun(line)],
  });
}

function createDocxBulletLine(bullet: string, markerColor: string) {
  return new Paragraph({
    spacing: { before: 40, after: 40, line: 260 },
    indent: { left: 360, hanging: 200 },
    keepLines: true,
    widowControl: true,
    children: [
      new TextRun({ text: "•", color: markerColor }),
      new TextRun({ text: ` ${bullet}` }),
    ],
  });
}

async function exportResumeDocx(
  resume: ParsedResume,
  fileName: string,
  template: TemplateId,
  theme: ThemeId,
  contactStyle: ContactDisplayStyle,
) {
  const palette = getThemePalette(theme);
  const headingColor = palette.heading.replace("#", "").toUpperCase();
  const accentColor = palette.accent.replace("#", "").toUpperCase();
  const headingSpacingBefore = getTemplateDefinition(template).density === "compact" ? 180 : 240;
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60, line: 300 },
      keepNext: true,
      keepLines: true,
      children: [
        new TextRun({
          text: resume.name,
          bold: true,
          size: 34,
          allCaps: true,
          color: headingColor,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 60, line: 280 },
      keepNext: true,
      keepLines: true,
      children: [
        new TextRun({
          text: resume.title,
          bold: true,
          color: accentColor,
          size: 22,
        }),
      ],
    }),
  ];

  if (resume.contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 180, line: 240 },
        keepNext: true,
        keepLines: true,
        children: [new TextRun({ text: formatContactForDisplay(resume.contact, contactStyle), size: 18 })],
      }),
    );
  }

  for (const section of resume.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: headingSpacingBefore, after: 100 },
        keepNext: true,
        keepLines: true,
        widowControl: true,
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            color: headingColor,
            allCaps: true,
          }),
        ],
      }),
    );

    if (["CORE SKILLS", "CERTIFICATIONS"].includes(section.heading)) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 60 },
          keepLines: true,
          widowControl: true,
          children: [new TextRun(section.body.join(" | "))],
        }),
      );
    } else {
      children.push(...section.body.map(createDocxBodyLine));
    }

    children.push(
      ...section.bullets.map((bullet) => createDocxBulletLine(bullet, headingColor)),
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
  const blob = await Packer.toBlob(document);

  saveAs(blob, buildResumeFileName(fileName, "docx"));
}

function createIdleUploadState(): UploadState {
  return { fileName: "", status: "idle", message: "" };
}

function isLocalStorageAvailable() {
  try {
    const key = "__resume_agent_storage_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

async function extractDocxText(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file("word/document.xml")?.async("text");

  if (!documentXml) {
    throw new Error("Could not read DOCX document text.");
  }

  return documentXml
    .replace(/<w:tab\/>/g, " ")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildExtractionResult(
  text: string,
  method: TextExtractionResult["method"],
  confidence: TextExtractionResult["confidence"] = "high",
  warning?: string,
): TextExtractionResult {
  return {
    text: cleanResumeText(text),
    method,
    confidence,
    warning,
  };
}

function getExtractionMessage(result: TextExtractionResult, successText: string) {
  if (result.warning) {
    return result.warning;
  }

  if (result.method === "ocr") {
    return "OCR extracted readable text and added it to the input.";
  }

  if (result.method === "hybrid") {
    return "PDF text and OCR results were combined and added to the input.";
  }

  return successText;
}

function isReadableExtraction(text: string) {
  const cleaned = cleanResumeText(text);
  const words = cleaned.match(/[A-Za-z][A-Za-z'-]{1,}/g) || [];

  return cleaned.length >= 20 && words.length >= 6;
}

async function extractImageTextWithOcr(source: File | HTMLCanvasElement) {
  const { recognize } = await import("tesseract.js");
  const result = await recognize(source, "eng", {
    logger: () => undefined,
  });

  return cleanResumeText(result.data.text || "");
}

async function renderPdfPageToCanvas(page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: 1.8 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare PDF page for OCR.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;

  return canvas;
}

async function extractPdfNativeText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const documentTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  });
  const document = await documentTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  return cleanResumeText(pages.join("\n\n"));
}

async function extractPdfOcrText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const documentTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  });
  const document = await documentTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const canvas = await renderPdfPageToCanvas(page);
    const pageText = await extractImageTextWithOcr(canvas);

    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  return cleanResumeText(pages.join("\n\n"));
}

async function extractPdfText(file: File): Promise<TextExtractionResult> {
  let nativeText = "";

  try {
    nativeText = await extractPdfNativeText(file);
  } catch {
    nativeText = "";
  }

  if (isReadableExtraction(nativeText) && nativeText.length >= 160) {
    return buildExtractionResult(nativeText, "native", "high");
  }

  let ocrText = "";

  try {
    ocrText = await extractPdfOcrText(file);
  } catch {
    ocrText = "";
  }

  const combinedText = cleanResumeText(
    [nativeText, ocrText].filter((part) => part.trim()).join("\n\n"),
  );

  if (isReadableExtraction(combinedText)) {
    return buildExtractionResult(
      combinedText,
      nativeText.trim() && ocrText.trim() ? "hybrid" : ocrText.trim() ? "ocr" : "native",
      combinedText.length >= 160 ? "medium" : "low",
      combinedText.length >= 160
        ? undefined
        : "Low-confidence extraction: partial text was recovered and preserved for review.",
    );
  }

  throw new Error(
    "PDF extraction could not recover readable text from this file. Try a clearer PDF, DOCX, TXT, PNG, JPG, or JPEG.",
  );
}

async function extractReadableTextFromFile(file: File): Promise<TextExtractionResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = file.type.toLowerCase();

  if (extension === "txt" || mimeType === "text/plain") {
    return buildExtractionResult(await file.text(), "native", "high");
  }

  if (extension === "docx") {
    return buildExtractionResult(await extractDocxText(file), "native", "high");
  }

  if (extension === "pdf" || mimeType === "application/pdf") {
    return extractPdfText(file);
  }

  if (extension === "doc") {
    throw new Error(
      "Legacy .doc extraction is not fully available yet. Please save as DOCX/TXT or paste the text manually.",
    );
  }

  if (["png", "jpg", "jpeg"].includes(extension) || mimeType.startsWith("image/")) {
    const imageText = await extractImageTextWithOcr(file);

    if (isReadableExtraction(imageText)) {
      return buildExtractionResult(
        imageText,
        "ocr",
        imageText.length >= 160 ? "medium" : "low",
        imageText.length >= 160
          ? undefined
          : "Low-confidence OCR: partial text was recovered and preserved for review.",
      );
    }

    throw new Error("OCR could not recover readable text from this image.");
  }

  throw new Error("Unsupported file type. Upload DOC, DOCX, PDF, TXT, PNG, JPG, or JPEG.");
}

function loadSavedVersions() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(savedVersionsKey);
    return raw ? (JSON.parse(raw) as SavedVersion[]) : [];
  } catch {
    return [];
  }
}

function persistSavedVersions(versions: SavedVersion[]) {
  window.localStorage.setItem(savedVersionsKey, JSON.stringify(versions));
}

export default function Home() {
  const [initialSavedState] = useState<SavedResumeState>(() =>
    getDefaultSavedResumeState(),
  );
  const [masterResume, setMasterResume] = useState(
    initialSavedState.masterResume,
  );
  const [jobDescription, setJobDescription] = useState(
    initialSavedState.jobDescription,
  );
  const [targetRole, setTargetRole] = useState(initialSavedState.targetRole);
  const [careerMode, setCareerMode] = useState<CareerModeId>(
    initialSavedState.careerMode,
  );
  const [customCareerField, setCustomCareerField] = useState(
    initialSavedState.customCareerField,
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>(initialSavedState.selectedTemplate);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(
    initialSavedState.selectedTheme,
  );
  const [downloadFileName, setDownloadFileName] = useState(
    initialSavedState.downloadFileName,
  );
  const [coverLetter, setCoverLetter] = useState<CoverLetterState>(
    initialSavedState.coverLetter,
  );
  const [outputScoreLabel, setOutputScoreLabel] = useState<ResumeScoreLabel>(
    initialSavedState.outputScoreLabel,
  );
  const [contactDisplayStyle, setContactDisplayStyle] = useState<ContactDisplayStyle>(
    initialSavedState.contactDisplayStyle,
  );
  const [editableResume, setEditableResume] = useState<EditableResume | null>(
    initialSavedState.editableResume,
  );
  const [dirtyResumeFields, setDirtyResumeFields] = useState<Set<keyof EditableResume>>(
    () => new Set(),
  );
  const [optimizedBaselineScore, setOptimizedBaselineScore] = useState<ReadinessScore | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [masterUploads, setMasterUploads] = useState<UploadedFileText[]>(
    initialSavedState.masterUploads,
  );
  const [jobUpload, setJobUpload] = useState<UploadState>(() =>
    createIdleUploadState(),
  );
  const [activeAction, setActiveAction] = useState<ActionState | null>(null);
  const [completedAction, setCompletedAction] = useState<ActionState | null>(null);
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>([]);
  const [versionName, setVersionName] = useState("");
  const [versionTargetOrg, setVersionTargetOrg] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [hasLoadedSavedState, setHasLoadedSavedState] = useState(false);
  const activeCareerProfile = useMemo(
    () =>
      resolveCareerProfile(
        careerMode,
        customCareerField,
        targetRole,
        jobDescription,
      ),
    [careerMode, customCareerField, jobDescription, targetRole],
  );
  const templateRecommendation = useMemo(
    () => recommendTemplateChoice(activeCareerProfile, jobDescription, targetRole),
    [activeCareerProfile, jobDescription, targetRole],
  );
  const uploadedSourceText = useMemo(
    () =>
      masterUploads
        .filter((upload) => upload.status === "success" && upload.text.trim())
        .map((upload) => upload.text)
        .join("\n\n"),
    [masterUploads],
  );
  const combinedSourceText = useMemo(
    () => cleanResumeText([masterResume, uploadedSourceText].filter((part) => part.trim()).join("\n\n")),
    [masterResume, uploadedSourceText],
  );
  const editedResumeText = useMemo(
    () => (editableResume ? serializeEditableResume(editableResume, activeCareerProfile, combinedSourceText) : ""),
    [activeCareerProfile, combinedSourceText, editableResume],
  );
  const parsedResume = useMemo(
    () => (editedResumeText ? parseResumePreview(editedResumeText) : null),
    [editedResumeText],
  );
  const sourceResumeScore = useMemo(
    () =>
      combinedSourceText.trim().length >= 40 && jobDescription.trim().length >= 40
        ? calculateReadinessScore(
            combinedSourceText,
            jobDescription,
            targetRole,
            activeCareerProfile,
          )
        : null,
    [activeCareerProfile, combinedSourceText, jobDescription, targetRole],
  );
  const result = useMemo(() => {
    if (!editableResume) {
      return null;
    }

    const nextResult = buildResultFromEditedResume(
      editableResume,
      jobDescription,
      targetRole,
      activeCareerProfile,
      combinedSourceText,
    );

    const sourceGuarded = applyScoreGuardrails(nextResult, sourceResumeScore, outputScoreLabel);

    return outputScoreLabel === "Optimized Resume Score"
      ? applyScoreGuardrails(sourceGuarded, optimizedBaselineScore, outputScoreLabel)
      : sourceGuarded;
  }, [activeCareerProfile, combinedSourceText, editableResume, jobDescription, optimizedBaselineScore, outputScoreLabel, sourceResumeScore, targetRole]);

  const canTailor = useMemo(
    () =>
      combinedSourceText.trim().length >= 40 &&
      jobDescription.trim().length >= 40 &&
      targetRole.trim().length >= 2,
    [combinedSourceText, jobDescription, targetRole],
  );
  const isWorking = activeAction !== null;
  const hasUploadingFiles =
    masterUploads.some((upload) => upload.status === "loading") ||
    jobUpload.status === "loading";

  function finishAction(action: ActionState) {
    setActiveAction(null);
    setCompletedAction(action);
    window.setTimeout(() => {
      setCompletedAction((current) => (current === action ? null : current));
    }, 1500);
  }

  function actionLabel(action: ActionState, idle: string, loading: string, done: string) {
    if (activeAction === action) {
      return loading;
    }

    if (completedAction === action) {
      return done;
    }

    return idle;
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedState = getInitialSavedResumeState();

      setMasterResume(savedState.masterResume);
      setMasterUploads(savedState.masterUploads || []);
      setJobDescription(savedState.jobDescription);
      setTargetRole(savedState.targetRole);
      setCareerMode(savedState.careerMode);
      setCustomCareerField(savedState.customCareerField);
      setEditableResume(savedState.editableResume);
      setSelectedTemplate(savedState.selectedTemplate);
      setSelectedTheme(savedState.selectedTheme);
      setDownloadFileName(savedState.downloadFileName);
      setCoverLetter(savedState.coverLetter);
      setOutputScoreLabel(savedState.outputScoreLabel);
      setContactDisplayStyle(savedState.contactDisplayStyle);
      setDirtyResumeFields(new Set(savedState.editableResume ? editableResumeFields : []));
      setSavedVersions(loadSavedVersions());
      setHasLoadedSavedState(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedState) {
      return;
    }

    const savedState: SavedResumeState = {
      masterResume,
      masterUploads,
      jobDescription,
      targetRole,
      careerMode,
      customCareerField,
      editableResume,
      selectedTemplate,
      selectedTheme,
      downloadFileName,
      coverLetter,
      outputScoreLabel,
      contactDisplayStyle,
    };

    try {
      window.localStorage.setItem(savedResumeKey, JSON.stringify(savedState));
    } catch {
      // Draft autosave is best-effort; explicit version saves still surface storage errors.
    }
  }, [
    coverLetter,
    contactDisplayStyle,
    downloadFileName,
    editableResume,
    careerMode,
    customCareerField,
    hasLoadedSavedState,
    jobDescription,
    masterResume,
    masterUploads,
    selectedTemplate,
    selectedTheme,
    outputScoreLabel,
    targetRole,
  ]);

  async function waitForPaint() {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  function extractDetailsFromSource(sourceText = combinedSourceText) {
    if (sourceText.trim().length < 20) {
      return;
    }

    const extracted = extractEditableResumeDetails(sourceText, targetRole);

    setEditableResume((current) =>
      mergeExtractedResumeDetails(current, extracted, dirtyResumeFields),
    );
    setDownloadFileName((current) =>
      current.trim()
        ? current
        : buildDefaultResumeFileName(extracted.name || "Candidate Name", targetRole),
    );
    setErrorMessage("");
  }

  async function tailorResume() {
    if (isWorking) {
      return;
    }
    if (combinedSourceText.trim().length < 40) {
      setErrorMessage("Add a master resume before tailoring.");
      return;
    }
    if (jobDescription.trim().length < 40) {
      setErrorMessage("Add a job description before tailoring.");
      return;
    }

    setActiveAction("tailor");
    await waitForPaint();

    const tailoredResult = buildTailoredResume(
      combinedSourceText,
      jobDescription,
      targetRole,
      activeCareerProfile,
    );

    const academicMode =
      selectedTemplate === "academic-cv" ||
      isAcademicCareer(activeCareerProfile);
    const extractedAcademicContent = extractAcademicSignals(combinedSourceText);
    const nextResume = parseEditableResume(tailoredResult.rewrittenResume);
    const preparedResume = academicMode
      ? {
          ...nextResume,
          title: targetRole || nextResume.title,
          research:
            nextResume.research ||
            `Research Interests\n${activeCareerProfile.suggestedLanguage.slice(0, 4).join(", ")}, field-specific evidence, and institutional fit.`,
          publications: nextResume.publications || extractedAcademicContent,
          teaching: nextResume.teaching,
          conferences: nextResume.conferences,
        }
      : nextResume;

    setEditableResume(preparedResume);
    setDirtyResumeFields(new Set());
    setOptimizedBaselineScore(null);
    setOutputScoreLabel("Tailored Resume Score");
    setDownloadFileName(buildDefaultResumeFileName(preparedResume.name, targetRole));
    setCoverLetter((current) => ({
      ...current,
      targetTitle: current.targetTitle.trim() ? current.targetTitle : targetRole,
      fileName: buildDefaultCoverLetterFileName(preparedResume.name, current.targetTitle || targetRole),
    }));
    setErrorMessage("");
    finishAction("tailor");
  }

  async function optimizeResume() {
    if (isWorking) {
      return;
    }
    if (combinedSourceText.trim().length < 40) {
      setErrorMessage("Add a master resume or readable upload before optimizing.");
      return;
    }
    if (jobDescription.trim().length < 40) {
      setErrorMessage("Add a job description before optimizing.");
      return;
    }

    setActiveAction("optimize");
    await waitForPaint();

    const optimizationSource = editableResume
      ? `${combinedSourceText}\n\nCURRENT EDITABLE DRAFT\n${serializeEditableResume(editableResume, activeCareerProfile, combinedSourceText)}`
      : combinedSourceText;
    const currentDraftScore = editableResume
      ? buildResultFromEditedResume(editableResume, jobDescription, targetRole, activeCareerProfile, combinedSourceText)
      : sourceResumeScore;
    const optimizedResult = buildTailoredResume(
      optimizationSource,
      jobDescription,
      targetRole,
      activeCareerProfile,
    );
    const optimizedResume = parseEditableResume(optimizedResult.rewrittenResume);

    setEditableResume({
      ...optimizedResume,
      title: targetRole || optimizedResume.title,
    });
    setDirtyResumeFields(new Set());
    setOptimizedBaselineScore(currentDraftScore);
    setOutputScoreLabel("Optimized Resume Score");
    setDownloadFileName(buildDefaultResumeFileName(optimizedResume.name, targetRole));
    setSelectedTemplate((current) =>
      current === templateRecommendation.template.id
        ? current
        : templateRecommendation.template.id,
    );
    setSelectedTheme((current) => current || templateRecommendation.theme);
    setErrorMessage("");
    finishAction("optimize");
  }

  function updateCoverLetter<K extends keyof CoverLetterState>(
    field: K,
    value: CoverLetterState[K],
  ) {
    setCoverLetter((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function generateCoverLetter() {
    if (isWorking) {
      return;
    }
    if (combinedSourceText.trim().length < 40) {
      setErrorMessage("Add a master resume before generating a cover letter.");
      return;
    }
    if (jobDescription.trim().length < 40) {
      setErrorMessage("Add a job description before generating a cover letter.");
      return;
    }

    setActiveAction("cover-letter");
    await waitForPaint();

    const currentResume = editableResume;
    const nextResult = currentResume
      ? buildResultFromEditedResume(
          currentResume,
          jobDescription,
          targetRole,
          activeCareerProfile,
          combinedSourceText,
        )
      : buildTailoredResume(
          combinedSourceText,
          jobDescription,
          targetRole,
          activeCareerProfile,
        );
    const nextEditableResume = currentResume || parseEditableResume(nextResult.rewrittenResume);
    const tailoredResumeText = serializeEditableResume(nextEditableResume, activeCareerProfile, combinedSourceText);
    const nextCoverLetterBase = {
      ...coverLetter,
      targetTitle: coverLetter.targetTitle.trim() || targetRole,
    };
    const body = buildCoverLetter({
      masterResume: combinedSourceText,
      tailoredResume: tailoredResumeText,
      jobDescription,
      targetRole,
      careerProfile: activeCareerProfile,
      coverLetter: nextCoverLetterBase,
      result: nextResult,
    });

    if (!currentResume) {
      setEditableResume(nextEditableResume);
      setOutputScoreLabel("Tailored Resume Score");
      setOptimizedBaselineScore(null);
      setDownloadFileName(buildDefaultResumeFileName(nextEditableResume.name, targetRole));
    }

    setCoverLetter({
      ...nextCoverLetterBase,
      body,
      fileName: coverLetter.fileName.trim()
        ? sanitizeResumeFileName(coverLetter.fileName)
        : buildDefaultCoverLetterFileName(nextEditableResume.name, nextCoverLetterBase.targetTitle),
    });
    setErrorMessage("");
    finishAction("cover-letter");
  }

  async function handleUpload(
    file: File | undefined,
    setter: (value: string) => void,
    uploadSetter: (state: UploadState) => void,
  ) {
    if (!file) {
      return;
    }

    uploadSetter({ fileName: file.name, status: "loading", message: "Extracting text..." });

    try {
      const extraction = await extractReadableTextFromFile(file);
      const cleanedText = extraction.text;

      if (!isReadableExtraction(cleanedText)) {
        throw new Error("Text extraction returned too little readable content.");
      }

      setter(cleanedText);
      uploadSetter({
        fileName: file.name,
        status: "success",
        message: getExtractionMessage(extraction, "Text extracted and added to the input."),
      });
      if (extraction.warning) {
        setErrorMessage(extraction.warning);
      } else {
        setErrorMessage("");
      }
    } catch (error) {
      uploadSetter({
        fileName: file.name,
        status: "error",
        message: error instanceof Error ? error.message : "File extraction failed.",
      });
    }
  }

  async function handleMasterUploads(files: FileList | null) {
    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const pendingUploads: UploadedFileText[] = selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      text: "",
      status: "loading",
      message: "Extracting text...",
    }));

    setMasterUploads((current) => [...current, ...pendingUploads]);

    const extractedTexts = await Promise.all(
      selectedFiles.map(async (file, index) => {
        const uploadId = pendingUploads[index].id;

        try {
          const extraction = await extractReadableTextFromFile(file);
          const cleanedText = extraction.text;

          if (!isReadableExtraction(cleanedText)) {
            throw new Error("Text extraction returned too little readable content.");
          }

          setMasterUploads((current) =>
            current.map((upload) =>
              upload.id === uploadId
                ? {
                    ...upload,
                    text: cleanedText,
                    status: "success",
                    message: getExtractionMessage(extraction, "Text extracted and included in tailoring."),
                  }
                : upload,
            ),
          );
          if (extraction.warning) {
            setErrorMessage(extraction.warning);
          } else {
            setErrorMessage("");
          }
          return cleanedText;
        } catch (error) {
          setMasterUploads((current) =>
            current.map((upload) =>
              upload.id === uploadId
                ? {
                    ...upload,
                    status: "error",
                    message: error instanceof Error ? error.message : "File extraction failed.",
                  }
                : upload,
            ),
          );
          return "";
        }
      }),
    );

    const recoveredText = extractedTexts.filter((text) => text.trim()).join("\n\n");

    if (recoveredText.trim()) {
      extractDetailsFromSource(
        cleanResumeText([masterResume, uploadedSourceText, recoveredText].filter((part) => part.trim()).join("\n\n")),
      );
    }
  }

  function removeMasterUpload(id: string) {
    setMasterUploads((current) => current.filter((upload) => upload.id !== id));
  }

  function downloadTxt() {
    if (!editedResumeText) {
      return;
    }

    setActiveAction("txt");
    const blob = new Blob([formatResumeTextForExport(editedResumeText)], {
      type: "text/plain;charset=utf-8",
    });

    saveAs(blob, buildResumeFileName(downloadFileName, "txt"));
    finishAction("txt");
  }

  async function downloadPdf() {
    if (!parsedResume) {
      return;
    }

    try {
      setActiveAction("pdf");
      await exportResumePdf(
        parsedResume,
        downloadFileName,
        selectedTemplate,
        selectedTheme,
        contactDisplayStyle,
      );
      setErrorMessage("");
      finishAction("pdf");
    } catch {
      setErrorMessage("PDF export failed. Try TXT/DOCX or simplify the resume content.");
      setActiveAction(null);
    }
  }

  async function downloadDocx() {
    if (!parsedResume) {
      return;
    }

    try {
      setActiveAction("docx");
      await exportResumeDocx(
        parsedResume,
        downloadFileName,
        selectedTemplate,
        selectedTheme,
        contactDisplayStyle,
      );
      setErrorMessage("");
      finishAction("docx");
    } catch {
      setErrorMessage("DOCX export failed. Try TXT/PDF or simplify the resume content.");
      setActiveAction(null);
    }
  }

  function downloadCoverLetterTxt() {
    if (!coverLetter.body) {
      return;
    }

    setActiveAction("cover-txt");
    const blob = new Blob([coverLetter.body], {
      type: "text/plain;charset=utf-8",
    });

    saveAs(blob, buildCoverLetterFileName(coverLetter.fileName, "txt"));
    finishAction("cover-txt");
  }

  async function downloadCoverLetterPdf() {
    if (!coverLetter.body) {
      return;
    }

    try {
      setActiveAction("cover-pdf");
      await exportCoverLetterPdf(coverLetter.body, coverLetter.fileName);
      setErrorMessage("");
      finishAction("cover-pdf");
    } catch {
      setErrorMessage("Cover letter PDF export failed. Try TXT/DOCX or simplify the cover letter content.");
      setActiveAction(null);
    }
  }

  async function downloadCoverLetterDocx() {
    if (!coverLetter.body) {
      return;
    }

    try {
      setActiveAction("cover-docx");
      await exportCoverLetterDocx(coverLetter.body, coverLetter.fileName);
      setErrorMessage("");
      finishAction("cover-docx");
    } catch {
      setErrorMessage("Cover letter DOCX export failed. Try TXT/PDF or simplify the cover letter content.");
      setActiveAction(null);
    }
  }

  async function saveCurrentVersion() {
    if (isWorking) {
      return;
    }
    if (!editableResume || !result) {
      setErrorMessage("Generate a tailored resume before saving a version.");
      return;
    }
    if (!isLocalStorageAvailable()) {
      setErrorMessage("Local storage is unavailable. Saved versions cannot be written in this browser session.");
      return;
    }

    setActiveAction("save-version");
    await waitForPaint();
    const state: SavedResumeState = {
      masterResume,
      masterUploads,
      jobDescription,
      targetRole,
      careerMode,
      customCareerField,
      editableResume,
      selectedTemplate,
      selectedTheme,
      downloadFileName,
      coverLetter,
      outputScoreLabel,
      contactDisplayStyle,
    };
    const tailoredResume = serializeEditableResume(editableResume, activeCareerProfile, combinedSourceText);
    const uploadedFileTextSummary = masterUploads.length > 0
      ? masterUploads.map((upload) => `${upload.fileName}: ${upload.status === "success" ? `${upload.text.length} characters extracted` : upload.message}`).join("; ")
      : "No uploaded master files.";
    const nextVersion: SavedVersion = {
      id: `${Date.now()}`,
      versionName: versionName.trim() || `${targetRole || "Tailored Resume"} Version`,
      targetOrganization: versionTargetOrg.trim() || coverLetter.organizationName.trim(),
      targetRoleProgram: coverLetter.targetTitle.trim() || targetRole,
      tailoredResume,
      uploadedFileTextSummary,
      targetDescription: jobDescription,
      careerModeLabel: activeCareerProfile.label,
      coverLetter: coverLetter.body,
      companySchoolName: coverLetter.organizationName.trim() || versionTargetOrg.trim(),
      template: selectedTemplate,
      theme: selectedTheme,
      dateCreated: new Date().toISOString(),
      templateUsed: selectedTemplate,
      colorThemeUsed: selectedTheme,
      score: result.score,
      notes: versionNotes.trim(),
      state,
    };
    const nextVersions = [nextVersion, ...savedVersions].slice(0, 25);

    persistSavedVersions(nextVersions);
    setSavedVersions(nextVersions);
    setVersionName("");
    setVersionTargetOrg("");
    setVersionNotes("");
    setErrorMessage("");
    finishAction("save-version");
  }

  async function restoreVersion(version: SavedVersion) {
    if (isWorking) {
      return;
    }

    setActiveAction("restore-version");
    await waitForPaint();
    setMasterResume(version.state.masterResume);
    setMasterUploads(version.state.masterUploads || []);
    setJobDescription(version.state.jobDescription);
    setTargetRole(version.state.targetRole);
    setCareerMode(version.state.careerMode || "general-professional");
    setCustomCareerField(version.state.customCareerField || "");
    const restoredEditableResume = normalizeEditableResume(version.state.editableResume);

    setEditableResume(restoredEditableResume);
    setDirtyResumeFields(new Set(restoredEditableResume ? editableResumeFields : []));
    setSelectedTemplate(version.state.selectedTemplate);
    setSelectedTheme(version.state.selectedTheme);
    setDownloadFileName(version.state.downloadFileName);
    setOutputScoreLabel(version.state.outputScoreLabel || "Tailored Resume Score");
    setOptimizedBaselineScore(null);
    setContactDisplayStyle(version.state.contactDisplayStyle || "labels");
    setCoverLetter(version.state.coverLetter || createDefaultCoverLetterState(
      version.state.editableResume?.name ||
        firstMeaningfulLine(version.state.masterResume, "Candidate Name"),
      version.state.targetRole,
    ));
    finishAction("restore-version");
  }

  function renameVersion(id: string, nextName: string) {
    const nextVersions = savedVersions.map((version) =>
      version.id === id ? { ...version, versionName: nextName } : version,
    );

    setSavedVersions(nextVersions);
    persistSavedVersions(nextVersions);
  }

  function deleteVersion(id: string) {
    const nextVersions = savedVersions.filter((version) => version.id !== id);

    setSavedVersions(nextVersions);
    persistSavedVersions(nextVersions);
  }

  function resetSavedResume() {
    window.localStorage.removeItem(savedResumeKey);
    setMasterResume(sampleResume);
    setMasterUploads([]);
    setJobDescription(sampleJob);
    setTargetRole(targetResumeTitle);
    setCareerMode("general-professional");
    setCustomCareerField("");
    setSelectedTemplate("classic-executive");
    setSelectedTheme("executive-navy");
    setDownloadFileName(
      buildDefaultResumeFileName(
        firstMeaningfulLine(sampleResume, "Candidate Name"),
        targetResumeTitle,
      ),
    );
    setCoverLetter(createDefaultCoverLetterState(
      firstMeaningfulLine(sampleResume, "Candidate Name"),
      targetResumeTitle,
    ));
    setOutputScoreLabel("Tailored Resume Score");
    setOptimizedBaselineScore(null);
    setContactDisplayStyle("labels");
    setEditableResume(null);
    setDirtyResumeFields(new Set());
    setJobUpload(createIdleUploadState());
    setErrorMessage("");
  }

  function updateEditableResume<K extends keyof EditableResume>(
    field: K,
    value: EditableResume[K],
  ) {
    setDirtyResumeFields((current) => new Set(current).add(field));
    setEditableResume((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  async function applyAchievementSuggestion(suggestion: AchievementSuggestion) {
    if (isWorking) {
      return;
    }
    if (!editableResume) {
      return;
    }

    setActiveAction("apply-suggestion");
    await waitForPaint();
    const fields: Array<keyof Pick<EditableResume, "experience" | "projects" | "research">> = [
      "experience",
      "projects",
      "research",
    ];
    const originalPattern = new RegExp(escapeRegExp(suggestion.original), "i");
    const nextResume = { ...editableResume };
    let applied = false;

    for (const field of fields) {
      if (originalPattern.test(nextResume[field])) {
        nextResume[field] = nextResume[field].replace(originalPattern, suggestion.improved);
        applied = true;
        break;
      }
    }

    if (applied) {
      setEditableResume(nextResume);
      finishAction("apply-suggestion");
    } else {
      setActiveAction(null);
    }
  }

  async function applyAllSafeSuggestions() {
    if (isWorking) {
      return;
    }
    if (!editableResume || !result) {
      return;
    }

    setActiveAction("apply-all");
    await waitForPaint();
    const fields: Array<keyof Pick<EditableResume, "experience" | "projects" | "research">> = [
      "experience",
      "projects",
      "research",
    ];
    const nextResume = { ...editableResume };

    for (const suggestion of result.achievementSuggestions.slice(0, 8)) {
      for (const field of fields) {
        const originalPattern = new RegExp(escapeRegExp(suggestion.original), "i");

        if (originalPattern.test(nextResume[field])) {
          nextResume[field] = nextResume[field].replace(originalPattern, suggestion.improved);
          break;
        }
      }
    }

    setEditableResume(nextResume);
    finishAction("apply-all");
  }

  const currentStepIndex = result
    ? 3
    : editableResume
      ? 2
      : combinedSourceText.trim().length >= 40 && jobDescription.trim().length >= 40
        ? 1
        : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b bg-white" style={{ borderColor: appBrand.border }}>
        <div className="mx-auto flex max-w-[1360px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-[980px]">
            <p className="text-sm font-semibold uppercase" style={{ color: appBrand.primary }}>
              ISEYA <span style={{ color: appBrand.muted }}>BY JORMP LLC</span>
            </p>
            <h1 className="mt-2 max-w-[980px] text-3xl font-semibold tracking-tight sm:text-4xl xl:whitespace-nowrap xl:text-5xl" style={{ color: appBrand.text }}>
              Transform your resume for any job opportunity
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Upload or paste your experience, tailor it to a role, optimize the draft, and export a polished resume or cover letter.
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              AI-powered resume, cover letter, and career positioning platform.
            </p>
            <ol className="mt-4 grid gap-2 text-sm font-semibold text-zinc-700 sm:grid-cols-2 lg:grid-cols-5">
              {["Start", "Target Job", "AI Optimization", "Choose Style", "Export"].map((step, index) => (
                <li
                  key={step}
                  className="rounded-md border bg-slate-50 px-3 py-2"
                  style={{
                    borderColor: index === currentStepIndex ? appBrand.accent : appBrand.border,
                    color: appBrand.text,
                  }}
                >
                  <span
                    className="mr-2"
                    style={{ color: index === currentStepIndex ? appBrand.accent : appBrand.primary }}
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              onClick={resetSavedResume}
              disabled={isWorking}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-[#D9E1EC] bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 sm:w-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="mx-auto mt-5 max-w-7xl px-5 sm:px-8">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {errorMessage}
          </div>
        </div>
      ) : null}

      <section className="mx-auto grid max-w-[1360px] grid-cols-1 gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-lg border border-[#D9E1EC] bg-white p-5 shadow-sm">
          <div className="mb-5 rounded-lg border border-[#D9E1EC] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Step 1 · Start
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                "Improve existing resume",
                "Create from scratch",
                "Build from portfolio/source documents",
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    if (option === "Create from scratch") {
                      setMasterResume("");
                      setEditableResume(normalizeEditableResume({ title: targetRole }));
                    }
                  }}
                  className="min-h-12 rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-left text-sm font-semibold text-zinc-800 transition hover:border-[#10224C] hover:bg-white"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <label
            htmlFor="master-resume"
            className="text-sm font-semibold text-zinc-900"
          >
            Source Material
          </label>
          <p className="mt-1 text-sm text-zinc-500">
            Paste your resume or upload readable source files.
          </p>
          <MultiFileUploadControl
            id="master-resume-upload"
            uploads={masterUploads}
            onUpload={(files) => void handleMasterUploads(files)}
            onRemove={removeMasterUpload}
          />
          <button
            type="button"
            onClick={() => extractDetailsFromSource()}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 sm:w-auto"
            style={{ borderColor: appBrand.primary, color: appBrand.primary }}
          >
            Extract Details
          </button>
          <textarea
            id="master-resume"
            value={masterResume}
            onChange={(event) => {
              const nextResume = event.target.value;

              setMasterResume(nextResume);
              extractDetailsFromSource(
                cleanResumeText([nextResume, uploadedSourceText].filter((part) => part.trim()).join("\n\n")),
              );
            }}
            className="mt-3 min-h-[340px] w-full resize-y rounded-md border border-[#D9E1EC] bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20 lg:min-h-[420px]"
            placeholder="Paste resume, CV, or experience notes..."
          />
        </div>

        <div className="rounded-lg border border-[#D9E1EC] bg-white p-5 shadow-sm">
          <label
            htmlFor="target-role"
            className="text-sm font-semibold text-zinc-900"
          >
            Job Opportunity
          </label>
          <input
            id="target-role"
            value={targetRole}
            onChange={(event) => {
              const nextTargetRole = event.target.value;

              setTargetRole(nextTargetRole);
              setCoverLetter((current) => ({
                ...current,
                targetTitle:
                  !current.targetTitle.trim() || current.targetTitle === targetRole
                    ? nextTargetRole
                    : current.targetTitle,
              }));
            }}
            className="mt-3 w-full rounded-md border border-[#D9E1EC] bg-white p-4 text-sm text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
            placeholder="Example: AI Product Manager"
          />

          <div className="mt-5 grid gap-3 rounded-lg border border-[#D9E1EC] bg-zinc-50 p-4">
            <SelectControl
              id="career-mode"
              label="Career / Industry Mode"
              value={careerMode}
              options={careerModeOptions}
              onChange={(value) => {
                setCareerMode(value as CareerModeId);
              }}
            />
            {careerMode === "custom" ? (
              <label htmlFor="custom-career-field" className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Custom Career Field
                </span>
                <input
                  id="custom-career-field"
                  value={customCareerField}
                  onChange={(event) => setCustomCareerField(event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
                  placeholder="Example: Climate policy, real estate, cybersecurity"
                />
              </label>
            ) : null}
            <div className="rounded-md bg-white p-3 text-sm leading-6 text-zinc-600">
              <span className="font-semibold text-zinc-900">
                Active mode:
              </span>{" "}
              {activeCareerProfile.label}
              <span className="block text-xs text-zinc-500">
                Template recommendation: {templateRecommendation.template.label} · {templateRecommendation.density} density · {themes.find((theme) => theme.id === templateRecommendation.theme)?.label}
              </span>
              <span className="block text-xs text-zinc-500">
                {templateRecommendation.reason}
              </span>
            </div>
          </div>

          <label
            htmlFor="job-description"
            className="mt-5 block text-sm font-semibold text-zinc-900"
          >
            Job Description
          </label>
          <p className="mt-1 text-sm text-zinc-500">
            Paste the role, program, grant, school, or opportunity description.
          </p>
          <FileUploadControl
            id="job-description-upload"
            upload={jobUpload}
            onUpload={(file) =>
              void handleUpload(file, setJobDescription, setJobUpload)
            }
            onRemove={() => setJobUpload(createIdleUploadState())}
          />
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            className="mt-3 min-h-[300px] w-full resize-y rounded-md border border-[#D9E1EC] bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20 lg:min-h-[340px]"
            placeholder="Paste the job description here..."
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ResumeScoreComparisonCard
            sourceScore={sourceResumeScore}
            outputScore={result}
            outputLabel={outputScoreLabel}
          />
          <div className="rounded-lg border border-[#D9E1EC] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-950">Generate & Optimize</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Create the first tailored draft, then optimize it after review.
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => void tailorResume()}
                disabled={!canTailor || isWorking || hasUploadingFiles}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                style={{ backgroundColor: canTailor && !isWorking && !hasUploadingFiles ? appBrand.primary : undefined }}
              >
                {actionLabel("tailor", "Tailor Resume", "Tailoring...", "Tailored")}
              </button>
              <button
                type="button"
                onClick={() => void optimizeResume()}
                disabled={!canTailor || isWorking || hasUploadingFiles}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border bg-white px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-[#D9E1EC] disabled:bg-zinc-100 disabled:text-zinc-400"
                style={{ borderColor: appBrand.primary, color: appBrand.primary }}
              >
                {actionLabel("optimize", "Optimize Resume", "Optimizing...", "Optimized")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 pb-6 sm:px-6 lg:px-8">
        <details className="rounded-lg border border-[#D9E1EC] bg-white p-5 shadow-sm">
          <summary className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Cover Letter</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Optional application letter generated from the same source and target.
              </p>
            </div>
            <span className="text-sm font-semibold" style={{ color: appBrand.accent }}>Open</span>
          </summary>

          <div className="mt-5 border-t border-[#D9E1EC] pt-5">
            <button
              type="button"
              onClick={() => void generateCoverLetter()}
              disabled={!canTailor || isWorking || hasUploadingFiles}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 sm:w-auto"
              style={{ backgroundColor: canTailor && !isWorking && !hasUploadingFiles ? appBrand.primary : undefined }}
            >
              {actionLabel("cover-letter", "Generate Cover Letter", "Generating...", "Generated")}
            </button>
          </div>

          <div className="grid gap-4 py-5 lg:grid-cols-3">
            <ResumeTextInput
              id="cover-organization"
              label="Company / School / Organization Name"
              value={coverLetter.organizationName}
              onChange={(value) => updateCoverLetter("organizationName", value)}
            />
            <ResumeTextInput
              id="cover-contact"
              label="Hiring Manager / Admissions Contact Name optional"
              value={coverLetter.contactName}
              onChange={(value) => updateCoverLetter("contactName", value)}
            />
            <ResumeTextInput
              id="cover-target-title"
              label="Target Role / Program Title"
              value={coverLetter.targetTitle}
              onChange={(value) => updateCoverLetter("targetTitle", value)}
            />
            <SelectControl
              id="cover-tone"
              label="Cover Letter Tone"
              value={coverLetter.tone}
              options={coverLetterToneOptions}
              onChange={(value) => updateCoverLetter("tone", value as CoverLetterTone)}
            />
            <SelectControl
              id="cover-length"
              label="Cover Letter Length"
              value={coverLetter.length}
              options={coverLetterLengthOptions}
              onChange={(value) => updateCoverLetter("length", value as CoverLetterLength)}
            />
            <ResumeTextArea
              id="cover-extra-notes"
              label="Extra Notes optional"
              value={coverLetter.extraNotes}
              rows={3}
              onChange={(value) => updateCoverLetter("extraNotes", value)}
            />
          </div>

          {coverLetter.body ? (
            <div className="border-t border-[#D9E1EC] pt-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <label htmlFor="cover-filename" className="w-full lg:max-w-md">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Cover Letter Filename
                  </span>
                  <input
                    id="cover-filename"
                    value={coverLetter.fileName}
                    onChange={(event) =>
                      updateCoverLetter(
                        "fileName",
                        event.target.value.replace(/\.(txt|pdf|docx)$/i, ""),
                      )
                    }
                    onBlur={() =>
                      setCoverLetter((current) => ({
                        ...current,
                        fileName: sanitizeResumeFileName(current.fileName),
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
                    placeholder="Candidate_Role_Cover_Letter"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={downloadCoverLetterTxt}
                    disabled={isWorking}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    style={{ backgroundColor: activeAction === "cover-txt" ? appBrand.accent : appBrand.primary }}
                  >
                    {actionLabel("cover-txt", "Download TXT", "Exporting TXT...", "Exported")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadCoverLetterPdf()}
                    disabled={isWorking}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    style={{ backgroundColor: activeAction === "cover-pdf" ? appBrand.accent : appBrand.primary }}
                  >
                    {actionLabel("cover-pdf", "Download PDF", "Exporting PDF...", "Exported")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadCoverLetterDocx()}
                    disabled={isWorking}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    style={{ backgroundColor: activeAction === "cover-docx" ? appBrand.accent : appBrand.primary }}
                  >
                    {actionLabel("cover-docx", "Download DOCX", "Exporting DOCX...", "Exported")}
                  </button>
                </div>
              </div>
              <label htmlFor="cover-letter-output" className="mt-5 block">
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Editable Cover Letter
                </span>
                <textarea
                  id="cover-letter-output"
                  value={coverLetter.body}
                  onChange={(event) => updateCoverLetter("body", event.target.value)}
                  className="mt-3 min-h-[360px] w-full resize-y rounded-md border border-[#D9E1EC] bg-white p-4 text-sm leading-7 text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
                />
              </label>
            </div>
          ) : null}
        </details>
      </section>

      {result ? (
        <section className="mx-auto grid max-w-[1360px] grid-cols-1 gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
          <aside className="min-w-0 space-y-3">
            <AccordionPanel
              title="Tailoring Intelligence"
              summary={`${result.intelligence.careerMode} positioning`}
            >
              <TailoringIntelligenceCard intelligence={result.intelligence} />
            </AccordionPanel>

            <AccordionPanel
              title="ATS Simulation"
              summary={`${result.atsSimulation.warnings.length} scan notes`}
            >
              <AtsWarningsCard warnings={result.atsSimulation.warnings} />
            </AccordionPanel>

            <AccordionPanel
              title="Matched Keywords"
              summary={`${result.matchedKeywords.length} matched`}
            >
              <KeywordList
                title="Matched Keywords"
                keywords={result.matchedKeywords}
                emptyText="No matched keywords found yet."
                variant="match"
              />
            </AccordionPanel>

            <AccordionPanel
              title="Missing Keywords"
              summary={`${result.missingKeywords.length} gaps`}
            >
              <KeywordList
                title="Missing Keywords"
                keywords={result.missingKeywords}
                emptyText="No major keyword gaps found."
                variant="missing"
              />
            </AccordionPanel>

            <AccordionPanel
              title="Saved Versions"
              summary={`${savedVersions.length} saved`}
            >
              <SavedVersionsPanel
                versions={savedVersions}
                versionName={versionName}
                targetOrganization={versionTargetOrg}
                notes={versionNotes}
                isWorking={isWorking}
                saveLabel={actionLabel("save-version", "Save Version", "Saving...", "Saved")}
                restoreLabel={actionLabel("restore-version", "Restore", "Restoring...", "Restored")}
                onVersionNameChange={setVersionName}
                onTargetOrganizationChange={setVersionTargetOrg}
                onNotesChange={setVersionNotes}
                onSave={saveCurrentVersion}
                onRestore={restoreVersion}
                onRename={renameVersion}
                onDelete={deleteVersion}
              />
            </AccordionPanel>
          </aside>

          <div className="min-w-0 rounded-lg border border-[#D9E1EC] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#D9E1EC] pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Export
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Review the draft, choose a format, and export. Confirm all facts, dates, and metrics before submitting.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
                <label htmlFor="download-filename" className="w-full md:w-80">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Download Filename
                  </span>
                  <input
                    id="download-filename"
                    value={downloadFileName}
                    onChange={(event) =>
                      setDownloadFileName(
                        event.target.value.replace(/\.(txt|pdf|docx)$/i, ""),
                      )
                    }
                    onBlur={() =>
                      setDownloadFileName((current) =>
                        sanitizeResumeFileName(current),
                      )
                    }
                    className="mt-2 w-full rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
                    placeholder="Candidate_Role_Resume"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={downloadTxt}
                  disabled={isWorking}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  style={{ backgroundColor: activeAction === "txt" ? appBrand.accent : appBrand.primary }}
                >
                  {actionLabel("txt", "Download TXT", "Exporting TXT...", "Exported")}
                </button>
                <button
                  type="button"
                  onClick={() => void downloadPdf()}
                  disabled={isWorking}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  style={{ backgroundColor: activeAction === "pdf" ? appBrand.accent : appBrand.primary }}
                >
                  {actionLabel("pdf", "Download PDF", "Exporting PDF...", "Exported")}
                </button>
                <button
                  type="button"
                  onClick={() => void downloadDocx()}
                  disabled={isWorking}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  style={{ backgroundColor: activeAction === "docx" ? appBrand.accent : appBrand.primary }}
                >
                  {actionLabel("docx", "Download DOCX", "Exporting DOCX...", "Exported")}
                </button>
                </div>
                <p className="max-w-md rounded-md border border-[#D9E1EC] bg-slate-50 p-3 text-xs leading-5 text-zinc-600">
                  Free plan includes 1 clean export. After that, watermark controls are ready for Pro gating. Pro removes watermark, unlocks premium templates, unlimited exports, saved versions, and copy access for $4.99/month or $2.99 for 14 days.
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-b border-[#D9E1EC] py-4 md:grid-cols-2">
              <SelectControl
                id="template-select"
                label="Template"
                value={selectedTemplate}
                options={templates}
                onChange={(value) => setSelectedTemplate(value as TemplateId)}
              />
              <SelectControl
                id="theme-select"
                label="Color Theme"
                value={selectedTheme}
                options={themes}
                onChange={(value) => setSelectedTheme(value as ThemeId)}
              />
              <SelectControl
                id="contact-style-select"
                label="Contact Display"
                value={contactDisplayStyle}
                options={[
                  { id: "labels", label: "Text labels" },
                  { id: "icons", label: "Icons" },
                  { id: "minimal", label: "Minimal line" },
                  { id: "centered", label: "Centered classic" },
                ]}
                onChange={(value) => setContactDisplayStyle(value as ContactDisplayStyle)}
              />
            </div>

            <TemplateRecommendationPanel
              recommendation={templateRecommendation}
              selectedTemplate={selectedTemplate}
              onUseTemplate={(templateId, themeId) => {
                setSelectedTemplate(templateId);
                setSelectedTheme(themeId);
              }}
            />

            <div className="grid gap-5 py-5 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Tailored Summary
                </h3>
                <p className="mt-3 rounded-md bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                  {result.summary}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Skills
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md px-3 py-2 text-xs font-semibold"
                      style={{
                        backgroundColor: appBrand.light,
                        color: appBrand.primary,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <AccordionPanel
              title="Achievement Optimizer"
              summary={`${result.achievementSuggestions.length} improvement opportunities`}
            >
              <p className="text-sm text-zinc-500">
                Review suggested bullet improvements before applying them.
              </p>
              <AchievementOptimizer
                suggestions={result.achievementSuggestions}
                isWorking={isWorking}
                applyLabel={actionLabel("apply-suggestion", "Apply Suggestion", "Applying...", "Applied")}
                applyAllLabel={actionLabel("apply-all", "Apply All Safe Suggestions", "Applying...", "Applied")}
                onApply={applyAchievementSuggestion}
                onApplyAll={applyAllSafeSuggestions}
              />
            </AccordionPanel>

            <section className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Tailored Resume Output
              </h3>
              {editableResume && parsedResume ? (
                <div className="mt-3 grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
                  <ResumeEditPanel
                    resume={editableResume}
                    careerProfile={activeCareerProfile}
                    sourceText={combinedSourceText}
                    onChange={updateEditableResume}
                  />
                  <ResumePreview
                    resume={parsedResume}
                    template={selectedTemplate}
                    theme={selectedTheme}
                    contactStyle={contactDisplayStyle}
                  />
                </div>
              ) : null}
            </section>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function AccordionPanel({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-lg border border-[#D9E1EC] bg-white p-4 shadow-sm">
      <summary className="flex min-w-0 items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-900">
            {title}
          </span>
          {summary ? (
            <span className="mt-1 block truncate text-xs text-zinc-500">
              {summary}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-xs font-semibold" style={{ color: appBrand.accent }}>
          Expand
        </span>
      </summary>
      <div className="mt-4 border-t border-[#D9E1EC] pt-4">{children}</div>
    </details>
  );
}

function ResumeScoreComparisonCard({
  sourceScore,
  outputScore,
  outputLabel,
}: {
  sourceScore: ReadinessScore | null;
  outputScore: TailoringResult | null;
  outputLabel: ResumeScoreLabel;
}) {
  const beforeScore = sourceScore?.score ?? 0;
  const afterScore = outputScore?.score ?? null;
  const improvement = afterScore === null ? null : afterScore - beforeScore;
  const improvementClass =
    improvement === null
      ? "bg-zinc-100 text-zinc-600"
      : improvement > 0
        ? "bg-slate-50 text-slate-900 ring-1 ring-slate-200"
        : improvement < 0
          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
          : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";

  return (
    <div className="rounded-lg border border-[#D9E1EC] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Resume Score Comparison
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Scores estimate alignment, readability, and evidence strength. Review all optimized content before submitting.
          </p>
        </div>
        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${improvementClass}`}>
          Improvement: {improvement === null ? "--" : `${improvement >= 0 ? "+" : ""}${improvement}%`}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ScoreProgressBlock
          label="Source Resume Score"
          value={beforeScore}
          tone="source"
        />
        {afterScore === null ? null : (
          <ScoreProgressBlock
            label={outputLabel}
            value={afterScore}
            tone="output"
          />
        )}
      </div>

      {sourceScore ? (
        <div className="mt-5 space-y-3 border-t border-[#D9E1EC] pt-4 text-xs text-zinc-600">
          <SubScoreComparisonLine
            label="Keyword Match"
            before={sourceScore.scoreBreakdown.keywordMatch}
            after={outputScore?.scoreBreakdown.keywordMatch ?? null}
          />
          <SubScoreComparisonLine
            label="Role Alignment"
            before={sourceScore.scoreBreakdown.roleAlignment}
            after={outputScore?.scoreBreakdown.roleAlignment ?? null}
          />
          <SubScoreComparisonLine
            label="ATS Readability"
            before={sourceScore.scoreBreakdown.atsReadability}
            after={outputScore?.scoreBreakdown.atsReadability ?? null}
          />
          <SubScoreComparisonLine
            label="Impact / Metrics"
            before={sourceScore.scoreBreakdown.impactMetrics}
            after={outputScore?.scoreBreakdown.impactMetrics ?? null}
          />
          <SubScoreComparisonLine
            label="Structure"
            before={sourceScore.scoreBreakdown.structure}
            after={outputScore?.scoreBreakdown.structure ?? null}
          />
        </div>
      ) : null}
      {outputScore?.scoreWarning ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          {outputScore.scoreWarning}
        </p>
      ) : null}
    </div>
  );
}

function ScoreProgressBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "source" | "output";
}) {
  const barColor = tone === "output" ? appBrand.accent : appBrand.primary;
  const valueColor = tone === "output" ? appBrand.accent : appBrand.primary;

  return (
    <div className="rounded-md border border-[#D9E1EC] bg-zinc-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-semibold tracking-tight" style={{ color: valueColor }}>
          {value}
        </span>
        <span className="pb-1 text-lg font-semibold text-zinc-500">%</span>
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-zinc-200">
        <div
          className="h-2.5 rounded-full"
          style={{ width: `${value}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

function SubScoreComparisonLine({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after: number | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <span className="font-medium text-zinc-600">{label}</span>
      <span className="whitespace-nowrap font-semibold text-zinc-900">
        <span className="text-zinc-500">{before}%</span>
        {after === null ? null : (
          <>
            <span className="px-2 text-zinc-400">-&gt;</span>
            <span style={{ color: appBrand.accent }}>{after}%</span>
          </>
        )}
      </span>
    </div>
  );
}

function KeywordList({
  title,
  keywords,
  emptyText,
  variant,
}: {
  title: string;
  keywords: string[];
  emptyText: string;
  variant: "match" | "missing";
}) {
  const colorClass =
    variant === "match"
      ? "bg-slate-50 text-slate-900"
      : "bg-amber-50 text-amber-900";

  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {keywords.length > 0 ? (
          keywords.map((keyword) => (
            <span
              key={keyword}
              className={`rounded-md px-3 py-2 text-xs font-semibold ${colorClass}`}
            >
              {keyword}
            </span>
          ))
        ) : (
          <p className="text-sm text-zinc-500">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function SelectControl({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FileUploadControl({
  id,
  upload,
  onUpload,
  onRemove,
}: {
  id: string;
  upload: UploadState;
  onUpload: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-[#D9E1EC] bg-zinc-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label
          htmlFor={id}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition"
          style={{ backgroundColor: appBrand.primary }}
        >
          Upload File
        </label>
        <input
          id={id}
          type="file"
          accept=".doc,.docx,.pdf,.txt,.png,.jpg,.jpeg"
          className="sr-only"
          onChange={(event) => onUpload(event.target.files?.[0])}
        />
        <p className="text-xs font-medium text-zinc-500">
          DOC, DOCX, PDF, TXT, PNG, JPG, JPEG
        </p>
      </div>
      {upload.fileName ? (
        <div className="mt-3 flex flex-col gap-2 rounded-md border border-[#D9E1EC] bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{upload.fileName}</p>
            <p
              className={
                upload.status === "error"
                  ? "mt-1 text-xs font-medium text-amber-800"
                  : "mt-1 text-xs text-zinc-500"
              }
            >
              {upload.message}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MultiFileUploadControl({
  id,
  uploads,
  onUpload,
  onRemove,
}: {
  id: string;
  uploads: UploadedFileText[];
  onUpload: (files: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-[#D9E1EC] bg-zinc-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label
          htmlFor={id}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition"
          style={{ backgroundColor: appBrand.primary }}
        >
          Upload Files
        </label>
        <input
          id={id}
          type="file"
          accept=".doc,.docx,.pdf,.txt,.png,.jpg,.jpeg"
          multiple
          className="sr-only"
          onChange={(event) => {
            onUpload(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <p className="text-xs font-medium text-zinc-500">
          DOC, DOCX, PDF, TXT, PNG, JPG, JPEG
        </p>
      </div>
      {uploads.length > 0 ? (
        <div className="mt-3 space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex flex-col gap-2 rounded-md border border-[#D9E1EC] bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">{upload.fileName}</p>
                <p
                  className={
                    upload.status === "error"
                      ? "mt-1 text-xs font-medium text-amber-800"
                      : "mt-1 text-xs text-zinc-500"
                  }
                >
                  {upload.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(upload.id)}
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TailoringIntelligenceCard({
  intelligence,
}: {
  intelligence: TailoringIntelligence;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900">Tailoring Intelligence</h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: appBrand.accent }}>
        {intelligence.careerMode} · {intelligence.targetType}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {intelligence.positioningAngle}
      </p>
      <IntelligenceList title="Positioning Strategy" items={[intelligence.positioningAngle]} />
      <IntelligenceList title="Top Missing Evidence" items={intelligence.missingEvidence} />
      <IntelligenceList title="Keywords to include naturally" items={[...intelligence.requiredSkills, ...intelligence.preferredSkills].slice(0, 10)} />
      <IntelligenceList title="Suggested Section Order" items={intelligence.sectionPriority} />
      <IntelligenceList title="Recommended Template" items={[intelligence.templateRecommendation]} />
      <IntelligenceList title="Risk Warnings" items={intelligence.warnings} />
    </div>
  );
}

function IntelligenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {title}
      </p>
      <ul className="mt-2 space-y-2 text-sm leading-5 text-zinc-700">
        {(items.length > 0 ? items : ["No major items detected."]).map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: appBrand.accent }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AtsWarningsCard({ warnings }: { warnings: string[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900">ATS Simulation</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Scan risks based on structure, evidence, formatting, and target fit.
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-5 text-zinc-700">
        {warnings.map((warning, index) => (
          <li key={`${warning}-${index}`} className="rounded-md bg-zinc-50 p-3">
            {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AchievementOptimizer({
  suggestions,
  isWorking,
  applyLabel,
  applyAllLabel,
  onApply,
  onApplyAll,
}: {
  suggestions: AchievementSuggestion[];
  isWorking: boolean;
  applyLabel: string;
  applyAllLabel: string;
  onApply: (suggestion: AchievementSuggestion) => void;
  onApplyAll: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleSuggestions = showAll ? suggestions : suggestions.slice(0, 3);

  if (suggestions.length === 0) {
    return (
      <p className="mt-3 rounded-md p-4 text-sm font-medium" style={{ backgroundColor: appBrand.light, color: appBrand.primary }}>
        No weak bullets detected in the generated draft.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-[#D9E1EC] bg-zinc-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-zinc-900">
          {suggestions.length} improvement {suggestions.length === 1 ? "opportunity" : "opportunities"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApplyAll}
            disabled={isWorking}
            className="inline-flex min-h-9 w-full items-center justify-center rounded-md px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 sm:w-auto"
            style={{ backgroundColor: isWorking ? undefined : appBrand.primary }}
          >
            {applyAllLabel}
          </button>
          {suggestions.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              {showAll ? "Show top 3" : "View all suggestions"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {visibleSuggestions.map((suggestion, index) => (
          <div key={`${suggestion.original}-${index}`} className="rounded-md border border-[#D9E1EC] bg-white p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: appBrand.accent }}>
                  {suggestion.category}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{suggestion.original}</p>
              </div>
              <button
                type="button"
                onClick={() => onApply(suggestion)}
                disabled={isWorking}
                className="inline-flex min-h-9 w-full shrink-0 items-center justify-center rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 sm:w-auto"
              >
                {applyLabel}
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-800">{suggestion.improved}</p>
            {suggestion.missing.length > 0 ? (
              <p className="mt-2 text-xs text-zinc-500">
                Missing: {suggestion.missing.join(", ")}
              </p>
            ) : null}
            {suggestion.category === "Add Metric" ? (
              <p className="mt-2 text-xs font-medium text-amber-800">
                {suggestion.metricPrompt}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedVersionsPanel({
  versions,
  versionName,
  targetOrganization,
  notes,
  isWorking,
  saveLabel,
  restoreLabel,
  onVersionNameChange,
  onTargetOrganizationChange,
  onNotesChange,
  onSave,
  onRestore,
  onRename,
  onDelete,
}: {
  versions: SavedVersion[];
  versionName: string;
  targetOrganization: string;
  notes: string;
  isWorking: boolean;
  saveLabel: string;
  restoreLabel: string;
  onVersionNameChange: (value: string) => void;
  onTargetOrganizationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onRestore: (version: SavedVersion) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900">Saved Versions</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Save a version for each company, school, program, or opportunity so you can restore the exact resume and cover letter you created for that application.
      </p>
      <div className="mt-4 grid gap-2">
        <input
          value={versionName}
          onChange={(event) => onVersionNameChange(event.target.value)}
          className="rounded-md border border-[#D9E1EC] px-3 py-2 text-sm outline-none focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
          placeholder="Version name"
        />
        <input
          value={targetOrganization}
          onChange={(event) => onTargetOrganizationChange(event.target.value)}
          className="rounded-md border border-[#D9E1EC] px-3 py-2 text-sm outline-none focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
          placeholder="Organization / school"
        />
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={3}
          className="resize-y rounded-md border border-[#D9E1EC] px-3 py-2 text-sm outline-none focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
          placeholder="Notes"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={isWorking}
          className="inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          style={{ backgroundColor: isWorking ? undefined : appBrand.primary }}
        >
          {saveLabel}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {versions.length === 0 ? (
          <p className="text-sm text-zinc-500">No saved versions yet.</p>
        ) : (
          versions.map((version) => (
            <div key={version.id} className="rounded-md border border-[#D9E1EC] bg-zinc-50 p-3">
              <input
                value={version.versionName}
                onChange={(event) => onRename(version.id, event.target.value)}
                className="w-full rounded-md border border-[#D9E1EC] bg-white px-2 py-1 text-sm font-semibold text-zinc-900"
              />
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {version.targetOrganization || "No organization"} · {version.targetRoleProgram} · {version.score}% · {new Date(version.dateCreated).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRestore(version)}
                  disabled={isWorking}
                  className="rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  {restoreLabel}
                </button>
                <button
                  type="button"
                  onClick={() => onRename(version.id, version.versionName.trim() || "Untitled Version")}
                  className="rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(version.id)}
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TemplateRecommendationPanel({
  recommendation,
  selectedTemplate,
  onUseTemplate,
}: {
  recommendation: ReturnType<typeof recommendTemplateChoice>;
  selectedTemplate: TemplateId;
  onUseTemplate: (templateId: TemplateId, themeId: ThemeId) => void;
}) {
  const recommendedTemplates = uniqueTerms([
    recommendation.template.id,
    ...templates
      .filter((template) => template.category === recommendation.category)
      .map((template) => template.id),
  ])
    .map((templateId) => getTemplateDefinition(templateId))
    .slice(0, 4);

  return (
    <section className="border-b border-[#D9E1EC] py-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Step 4 · Choose Style
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {recommendation.reason}
          </p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          {recommendation.category}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {recommendedTemplates.map((template) => {
          const isSelected = template.id === selectedTemplate;

          return (
            <div
              key={template.id}
              className="rounded-lg border bg-white p-3"
              style={{ borderColor: isSelected ? appBrand.accent : appBrand.border }}
            >
              <div className="h-16 rounded-md border border-[#D9E1EC] bg-slate-50 p-2">
                <div className="h-2 w-1/2 rounded-sm" style={{ backgroundColor: appBrand.primary }} />
                <div className="mt-2 h-1.5 w-3/4 rounded-sm bg-slate-300" />
                <div className="mt-3 grid grid-cols-3 gap-1">
                  <span className="h-1.5 rounded-sm bg-slate-300" />
                  <span className="h-1.5 rounded-sm bg-slate-300" />
                  <span className="h-1.5 rounded-sm bg-slate-300" />
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-950">{template.label}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{template.category}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-700">Best for {template.bestFor}.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                <span>{template.density}</span>
                <span>ATS {template.atsRisk}</span>
              </div>
              <button
                type="button"
                onClick={() => onUseTemplate(template.id, recommendation.theme)}
                className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-md px-3 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: isSelected ? appBrand.accent : appBrand.primary }}
              >
                {isSelected ? "Selected" : "Use Template"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ResumeEditPanel({
  resume,
  careerProfile,
  sourceText,
  onChange,
}: {
  resume: EditableResume;
  careerProfile: CareerModeProfile;
  sourceText: string;
  onChange: <K extends keyof EditableResume>(
    field: K,
    value: EditableResume[K],
  ) => void;
}) {
  const headings = getCareerSectionHeadings(careerProfile, sourceText);

  return (
    <div className="max-h-[760px] overflow-auto rounded-md border border-[#D9E1EC] bg-zinc-50 p-4">
      <h4 className="text-sm font-semibold text-zinc-950">
        Edit Resume Details
      </h4>
      <div className="mt-4 grid gap-3">
        <ResumeTextInput
          id="edit-name"
          label="Name"
          value={resume.name}
          onChange={(value) => onChange("name", value)}
        />
        <ResumeTextInput
          id="edit-title"
          label="Title"
          value={resume.title}
          onChange={(value) => onChange("title", value)}
        />
        <ResumeTextInput
          id="edit-email"
          label="Email"
          value={resume.email}
          onChange={(value) => onChange("email", value)}
        />
        <ResumeTextInput
          id="edit-phone"
          label="Phone"
          value={resume.phone}
          onChange={(value) => onChange("phone", value)}
        />
        <ResumeTextInput
          id="edit-location"
          label="Location"
          value={resume.location}
          onChange={(value) => onChange("location", value)}
        />
        <ResumeTextInput
          id="edit-linkedin"
          label="LinkedIn"
          value={resume.linkedIn}
          onChange={(value) => onChange("linkedIn", value)}
        />
        <ResumeTextInput
          id="edit-portfolio"
          label="Portfolio"
          value={resume.portfolio}
          onChange={(value) => onChange("portfolio", value)}
        />
        <ResumeTextInput
          id="edit-website"
          label="Website"
          value={resume.website}
          onChange={(value) => onChange("website", value)}
        />
        <ResumeTextArea
          id="edit-summary"
          label={headings.summary}
          value={resume.summary}
          rows={5}
          onChange={(value) => onChange("summary", value)}
        />
        <ResumeTextArea
          id="edit-skills"
          label={headings.skills}
          value={resume.coreSkills}
          rows={4}
          onChange={(value) => onChange("coreSkills", value)}
        />
        <ResumeTextArea
          id="edit-experience"
          label={`${headings.experience} roles, organizations, dates, and bullet points`}
          value={resume.experience}
          rows={12}
          onChange={(value) => onChange("experience", value)}
        />
        <ResumeTextArea
          id="edit-projects"
          label={headings.projects}
          value={resume.projects}
          rows={7}
          onChange={(value) => onChange("projects", value)}
        />
        <ResumeTextArea
          id="edit-research"
          label={headings.research}
          value={resume.research}
          rows={4}
          onChange={(value) => onChange("research", value)}
        />
        <ResumeTextArea
          id="edit-publications"
          label="Publications / Working Papers"
          value={resume.publications}
          rows={4}
          onChange={(value) => onChange("publications", value)}
        />
        <ResumeTextArea
          id="edit-teaching"
          label="Teaching Experience"
          value={resume.teaching}
          rows={4}
          onChange={(value) => onChange("teaching", value)}
        />
        <ResumeTextArea
          id="edit-conferences"
          label="Conferences / Presentations"
          value={resume.conferences}
          rows={4}
          onChange={(value) => onChange("conferences", value)}
        />
        <ResumeTextArea
          id="edit-awards"
          label="Grants / Awards"
          value={resume.awards}
          rows={3}
          onChange={(value) => onChange("awards", value)}
        />
        <ResumeTextArea
          id="edit-education"
          label="Education"
          value={resume.education}
          rows={4}
          onChange={(value) => onChange("education", value)}
        />
        <ResumeTextArea
          id="edit-certifications"
          label={headings.certifications}
          value={resume.certifications}
          rows={3}
          onChange={(value) => onChange("certifications", value)}
        />
      </div>
    </div>
  );
}

function ResumeTextInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold text-zinc-700">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
      />
    </label>
  );
}

function ResumeTextArea({
  id,
  label,
  value,
  rows,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold text-zinc-700">{label}</span>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full resize-y rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm leading-6 text-zinc-800 outline-none transition focus:border-[#10224C] focus:ring-4 focus:ring-[#F28A00]/20"
      />
    </label>
  );
}

function ResumePreview({
  resume,
  template,
  theme,
  contactStyle,
}: {
  resume: ParsedResume;
  template: TemplateId;
  theme: ThemeId;
  contactStyle: ContactDisplayStyle;
}) {
  const palette = getThemePalette(theme);
  const templateDefinition = getTemplateDefinition(template);
  const isExecutive = templateDefinition.category === "Corporate / ATS" || templateDefinition.category === "Finance / VC / Consulting";
  const isModern = ["Technology / Product", "Creative / Media / Fashion", "Architecture / Real Estate / Design"].includes(templateDefinition.category);
  const isAts = template === "ats-clean";
  const isAcademic = templateDefinition.category === "Academic / Research";
  const densityClasses =
    templateDefinition.density === "compact"
      ? "text-[13px] leading-5"
      : templateDefinition.density === "spacious"
        ? "text-[14px] leading-7"
        : "text-sm leading-6";
  const articleClass = isAts
    ? "resume-export-preview w-full max-w-full max-h-[760px] min-w-0 overflow-auto rounded-md border border-[#D9E1EC] bg-white text-zinc-900 shadow-sm print:max-h-none print:overflow-visible print:shadow-none"
    : isModern
      ? "resume-export-preview w-full max-w-full max-h-[760px] min-w-0 overflow-auto rounded-md border border-[#D9E1EC] bg-white text-zinc-900 shadow-sm print:max-h-none print:overflow-visible print:shadow-none"
      : "resume-export-preview w-full max-w-full max-h-[760px] min-w-0 overflow-auto rounded-md border border-[#D9E1EC] bg-white text-zinc-900 shadow-sm print:max-h-none print:overflow-visible print:shadow-none";
  const bodyClass = isModern
    ? "grid gap-5 p-4 sm:p-7 lg:grid-cols-2"
    : isAcademic
      ? "space-y-6 p-4 sm:p-8"
      : "space-y-7 p-4 sm:p-7";

  return (
    <article className={articleClass}>
      <header
        className={
          isAts
            ? "resume-export-header border-b border-[#D9E1EC] bg-white px-4 py-5 sm:px-7 sm:py-7"
            : "resume-export-header border-b px-4 py-5 sm:px-7 sm:py-7"
        }
        style={{
          backgroundColor: isAts || isAcademic ? "#ffffff" : palette.light,
          borderColor: isAts ? palette.border : palette.sectionLine,
          color: palette.text,
          textAlign: contactStyle === "centered" ? "center" : "left",
        }}
      >
        <h4
          className="break-words text-3xl font-bold leading-tight tracking-tight"
          style={{ color: palette.heading }}
        >
          {resume.name}
        </h4>
        <p
          className="mt-3 break-words text-base font-semibold leading-6"
          style={{ color: palette.accent }}
        >
          {resume.title}
        </p>
        {resume.contact ? (
          <ResumeContactLine contact={resume.contact} styleMode={contactStyle} />
        ) : null}
      </header>

      <div className={bodyClass}>
        {resume.sections.map((section, sectionIndex) => (
          <section
            key={`${section.heading}-${sectionIndex}`}
            className={
              isModern
                ? "resume-export-section rounded-md border border-[#D9E1EC] bg-zinc-50 p-4"
                : "resume-export-section"
            }
            style={{
              breakInside: "avoid",
              pageBreakInside: "avoid",
            }}
          >
            <h5
              className={
                isExecutive
                  ? "border-b pb-2 text-xs font-bold uppercase tracking-[0.18em]"
                  : isModern
                    ? "text-xs font-bold uppercase tracking-[0.16em]"
                    : "border-b pb-2 text-xs font-bold uppercase tracking-[0.16em]"
              }
              style={{
                color: palette.heading,
                borderColor: palette.sectionLine,
              }}
            >
              {section.heading}
            </h5>
            {["CORE SKILLS", "CERTIFICATIONS"].includes(section.heading) ? (
              <div className="resume-export-block mt-4 flex flex-wrap gap-2">
                {section.body
                  .join(" | ")
                  .split("|")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item, itemIndex) => (
                    <span
                      key={`${item}-${itemIndex}`}
                      className="rounded-md px-3 py-2 text-xs font-semibold ring-1"
                      style={{
                        backgroundColor: isAts ? "#ffffff" : palette.light,
                        color: palette.heading,
                        borderColor: palette.border,
                      }}
                    >
                      {item}
                    </span>
                  ))}
              </div>
            ) : null}
            {section.body.length > 0 ? (
              !["CORE SKILLS", "CERTIFICATIONS"].includes(section.heading) ? (
                <div className="resume-export-block mt-4 space-y-3">
                  {section.body.map((paragraph, paragraphIndex) => (
                    <ResumeBodyLine
                      key={`${paragraph}-${paragraphIndex}`}
                      line={paragraph}
                      template={template}
                      theme={theme}
                    />
                  ))}
                </div>
              ) : null
            ) : null}
            {section.bullets.length > 0 ? (
              <ul
                className={`resume-export-bullets mt-4 list-outside list-disc pl-5 text-zinc-700 ${densityClasses}`}
                style={{
                  color: palette.text,
                }}
              >
                {section.bullets.map((bullet, bulletIndex) => (
                  <li
                    key={`${bullet}-${bulletIndex}`}
                    className="resume-export-bullet my-1 pl-1 leading-[1.35] marker:font-bold"
                    style={{
                      color: palette.bullet,
                      breakInside: "avoid",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <span style={{ color: "#3f3f46" }}>{bullet}</span>
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

function ResumeBodyLine({
  line,
  template,
  theme,
}: {
  line: string;
  template: TemplateId;
  theme: ThemeId;
}) {
  const parts = line.split("|").map((part) => part.trim());
  const palette = getThemePalette(theme);
  const templateDefinition = getTemplateDefinition(template);
  const isModern = ["Technology / Product", "Creative / Media / Fashion", "Architecture / Real Estate / Design"].includes(templateDefinition.category);

  if (parts.length >= 3) {
    if (template === "ats-clean") {
      return (
        <div className="resume-export-block">
          <p className="text-sm font-semibold text-zinc-950">{parts[0]}</p>
          <p className="mt-1 text-sm text-zinc-700">
            {parts.slice(1).join(" | ")}
          </p>
        </div>
      );
    }

    return (
      <div
        className="resume-export-block rounded-md border bg-zinc-50 px-4 py-3"
        style={{
          borderColor: isModern ? palette.border : "#e4e4e7",
          backgroundColor: isModern ? palette.light : "#fafafa",
        }}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-950">{parts[0]}</p>
            <p className="mt-1 text-sm font-medium text-zinc-700">{parts[1]}</p>
          </div>
          <div className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:text-right">
            {parts.slice(2).join(" | ")}
          </div>
        </div>
      </div>
    );
  }

  return <p className="resume-export-block text-sm leading-6 text-zinc-700">{line}</p>;
}

function ContactIcon({ type }: { type: ContactItem["key"] }) {
  const paths: Record<ContactItem["key"], ReactNode> = {
    email: <path d="M3 5h18v14H3z M3 7l9 6 9-6" />,
    phone: <path d="M7 4h4l2 5-3 2a13 13 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 6a2 2 0 0 1 2-2h1z" />,
    location: <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z M12 10.5h.01" />,
    linkedIn: <path d="M5 9h4v10H5z M7 5.5h.01 M12 9h4v1.5A3.5 3.5 0 0 1 22 13v6h-4v-5a1.5 1.5 0 0 0-3 0v5h-3z" />,
    portfolio: <path d="M4 7h16v12H4z M9 7V5h6v2 M8 12h8" />,
    website: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3.6 9h16.8 M3.6 15h16.8 M12 3a15 15 0 0 1 0 18 M12 3a15 15 0 0 0 0 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[type]}
    </svg>
  );
}

function ResumeContactLine({
  contact,
  styleMode,
}: {
  contact: string;
  styleMode: ContactDisplayStyle;
}) {
  const items = parseContactItems(contact);

  if (items.length === 0) {
    return (
      <p className="mt-3 break-words text-xs font-medium uppercase leading-5 tracking-[0.14em] text-zinc-500">
        {contact}
      </p>
    );
  }

  if (styleMode === "labels") {
    return (
      <p className="mt-3 break-words text-xs font-medium uppercase leading-5 tracking-[0.14em] text-zinc-500">
        {items.map((item) => `${item.label}: ${item.value}`).join(" | ")}
      </p>
    );
  }

  if (styleMode === "minimal" || styleMode === "centered") {
    return (
      <p className={`mt-3 break-words text-xs font-medium leading-5 text-zinc-500 ${styleMode === "centered" ? "mx-auto max-w-3xl text-center" : ""}`}>
        {items.map((item) => item.value).join(" | ")}
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium leading-5 text-zinc-500">
      {items.map((item) => (
        <span key={item.key} className="inline-flex min-w-0 items-center gap-1.5">
          <ContactIcon type={item.key} />
          <span className="break-all">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
