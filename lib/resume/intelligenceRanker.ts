import { optimizationModel } from "@/lib/ai/models";
import type {
  CandidateSeniority,
  CanonicalResume,
  ResumeExperience,
  ResumeIntelligenceStrategy,
  ResumeProject,
} from "./types";
import {
  classifySemanticBlock,
  normalizeCanonicalResume,
  validateResume,
} from "./validateResume";

type RankResumeInput = {
  resume: CanonicalResume;
  jobDescription?: string;
  targetRole?: string;
  industryTarget?: string;
  openAiApiKey?: string;
};

type RankedResumeResult = {
  resume: CanonicalResume;
  strategy: ResumeIntelligenceStrategy;
};

const metricPattern = /(\$?\d[\d,.]*\+?%?|\b\d+\+?\b)/;
const executivePattern =
  /\b(chief|c-level|executive|founder|vp|vice president|director|head of|principal|senior director)\b/i;
const seniorPattern =
  /\b(senior|lead|manager|owner|principal|architect|consultant|advisor|strategy|stakeholder|roadmap|portfolio)\b/i;
const leadershipPattern =
  /\b(led|managed|directed|owned|mentored|represented|governed|chaired|supervised|stakeholder|cross-functional|executive)\b/i;
const enterprisePattern =
  /\b(enterprise|platform|program|portfolio|governance|compliance|stakeholder|roadmap|revenue|risk|operations|transformation|systems)\b/i;
const projectContaminationPattern =
  /\b(manager|director|analyst|engineer|consultant|specialist|coordinator|associate|intern|llc|inc|corp|company|present)\b/i;
