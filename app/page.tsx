"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";

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
  summary: string;
  skills: string[];
  bullets: string[];
  rewrittenResume: string;
  coverLetter: string;
  scoreNotes: string[];
};

type ResumeSection = {
  heading: string;
  body: string[];
  bullets: string[];
};

type SavedState = {
  masterResume: string;
  jobDescription: string;
  targetRole: string;
  template: TemplateId;
  theme: ThemeId;
  result: TailoringResult | null;
};

const storageKey = "resume-agent-state-v2";

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
  const strongestKeywords = [
    ...matchedKeywords,
    ...missingKeywords.slice(0, 4),
  ].slice(0, 12);
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
  const baseResult = {
    score: scoreResult.score,
    matchedKeywords,
    missingKeywords,
    summary,
    skills,
    bullets,
    rewrittenResume,
    scoreNotes: scoreResult.notes,
  };

  return {
    ...baseResult,
    coverLetter: buildCoverLetterFromInputs(
      rewrittenResume,
      targetRole,
      jobDescription,
    ),
  };
}

function parseResumePreview(resumeText: string) {
  const lines = resumeText.split(/\r?\n/);
  const name = lines[0]?.trim() || "Candidate Name";
  const title = lines[1]?.trim() || "Target Role";
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (const rawLine of lines.slice(2)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const cleanedLine = line.replace(/^#{1,6}\s*/, "").replace(/^\*+\s*/, "");
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

function fileNameForRole(targetRole: string, extension: "pdf" | "docx") {
  const roleSlug =
    targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "tailored-resume";

  return `${roleSlug}.${extension}`;
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

async function createResumePdfBlob(
  resumeText: string,
  template: TemplateId,
  theme: (typeof previewThemes)[ThemeId],
) {
  const ReactPdf = await import("@react-pdf/renderer");
  const { Document, Page, StyleSheet, Text, View, pdf } = ReactPdf;
  const resume = parseResumePreview(resumeText);
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
        createElement(Text, { style: styles.name }, resume.name),
        createElement(Text, { style: styles.title }, resume.title),
      ),
      ...resume.sections.map((section) =>
        createElement(
          View,
          { key: section.heading, style: styles.section },
          createElement(Text, { style: styles.heading }, section.heading),
          ...section.body.map((paragraph) =>
            createElement(
              Text,
              { key: paragraph, style: styles.paragraph },
              paragraph,
            ),
          ),
          ...section.bullets.map((bullet) =>
            createElement(
              Text,
              { key: bullet, style: styles.bullet },
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
) {
  const Docx = await import("docx");
  const {
    BorderStyle,
    Document: DocxDocument,
    Packer,
    Paragraph,
    ShadingType,
    TextRun,
  } = Docx;
  const resume = parseResumePreview(resumeText);
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
          text: resume.name,
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
          text: resume.title,
          bold: true,
          color: hasHeaderBand ? "FFFFFF" : accentColor,
          size: 21,
        }),
      ],
    }),
  ];

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

export default function Home() {
  const [masterResume, setMasterResume] = useState(sampleResume);
  const [jobDescription, setJobDescription] = useState(sampleJob);
  const [targetRole, setTargetRole] = useState("AI Product Manager");
  const [template, setTemplate] = useState<TemplateId>("executive-navy");
  const [theme, setTheme] = useState<ThemeId>("deep-navy");
  const [result, setResult] = useState<TailoringResult | null>(null);
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [coverCopyStatus, setCoverCopyStatus] = useState("Copy Cover Letter");
  const [activeOutput, setActiveOutput] = useState<"resume" | "cover">("resume");
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(false);
  const previewTheme = previewThemes[theme];

  useEffect(() => {
    window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);

        if (saved) {
          const parsed = JSON.parse(saved) as Partial<SavedState>;
          setMasterResume(parsed.masterResume ?? sampleResume);
          setJobDescription(parsed.jobDescription ?? sampleJob);
          setTargetRole(parsed.targetRole ?? "AI Product Manager");
          setTemplate(
            isTemplateId(parsed.template)
              ? parsed.template
              : "executive-navy",
          );
          setTheme(isThemeId(parsed.theme) ? parsed.theme : "deep-navy");
          setResult(parsed.result ?? null);
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
      template,
      theme,
      result,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(savedState));
  }, [hydrated, jobDescription, masterResume, result, targetRole, template, theme]);

  const canTailor = useMemo(
    () =>
      masterResume.trim().length >= 40 &&
      jobDescription.trim().length >= 40 &&
      targetRole.trim().length >= 2,
    [jobDescription, masterResume, targetRole],
  );

  function tailorResume() {
    setCopyStatus("Copy");
    setCoverCopyStatus("Copy Cover Letter");
    setActiveOutput("resume");
    setResult(buildTailoredResume(masterResume, jobDescription, targetRole));
  }

  function generateCoverLetter() {
    setCopyStatus("Copy");
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
  }

  function resetSavedResume() {
    skipNextSave.current = true;
    window.localStorage.removeItem(storageKey);
    setMasterResume(sampleResume);
    setJobDescription(sampleJob);
    setTargetRole("AI Product Manager");
    setTemplate("executive-navy");
    setTheme("deep-navy");
    setResult(null);
    setActiveOutput("resume");
    setCopyStatus("Copy");
    setCoverCopyStatus("Copy Cover Letter");
  }

  function updateResumeOutput(value: string) {
    setResult((current) =>
      current
        ? {
            ...current,
            rewrittenResume: value,
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

  async function copyOutput() {
    if (!result) {
      return;
    }

    const output =
      activeOutput === "cover" ? result.coverLetter : result.rewrittenResume;

    try {
      await navigator.clipboard.writeText(output);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy"), 1500);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy"), 1500);
    }
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

  function downloadCoverLetterTxt() {
    if (!result) {
      return;
    }

    const fileName = `${
      targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      "cover-letter"
    }-cover-letter.txt`;
    const blob = new Blob([result.coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadResumePdf() {
    if (!result) {
      return;
    }

    const blob = await createResumePdfBlob(
      result.rewrittenResume,
      template,
      previewTheme,
    );
    saveBlob(blob, fileNameForRole(targetRole, "pdf"));
  }

  async function downloadResumeDocx() {
    if (!result) {
      return;
    }

    const blob = await createResumeDocxBlob(
      result.rewrittenResume,
      template,
      previewTheme,
    );
    saveBlob(blob, fileNameForRole(targetRole, "docx"));
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[96rem] flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Resume Tailoring Agent MVP
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Tailor a resume to a target role
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              Paste a master resume and job description, then generate an
              ATS-friendly resume, cover letter, keyword analysis, and editable
              output.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetSavedResume}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Reset Saved Resume
            </button>
            <button
              type="button"
              onClick={generateCoverLetter}
              disabled={!canTailor}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              Generate Cover Letter
            </button>
            <button
              type="button"
              onClick={tailorResume}
              disabled={!canTailor}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              Tailor Resume
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[96rem] gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_1fr]">
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

      {result ? (
        <section className="mx-auto grid max-w-[112rem] gap-5 px-5 pb-10 sm:px-8 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-zinc-500">Match Score</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-zinc-950">
                  {result.score}
                </span>
                <span className="pb-2 text-xl font-semibold text-zinc-500">%</span>
              </div>
              <div className="mt-5 h-3 rounded-full bg-zinc-100">
                <div
                  className="h-3 rounded-full bg-teal-700"
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                {result.scoreNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>

            <KeywordList
              title="Matched Keywords"
              keywords={result.matchedKeywords}
              emptyText="No matched keywords found yet."
              variant="match"
            />
            <KeywordList
              title="Missing Keywords"
              keywords={result.missingKeywords}
              emptyText="No major keyword gaps found."
              variant="missing"
            />
          </aside>

          <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Tailored Output
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Edit the generated resume fields and cover letter before use.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOutput("resume")}
                  className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                    activeOutput === "resume"
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOutput("cover")}
                  className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                    activeOutput === "cover"
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  Cover Letter
                </button>
                <button
                  type="button"
                  onClick={copyOutput}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  {copyStatus}
                </button>
                <button
                  type="button"
                  onClick={downloadResumePdf}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={downloadResumeDocx}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Download DOCX
                </button>
              </div>
            </div>

            {activeOutput === "resume" ? (
              <>
                <div className="grid gap-5 py-5 lg:grid-cols-2">
                  <section id="tailored-summary">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Tailored Summary
                    </h3>
                    <textarea
                      value={result.summary}
                      onChange={(event) =>
                        setResult((current) =>
                          current
                            ? { ...current, summary: event.target.value }
                            : current,
                        )
                      }
                      className="mt-3 min-h-36 w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                    />
                  </section>

                  <section id="tailored-skills">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Skills
                    </h3>
                    <textarea
                      value={result.skills.join(", ")}
                      onChange={(event) =>
                        setResult((current) =>
                          current
                            ? {
                                ...current,
                                skills: event.target.value
                                  .split(",")
                                  .map((skill) => skill.trim())
                                  .filter(Boolean),
                              }
                            : current,
                        )
                      }
                      className="mt-3 min-h-36 w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                    />
                  </section>
                </div>

                <section id="rewritten-resume">
                  <div className="sticky top-0 z-10 -mx-5 border-y border-zinc-200 bg-white/95 px-5 py-3 backdrop-blur">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Rewritten Resume
                      </h3>
                      <nav
                        aria-label="Rewritten resume navigation"
                        className="flex flex-wrap gap-2"
                      >
                        <a
                          href="#tailored-summary"
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Summary
                        </a>
                        <a
                          href="#tailored-skills"
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Skills
                        </a>
                        <a
                          href="#resume-editor"
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Editor
                        </a>
                        <a
                          href="#resume-preview"
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Preview
                        </a>
                      </nav>
                    </div>
                  </div>
                  <div className="grid gap-5 pt-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(520px,0.92fr)]">
                    <textarea
                      id="resume-editor"
                      value={result.rewrittenResume}
                      onChange={(event) => updateResumeOutput(event.target.value)}
                      className="min-h-[720px] w-full resize-y scroll-mt-24 rounded-md border border-zinc-300 bg-white p-4 font-mono text-sm leading-6 text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                    />
                    <div id="resume-preview" className="min-w-0 scroll-mt-24">
                      <ResumePreview
                        resumeText={result.rewrittenResume}
                        theme={previewTheme}
                        template={template}
                      />
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <section className="py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Cover Letter
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={generateCoverLetter}
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Generate Cover Letter
                    </button>
                    <button
                      type="button"
                      onClick={copyCoverLetter}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                    >
                      {coverCopyStatus}
                    </button>
                    <button
                      type="button"
                      onClick={downloadCoverLetterTxt}
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Download Cover Letter TXT
                    </button>
                  </div>
                </div>
                <textarea
                  value={result.coverLetter}
                  onChange={(event) => updateCoverLetter(event.target.value)}
                  className="mt-3 min-h-[560px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-7 text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                />
              </section>
            )}
          </div>
        </section>
      ) : null}
    </main>
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
      ? "bg-emerald-50 text-emerald-900"
      : "bg-amber-50 text-amber-900";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
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

function ResumePreview({
  resumeText,
  theme,
  template,
}: {
  resumeText: string;
  theme: (typeof previewThemes)[ThemeId];
  template: TemplateId;
}) {
  const resume = parseResumePreview(resumeText);
  const isExecutive = template === "executive-navy";
  const isModern = template === "modern-product";
  const bodyClass =
    template === "ats-clean"
      ? "space-y-5 p-6"
      : isModern
        ? "space-y-6 p-7"
        : "space-y-6 p-7";
  const headerClass = isExecutive
    ? `border-b border-zinc-200 px-7 py-6 ${theme.headerBg} ${theme.headerText}`
    : isModern
      ? `border-b border-zinc-200 border-l-4 bg-white px-6 py-5 text-zinc-950 ${theme.accentBorder}`
      : "border-b border-zinc-200 bg-white px-6 py-4 text-zinc-950";
  const subtitleClass = isExecutive
    ? `mt-1 text-sm font-medium ${theme.subheadText}`
    : "mt-1 text-sm font-medium text-zinc-500";

  return (
    <article className="mt-5 max-h-[760px] overflow-auto rounded-md border border-zinc-200 bg-white text-zinc-850">
      <header className={headerClass}>
        <h4 className="text-2xl font-semibold tracking-tight">{resume.name}</h4>
        <p className={subtitleClass}>{resume.title}</p>
      </header>

      <div className={bodyClass}>
        {resume.sections.map((section) => (
          <section
            key={section.heading}
            className={isModern ? "border-l-2 border-zinc-100 pl-4" : undefined}
          >
            <h5
              className={`border-b pb-2 text-xs font-bold uppercase tracking-[0.16em] ${theme.accentText} ${theme.accentBorder}`}
            >
              {section.heading}
            </h5>
            {section.body.length > 0 ? (
              <div className="mt-3 space-y-2">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-7 text-zinc-700"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            {section.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
