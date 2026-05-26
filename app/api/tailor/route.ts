import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { optimizationModel } from "@/lib/ai/models";
import { extractResume } from "@/lib/resume/extractResume";
import { rankResumeIntelligence } from "@/lib/resume/intelligenceRanker";
import { optimizeResume } from "@/lib/resume/optimizeResume";
import { renderResume } from "@/lib/resume/renderResume";
import type { CanonicalResume, RenderResumeState } from "@/lib/resume/types";
import { isProPlan, normalizeSubscriptionPlan, planOptimizationLimit } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadedSourceMaterial = {
  name: string;
  type: string;
  size?: number;
  extractionStatus?: string;
  warnings?: string[];
  extractedText?: string;
};

type TailorRequest = {
  masterResume?: string;
  jobDescription?: string;
  targetRole?: string;
  industryTarget?: string;
  uploadedSourceMaterials?: UploadedSourceMaterial[];
  currentEditedResume?: string;
  aiSettings?: {
    model?: string;
    creativity?: number;
    atsStrictness?: number;
    toneStyle?: string;
    aggressiveOptimization?: boolean;
    positioningMode?: string;
  };
  optimizationRequest?: {
    action?: string;
    sectionName?: string;
    sectionText?: string;
    fullResumeText?: string;
  };
};

type OptimizationResponse = {
  optimizedText: string;
  warnings: string[];
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

type Coaching = {
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
  bulletImprovements: Array<{
    original: string;
    strongerVersion: string;
    atsOptimizedVersion: string;
    executiveVersion: string;
    conciseVersion: string;
    metricFocusedVersion: string;
    suggestedMetrics: string[];
  }>;
  aiSuggestions: string[];
  positioningMode: string;
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

type TailorResponse = {
  matchScore: number;
  matchBreakdown: {
    roleFit: number;
    industryFit: number;
    requiredSkillsMatch: number;
    preferredSkillsMatch: number;
    metricStrength: number;
    seniorityAlignment: number;
    projectRelevance: number;
    atsReadability: number;
  };
  missingKeywords: string[];
  recommendedKeywords: string[];
  positioningStrategy: string;
  tailoredResume: string;
  coverLetter: string;
  improvementNotes: string[];
  riskFlags: string[];
  coaching: Coaching;
  advancedAnalysis?: AdvancedAnalysis;
  linkedin?: LinkedInKit;
  applicationKit?: ApplicationKit;
  extractedResumeJson?: CanonicalResume;
  optimizedResumeJson?: CanonicalResume;
  renderResumeState?: RenderResumeState;
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

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "matchScore",
    "matchBreakdown",
    "missingKeywords",
    "recommendedKeywords",
    "positioningStrategy",
    "tailoredResume",
    "coverLetter",
    "improvementNotes",
    "riskFlags",
    "coaching",
    "linkedin",
    "applicationKit",
  ],
  properties: {
    matchScore: { type: "number", minimum: 0, maximum: 100 },
    matchBreakdown: {
      type: "object",
      additionalProperties: false,
      required: [
        "roleFit",
        "industryFit",
        "requiredSkillsMatch",
        "preferredSkillsMatch",
        "metricStrength",
        "seniorityAlignment",
        "projectRelevance",
        "atsReadability",
      ],
      properties: {
        roleFit: { type: "number", minimum: 0, maximum: 100 },
        industryFit: { type: "number", minimum: 0, maximum: 100 },
        requiredSkillsMatch: { type: "number", minimum: 0, maximum: 100 },
        preferredSkillsMatch: { type: "number", minimum: 0, maximum: 100 },
        metricStrength: { type: "number", minimum: 0, maximum: 100 },
        seniorityAlignment: { type: "number", minimum: 0, maximum: 100 },
        projectRelevance: { type: "number", minimum: 0, maximum: 100 },
        atsReadability: { type: "number", minimum: 0, maximum: 100 },
      },
    },
    missingKeywords: { type: "array", items: { type: "string" } },
    recommendedKeywords: { type: "array", items: { type: "string" } },
    positioningStrategy: { type: "string" },
    tailoredResume: { type: "string" },
    coverLetter: { type: "string" },
    improvementNotes: { type: "array", items: { type: "string" } },
    riskFlags: { type: "array", items: { type: "string" } },
    coaching: {
      type: "object",
      additionalProperties: false,
      required: [
        "overallRecruiterImpression",
        "whyThisScore",
        "topStrengths",
        "topGaps",
        "atsRisks",
        "recruiterReadabilityScore",
        "seniorityAlignment",
        "industryAlignment",
        "keywordDensityNotes",
        "rolePositioningRecommendation",
        "sectionCritique",
        "weakBullets",
        "recruiterObjections",
      ],
      properties: {
        overallRecruiterImpression: { type: "string" },
        whyThisScore: { type: "array", items: { type: "string" } },
        topStrengths: { type: "array", items: { type: "string" } },
        topGaps: { type: "array", items: { type: "string" } },
        atsRisks: { type: "array", items: { type: "string" } },
        recruiterReadabilityScore: { type: "number", minimum: 0, maximum: 100 },
        seniorityAlignment: { type: "string" },
        industryAlignment: { type: "string" },
        keywordDensityNotes: { type: "array", items: { type: "string" } },
        rolePositioningRecommendation: { type: "string" },
        sectionCritique: {
          type: "object",
          additionalProperties: false,
          required: [
            "headerContact",
            "professionalSummary",
            "skills",
            "experience",
            "projects",
            "educationCertifications",
            "coverLetter",
          ],
          properties: {
            headerContact: { type: "array", items: { type: "string" } },
            professionalSummary: { type: "array", items: { type: "string" } },
            skills: { type: "array", items: { type: "string" } },
            experience: { type: "array", items: { type: "string" } },
            projects: { type: "array", items: { type: "string" } },
            educationCertifications: {
              type: "array",
              items: { type: "string" },
            },
            coverLetter: { type: "array", items: { type: "string" } },
          },
        },
        weakBullets: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["original", "issueType", "issue", "strongerVersion"],
            properties: {
              original: { type: "string" },
              issueType: { type: "string" },
              issue: { type: "string" },
              strongerVersion: { type: "string" },
            },
          },
        },
        recruiterObjections: { type: "array", items: { type: "string" } },
      },
    },
    linkedin: {
      type: "object",
      additionalProperties: false,
      required: [
        "headline",
        "about",
        "featuredProjects",
        "topSkills",
        "recruiterKeywords",
        "openToWorkPositioning",
        "networkingMessage",
        "recruiterOutreachMessage",
      ],
      properties: {
        headline: { type: "string" },
        about: { type: "string" },
        featuredProjects: { type: "string" },
        topSkills: { type: "array", items: { type: "string" } },
        recruiterKeywords: { type: "array", items: { type: "string" } },
        openToWorkPositioning: { type: "string" },
        networkingMessage: { type: "string" },
        recruiterOutreachMessage: { type: "string" },
      },
    },
    applicationKit: {
      type: "object",
      additionalProperties: false,
      required: [
        "recruiterEmail",
        "followUpEmail",
        "referralRequest",
        "connectionRequest",
        "interviewIntroPitch",
        "tellMeAboutYourself",
      ],
      properties: {
        recruiterEmail: { type: "string" },
        followUpEmail: { type: "string" },
        referralRequest: { type: "string" },
        connectionRequest: { type: "string" },
        interviewIntroPitch: { type: "string" },
        tellMeAboutYourself: { type: "string" },
      },
    },
  },
} as const;

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function extractKeywords(text: string) {
  const normalized = normalizeText(text);

  return keywordBank.filter((keyword) =>
    normalized.includes(normalizeText(keyword)),
  );
}