const projectSignalPattern =
  /\b(project|platform|implementation|application|system|product|research|prototype|dashboard|automation|initiative|model|tool)\b/i;

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
    "your",
    "their",
    "role",
  ]);

  return Array.from(
    new Set(
      jobDescription
        .toLowerCase()
        .match(/\b[a-z][a-z0-9+#.-]{2,}\b/g)
        ?.filter((word) => !stopWords.has(word)) ?? [],
    ),
  ).slice(0, 50);
}

function parseYear(value: string) {
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function estimateYears(experience: ResumeExperience[]) {
  const years = experience.flatMap((entry) =>
    [parseYear(entry.startDate), parseYear(entry.endDate)].filter(
      (year): year is number => typeof year === "number",
    ),
  );

  if (years.length < 2) {
    return experience.length >= 4 ? 8 : experience.length >= 2 ? 4 : 1;
  }

  return Math.max(...years) - Math.min(...years) + 1;
}

function detectSeniority(resume: CanonicalResume): CandidateSeniority {
  const text = JSON.stringify(resume);
  const years = estimateYears(resume.professionalExperience);
  let score = 0;

  if (years >= 10) score += 35;
  else if (years >= 6) score += 24;
  else if (years >= 3) score += 12;

  if (executivePattern.test(text)) score += 38;
  if (seniorPattern.test(text)) score += 24;
  if (leadershipPattern.test(text)) score += 18;
  if (enterprisePattern.test(text)) score += 14;
  if (metricPattern.test(text)) score += 12;

  if (score >= 70) return "executive";
  if (score >= 44) return "senior";
  if (score >= 18) return "mid-level";
  return "entry-level";
}

function textSimilarityKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(the|and|for|with|from|into|that|this|your|their)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function bulletScore(bullet: string, jobKeywords: string[]) {
  const lower = bullet.toLowerCase();
  let score = 0;

  if (/^(led|owned|managed|delivered|launched|implemented|built|improved|reduced|increased|optimized|directed|partnered|drove)\b/i.test(bullet)) {
    score += 24;
  }
  if (metricPattern.test(bullet)) score += 24;
  if (leadershipPattern.test(bullet)) score += 16;
  if (enterprisePattern.test(bullet)) score += 14;
  if (jobKeywords.some((keyword) => lower.includes(keyword))) score += 18;
  if (bullet.length >= 60 && bullet.length <= 220) score += 10;
  if (/^(responsible for|worked on|helped|assisted|participated)\b/i.test(bullet)) score -= 20;
  if (/^(profile|summary|skills|education|projects|leadership)$/i.test(bullet)) score -= 80;

  return score;
}

function curateBullets(bullets: string[], jobKeywords: string[], limit: number) {
  const seen = new Set<string>();

  return bullets
    .map((bullet, index) => ({
      bullet: bullet.replace(/\s+/g, " ").replace(/^[-•*]\s*/, "").trim(),
      index,
    }))
    .filter(({ bullet }) => {
      const key = textSimilarityKey(bullet);
      if (!bullet || seen.has(key)) return false;
      seen.add(key);
      return classifySemanticBlock(bullet).sectionType !== "education";
    })
    .map((item) => ({ ...item, score: bulletScore(item.bullet, jobKeywords) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.bullet);
}

function rankExperience(
  experience: ResumeExperience[],
  jobKeywords: string[],
  seniority: CandidateSeniority,
) {
  const bulletLimit = seniority === "entry-level" ? 4 : 5;

  return experience
    .map((entry, index) => {
      const entryText = JSON.stringify(entry).toLowerCase();
      const score =
        (entry.title ? 16 : 0) +
        (entry.company ? 14 : 0) +
        (entry.startDate || entry.endDate ? 12 : 0) +
        (leadershipPattern.test(entryText) ? 16 : 0) +
        (enterprisePattern.test(entryText) ? 14 : 0) +
        (metricPattern.test(entryText) ? 14 : 0) +
        jobKeywords.filter((keyword) => entryText.includes(keyword)).length * 8;

      return {
        ...entry,
        bullets: curateBullets(entry.bullets, jobKeywords, bulletLimit),
        originalIndex: index,
        score,
      };
    })
    .filter((entry) => entry.title || entry.company || entry.bullets.length > 0)
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .map((entry) => ({
      title: entry.title,
      company: entry.company,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      employmentType: entry.employmentType,
      bullets: entry.bullets,
    }));
}

function curateProjects(projects: ResumeProject[], jobKeywords: string[]) {
  return projects
    .map((project, index) => {
      const text = [project.title, project.organization, ...project.bullets].join(" ");
      const classification = classifySemanticBlock(text);
      const lower = text.toLowerCase();
      return {
        ...project,
        bullets: curateBullets(project.bullets, jobKeywords, 3),
        index,
        score:
          classification.confidenceScore +
          (projectSignalPattern.test(text) ? 24 : 0) +
          jobKeywords.filter((keyword) => lower.includes(keyword)).length * 8 -
          (projectContaminationPattern.test(text) ? 45 : 0),
      };
    })
    .filter((project) => project.score >= 30)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index)
    .map((project) => ({
      title: project.title,
      organization: project.organization,
      bullets: project.bullets,
    }));
}

function recruiterGradeSkills(resume: CanonicalResume, jobKeywords: string[]) {
  const supportedText = JSON.stringify(resume).toLowerCase();
  const expanded = resume.coreSkills.flatMap((skill) => {
    const normalized = skill.trim();
    const lower = normalized.toLowerCase();
    const replacements: Record<string, string> = {
      ai: "AI Product Strategy",
      delivery: "Agile Delivery",
      roadmap: "Product Roadmapping",
      stakeholder: "Stakeholder Management",
      analytics: "Product Analytics",
      compliance: "Compliance Operations",
      automation: "Workflow Automation",
      saas: "SaaS Platforms",
    };

    return replacements[lower] ?? normalized;
  });
  const supportedKeywords = jobKeywords
    .filter((keyword) => supportedText.includes(keyword))
    .map((keyword) =>
      keyword
        .split(/[-_\s]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    );
  const seen = new Set<string>();

  return [...expanded, ...supportedKeywords]
    .map((skill) => skill.replace(/[.:]$/g, "").trim())
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (!skill || skill.length > 70 || seen.has(key)) return false;
      seen.add(key);
      return !/[.!?]$/.test(skill);
    })
    .slice(0, 24);
}

function strongestSignals(resume: CanonicalResume, jobKeywords: string[]) {
  return resume.professionalExperience
    .flatMap((entry) => entry.bullets)
    .map((bullet) => ({ bullet, score: bulletScore(bullet, jobKeywords) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.bullet);
}

function keyAchievements(resume: CanonicalResume, jobKeywords: string[]) {
  return strongestSignals(resume, jobKeywords).slice(0, 3);
}

function trimSecondarySections(resume: CanonicalResume, seniority: CandidateSeniority) {
  const isExperienced = seniority === "senior" || seniority === "executive";
  const leadershipLimit = isExperienced ? 3 : 5;
  const awardsLimit = isExperienced ? 3 : 5;
  const suppressedContentCount =
    Math.max(0, resume.leadership.length - leadershipLimit) +
    Math.max(0, resume.awards.length - awardsLimit) +
    Math.max(0, resume.volunteerExperience.length - (isExperienced ? 2 : 4));

  return {
    leadership: resume.leadership
      .filter((item) => {
        const classification = classifySemanticBlock(item);
        return (
          classification.sectionType === "leadership" ||
          leadershipPattern.test(item)
        );
      })
      .slice(0, leadershipLimit),
    awards: resume.awards.slice(0, awardsLimit),
    volunteerExperience: resume.volunteerExperience.slice(0, isExperienced ? 2 : 4),
    suppressedContentCount,
  };
}

function fallbackExecutiveSummary(
  resume: CanonicalResume,
  targetRole: string | undefined,
  seniority: CandidateSeniority,
  jobKeywords: string[],
) {
  const role =
    targetRole ||
    resume.header.headline ||
    resume.professionalExperience.find((entry) => entry.title)?.title ||
    "Professional";
  const skillText = resume.coreSkills.slice(0, 5).join(", ");
  const signal = strongestSignals(resume, jobKeywords)[0];
  const level =
    seniority === "executive"
      ? "Executive-level"
      : seniority === "senior"
        ? "Senior"
        : "Experienced";

  return [
    `${level} ${role} with a background in ${skillText || "cross-functional execution, stakeholder alignment, and delivery leadership"}.`,
    signal
      ? `Known for ${signal.replace(/[.!?]$/, "").replace(/^(led|managed|owned|delivered|launched|implemented)\b/i, (match) => match.toLowerCase())}.`
      : "",
    "Brings recruiter-ready strengths in business impact, structured execution, and role-aligned communication.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function synthesizeSummary(input: {
  resume: CanonicalResume;
  seniority: CandidateSeniority;
  targetRole?: string;
  industryTarget?: string;
  jobDescription?: string;
  openAiApiKey?: string;
}) {
  const fallback = fallbackExecutiveSummary(
    input.resume,
    input.targetRole,
    input.seniority,
    keywordsFromJob(input.jobDescription),
  );

  if (!input.openAiApiKey) {
    return fallback;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: optimizationModel,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are ISEYA executive summary synthesis. Return JSON only: {\"professionalSummary\":\"\"}. Write a concise recruiter-grade summary grounded only in the structured resume. Do not invent metrics, employers, degrees, certifications, or experience. Use executive ATS tone.",
          },
          {
            role: "user",
            content: JSON.stringify({
              seniority: input.seniority,
              targetRole: input.targetRole ?? "",
              industryTarget: input.industryTarget ?? "",
              jobDescription: input.jobDescription?.slice(0, 6000) ?? "",
              structuredResume: input.resume,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Summary synthesis failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as {
      professionalSummary?: string;
    };
    return parsed.professionalSummary?.replace(/\s+/g, " ").trim() || fallback;
  } catch (error) {
    console.warn("ISEYA executive summary synthesis failed", {
      message: error instanceof Error ? error.message : "Unknown summary error",
    });
    return fallback;
  }
}

export async function rankResumeIntelligence(
  input: RankResumeInput,
): Promise<RankedResumeResult> {
  const normalized = normalizeCanonicalResume(input.resume);
  const jobKeywords = keywordsFromJob(input.jobDescription);
  const seniority = detectSeniority(normalized);
  const rankedExperience = rankExperience(
    normalized.professionalExperience,
    jobKeywords,
    seniority,
  );
  const nextBase = normalizeCanonicalResume({
    ...normalized,
    professionalExperience: rankedExperience,
    projects: curateProjects(normalized.projects, jobKeywords),
    coreSkills: recruiterGradeSkills(
      { ...normalized, professionalExperience: rankedExperience },
      jobKeywords,
    ),
  });
  const summary = await synthesizeSummary({
    resume: nextBase,
    seniority,
    targetRole: input.targetRole,
    industryTarget: input.industryTarget,
    jobDescription: input.jobDescription,
    openAiApiKey: input.openAiApiKey,
  });
  const secondary = trimSecondarySections(nextBase, seniority);
  const achievements =
    seniority === "senior" || seniority === "executive"
      ? keyAchievements(nextBase, jobKeywords)
      : [];
  const resume = normalizeCanonicalResume({
    ...nextBase,
    professionalSummary: summary,
    leadership: secondary.leadership,
    awards: secondary.awards,
    volunteerExperience: secondary.volunteerExperience,
    additionalSections: [
      ...(achievements.length > 0
        ? [{ heading: "Key Achievements", items: achievements }]
        : []),
      ...nextBase.additionalSections.filter(
        (section) => !/key achievements|review unmatched content/i.test(section.heading),
      ),
    ],
  });
  const validation = validateResume(resume);

  console.log("ISEYA intelligence ranker complete", {
    seniority,
    experienceCount: validation.resume.professionalExperience.length,
    projectCount: validation.resume.projects.length,
    suppressedContentCount: secondary.suppressedContentCount,
    issueCount: validation.issues.length,
  });

  return {
    resume: validation.resume,
    strategy: {
      seniority,
      strongestSignals: strongestSignals(validation.resume, jobKeywords),
      suppressedContentCount: secondary.suppressedContentCount,
      sectionOrder: [
        "Header",
        "Professional Summary",
        "Core Skills",
        "Professional Experience",
        "Projects",
        "Education",
        "Certifications",
        ...(achievements.length > 0 ? ["Key Achievements"] : []),
        "Leadership",
        "Awards",
        "Volunteer Experience",
        "Publications",
      ],
    },
  };
}
