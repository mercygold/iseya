import { extractionModel } from "@/lib/ai/models";
import type { CanonicalResume, ResumeExperience } from "./types";
import {
  classifySemanticBlock,
  cleanText,
  emptyCanonicalResume,
  normalizeCanonicalResume,
  validateResume,
} from "./validateResume";

type ExtractResumeInput = {
  rawText: string;
  openAiApiKey?: string;
};

const sectionHeadings: Record<string, keyof CanonicalResume | "ignore"> = {
  profile: "professionalSummary",
  summary: "professionalSummary",
  "professional summary": "professionalSummary",
  "executive summary": "professionalSummary",
  objective: "professionalSummary",
  skills: "coreSkills",
  "core skills": "coreSkills",
  "areas of expertise": "coreSkills",
  "technical proficiencies": "coreSkills",
  tools: "coreSkills",
  technologies: "coreSkills",
  experience: "professionalExperience",
  "professional experience": "professionalExperience",
  "work experience": "professionalExperience",
  employment: "professionalExperience",
  projects: "projects",
  "technical projects": "projects",
  "product projects": "projects",
  education: "education",
  certifications: "certifications",
  certificates: "certifications",
  leadership: "leadership",
  awards: "awards",
  honors: "awards",
  "volunteer experience": "volunteerExperience",
  volunteering: "volunteerExperience",
  publications: "publications",
  research: "publications",
};

const dateRangePattern =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:[-–to]+\s*)?((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})?/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;
const linkedinPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|]+/i;
const portfolioPattern = /(?:https?:\/\/)?(?:www\.)?(?!linkedin\.com)[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s|]*)?/i;
const companyPattern = /\b(llc|inc\.?|ltd\.?|corp\.?|corporation|company|group|partners|solutions|systems|technologies|university|bank|health|labs|agency)\b/i;
const rolePattern = /\b(manager|director|analyst|engineer|consultant|specialist|coordinator|lead|owner|associate|intern|developer|designer|officer|administrator|strategist|researcher|architect|advisor)\b/i;
const educationPattern = /\b(university|college|school|institute|academy|bachelor|master|mba|ph\.?d|degree|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?)\b/i;