function firstMeaningfulLine(text: string, fallback: string) {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? fallback
  );
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

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreNotesFromBreakdown(breakdown: TailorResponse["matchBreakdown"]) {
  return [
    `Role fit: ${Math.round(breakdown.roleFit)}/100`,
    `Industry fit: ${Math.round(breakdown.industryFit)}/100`,
    `Required skills match: ${Math.round(breakdown.requiredSkillsMatch)}/100`,
    `Preferred skills match: ${Math.round(breakdown.preferredSkillsMatch)}/100`,
    `Metrics strength: ${Math.round(breakdown.metricStrength)}/100`,
    `Seniority alignment: ${Math.round(breakdown.seniorityAlignment)}/100`,
    `AI/project relevance: ${Math.round(breakdown.projectRelevance)}/100`,
    `ATS readability: ${Math.round(breakdown.atsReadability)}/100`,
  ];
}

function detectWeakBullets(text: string): WeakBulletSuggestion[] {
  return text
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
        strongerVersion:
          line
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

function buildLocalCoaching({
  matchScore,
  matchBreakdown,
  missingKeywords,
  positioningStrategy,
  tailoredResume,
  coverLetter,
  improvementNotes,
  riskFlags,
}: Omit<TailorResponse, "coaching">): Coaching {
  const hasContact =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(tailoredResume) ||
    /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/.test(
      tailoredResume,
    );
  const hasProjects = /\bprojects?\b/i.test(tailoredResume);

  return {
    overallRecruiterImpression:
      matchScore >= 90
        ? "Strong fit with clear role alignment and recruiter-readable positioning."
        : matchScore >= 75
          ? "Credible fit, with a few proof points and keyword gaps to tighten before applying."
          : "Relevant experience is present, but the resume needs sharper evidence and closer role alignment.",
    whyThisScore: scoreNotesFromBreakdown(matchBreakdown),
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
    recruiterReadabilityScore: matchBreakdown.atsReadability,
    seniorityAlignment: `Seniority alignment is ${matchBreakdown.seniorityAlignment}/100 based on title language, leadership signals, and scope described in the resume.`,
    industryAlignment: `Industry alignment is ${matchBreakdown.industryFit}/100 based on the selected industry target and available source material.`,
    keywordDensityNotes:
      missingKeywords.length > 0
        ? [
            `Recommended keywords to add only where truthful: ${missingKeywords
              .slice(0, 6)
              .join(", ")}.`,
            "Use important terms naturally in the summary, skills, and most relevant bullets.",
          ]
        : ["Keyword coverage is strong; avoid unnatural repetition."],
    rolePositioningRecommendation: positioningStrategy,
    sectionCritique: {
      headerContact: [
        hasContact
          ? "Header includes contact signal; confirm LinkedIn and location if appropriate."
          : "Add direct contact details before applying.",
      ],
      professionalSummary: [
        "Lead with the target role, strongest domain fit, and two to three recruiter-relevant strengths.",
      ],
      skills: [
        "Keep skills tied to the job description and remove unsupported tools.",
      ],
      experience: improvementNotes.slice(0, 2),
      projects: [
        hasProjects
          ? "Project evidence is visible; connect it directly to the target role."
          : "Add projects only if source material supports them.",
      ],
      educationCertifications: [
        "Keep education and certifications concise, current, and directly relevant.",
      ],
      coverLetter: [
        coverLetter.trim().length > 0
          ? "Cover letter is available; keep it concise and aligned to the edited resume."
          : "Generate a concise cover letter after finalizing the resume.",
      ],
    },
    weakBullets: detectWeakBullets(tailoredResume),
    recruiterObjections:
      missingKeywords.length > 0
        ? [
            `Recruiter may question missing evidence for ${missingKeywords
              .slice(0, 4)
              .join(", ")}.`,
            "Any new claim should be supported by the resume or uploaded source materials.",
          ]
        : ["Recruiter objections are mostly around proof depth, not keyword coverage."],
  };
}

function resumeBullets(text: string) {
  return text
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

function buildLocalAdvancedAnalysis(
  response: Omit<TailorResponse, "advancedAnalysis">,
  request: TailorRequest,
): AdvancedAnalysis {
  const positioningMode = request.aiSettings?.positioningMode || "Product";
  const interviewLabel =
    response.matchScore >= 85 ? "Strong" : response.matchScore >= 70 ? "Moderate" : "Limited";
  const makeReview = (
    score: number,
    strengths: string[],
    weaknesses: string[],
    concerns: string[],
  ): ReviewSimulation => ({
    score: clampScore(score),
    strengths,
    weaknesses,
    concerns,
    interviewProbability: interviewLabel,
  });
  const bulletImprovements = resumeBullets(response.tailoredResume).map((bullet) => {
    const base = bullet.replace(/\.$/, "");
    const hasMetric = /\$?\d[\d,.]*\+?%?/.test(bullet);

    return {
      original: bullet,
      strongerVersion: `${base}. Add verified ownership, scope, or outcome detail where supported.`,
      atsOptimizedVersion: `${base}, aligning keywords, tools, and responsibilities to the target job description.`,
      executiveVersion: `${base}, connecting execution to strategic priorities, stakeholder confidence, and measurable business value.`,
      conciseVersion: base.length > 120 ? `${base.slice(0, 117)}...` : base,
      metricFocusedVersion: hasMetric
        ? bullet
        : `${base}, adding verified scope, stakeholder count, timeline, or business result where available.`,
      suggestedMetrics: hasMetric
        ? ["Existing metric detected; verify accuracy before use."]
        : [
            "AI suggestion - verify before use: stakeholder count.",
            "AI suggestion - verify before use: number of projects, launches, users, or workflows affected.",
            "AI suggestion - verify before use: time saved, revenue influenced, cost reduced, or quality improved.",
          ],
    };
  });

  return {
    recruiterSimulation: {
      atsScreening: makeReview(
        response.matchBreakdown.atsReadability,
        ["Plain section structure and role keywords support ATS parsing."],
        response.missingKeywords.length > 0
          ? [`Missing or light keywords: ${response.missingKeywords.slice(0, 5).join(", ")}.`]
          : ["No major ATS keyword gaps detected."],
        ["Unsupported keywords should not be added without source evidence."],
      ),
      recruiterReview: makeReview(
        response.matchScore,
        ["Resume has a clear role target and recruiter-readable positioning."],
        ["Some bullets may need stronger measurable proof."],
        response.riskFlags,
      ),
      hiringManagerReview: makeReview(
        response.matchBreakdown.seniorityAlignment,
        ["Experience can be mapped to ownership, delivery, and stakeholder outcomes."],
        ["Hiring manager may ask for deeper examples of scope and decision-making."],
        ["Prepare proof stories for the most senior claims."],
      ),
    },
    keyScores: {
      likelihoodOfInterview: response.matchScore,
      atsPassProbability: response.matchBreakdown.atsReadability,
      executiveReadiness: clampScore(
        (response.matchBreakdown.seniorityAlignment +
          response.matchBreakdown.metricStrength) /
          2,
      ),
      technicalDepth: response.matchBreakdown.projectRelevance,
      leadershipStrength: response.matchBreakdown.seniorityAlignment,
      industryAlignment: response.matchBreakdown.industryFit,
    },
    interviewPrep: {
      whyYouFitThisRole: response.positioningStrategy,
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
        `What makes your experience relevant to ${request.industryTarget || "this industry"}?`,
        "Which industry risks or constraints would you watch first?",
      ],
      potentialRecruiterObjections: response.riskFlags,
    },
    gapAnalysis: {
      missingKeywords: response.missingKeywords,
      weakExperienceAreas: ["Quantified impact", "Scope clarity", "Role-specific proof stories"],
      seniorityGaps: ["Make ownership level, decision rights, and stakeholder level explicit."],
      leadershipGaps: ["Add leadership outcomes only where supported by source material."],
      technicalGaps: response.missingKeywords.filter((keyword) =>
        /ai|ml|api|data|analytics|automation|llm|technical/i.test(keyword),
      ),
      educationAlignment: ["Education should stay concise and relevant to the target role."],
      certificationAlignment: [
        "Add certifications only if already earned or clearly marked as planned.",
      ],
      recommendations: [
        "Prioritize bullets with action, scope, and verified outcome.",
        "Add missing keywords only where source material supports them.",
        `Adjust tone toward ${positioningMode.toLowerCase()} positioning.`,
      ],
      wordingChanges: [
        "Replace task language with ownership and outcome language.",
        "Move role-relevant keywords into the summary and skills sections.",
      ],
    },
    jobDescriptionIntelligence: {
      requiredSkills: response.recommendedKeywords.slice(0, 6),
      preferredSkills: response.missingKeywords.slice(0, 6),
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
      keywordMap: [
        ...response.recommendedKeywords,
        ...response.missingKeywords,
      ].slice(0, 12),
      alignmentSummary: `The resume is positioned for ${request.industryTarget || "the selected industry"} with a ${response.matchScore}/100 overall match.`,
      roleStrategy: `Use ${positioningMode.toLowerCase()} positioning while keeping every claim grounded in source material.`,
    },
    bulletImprovements,
    aiSuggestions: [
      response.missingKeywords.length > 0
        ? `Add stronger evidence for ${response.missingKeywords.slice(0, 3).join(", ")} if truthful.`
        : "Keyword coverage is strong; focus on proof depth.",
      "Add stronger roadmap ownership language where source material supports it.",
      "Check whether metrics are concentrated in one role and distribute proof across relevant experience.",
      "Leadership positioning could be stronger if scope and stakeholder level are verified.",
    ],
    positioningMode,
  };
}

function buildLocalApplicationPackage({
  response,
  request,
}: {
  response: Omit<TailorResponse, "linkedin" | "applicationKit">;
  request: TailorRequest;
}): { linkedin: LinkedInKit; applicationKit: ApplicationKit } {
  const role = titleCase(request.targetRole || firstMeaningfulLine(response.tailoredResume, "Target Role"));
  const industry = request.industryTarget || "General / ATS";
  const candidateName = firstMeaningfulLine(response.tailoredResume, "Candidate");
  const strengths =
    response.coaching.topStrengths.slice(0, 5).join(", ") ||
    "product delivery, stakeholder alignment, and execution";
  const keywords = Array.from(
    new Set([
      ...response.coaching.topStrengths,
      ...response.recommendedKeywords,
      ...response.missingKeywords,
    ]),
  ).slice(0, 12);
  const firstBullet =
    response.tailoredResume
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*]\s+/, "").trim())
      .find((line) => line.length > 40) || response.positioningStrategy;
  const article = articleFor(role);

  return {
    linkedin: {
      headline: `${role} | ${industry} | ${strengths}`,
      about: `${role} focused on ${industry} opportunities. I bring experience in ${strengths}, with a practical record of translating business needs into clear priorities, stakeholder alignment, and execution-ready work. My background is strongest where product judgment, technical fluency, and measurable delivery need to come together.`,
      featuredProjects: firstBullet,
      topSkills: keywords.slice(0, 10),
      recruiterKeywords: keywords,
      openToWorkPositioning: `Open to ${role} opportunities in ${industry}, especially roles that value execution discipline, stakeholder leadership, and practical technical fluency.`,
      networkingMessage: `Hi, I am exploring ${role} opportunities in ${industry}. Your work caught my attention, and I would value connecting with professionals in this space.`,
      recruiterOutreachMessage: `Hi, I am interested in ${role} opportunities and bring experience across ${strengths}. I would welcome a conversation if my background aligns with roles you are supporting.`,
    },
    applicationKit: {
      recruiterEmail: `Hello,\n\nI am reaching out regarding ${role} opportunities. My background aligns with ${industry} needs through ${strengths}. I would welcome the chance to share how my experience could support your team.\n\nBest regards,\n${candidateName}`,
      followUpEmail: `Hello,\n\nI wanted to follow up on my interest in the ${role} role. I remain interested because the opportunity aligns with my experience in ${strengths}. Please let me know if I can provide any additional information.\n\nBest regards,\n${candidateName}`,
      referralRequest: `Hi, I am applying for ${article} ${role} role and noticed your connection to the team. If you feel comfortable, I would appreciate a referral or any guidance on how to position my background for this opportunity.`,
      connectionRequest: `Hi, I am exploring ${role} opportunities in ${industry} and would value connecting with people working in this space.`,
      interviewIntroPitch: `I am ${article} ${role} candidate with experience in ${strengths}. I focus on turning business needs into clear priorities, aligning stakeholders, and supporting delivery that is practical, measurable, and recruiter-ready.`,
      tellMeAboutYourself: `I have built my background around ${strengths}, with a focus on practical execution and cross-functional alignment. For this ${role} opportunity, I am especially interested in applying that experience to ${industry} challenges where clear priorities, technical fluency, and measurable outcomes matter.`,
    },
  };
}

