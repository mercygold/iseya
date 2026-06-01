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
const instructionArtifactPattern =
  /\b(full job description|target positioning|start month year|degree or certificate|school or organization|add a short project summary|keep the resume|keep resume senior|do not\b|important resume cleanup instructions|i am tailoring my resume|placeholder|professional summary repeated|professional experience\.|target role|job description|resume cleanup instructions|cleanup instructions|resume notes|user instructions|paste your|replace this|remove this|if space allows|if space is limited|use implementation language|reconcile inconsistent dates|prioritize|make it sound)\b/i;
const headingOnlyPattern =
  /^(profile|summary|professional summary|skills|core skills|experience|professional experience|projects|education|certifications|leadership|awards|publications)$/i;
const dateOnlyPattern =
  /^(present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})(?:\s*[-–]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}))?$/i;
const educationSignalPattern =
  /\b(university|college|school|institute|academy|bachelor|master|mba|phd|doctor|degree)\b/i;
const experienceSignalPattern =
  /\b(manager|director|analyst|engineer|consultant|specialist|coordinator|lead|owner|associate|intern|developer|designer|officer|company|llc|inc|ltd|corp)\b/i;
const companySignalPattern =
  /\b(llc|inc\.?|ltd\.?|corp\.?|corporation|company|group|partners|solutions|systems|technologies|technology|consulting|university|bank|health|labs|agency|foods|fintech|platform)\b/i;
const leadershipSignalPattern =
  /\b(mentor|representative|president|chair|volunteer|community|advisor|speaker|ambassador|csr|student leader)\b/i;
const volunteerSignalPattern =
  /\b(volunteer|volunteering|mentor|mentoring|coach|coaching|community service|unpaid service|nonprofit|non-profit|training)\b/i;
const projectSignalPattern =
  /\b(project|platform|application|app|implementation|launch|prototype|research|study|model|dashboard|system|automation|workflow|tool|product)\b/i;
const awardSignalPattern =
  /\b(award|honou?r|recognition|scholarship|winner|finalist|distinction|dean's list|excellence|productivity|\d+(?:st|nd|rd|th)\s+(?:position|place)|competition placement)\b/i;
const certificationSignalPattern =
  /\b(certified|certification|certificate|license|licensed|credential|course|specialization|professional certificate|scrummaster|scrum master|google project management|deeplearning\.?ai|blockchain council|ai product development|ai ethics)\b/i;
const certificationRejectPattern =
  /\b(llc|consulting|manager|product owner|program lead|growth lead|platform|built|led|implemented|shipped|improved|supported|developed|delivered|launched|principal|owner|associate|analyst|coordinator|director)\b/i;
const enterpriseVerbPattern =
  /\b(led|managed|owned|delivered|launched|implemented|coordinated|directed|built|improved|reduced|increased|optimized|partnered|developed|analyzed|executed|supported|drove)\b/i;
const metricPattern = /(\$?\d[\d,.]*\+?%?|\b\d+\+?\b)/;
const summarySignalPattern =
  /\b(years of experience|experienced|professional|specialist|leader|background in|expertise in|track record|skilled in)\b/i;
const genericSkillRejectSet = new Set([
  "accuracy",
  "across",
  "active",
  "description",
  "field",
  "full",
  "job",
  "manage",
  "national",
  "onboarding",
  "platform",
  "programs",
  "time",
  "training",
  "date",
]);
const allowedSingleSkillSet = new Set([
  "jira",
  "asana",
  "supabase",
  "next.js",
  "nextjs",
  "react",
  "typescript",
  "sql",
  "excel",
]);
const strongSkillPhrasePattern =
  /\b(saas implementation|enterprise platform|uat|qa|release readiness|go-live|stakeholder communication|risk|change control|agile|hybrid delivery|llm workflow|ai product|prompt engineering|rag|product design|openai api|implementation management|platform delivery)\b/i;
const summaryDebrisPattern =
  /\b(accuracy|description|field|full job|active platform|start month|target positioning|what success looks like|about estream|qualifications|responsibilities)\b/i;

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
  const cleaned = cleanText(value)
    .replace(/^[-*\u2022]\s*/, "")
    .replace(/\s*[-–]\s*$/g, "")
    .trim();

  return isInstructionArtifactText(cleaned) ? "" : cleaned;
}

