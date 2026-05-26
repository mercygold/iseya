import type {
  AdditionalResumeSection,
  CanonicalResume,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  SemanticClassification,
  SemanticSectionType,
  ResumeValidationIssue,
  ResumeValidationResult,
} from "./types";

const artifactPattern =
  /\b(source resume excerpt|supporting source material|tailoring notes|parser|debug|ocr artifact|page \d+ of \d+)\b/i;
const headingOnlyPattern =
  /^(profile|summary|professional summary|skills|core skills|experience|professional experience|projects|education|certifications|leadership|awards|publications)$/i;
const dateOnlyPattern =
  /^(present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})(?:\s*[-–]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}))?$/i;
const educationSignalPattern =
  /\b(university|college|school|institute|academy|bachelor|master|mba|phd|doctor|degree|certification)\b/i;
const experienceSignalPattern =
  /\b(manager|director|analyst|engineer|consultant|specialist|coordinator|lead|owner|associate|intern|developer|designer|officer|company|llc|inc|ltd|corp)\b/i;
const leadershipSignalPattern =
  /\b(mentor|representative|president|chair|volunteer|community|advisor|speaker|ambassador|csr|student leader)\b/i;
const projectSignalPattern =
  /\b(project|platform|application|app|implementation|launch|prototype|research|study|model|dashboard|system|automation|workflow|tool|product)\b/i;
const awardSignalPattern =
  /\b(award|honor|recognition|scholarship|winner|finalist|distinction|dean's list|excellence)\b/i;
const enterpriseVerbPattern =
  /\b(led|managed|owned|delivered|launched|implemented|coordinated|directed|built|improved|reduced|increased|optimized|partnered|developed|analyzed|executed|supported|drove)\b/i;
const metricPattern = /(\$?\d[\d,.]*\+?%?|\b\d+\+?\b)/;
const summarySignalPattern =
  /\b(years of experience|experienced|professional|specialist|leader|background in|expertise in|track record|skilled in)\b/i;

export function emptyCanonicalResume(): CanonicalResume {
  return {
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
    professionalExperience: [],
    projects: [],
    education: [],
    certifications: [],
    leadership: [],
    awards: [],
    volunteerExperience: [],
    publications: [],
    additionalSections: [],
  };
}

export function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/[•●▪◆◦]/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLine(value: unknown): string {
  return cleanText(value)
    .replace(/^[-*\u2022]\s*/, "")
    .replace(/\s*[-–]\s*$/g, "")
    .trim();
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values) {
    const cleaned = cleanLine(value);
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key) || artifactPattern.test(cleaned)) {
      continue;
    }

    seen.add(key);
    items.push(cleaned);
  }

  return items;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function classifySemanticBlock(text: string): SemanticClassification {
  const normalized = cleanText(text).toLowerCase();
  const scores: Record<SemanticSectionType, number> = {
    professionalSummary: 0,
    coreSkills: 0,
    professionalExperience: 0,
    projects: 0,
    education: 0,
    certifications: 0,
    leadership: 0,
    awards: 0,
    volunteerExperience: 0,
    publications: 0,
    additionalSections: 0,
  };

  if (!normalized) {
    return { sectionType: "additionalSections", confidenceScore: 0, scores };
  }

  if (summarySignalPattern.test(normalized) && normalized.length > 80) {
    scores.professionalSummary += 35;
  }
  if (normalized.split(/[|,;]/).length >= 4 && !/[.!?]/.test(normalized)) {
    scores.coreSkills += 35;
  }
  if (experienceSignalPattern.test(normalized)) {
    scores.professionalExperience += 24;
  }
  if (dateOnlyPattern.test(text) || /\b(19|20)\d{2}\b.*\b(present|current|(19|20)\d{2})\b/i.test(text)) {
    scores.professionalExperience += 24;
  }
  if (enterpriseVerbPattern.test(normalized)) {
    scores.professionalExperience += 18;
  }
  if (metricPattern.test(normalized)) {
    scores.professionalExperience += 14;
    scores.projects += 6;
  }
  if (projectSignalPattern.test(normalized)) {
    scores.projects += 28;
  }
  if (educationSignalPattern.test(normalized)) {
    scores.education += 38;
  }
  if (/\b(certified|certification|certificate|license|credential)\b/i.test(normalized)) {
    scores.certifications += 40;
  }
  if (leadershipSignalPattern.test(normalized)) {
    scores.leadership += 42;
    scores.projects -= 18;
  }
  if (awardSignalPattern.test(normalized)) {
    scores.awards += 45;
    scores.projects -= 16;
  }
  if (/\b(volunteer|nonprofit|community service)\b/i.test(normalized)) {
    scores.volunteerExperience += 35;
  }
  if (/\b(publication|published|journal|conference|paper|research)\b/i.test(normalized)) {
    scores.publications += 28;
  }

  if (scores.projects > 0 && (experienceSignalPattern.test(normalized) || /\b(present|current)\b/i.test(normalized))) {
    scores.projects -= 22;
    scores.professionalExperience += 12;
  }

  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]) as Array<
    [SemanticSectionType, number]
  >;
  const [sectionType, score] = ordered[0] ?? ["additionalSections", 0];

  return {
    sectionType,
    confidenceScore: clampScore(score),
    scores,
  };
}