function sourceMaterialText(files: UploadedSourceMaterial[] = []) {
  return files
    .map((file) => file.extractedText?.trim())
    .filter((text): text is string => Boolean(text))
    .join("\n\n");
}

function sourceMaterialWarnings(
  files: UploadedSourceMaterial[] = [],
  masterResume = "",
) {
  const warnings = files.flatMap((file) =>
    (file.warnings ?? []).map((warning) => `${file.name}: ${warning}`),
  );
  const sourceText = sourceMaterialText(files);
  const masterEducation = masterResume.match(/\b(M\.?S\.?|B\.?S\.?|B\.?Tech|MBA|Ph\.?D\.?)\b/gi) ?? [];
  const sourceEducation = sourceText.match(/\b(M\.?S\.?|B\.?S\.?|B\.?Tech|MBA|Ph\.?D\.?)\b/gi) ?? [];
  const hasEducationMismatch =
    masterEducation.length > 0 &&
    sourceEducation.length > 0 &&
    sourceEducation.some(
      (degree) =>
        !masterEducation.some(
          (masterDegree) => normalizeText(masterDegree) === normalizeText(degree),
        ),
    );

  if (hasEducationMismatch) {
    warnings.push(
      "Uploaded source materials may contain education details that differ from the master resume. Verify before using them.",
    );
  }

  return warnings;
}