export function isInstructionArtifactText(value: unknown): boolean {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return false;
  }

  if (instructionArtifactPattern.test(cleaned) || artifactPattern.test(cleaned)) {
    return true;
  }

  if (/^[-*\u2022]?\s*(professional summary|core skills|professional experience|education|certifications|awards|projects)\s*[:.]$/i.test(cleaned)) {
    return true;
  }

  if (/^[-*\u2022]?\s*(professional summary|core skills|professional experience|education|certifications|awards|projects)\s*[:.-]\s+/i.test(cleaned)) {
    return true;
  }

  if (
    /\b(add|include|keep|make|rewrite|tailor|optimize|remove|format|ensure)\b/i.test(cleaned) &&
    /\b(resume|cv|summary|skills|project|education|experience|bullet|section)\b/i.test(cleaned)
  ) {
    return true;
  }

  return false;
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values) {
    const cleaned = cleanLine(value);
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key) || artifactPattern.test(cleaned) || isInstructionArtifactText(cleaned)) {
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
  if (certificationSignalPattern.test(normalized)) {
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
  if (volunteerSignalPattern.test(normalized)) {
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
  if (headingOnlyPattern.test(bullet) || artifactPattern.test(bullet) || isInstructionArtifactText(bullet)) {
    score -= 80;
  }

  return score;
}

function prioritizeBullets(bullets: string[], limit: number, jobKeywords: string[] = []) {
  const unique = uniqueStrings(bullets).filter((bullet) => {
    if (headingOnlyPattern.test(bullet) || dateOnlyPattern.test(bullet) || isInstructionArtifactText(bullet)) {
      return false;
    }
    if (parseCombinedCompanyRole(bullet)) return false;
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
      if (!line || headingOnlyPattern.test(line) || artifactPattern.test(line) || isInstructionArtifactText(line)) {
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
      if (!skill || skill.length > 80 || headingOnlyPattern.test(skill) || isInstructionArtifactText(skill)) {
        return false;
      }
      return !/[.!?]\s*$/.test(skill) && isMeaningfulSkill(skill);
    })
    .slice(0, 32);
}

function isMeaningfulSkill(skill: string) {
  const normalized = skill.toLowerCase().replace(/\s+/g, " ").trim();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  if (genericSkillRejectSet.has(normalized)) {
    return false;
  }

  if (allowedSingleSkillSet.has(normalized)) {
    return true;
  }

  if (wordCount === 1) {
    return (
      /^[A-Z0-9][A-Za-z0-9.+#-]{2,}$/.test(skill) &&
      !genericSkillRejectSet.has(normalized)
    );
  }

  return strongSkillPhrasePattern.test(skill) || wordCount >= 2;
}

function normalizeBullets(values: unknown): string[] {
  const raw = Array.isArray(values) ? values : String(values ?? "").split(/\n+/);

  return prioritizeBullets(raw, 5);
}

function stripLeadingNumber(value: string) {
  return cleanLine(value).replace(/^\d+\.\s*/, "").trim();
}

function parseCombinedCompanyRole(value: string) {
  const cleaned = stripLeadingNumber(value);
  const parts = cleaned.split(/\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const [first, ...rest] = parts;
  const second = rest.join(" - ");
  const firstLooksCompany = companySignalPattern.test(first);
  const secondLooksCompany = companySignalPattern.test(second);

  if (!firstLooksCompany && secondLooksCompany) {
    return { company: second, title: first };
  }

  if (firstLooksCompany) {
    return { company: first, title: second };
  }

  return null;
}

export function normalizeExperience(values: unknown): ResumeExperience[] {
  const raw = Array.isArray(values) ? values : [];
  const seen = new Set<string>();
  const entries: ResumeExperience[] = [];

  for (const item of raw) {
    const source = (item ?? {}) as Partial<ResumeExperience>;
    const combined = parseCombinedCompanyRole(source.title || "");
    const title = combined?.title || cleanLine(source.title);
    const company = cleanLine(source.company) || combined?.company || "";
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

    const roleHeaders = (Array.isArray(source.bullets) ? source.bullets : [])
      .map(parseCombinedCompanyRole)
      .filter((entry): entry is { company: string; title: string } => Boolean(entry));

    for (const roleHeader of roleHeaders) {
      const roleKey = [roleHeader.title, roleHeader.company, "", ""].join("|").toLowerCase();
      if (seen.has(roleKey)) {
        continue;
      }

      seen.add(roleKey);
      entries.push({
        title: roleHeader.title,
        company: roleHeader.company,
        location: "",
        startDate: "",
        endDate: "",
        employmentType: "",
        bullets: [],
      });
    }
  }

  return entries;
}

export function normalizeProjects(values: unknown): ResumeProject[] {
  const raw = Array.isArray(values) ? values : [];

  return raw
    .map((item) => {
      const source = (item ?? {}) as Partial<ResumeProject>;
      const title = cleanLine(source.title);
      const titleLooksLikeAchievement =
        title.length > 90 ||
        (enterpriseVerbPattern.test(title) && /\b(i|we|built|led|implemented|platform|system)\b/i.test(title));
      return {
        title: titleLooksLikeAchievement ? "" : title,
        organization: cleanLine(source.organization),
        bullets: normalizeBullets([
          ...(titleLooksLikeAchievement ? [title] : []),
          ...(Array.isArray(source.bullets) ? source.bullets : []),
        ]),
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

function isCertificationText(value: string) {
  const cleaned = cleanLine(value);

  return (
    Boolean(cleaned) &&
    certificationSignalPattern.test(cleaned) &&
    !certificationRejectPattern.test(cleaned) &&
    !companySignalPattern.test(cleaned) &&
    !enterpriseVerbPattern.test(cleaned) &&
    !awardSignalPattern.test(cleaned) &&
    !leadershipSignalPattern.test(cleaned) &&
    !volunteerSignalPattern.test(cleaned) &&
    !isInstructionArtifactText(cleaned)
  );
}

function isAwardText(value: string) {
  const cleaned = cleanLine(value);
  return Boolean(cleaned) && awardSignalPattern.test(cleaned) && !isInstructionArtifactText(cleaned);
}

function isLeadershipText(value: string) {
  const cleaned = cleanLine(value);
  return (
    Boolean(cleaned) &&
    leadershipSignalPattern.test(cleaned) &&
    !volunteerSignalPattern.test(cleaned) &&
    !isInstructionArtifactText(cleaned)
  );
}

function isVolunteerText(value: string) {
  const cleaned = cleanLine(value);
  return Boolean(cleaned) && volunteerSignalPattern.test(cleaned) && !isInstructionArtifactText(cleaned);
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
    .filter((section) => section.heading && !isInstructionArtifactText(section.heading) && section.items.length > 0);
}

export function normalizeCanonicalResume(input: Partial<CanonicalResume> = {}): CanonicalResume {
  const empty = emptyCanonicalResume();
  const header = { ...empty.header, ...(input.header ?? {}) };
  const certificationSourceItems = uniqueStrings(input.certifications ?? []);

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
    certifications: certificationSourceItems.filter(isCertificationText),
    leadership: normalizeLeadership([
      ...(Array.isArray(input.leadership) ? input.leadership : []),
      ...certificationSourceItems.filter(isLeadershipText),
    ]),
    awards: normalizeAwards([
      ...(Array.isArray(input.awards) ? input.awards : []),
      ...certificationSourceItems.filter(isAwardText),
    ]),
    volunteerExperience: uniqueStrings([
      ...(Array.isArray(input.volunteerExperience) ? input.volunteerExperience : []),
      ...certificationSourceItems.filter(isVolunteerText),
    ]),
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
  next.certifications = uniqueStrings(next.certifications).filter(isCertificationText);

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

  if (
    !resume.professionalSummary ||
    resume.professionalSummary.length < 120 ||
    summaryDebrisPattern.test(resume.professionalSummary)
  ) {
    issues.push({
      code: "resume_quality_block",
      section: "professionalSummary",
      message: "Professional summary is too weak or contains source debris.",
    });
  }

  const badSkills = resume.coreSkills.filter((skill) => !isMeaningfulSkill(skill));
  if (badSkills.length > 0 || resume.coreSkills.length < 4) {
    issues.push({
      code: "resume_quality_block",
      section: "coreSkills",
      message: "Core skills contain generic parser debris or too few meaningful skills.",
    });
  }

  const contaminatedCertifications = resume.certifications.filter(
    (certification) => !isCertificationText(certification),
  );
  if (contaminatedCertifications.length > 0) {
    issues.push({
      code: "resume_quality_block",
      section: "certifications",
      message: "Certifications contain non-credential content.",
    });
  }

  const projectTitleCounts = new Map<string, number>();
  for (const project of resume.projects) {
    const key = project.title.toLowerCase();
    projectTitleCounts.set(key, (projectTitleCounts.get(key) ?? 0) + 1);
  }
  if ([...projectTitleCounts.values()].some((count) => count >= 3)) {
    issues.push({
      code: "resume_quality_block",
      section: "projects",
      message: "Project section repeats the same generated project name.",
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
      if (headingOnlyPattern.test(bullet) || artifactPattern.test(bullet) || isInstructionArtifactText(bullet)) {
        issues.push({
          code: "malformed_bullet",
          section: `professionalExperience.${index}`,
          message: "Experience bullet contains a heading or extraction artifact.",
        });
      }
      if (parseCombinedCompanyRole(bullet)) {
        issues.push({
          code: "resume_quality_block",
          section: `professionalExperience.${index}`,
          message: "Experience contains another role inside a bullet list.",
        });
      }
      if (companySignalPattern.test(bullet) && experienceSignalPattern.test(bullet)) {
        issues.push({
          code: "resume_quality_block",
          section: `professionalExperience.${index}`,
          message: "Experience bullet appears to contain a separate company or role.",
        });
      }
    }
  }

  if (instructionArtifactPattern.test(JSON.stringify(resume))) {
    issues.push({
      code: "instruction_artifact",
      message: "Instruction-like text detected in structured resume.",
    });
  }

  if (resume.additionalSections.some((section) => /review unmatched content/i.test(section.heading))) {
    issues.push({
      code: "review_needed",
      message: "Some items need review before final export.",
    });
  }

  return { resume, issues };
}
