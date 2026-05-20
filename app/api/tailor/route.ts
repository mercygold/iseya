export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadedSourceMaterial = {
  name: string;
  type: string;
  size?: number;
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

function localTailor(request: TailorRequest): TailorResponse {
  const masterResume = request.currentEditedResume || request.masterResume || "";
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
  const strongestKeywords = [...matchedKeywords, ...missingKeywords.slice(0, 4)].slice(0, 10);
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

  return {
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
      missingKeywords.length > 0
        ? [`Do not claim ${missingKeywords.slice(0, 3).join(", ")} unless the candidate can verify that experience.`]
        : ["No major unsupported-claim risks detected."],
  };
}

function normalizeResponse(response: TailorResponse): TailorResponse {
  return {
    ...response,
    matchScore: clampScore(response.matchScore),
    matchBreakdown: {
      roleFit: clampScore(response.matchBreakdown.roleFit),
      industryFit: clampScore(response.matchBreakdown.industryFit),
      requiredSkillsMatch: clampScore(response.matchBreakdown.requiredSkillsMatch),
      preferredSkillsMatch: clampScore(response.matchBreakdown.preferredSkillsMatch),
      metricStrength: clampScore(response.matchBreakdown.metricStrength),
      seniorityAlignment: clampScore(response.matchBreakdown.seniorityAlignment),
      projectRelevance: clampScore(response.matchBreakdown.projectRelevance),
      atsReadability: clampScore(response.matchBreakdown.atsReadability),
    },
    tailoredResume: stripMarkdown(response.tailoredResume),
    coverLetter: stripMarkdown(response.coverLetter),
    positioningStrategy: stripMarkdown(response.positioningStrategy),
    improvementNotes: response.improvementNotes.map(stripMarkdown),
    riskFlags: response.riskFlags.map(stripMarkdown),
  };
}

async function callOpenAI(request: TailorRequest, apiKey: string) {
  const sourceMaterials = (request.uploadedSourceMaterials ?? []).map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
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
            "You are Iseya, a truthful senior resume strategist. Return only structured JSON. Do not fabricate employers, degrees, certifications, metrics, tools, or experience. Reframe only what is supported by the provided resume and source materials. Use clean plain text with no markdown symbols.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task:
              "Analyze the role, industry, required skills, preferred skills, tools, responsibilities, seniority, hidden hiring signals, ATS fit, recruiter readability, and truthful candidate positioning. Generate a tailored resume and concise recruiter-ready cover letter.",
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

    return Response.json(await callOpenAI(body, apiKey));
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