function localTailor(request: TailorRequest): TailorResponse {
  const baseResume = request.currentEditedResume || request.masterResume || "";
  const extractedSources = sourceMaterialText(request.uploadedSourceMaterials);
  const masterResume = [baseResume, extractedSources]
    .filter((text) => text.trim().length > 0)
    .join("\n\nSUPPORTING SOURCE MATERIAL\n");
  const jobDescription = request.jobDescription || "";
  const targetRole = request.targetRole || firstMeaningfulLine(jobDescription, "Target Role");
  const role = titleCase(targetRole);
  const resumeKeywords = extractKeywords(masterResume);
  const jobKeywords = extractKeywords(jobDescription);
  const matchedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !resumeKeywords.includes(keyword),
  );
  const keywordCoverage =
    matchedKeywords.length / Math.max(1, jobKeywords.length || matchedKeywords.length);
  const hasMetrics = /(\$?\d[\d,.]*\+?%?|\b\d+\+?\b)/.test(masterResume);
  const roleFit = normalizeText(masterResume).includes(normalizeText(role).split(" ")[0])
    ? 88
    : 72;
  const requiredSkillsMatch = clampScore(keywordCoverage * 100);
  const preferredSkillsMatch = clampScore(Math.max(65, keywordCoverage * 92));
  const metricStrength = hasMetrics ? 88 : 62;
  const seniorityAlignment = /senior|principal|lead|manager|owner/i.test(masterResume)
    ? 88
    : 70;
  const projectRelevance = /ai|ml|automation|product|platform|technical/i.test(
    masterResume,
  )
    ? 90
    : 72;
  const industryFit = request.industryTarget && request.industryTarget !== "General / ATS"
    ? projectRelevance
    : 84;
  const atsReadability = 90;
  const matchScore = clampScore(
    roleFit * 0.16 +
      industryFit * 0.12 +
      requiredSkillsMatch * 0.22 +
      preferredSkillsMatch * 0.12 +
      metricStrength * 0.12 +
      seniorityAlignment * 0.1 +
      projectRelevance * 0.1 +
      atsReadability * 0.06,
  );
  const candidateName = firstMeaningfulLine(masterResume, "");
  const strongestKeywords = matchedKeywords.slice(0, 10);
  const tailoredResume = `${candidateName}
${role}

PROFESSIONAL SUMMARY
${role} with experience translating business needs into delivery-ready product work. Brings strengths in ${strongestKeywords.join(", ") || "stakeholder alignment, product execution, and technical delivery"} with a focus on measurable outcomes, clear requirements, and recruiter-readable communication.

CORE SKILLS
${[
  ...new Set([
    ...strongestKeywords,
    "Product Requirements",
    "Stakeholder Alignment",
    "Delivery Planning",
  ]),
].join(" | ")}

EXPERIENCE HIGHLIGHTS
- Reframed relevant experience around ${role} priorities while staying grounded in the provided source material.
- Connected stakeholder needs, technical execution, and launch readiness across product and delivery work.
- Improved ATS alignment by emphasizing role-relevant language that appears in the job description.

SOURCE RESUME EXCERPT
${masterResume.trim()}`;
  const signature = candidateName ? `\n${candidateName}` : "";
  const coverLetter = `Dear Hiring Team,

I am interested in the ${role} role because it aligns with my verified experience in ${strongestKeywords.slice(0, 4).join(", ") || "role-relevant execution, stakeholder alignment, and practical delivery"}.

One relevant strength is translating business goals into clear requirements, coordinating technical and business stakeholders, and supporting launch-ready product work. That experience maps directly to the priorities in this role while keeping the resume grounded in what I can explain in interviews.

I would welcome the opportunity to bring practical judgment, execution discipline, and role-relevant experience to your team.

Sincerely,${signature}`;

  const sourceWarnings = sourceMaterialWarnings(
    request.uploadedSourceMaterials,
    request.masterResume || "",
  );
  const resultWithoutCoaching = {
    matchScore,
    matchBreakdown: {
      roleFit,
      industryFit,
      requiredSkillsMatch,
      preferredSkillsMatch,
      metricStrength,
      seniorityAlignment,
      projectRelevance,
      atsReadability,
    },
    missingKeywords,
    recommendedKeywords: missingKeywords.slice(0, 8),
    positioningStrategy:
      "Lead with relevant product, technical, and delivery experience while keeping claims tied to the provided resume and source materials.",
    tailoredResume,
    coverLetter,
    improvementNotes: [
      "Add quantified outcomes where they are supported by source material.",
      "Use job-description terminology in the summary, skills, and strongest bullets.",
      "Keep bullets concise and focused on action, scope, and impact.",
    ],
    riskFlags:
      [
        ...(missingKeywords.length > 0
          ? [
              `Only include ${missingKeywords
                .slice(0, 3)
                .join(", ")} if you can confidently explain that experience in interviews.`,
            ]
          : ["No major unsupported-claim risks detected."]),
        ...sourceWarnings,
      ],
  };

  const coaching = buildLocalCoaching(resultWithoutCoaching);
  const resultWithCoaching = {
    ...resultWithoutCoaching,
    coaching: {
      ...coaching,
      topStrengths:
        matchedKeywords.length > 0
          ? matchedKeywords.slice(0, 5)
          : coaching.topStrengths,
    },
  };
  const packageKit = buildLocalApplicationPackage({
    response: resultWithCoaching,
    request,
  });

  return {
    ...resultWithCoaching,
    advancedAnalysis: buildLocalAdvancedAnalysis(resultWithCoaching, request),
    linkedin: packageKit.linkedin,
    applicationKit: packageKit.applicationKit,
  };
}