function safeJsonParse(value: string): Partial<CanonicalResume> | null {
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

async function callExtractionModel(rawText: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: extractionModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are ISEYA Stage 1 Resume Intelligence. Extract and reconstruct only. Return valid JSON matching the canonical resume schema. Do not optimize, rewrite, tailor, summarize, invent, or improve wording. Preserve section boundaries, chronology, role grouping, dates, companies, bullets, education, leadership, awards, publications, and projects. Never include raw extraction notes or markdown.",
        },
        {
          role: "user",
          content: JSON.stringify({
            schema: {
              header: {
                fullName: "",
                headline: "",
                email: "",
                phone: "",
                location: "",
                linkedin: "",
                portfolio: "",
              },
              professionalSummary: "",
              coreSkills: [],
              professionalExperience: [
                {
                  title: "",
                  company: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  employmentType: "",
                  bullets: [],
                },
              ],
              projects: [{ title: "", organization: "", bullets: [] }],
              education: [
                {
                  institution: "",
                  degree: "",
                  field: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                },
              ],
              certifications: [],
              leadership: [],
              awards: [],
              volunteerExperience: [],
              publications: [],
              additionalSections: [],
            },
            classificationRequirement:
              "Internally classify every semantic block with sectionType and confidenceScore before placing it. If confidence is weak, keep it in additionalSections as Review unmatched content instead of contaminating resume sections.",
            rawResumeText: rawText.slice(0, 45000),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Stage 1 extraction failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Stage 1 extraction returned empty content.");
  }

  return safeJsonParse(content);
}

async function callSemanticRepairModel(
  rawText: string,
  resume: CanonicalResume,
  apiKey: string,
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: extractionModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are ISEYA semantic repair for Stage 1 extraction. Return only corrected canonical resume JSON. Reclassify contaminated blocks using confidence scoring. Professional summary must remain separate from leadership. Experience must not enter projects. Leadership, awards, education, and projects must remain isolated. Do not optimize or rewrite content.",
        },
        {
          role: "user",
          content: JSON.stringify({
            rawResumeText: rawText.slice(0, 30000),
            currentStructuredResume: resume,
            repairRules: [
              "Move corporate job history out of projects and into professionalExperience.",
              "Move leadership/community/university representation out of projects and summary.",
              "Move awards/honors out of projects and leadership.",
              "Keep weak-confidence blocks in additionalSections as Review unmatched content.",
              "Return the same canonical schema only.",
            ],
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Stage 1 semantic repair failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  return content ? safeJsonParse(content) : null;
}

function canonicalHeading(line: string): keyof CanonicalResume | "ignore" | null {
  const key = line
    .toLowerCase()
    .replace(/[^a-z\s/]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return sectionHeadings[key] ?? null;
}

function splitLines(rawText: string) {
  return cleanText(rawText)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !/^page\s+\d+/i.test(line))
    .filter((line) => !/source resume excerpt|supporting source material|parser|debug/i.test(line));
}

function extractHeader(lines: string[]) {
  const header = emptyCanonicalResume().header;
  const topLines = lines.slice(0, 8);
  const contactText = topLines.join(" | ");
  const email = contactText.match(emailPattern)?.[0] ?? "";
  const phone = contactText.match(phonePattern)?.[0] ?? "";
  const linkedin = contactText.match(linkedinPattern)?.[0] ?? "";
  const portfolio = contactText
    .split(/\s+[|•]\s+|\s{2,}/)
    .find((part) => portfolioPattern.test(part) && !emailPattern.test(part));

  const nameLine = topLines.find(
    (line) =>
      !emailPattern.test(line) &&
      !phonePattern.test(line) &&
      !linkedinPattern.test(line) &&
      line.length < 70 &&
      /^[A-Za-z][A-Za-z .'-]+$/.test(line),
  );

  const headline = topLines.find(
    (line) =>
      line !== nameLine &&
      !emailPattern.test(line) &&
      !phonePattern.test(line) &&
      !linkedinPattern.test(line) &&
      rolePattern.test(line),
  );

  return {
    ...header,
    fullName: nameLine ?? "",
    headline: headline ?? "",
    email,
    phone,
    location:
      topLines.find(
        (line) =>
          /,\s*[A-Z]{2}\b|United States|USA|Canada|California|New York|Texas/i.test(line) &&
          !emailPattern.test(line),
      ) ?? "",
    linkedin,
    portfolio: portfolio ?? "",
  };
}

function groupedSections(lines: string[]) {
  const groups = new Map<keyof CanonicalResume | "unknown", string[]>();
  let current: keyof CanonicalResume | "unknown" = "unknown";

  for (const line of lines) {
    const heading = canonicalHeading(line);
    if (heading) {
      current = heading === "ignore" ? "unknown" : heading;
      if (!groups.has(current)) {
        groups.set(current, []);
      }
      continue;
    }

    const bucket = groups.get(current) ?? [];
    bucket.push(line);
    groups.set(current, bucket);
  }

  return groups;
}

function classifyUnknownLines(lines: string[]) {
  const buckets: Record<keyof CanonicalResume | "unknown", string[]> = {
    header: [],
    professionalSummary: [],
    coreSkills: [],
    professionalExperience: [],
    projects: [],
    education: [],
    certifications: [],
    leadership: [],
    awards: [],
    volunteerExperience: [],
    publications: [],
    additionalSections: [],
    unknown: [],
  };

  for (const line of lines) {
    const classification = classifySemanticBlock(line);
    if (classification.confidenceScore >= 34) {
      buckets[classification.sectionType].push(line);
    } else {
      buckets.unknown.push(line);
    }
  }

  return buckets;
}

function splitSkillLines(lines: string[]) {
  return lines.flatMap((line) => line.split(/[|,;]+/)).map((skill) => skill.trim());
}

function experienceLineScore(line: string) {
  let score = 0;
  if (rolePattern.test(line)) score += 25;
  if (companyPattern.test(line)) score += 20;
  if (dateRangePattern.test(line)) score += 20;
  if (/\b(led|managed|owned|delivered|launched|implemented|coordinated|directed|built|improved|reduced|increased|optimized|partnered|executed)\b/i.test(line)) {
    score += 14;
  }
  if (/(\$?\d[\d,.]*\+?%?|\b\d+\+?\b)/.test(line)) score += 12;
  if (educationPattern.test(line)) score -= 35;
  if (/\b(award|honor|scholarship|volunteer|mentor|president|representative)\b/i.test(line)) {
    score -= 25;
  }
  return score;
}

function parseExperienceLines(lines: string[]): ResumeExperience[] {
  const entries: ResumeExperience[] = [];
  let current: ResumeExperience | null = null;

  const pushCurrent = () => {
    if (current && (current.title || current.company || current.bullets.length > 0)) {
      entries.push(current);
    }
  };

  for (const line of lines) {
    const cleaned = line.replace(/^[-*\u2022]\s*/, "").trim();
    const dateMatch = cleaned.match(dateRangePattern);
    const isBullet = /^[-*]/.test(line) || cleaned.length > 95;
    const looksLikeRole =
      experienceLineScore(cleaned) >= 40 &&
      classifySemanticBlock(cleaned).sectionType === "professionalExperience";

    if (!current || (!isBullet && looksLikeRole)) {
      if (looksLikeRole) {
        pushCurrent();
        const [beforeDate] = cleaned.split(dateRangePattern);
        const parts = beforeDate
          .split(/\s+[|@]\s+|\s+-\s+|\s+,\s+/)
          .map((part) => part.trim())
          .filter(Boolean);
        current = {
          title: parts[0] ?? "",
          company: parts[1] ?? "",
          location: parts.slice(2).join(", "),
          startDate: dateMatch?.[1] ?? "",
          endDate: dateMatch?.[2] ?? "",
          employmentType: "",
          bullets: [],
        };
        continue;
      }

      current ??= {
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        employmentType: "",
        bullets: [],
      };
    }

    if (current) {
      if (dateMatch && !current.startDate) {
        current.startDate = dateMatch[1] ?? "";
        current.endDate = dateMatch[2] ?? "";
      } else if (!current.company && companyPattern.test(cleaned) && cleaned.length < 90) {
        current.company = cleaned;
      } else if (!current.title && rolePattern.test(cleaned) && cleaned.length < 90) {
        current.title = cleaned;
      } else {
        current.bullets.push(cleaned);
      }
    }
  }

  pushCurrent();
  return entries;
}

function parseEducationLines(lines: string[]) {
  return lines
    .filter((line) => educationPattern.test(line))
    .map((line) => {
      const dateMatch = line.match(dateRangePattern);
      const withoutDate = line.replace(dateRangePattern, "").trim();
      const parts = withoutDate
        .split(/\s+[|–-]\s+|\s{2,}/)
        .map((part) => part.trim())
        .filter(Boolean);
      const institutionIndex = parts.findIndex((part) => educationPattern.test(part));
      const institution = institutionIndex >= 0 ? parts[institutionIndex] : parts[0] ?? "";

      return {
        institution,
        degree: parts.find((part) => /bachelor|master|mba|ph\.?d|degree|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?/i.test(part)) ?? "",
        field: parts.filter((part) => part !== institution).join(" | "),
        location: parts.find((part) => /,\s*[A-Z]{2}\b/.test(part)) ?? "",
        startDate: dateMatch?.[1] ?? "",
        endDate: dateMatch?.[2] ?? "",
      };
    });
}

function localExtract(rawText: string): CanonicalResume {
  const lines = splitLines(rawText);
  const groups = groupedSections(lines);
  const unknown = groups.get("unknown") ?? [];
  const classifiedUnknown = classifyUnknownLines(unknown);
  const resume = emptyCanonicalResume();
  resume.header = extractHeader(lines);

  const summaryLines = groups.get("professionalSummary") ?? [];
  resume.professionalSummary = [...summaryLines, ...classifiedUnknown.professionalSummary]
    .join(" ");

  resume.coreSkills = splitSkillLines([
    ...(groups.get("coreSkills") ?? []),
    ...classifiedUnknown.coreSkills,
  ]);

  resume.professionalExperience = parseExperienceLines([
    ...(groups.get("professionalExperience") ?? []),
    ...classifiedUnknown.professionalExperience,
  ]);

  resume.projects = [...(groups.get("projects") ?? []), ...classifiedUnknown.projects]
    .filter((line) => {
      const classification = classifySemanticBlock(line);
      return (
        classification.sectionType === "projects" &&
        classification.confidenceScore >= 24 &&
        !rolePattern.test(line) &&
        !educationPattern.test(line)
      );
    })
    .map((line) => ({ title: line, organization: "", bullets: [] }));

  resume.education = parseEducationLines([
    ...(groups.get("education") ?? []),
    ...classifiedUnknown.education,
  ]);
  resume.certifications = [
    ...(groups.get("certifications") ?? []),
    ...classifiedUnknown.certifications,
  ];
  resume.leadership = [...(groups.get("leadership") ?? []), ...classifiedUnknown.leadership];
  resume.awards = [...(groups.get("awards") ?? []), ...classifiedUnknown.awards];
  resume.volunteerExperience = [
    ...(groups.get("volunteerExperience") ?? []),
    ...classifiedUnknown.volunteerExperience,
  ];
  resume.publications = [
    ...(groups.get("publications") ?? []),
    ...classifiedUnknown.publications,
  ];

  const knownContent = new Set(
    [
      ...summaryLines,
      ...(groups.get("coreSkills") ?? []),
      ...(groups.get("professionalExperience") ?? []),
      ...(groups.get("projects") ?? []),
      ...(groups.get("education") ?? []),
    ].map((line) => line.toLowerCase()),
  );
  const unmatched = classifiedUnknown.unknown
    .filter((line) => !knownContent.has(line.toLowerCase()))
    .slice(0, 30);

  if (unmatched.length > 0) {
    resume.additionalSections.push({ heading: "Review unmatched content", items: unmatched });
  }

  return normalizeCanonicalResume(resume);
}

export async function extractResume({
  rawText,
  openAiApiKey,
}: ExtractResumeInput): Promise<CanonicalResume> {
  const cleaned = cleanText(rawText);
  if (!cleaned) {
    return emptyCanonicalResume();
  }

  let extracted: Partial<CanonicalResume> | null = null;

  if (openAiApiKey) {
    try {
      extracted = await callExtractionModel(cleaned, openAiApiKey);
    } catch {
      console.warn("ISEYA Stage 1 extraction model failed.");
    }
  }

  let validation = validateResume(extracted ?? localExtract(cleaned));

  if (openAiApiKey && validation.issues.length > 0) {
    try {
      const repaired = await callSemanticRepairModel(
        cleaned,
        validation.resume,
        openAiApiKey,
      );
      if (repaired) {
        validation = validateResume(repaired);
      }
    } catch {
      console.warn("ISEYA Stage 1 semantic repair failed.");
    }
  }

  return validation.resume;
}
