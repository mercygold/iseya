import { optimizationModel } from "@/lib/ai/models";
import type { CanonicalResume } from "./types";
import { normalizeCanonicalResume, validateResume } from "./validateResume";

type OptimizeResumeInput = {
  resume: CanonicalResume;
  jobDescription?: string;
  targetRole?: string;
  industryTarget?: string;
  openAiApiKey?: string;
};

function safeParse(value: string): Partial<CanonicalResume> | null {
  try {
    return JSON.parse(value) as Partial<CanonicalResume>;
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]) as Partial<CanonicalResume>;
    } catch {
      return null;
    }
  }
}

function keywordsFromJob(jobDescription = "") {
  const stopWords = new Set([
    "and",
    "the",
    "for",
    "with",
    "you",
    "will",
    "are",
    "our",
    "this",
    "that",
    "from",
    "have",
    "has",
    "into",
    "about",
  ]);

  return Array.from(
    new Set(
      jobDescription
        .toLowerCase()
        .match(/\b[a-z][a-z0-9+#.-]{2,}\b/g)
        ?.filter((word) => !stopWords.has(word)) ?? [],
    ),
  ).slice(0, 40);
}

async function callOptimizationModel(input: OptimizeResumeInput) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: optimizationModel,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are ISEYA Stage 2 Resume Optimization and semantic ranking. Return only canonical resume JSON. Tailor toward the job description while preserving truth, chronology, companies, education, certifications, roles, and supported metrics. Never invent experience, employers, degrees, certifications, years, or fake metrics. Never merge sections. Keep section semantics clean. Professional Summary must be directly after Header. Curate strongest role-relevant bullets instead of dumping every extracted item. Keep corporate job history only in professionalExperience. Keep leadership, awards, education, and projects isolated.",
        },
        {
          role: "user",
          content: JSON.stringify({
            structuredResumeJson: input.resume,
            targetRole: input.targetRole ?? "",
            industryTarget: input.industryTarget ?? "General / ATS",
            targetJobDescription: input.jobDescription ?? "",
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Stage 2 optimization failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Stage 2 optimization returned empty content.");
  }

  return safeParse(content);
}

function localOptimize(input: OptimizeResumeInput): CanonicalResume {
  const resume = normalizeCanonicalResume(input.resume);
  const keywords = keywordsFromJob(input.jobDescription);
  const existingSkills = new Set(resume.coreSkills.map((skill) => skill.toLowerCase()));
  const alignedSkills = [
    ...resume.coreSkills.filter((skill) =>
      keywords.some((keyword) => skill.toLowerCase().includes(keyword)),
    ),
    ...resume.coreSkills.filter(
      (skill) => !keywords.some((keyword) => skill.toLowerCase().includes(keyword)),
    ),
  ];

  const supportedJobKeywords = keywords
    .filter((keyword) =>
      JSON.stringify(resume).toLowerCase().includes(keyword.toLowerCase()),
    )
    .filter((keyword) => !existingSkills.has(keyword));

  const keywordSet = new Set(keywords);
  const rankedExperience = resume.professionalExperience.map((entry) => {
    const rankedBullets = [...entry.bullets]
      .map((bullet, index) => {
        const lower = bullet.toLowerCase();
        const jdMatches = keywords.filter((keyword) => lower.includes(keyword)).length;
        const hasMetric = /(\$?\d[\d,.]*\+?%?|\b\d+\+?\b)/.test(bullet);
        const hasImpact =
          /\b(led|managed|delivered|launched|implemented|improved|reduced|increased|optimized|built|partnered|drove|owned)\b/i.test(
            bullet,
          );
        return {
          bullet,
          index,
          score: jdMatches * 14 + (hasMetric ? 18 : 0) + (hasImpact ? 18 : 0),
        };
      })
      .filter((item) => !/^(profile|summary|skills|education|projects)$/i.test(item.bullet))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 5)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.bullet);

    return { ...entry, bullets: rankedBullets };
  });

  const summary =
    resume.professionalSummary ||
    [
      `${input.targetRole || resume.header.headline || "Professional"} with experience across ${[
        ...resume.coreSkills.filter((skill) =>
          [...keywordSet].some((keyword) => skill.toLowerCase().includes(keyword)),
        ),
        ...resume.coreSkills,
      ]
        .slice(0, 5)
        .join(", ")}.`,
      rankedExperience[0]?.bullets[0]
        ? `Relevant experience includes ${rankedExperience[0].bullets[0].replace(/[.!?]$/, "")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  return normalizeCanonicalResume({
    ...resume,
    header: {
      ...resume.header,
      headline: input.targetRole || resume.header.headline,
    },
    professionalSummary: summary,
    professionalExperience: rankedExperience,
    coreSkills: [...alignedSkills, ...supportedJobKeywords].slice(0, 28),
  });
}

export async function optimizeResume(input: OptimizeResumeInput): Promise<CanonicalResume> {
  let optimized: Partial<CanonicalResume> | null = null;

  if (input.openAiApiKey) {
    try {
      optimized = await callOptimizationModel(input);
    } catch (error) {
      console.warn("ISEYA Stage 2 optimization model failed", {
        message: error instanceof Error ? error.message : "Unknown optimization error",
      });
    }
  }

  const validation = validateResume(optimized ?? localOptimize(input));
  console.log("ISEYA Stage 2 optimization complete", {
    experienceCount: validation.resume.professionalExperience.length,
    issueCount: validation.issues.length,
  });

  return validation.resume;
}