function normalizeResponse(response: TailorResponse): TailorResponse {
  const normalizedBreakdown = {
    roleFit: clampScore(response.matchBreakdown.roleFit),
    industryFit: clampScore(response.matchBreakdown.industryFit),
    requiredSkillsMatch: clampScore(response.matchBreakdown.requiredSkillsMatch),
    preferredSkillsMatch: clampScore(response.matchBreakdown.preferredSkillsMatch),
    metricStrength: clampScore(response.matchBreakdown.metricStrength),
    seniorityAlignment: clampScore(response.matchBreakdown.seniorityAlignment),
    projectRelevance: clampScore(response.matchBreakdown.projectRelevance),
    atsReadability: clampScore(response.matchBreakdown.atsReadability),
  };
  const normalizedBase = {
    matchScore: clampScore(response.matchScore),
    matchBreakdown: normalizedBreakdown,
    missingKeywords: response.missingKeywords.map(stripMarkdown).filter(Boolean),
    recommendedKeywords: response.recommendedKeywords.map(stripMarkdown).filter(Boolean),
    positioningStrategy: stripMarkdown(response.positioningStrategy),
    tailoredResume: stripMarkdown(response.tailoredResume),
    coverLetter: stripMarkdown(response.coverLetter),
    improvementNotes: response.improvementNotes.map(stripMarkdown).filter(Boolean),
    riskFlags: response.riskFlags.map(stripMarkdown).filter(Boolean),
  };
  const fallbackCoaching = buildLocalCoaching(normalizedBase);
  const coaching = response.coaching ?? fallbackCoaching;

  const normalizedResponse = {
    ...normalizedBase,
    coaching: {
      overallRecruiterImpression:
        stripMarkdown(coaching.overallRecruiterImpression) ||
        fallbackCoaching.overallRecruiterImpression,
      whyThisScore:
        coaching.whyThisScore?.map(stripMarkdown).filter(Boolean) ||
        fallbackCoaching.whyThisScore,
      topStrengths:
        coaching.topStrengths?.map(stripMarkdown).filter(Boolean) ||
        fallbackCoaching.topStrengths,
      topGaps:
        coaching.topGaps?.map(stripMarkdown).filter(Boolean) ||
        fallbackCoaching.topGaps,
      atsRisks:
        coaching.atsRisks?.map(stripMarkdown).filter(Boolean) ||
        fallbackCoaching.atsRisks,
      recruiterReadabilityScore: clampScore(coaching.recruiterReadabilityScore),
      seniorityAlignment:
        stripMarkdown(coaching.seniorityAlignment) ||
        fallbackCoaching.seniorityAlignment,
      industryAlignment:
        stripMarkdown(coaching.industryAlignment) ||
        fallbackCoaching.industryAlignment,
      keywordDensityNotes:
        coaching.keywordDensityNotes?.map(stripMarkdown).filter(Boolean) ||
        fallbackCoaching.keywordDensityNotes,
      rolePositioningRecommendation:
        stripMarkdown(coaching.rolePositioningRecommendation) ||
        fallbackCoaching.rolePositioningRecommendation,
      sectionCritique: {
        headerContact:
          coaching.sectionCritique?.headerContact?.map(stripMarkdown).filter(Boolean) ||
          fallbackCoaching.sectionCritique.headerContact,
        professionalSummary:
          coaching.sectionCritique?.professionalSummary
            ?.map(stripMarkdown)
            .filter(Boolean) ||
          fallbackCoaching.sectionCritique.professionalSummary,
        skills:
          coaching.sectionCritique?.skills?.map(stripMarkdown).filter(Boolean) ||
          fallbackCoaching.sectionCritique.skills,
        experience:
          coaching.sectionCritique?.experience?.map(stripMarkdown).filter(Boolean) ||
          fallbackCoaching.sectionCritique.experience,
        projects:
          coaching.sectionCritique?.projects?.map(stripMarkdown).filter(Boolean) ||
          fallbackCoaching.sectionCritique.projects,
        educationCertifications:
          coaching.sectionCritique?.educationCertifications
            ?.map(stripMarkdown)
            .filter(Boolean) ||
          fallbackCoaching.sectionCritique.educationCertifications,
        coverLetter:
          coaching.sectionCritique?.coverLetter?.map(stripMarkdown).filter(Boolean) ||
          fallbackCoaching.sectionCritique.coverLetter,
      },
      weakBullets:
        coaching.weakBullets
          ?.filter((bullet) => bullet.original && bullet.strongerVersion)
          .map((bullet) => ({
            original: stripMarkdown(bullet.original),
            issueType: stripMarkdown(bullet.issueType),
            issue: stripMarkdown(bullet.issue),
            strongerVersion: stripMarkdown(bullet.strongerVersion),
          })) || fallbackCoaching.weakBullets,
      recruiterObjections:
        coaching.recruiterObjections?.map(stripMarkdown).filter(Boolean) ||
        fallbackCoaching.recruiterObjections,
    },
  };
  const fallbackPackage = buildLocalApplicationPackage({
    response: normalizedResponse,
    request: { industryTarget: "General / ATS", targetRole: "" },
  });

  return {
    ...normalizedResponse,
    extractedResumeJson: response.extractedResumeJson,
    optimizedResumeJson: response.optimizedResumeJson,
    renderResumeState: response.renderResumeState,
    advancedAnalysis:
      response.advancedAnalysis ??
      buildLocalAdvancedAnalysis(normalizedResponse, {
        industryTarget: "General / ATS",
        aiSettings: { positioningMode: "Product" },
      }),
    linkedin: response.linkedin ?? fallbackPackage.linkedin,
    applicationKit: response.applicationKit ?? fallbackPackage.applicationKit,
  };
}

