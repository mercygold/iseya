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
            ? ", clarifying scope, stakeholders, and outcome using only verified source details."
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
  const candidateName = firstMeaningfulLine(masterResume, "Candidate Name");
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
  const coverLetter = `Dear Hiring Team,

I am writing to express my interest in the ${role} role. My background aligns with the position through ${strongestKeywords.slice(0, 5).join(", ") || "product leadership, stakeholder alignment, and technical delivery"}.

The attached resume highlights experience translating business goals into requirements, coordinating technical and business stakeholders, and supporting launch-ready product work. I would welcome the opportunity to bring this practical execution focus to your team.

Sincerely,
${candidateName}`;

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
              `Do not claim ${missingKeywords
                .slice(0, 3)
                .join(", ")} unless the candidate can verify that experience.`,
            ]
          : ["No major unsupported-claim risks detected."]),
        ...sourceWarnings,
      ],
  };

  const coaching = buildLocalCoaching(resultWithoutCoaching);

  return {
    ...resultWithoutCoaching,
    coaching: {
      ...coaching,
      topStrengths:
        matchedKeywords.length > 0
          ? matchedKeywords.slice(0, 5)
          : coaching.topStrengths,
    },
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

  return {
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
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.25,
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
              "Analyze the role, industry, required skills, preferred skills, tools, responsibilities, seniority, hidden hiring signals, ATS fit, recruiter readability, truthful candidate positioning, recruiter objections, section-by-section resume quality, weak bullets, keyword density, role positioning, and uploaded source materials. Use uploaded extracted text only when relevant and truthful. Generate a tailored resume, concise recruiter-ready cover letter, score breakdown, and detailed AI Resume Coach data. For weakBullets, include the original bullet, issue type, issue, and a stronger rewritten version grounded only in the source material.",
            industryTarget: request.industryTarget || "General / ATS",
            targetRole: request.targetRole || "",
            masterResume: request.masterResume || "",
            currentEditedResume: request.currentEditedResume || "",
            jobDescription: request.jobDescription || "",
            uploadedSourceMaterials: sourceMaterials,
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

  return normalizeResponse(JSON.parse(content) as TailorResponse);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TailorRequest;

    if (!body.masterResume || !body.jobDescription || !body.targetRole) {
      return Response.json(
        { error: "masterResume, jobDescription, and targetRole are required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(localTailor(body));
    }

    try {
      return Response.json(await callOpenAI(body, apiKey));
    } catch {
      return Response.json(localTailor(body));
    }
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to tailor resume with AI.",
      },
      { status: 500 },
    );
  }
}