function bulletQualityScore(bullet: string, jobKeywords: string[] = []) {
  const lower = bullet.toLowerCase();
  let score = 0;

  if (enterpriseVerbPattern.test(bullet)) score += 24;
  if (metricPattern.test(bullet)) score += 22;
  if (/\b(impact|revenue|cost|customer|stakeholder|launch|delivery|risk|compliance|growth|efficiency|quality)\b/i.test(bullet)) {
    score += 16;
  }
  if (jobKeywords.some((keyword) => lower.includes(keyword))) score += 16;
  if (bullet.length >= 55 && bullet.length <= 210) score += 12;
  if (/^(responsible for|worked on|helped with|participated in)\b/i.test(bullet)) score -= 18;
  if (headingOnlyPattern.test(bullet) || artifactPattern.test(bullet)) score -= 80;

  return score;
}

function prioritizeBullets(bullets: string[], limit: number, jobKeywords: string[] = []) {
  const unique = uniqueStrings(bullets).filter((bullet) => {
    if (headingOnlyPattern.test(bullet) || dateOnlyPattern.test(bullet)) return false;
    if (classifySemanticBlock(bullet).sectionType === "education") return false;
    return true;
  });

  return unique
    .map((bullet, index) => ({
      bullet,
      index,
      score: bulletQualityScore(bullet, jobKeywords),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.bullet);
}

export function normalizeProfessionalSummary(value: unknown): string {
  return cleanText(value)
    .split(/\n+/)
    .map((line) => cleanLine(line))
    .filter((line) => {
      if (!line || headingOnlyPattern.test(line) || artifactPattern.test(line)) {
        return false;
      }
      const classification = classifySemanticBlock(line);
      return !["leadership", "awards", "education", "projects"].includes(
        classification.sectionType,
      );
    })
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeSkills(values: unknown): string[] {
  const raw = Array.isArray(values) ? values : String(values ?? "").split(/[|\n,;]+/);

  return uniqueStrings(raw)
    .map((skill) => skill.replace(/[.:]$/g, "").trim())
    .filter((skill) => {
      if (!skill || skill.length > 80 || headingOnlyPattern.test(skill)) {
        return false;
      }

      return !/[.!?]\s*$/.test(skill);
    })
    .slice(0, 32);
}

function normalizeBullets(values: unknown): string[] {
  const raw = Array.isArray(values) ? values : String(values ?? "").split(/\n+/);

  return prioritizeBullets(raw, 5);
}

export function normalizeExperience(values: unknown): ResumeExperience[] {
  const raw = Array.isArray(values) ? values : [];
  const seen = new Set<string>();
  const entries: ResumeExperience[] = [];

  for (const item of raw) {
    const source = (item ?? {}) as Partial<ResumeExperience>;
    const title = cleanLine(source.title);
    const company = cleanLine(source.company);
    const startDate = cleanLine(source.startDate);
    const endDate = cleanLine(source.endDate);
    const bullets = normalizeBullets(source.bullets);

    if (!title && !company && bullets.length === 0) {
      continue;
    }

    const key = [title, company, startDate, endDate].join("|").toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    entries.push({
      title,
      company,
      location: cleanLine(source.location),
      startDate,
      endDate,
      employmentType: cleanLine(source.employmentType),
      bullets,
    });
  }

  return entries;
}

export function normalizeProjects(values: unknown): ResumeProject[] {
  const raw = Array.isArray(values) ? values : [];

  return raw
    .map((item) => {
      const source = (item ?? {}) as Partial<ResumeProject>;
      return {
        title: cleanLine(source.title),
        organization: cleanLine(source.organization),
        bullets: normalizeBullets(source.bullets),
      };
    })
    .filter((project) => project.title || project.bullets.length > 0)
    .filter((project) => {
      const text = [project.title, project.organization, ...project.bullets].join(" ");
      const classification = classifySemanticBlock(text);
      return (
        classification.sectionType === "projects" &&
        classification.confidenceScore >= 24 &&
        !leadershipSignalPattern.test(text) &&
        !educationSignalPattern.test(text) &&
        !experienceSignalPattern.test(project.title)
      );
    });
}

export function normalizeEducation(values: unknown): ResumeEducation[] {
  const raw = Array.isArray(values) ? values : [];

  return raw
    .map((item) => {
      const source = (item ?? {}) as Partial<ResumeEducation>;
      return {
        institution: cleanLine(source.institution),
        degree: cleanLine(source.degree),
        field: cleanLine(source.field),
        location: cleanLine(source.location),
        startDate: cleanLine(source.startDate),
        endDate: cleanLine(source.endDate),
      };
    })
    .filter((education) => education.institution || education.degree || education.field);
}

export function normalizeLeadership(values: unknown): string[] {
  return uniqueStrings(Array.isArray(values) ? values : String(values ?? "").split(/\n+/));
}

export function normalizeAwards(values: unknown): string[] {
  return uniqueStrings(Array.isArray(values) ? values : String(values ?? "").split(/\n+/));
}

function normalizeAdditionalSections(values: unknown): AdditionalResumeSection[] {
  const raw = Array.isArray(values) ? values : [];

  return raw
    .map((section) => {
      const source = (section ?? {}) as Partial<AdditionalResumeSection>;
      return {
        heading: cleanLine(source.heading),
        items: uniqueStrings(Array.isArray(source.items) ? source.items : []),
      };
    })
    .filter((section) => section.heading && section.items.length > 0);
}

export function normalizeCanonicalResume(input: Partial<CanonicalResume> = {}): CanonicalResume {
  const empty = emptyCanonicalResume();
  const header = { ...empty.header, ...(input.header ?? {}) };

  const resume = {
    header: {
      fullName: cleanLine(header.fullName),
      headline: cleanLine(header.headline),
      email: cleanLine(header.email),
      phone: cleanLine(header.phone),
      location: cleanLine(header.location),
      linkedin: cleanLine(header.linkedin),
      portfolio: cleanLine(header.portfolio),
    },
    professionalSummary: normalizeProfessionalSummary(input.professionalSummary),
    coreSkills: normalizeSkills(input.coreSkills),
    professionalExperience: normalizeExperience(input.professionalExperience),
    projects: normalizeProjects(input.projects),
    education: normalizeEducation(input.education),
    certifications: uniqueStrings(input.certifications ?? []),
    leadership: normalizeLeadership(input.leadership),
    awards: normalizeAwards(input.awards),
    volunteerExperience: uniqueStrings(input.volunteerExperience ?? []),
    publications: uniqueStrings(input.publications ?? []),
    additionalSections: normalizeAdditionalSections(input.additionalSections),
  };
  const repaired = isolateContaminatedSections(resume);

  if (!repaired.professionalSummary) {
    repaired.professionalSummary = generateSummaryFallback(repaired);
  }

  return repaired;
}

function generateSummaryFallback(resume: CanonicalResume) {
  const role =
    resume.header.headline ||
    resume.professionalExperience.find((entry) => entry.title)?.title ||
    "Professional";
  const strengths = resume.coreSkills.slice(0, 5).join(", ");
  const impact = resume.professionalExperience
    .flatMap((entry) => entry.bullets)
    .find((bullet) => enterpriseVerbPattern.test(bullet) || metricPattern.test(bullet));

  return [
    `${role} with experience across ${strengths || "cross-functional delivery, stakeholder collaboration, and business execution"}.`,
    impact ? `Representative impact includes ${impact.replace(/[.!?]$/, "")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function isolateContaminatedSections(resume: CanonicalResume): CanonicalResume {
  const next: CanonicalResume = {
    ...resume,
    projects: [],
    leadership: [...resume.leadership],
    awards: [...resume.awards],
    education: [...resume.education],
    professionalExperience: [...resume.professionalExperience],
    additionalSections: [...resume.additionalSections],
  };

  for (const project of resume.projects) {
    const text = [project.title, project.organization, ...project.bullets].join(" ");
    const classification = classifySemanticBlock(text);

    if (classification.sectionType === "professionalExperience") {
      next.professionalExperience.push({
        title: project.title,
        company: project.organization,
        location: "",
        startDate: "",
        endDate: "",
        employmentType: "",
        bullets: project.bullets,
      });
      continue;
    }

    if (classification.sectionType === "leadership") {
      next.leadership.push([project.title, project.organization, ...project.bullets].filter(Boolean).join(" - "));
      continue;
    }

    if (classification.sectionType === "awards") {
      next.awards.push([project.title, project.organization, ...project.bullets].filter(Boolean).join(" - "));
      continue;
    }

    if (classification.sectionType === "education") {
      next.additionalSections.push({
        heading: "Review unmatched content",
        items: [[project.title, project.organization, ...project.bullets].filter(Boolean).join(" - ")],
      });
      continue;
    }

    if (classification.confidenceScore >= 24) {
      next.projects.push(project);
    } else {
      next.additionalSections.push({
        heading: "Review unmatched content",
        items: [[project.title, project.organization, ...project.bullets].filter(Boolean).join(" - ")],
      });
    }
  }

  next.professionalExperience = normalizeExperience(next.professionalExperience);
  next.leadership = normalizeLeadership(next.leadership);
  next.awards = normalizeAwards(next.awards);

  return next;
}

export function validateResume(input: Partial<CanonicalResume> = {}): ResumeValidationResult {
  const resume = normalizeCanonicalResume(input);
  const issues: ResumeValidationIssue[] = [];

  if (artifactPattern.test(JSON.stringify(resume))) {
    issues.push({
      code: "raw_artifact",
      message: "Raw extraction or parser artifact detected in structured resume.",
    });
  }

  if (headingOnlyPattern.test(resume.professionalSummary)) {
    issues.push({
      code: "malformed_summary",
      section: "professionalSummary",
      message: "Professional summary contains only a heading.",
    });
  }

  for (const [index, project] of resume.projects.entries()) {
    const text = [project.title, project.organization, ...project.bullets].join(" ");
    if (leadershipSignalPattern.test(text)) {
      issues.push({
        code: "leadership_inside_projects",
        section: `projects.${index}`,
        message: "Leadership content appears inside projects.",
      });
    }
    if (experienceSignalPattern.test(project.title) && dateOnlyPattern.test(project.organization)) {
      issues.push({
        code: "experience_inside_projects",
        section: `projects.${index}`,
        message: "Experience metadata appears inside projects.",
      });
    }
  }

  for (const [index, education] of resume.education.entries()) {
    const text = [education.institution, education.degree, education.field].join(" ");
    if (experienceSignalPattern.test(text) && !educationSignalPattern.test(text)) {
      issues.push({
        code: "experience_inside_education",
        section: `education.${index}`,
        message: "Experience content appears inside education.",
      });
    }
  }

  for (const [index, experience] of resume.professionalExperience.entries()) {
    if (!experience.title && !experience.company) {
      issues.push({
        code: "malformed_experience",
        section: `professionalExperience.${index}`,
        message: "Experience entry is missing title and company.",
      });
    }

    for (const bullet of experience.bullets) {
      if (headingOnlyPattern.test(bullet) || artifactPattern.test(bullet)) {
        issues.push({
          code: "malformed_bullet",
          section: `professionalExperience.${index}`,
          message: "Experience bullet contains a heading or extraction artifact.",
        });
      }
    }
  }

  return { resume, issues };
}