function resumeIntelligenceSourceText(request: TailorRequest) {
  return [
    request.currentEditedResume,
    request.masterResume,
    sourceMaterialText(request.uploadedSourceMaterials),
  ]
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n\n");
}

async function applyResumePipeline(
  request: TailorRequest,
  response: TailorResponse,
  apiKey?: string,
): Promise<TailorResponse> {
  const sourceText = resumeIntelligenceSourceText(request);

  if (!sourceText.trim()) {
    return normalizeResponse(response);
  }

  const extractedResumeJson = await extractResume({
    rawText: sourceText,
    openAiApiKey: apiKey,
  });
  const optimizedResumeJson = await optimizeResume({
    resume: extractedResumeJson,
    jobDescription: request.jobDescription,
    targetRole: request.targetRole,
    industryTarget: request.industryTarget,
    openAiApiKey: apiKey,
  });
  const rankedResume = await rankResumeIntelligence({
    resume: optimizedResumeJson,
    jobDescription: request.jobDescription,
    targetRole: request.targetRole,
    industryTarget: request.industryTarget,
    openAiApiKey: apiKey,
  });
  const renderResumeState = renderResume(rankedResume.resume);

  if (renderResumeState.validationIssues.length > 0) {
    console.warn("ISEYA pipeline validation failures", {
      issueCount: renderResumeState.validationIssues.length,
    });
  }

  return normalizeResponse({
    ...response,
    tailoredResume: renderResumeState.plainText || response.tailoredResume,
    extractedResumeJson,
    optimizedResumeJson: rankedResume.resume,
    renderResumeState,
  });
}

async function callOpenAI(request: TailorRequest, apiKey: string) {
  const sourceMaterials = (request.uploadedSourceMaterials ?? []).map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
    extractionStatus: file.extractionStatus,
    warnings: file.warnings ?? [],
    extractedText: file.extractedText?.slice(0, 8000),
  }));
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: optimizationModel,
      temperature: Math.max(
        0,
        Math.min(1, (request.aiSettings?.creativity ?? 25) / 100),
      ),
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "iseya_tailoring_result",
          strict: true,
          schema: responseSchema,
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are Iseya, a truthful senior resume strategist and recruiter-facing resume coach. Return only structured JSON that matches the schema. Do not fabricate employers, degrees, certifications, metrics, tools, keywords, or experience. Treat uploaded materials as supporting source material, not as permission to invent. If uploaded materials conflict with the master resume, surface that in riskFlags and coaching.recruiterObjections. Reframe only what is supported by the provided resume and source materials. Rewrite weak bullets without inventing metrics; include metrics only when directly supported. Use clean plain text with no markdown symbols.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task:
              "Analyze the role, industry, required skills, preferred skills, tools, responsibilities, seniority, hidden hiring signals, ATS fit, recruiter readability, truthful candidate positioning, recruiter objections, section-by-section resume quality, weak bullets, keyword density, role positioning, and uploaded source materials. Use uploaded extracted text only when relevant and truthful. Generate a tailored resume, concise recruiter-ready cover letter, score breakdown, detailed AI Resume Coach data, LinkedIn optimization kit, and job application kit. For weakBullets, include the original bullet, issue type, issue, and a stronger rewritten version grounded only in the source material.",
            industryTarget: request.industryTarget || "General / ATS",
            targetRole: request.targetRole || "",
            masterResume: request.masterResume || "",
            currentEditedResume: request.currentEditedResume || "",
            jobDescription: request.jobDescription || "",
            uploadedSourceMaterials: sourceMaterials,
            aiSettings: request.aiSettings,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return applyResumePipeline(request, JSON.parse(content) as TailorResponse, apiKey);
}

function optimizeTextLocally(request: TailorRequest): OptimizationResponse {
  const optimization = request.optimizationRequest;
  const action = optimization?.action || "Optimize this section";
  const sourceText = stripMarkdown(optimization?.sectionText || "");
  const cleanedLines = sourceText
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line).replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const prefix =
    action === "Strengthen Metrics"
      ? "Verify before use: add a supported metric, scope, or outcome where your source material proves it."
      : "";
  const optimizedLines = cleanedLines.map((line) => {
    let next = line
      .replace(/^responsible for\s+/i, "Led ")
      .replace(/^worked on\s+/i, "Advanced ")
      .replace(/^helped\s+/i, "Supported ")
      .replace(/^handled\s+/i, "Managed ");

    if (action === "Shorten" && next.length > 150) {
      next = `${next.slice(0, 147).replace(/\s+\S*$/, "")}.`;
    }

    return /[.!?]$/.test(next) ? next : `${next}.`;
  });

  return {
    optimizedText: [prefix, ...optimizedLines].filter(Boolean).join("\n"),
    warnings: [
      "Local fallback used. Review carefully and verify any inferred scope before use.",
    ],
  };
}

async function callOpenAIOptimization(
  request: TailorRequest,
  apiKey: string,
): Promise<OptimizationResponse> {
  const optimization = request.optimizationRequest;

  if (!optimization?.sectionText?.trim()) {
    return { optimizedText: "", warnings: ["No section text was provided."] };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: optimizationModel,
      temperature: Math.max(
        0,
        Math.min(0.8, (request.aiSettings?.creativity ?? 25) / 100),
      ),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are Iseya, a truthful resume optimization assistant. Return only JSON with optimizedText and warnings. Optimize only the provided section or bullet. Do not add employers, degrees, certifications, years, tools, metrics, or achievements unless directly supported by the supplied resume/source text. If you infer a metric or scope, mark it exactly as 'AI suggestion - verify before use.' Use clean plain text with no markdown symbols.",
        },
        {
          role: "user",
          content: JSON.stringify({
            action: optimization.action || "Optimize this section",
            sectionName: optimization.sectionName || "Resume section",
            sectionText: optimization.sectionText,
            fullResumeText: optimization.fullResumeText?.slice(0, 12000) || "",
            masterResume: request.masterResume?.slice(0, 12000) || "",
            jobDescription: request.jobDescription?.slice(0, 8000) || "",
            targetRole: request.targetRole || "",
            industryTarget: request.industryTarget || "General / ATS",
            instruction:
              "Return a revised version of only sectionText. Preserve truthfulness, keep the same basic content scope, improve recruiter readability and ATS clarity, and avoid markdown.",
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI optimization failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty optimization response.");
  }

  const parsed = JSON.parse(content) as Partial<OptimizationResponse>;

  return {
    optimizedText: stripMarkdown(parsed.optimizedText || optimization.sectionText),
    warnings:
      parsed.warnings?.map(stripMarkdown).filter(Boolean) ??
      ["Review optimized text before use."],
  };
}

async function canUseOptimizationEndpoint() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return false;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from("profiles")
    .select("subscription_plan, optimization_credits")
    .eq("id", user.id)
    .maybeSingle();

  const plan = normalizeSubscriptionPlan(data?.subscription_plan);
  const storedCreditLimit = Number(data?.optimization_credits) || 0;
  const creditLimit = storedCreditLimit > 0 ? storedCreditLimit : planOptimizationLimit(plan);
  const { data: usageData, error: usageError } = await supabase
    .from("profiles")
    .select("optimization_credits_used")
    .eq("id", user.id)
    .maybeSingle();
  const creditsUsed = usageError ? 0 : Number(usageData?.optimization_credits_used) || 0;

  if (isProPlan(plan)) {
    return creditLimit - creditsUsed > 0;
  }

  return plan === "plus" && creditLimit - creditsUsed > 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TailorRequest;
    const apiKey = process.env.OPENAI_API_KEY;

    if (body.optimizationRequest) {
      if (!(await canUseOptimizationEndpoint())) {
        return Response.json(
          { error: "AI optimization is locked for this plan." },
          { status: 403 },
        );
      }

      if (!apiKey) {
        return Response.json(optimizeTextLocally(body));
      }

      try {
        return Response.json(await callOpenAIOptimization(body, apiKey));
      } catch {
        return Response.json(optimizeTextLocally(body));
      }
    }

    if (!body.masterResume || !body.jobDescription || !body.targetRole) {
      return Response.json(
        { error: "masterResume, jobDescription, and targetRole are required." },
        { status: 400 },
      );
    }

    if (!apiKey) {
      return Response.json(await applyResumePipeline(body, localTailor(body)));
    }

    try {
      return Response.json(await callOpenAI(body, apiKey));
    } catch {
      return Response.json(await applyResumePipeline(body, localTailor(body)));
    }
  } catch {
    return Response.json(
      {
        error: "Unable to process your resume right now. Please review your inputs and try again.",
      },
      { status: 500 },
    );
  }
}
