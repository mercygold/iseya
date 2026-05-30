import type { CanonicalResume, ResumeEducation, ResumeExperience, ResumeProject } from "./types";
import { cleanText, isInstructionArtifactText } from "./validateResume";

export type ResumeProfile = {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  website: string;
};

export type Experience = {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
};

export type Project = {
  name: string;
  roleOrContext: string;
  tools: string[];
  bullets: string[];
};

export type Education = {
  school: string;
  degree: string;
  location: string;
  graduationDate: string;
  details: string[];
};

export type Certification = {
  name: string;
  issuer: string;
  year: string;
};

export type Award = {
  name: string;
  issuer: string;
  year: string;
  description: string;
};

export type Leadership = {
  title: string;
  organization: string;
  year: string;
  description: string;
};

export type VolunteerExperience = {
  role: string;
  organization: string;
  year: string;
  description: string;
};

export type ResumeSchema = {
  profile: ResumeProfile;
  resume: {
    summary: string;
    skills: string[];
    experience: Experience[];
    projects: Project[];
    education: Education[];
    certifications: Certification[];
    awards: Award[];
    leadership: Leadership[];
    volunteerExperience: VolunteerExperience[];
  };
};

export type ResumeSchemaIssue = {
  code: string;
  message: string;
  path?: string;
};

export type ResumeSchemaValidationResult = {
  resume: ResumeSchema;
  issues: ResumeSchemaIssue[];
};

const forbiddenOutputPhrases = [
  "source material",
  "target positioning",
  "full job description",
  "about estream",
  "about the role",
  "about the company",
  "responsibilities",
  "qualifications",
  "if space allows",
  "do not",
  "position me as",
  "make the resume",
  "use implementation language",
  "this should not",
  "key points to extract",
  "professional summary direction",
  "resume writing instructions",
  "what success looks like",
];

const genericSkillRejectSet = new Set([
  "accuracy",
  "description",
  "field",
  "full",
  "job",
  "manage",
  "national",
  "platform",
  "programs",
  "time",
  "training",
  "active",
  "across",
  "date",
]);

const allowedSingleSkills = new Set([
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

const certificationPattern =
  /\b(certificate|certification|certified|license|licensed|credential|scrummaster|scrum master|pmp|google project management|blockchain council|deeplearning\.?ai|ai ethics|ai product development|power bi|sql|excel)\b/i;
const certificationRejectPattern =
  /\b(llc|consulting|manager|product owner|program lead|growth lead|platform|built|led|implemented|shipped|improved|supported|developed|delivered|launched|principal|owner|associate|analyst|coordinator|director)\b/i;
const companySignalPattern =
  /\b(llc|consulting|plc|group|foods|ventures|investofly|jormp|bech360|japaul|patjeda|choice foods|inc|ltd|corp|company)\b/i;
const roleSignalPattern =
  /\b(manager|lead|owner|analyst|engineer|director|consultant|coordinator|associate|specialist|officer|developer)\b/i;
const awardPattern =
  /\b(award|honou?r|recognition|winner|finalist|excellence|productivity|\d+(?:st|nd|rd|th)\s+(?:position|place))\b/i;
const leadershipPattern =
  /\b(representative|president|chair|ambassador|leadership program|student leader|board|committee)\b/i;
const volunteerPattern =
  /\b(volunteer|technical coach|mentor|mentoring|coach|coaching|community service|codecrammers)\b/i;
const datePattern = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\b(?:19|20)\d{2}\b|present|current/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;
const linkedinPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|]+/i;
const websitePattern = /(?:https?:\/\/)?(?:www\.)?(?!linkedin\.com)[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s|]*)?/i;

const knownExperienceCompanies = [
  "Jormp LLC",
  "Bech360 Consulting",
  "Japaul Gold & Ventures PLC",
  "PATJEDA Group",
  "Choice Foods",
  "Investofly",
];

const prioritySkills = [
  "SaaS Implementation Management",
  "Enterprise Platform Delivery",
  "Requirements Gathering",
  "UAT & QA Coordination",
  "Release Readiness",
  "Go-Live Support",
  "Stakeholder Communication",
  "Risk & Change Control",
  "Agile / Hybrid Delivery",
  "LLM Workflow Implementation",
  "AI Product Implementation",
  "Prompt Engineering",
  "RAG-Informed Product Design",
  "Jira",
  "Asana",
  "Supabase",
  "Next.js",
  "OpenAI API",
];

function emptyProfile(): ResumeProfile {
  return {
    fullName: "",
    professionalTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    website: "",
  };
}

export function emptyResumeSchema(): ResumeSchema {
  return {
    profile: emptyProfile(),
    resume: {
      summary: "",
      skills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      awards: [],
      leadership: [],
      volunteerExperience: [],
    },
  };
}

function line(value: unknown) {
  return cleanText(value).replace(/^[-*\u2022]\s*/, "").replace(/^\d+\.\s*/, "").trim();
}

function containsForbiddenOutput(value: unknown) {
  const normalized = cleanText(value).toLowerCase();
  return forbiddenOutputPhrases.some((phrase) => normalized.includes(phrase)) || isInstructionArtifactText(normalized);
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string) {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    const key = keyFn(item).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function parseYear(value: string) {
  return value.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? "";
}

function isMeaningfulSkill(value: string) {
  const skill = line(value).replace(/[.:]$/g, "");
  const normalized = skill.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (!skill || containsForbiddenOutput(skill) || genericSkillRejectSet.has(normalized)) return false;
  if (allowedSingleSkills.has(normalized)) return true;
  if (words.length === 1) return /^[A-Z0-9][A-Za-z0-9.+#-]{2,}$/.test(skill);
  return true;
}

function cleanBullet(value: string) {
  const cleaned = line(value);
  if (!cleaned || containsForbiddenOutput(cleaned)) return "";
  if (parseCompanyRole(cleaned)) return "";
  if (companySignalPattern.test(cleaned) && roleSignalPattern.test(cleaned) && cleaned.length < 120) return "";
  return cleaned;
}

export function parseCompanyRole(value: string): { company: string; title: string } | null {
  const cleaned = line(value).replace(/\s+/g, " ");
  const dashParts = cleaned.split(/\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    const first = dashParts[0];
    const rest = dashParts.slice(1).join(" - ");
    if (companySignalPattern.test(first)) return { company: first, title: rest };
    if (companySignalPattern.test(rest)) return { company: rest, title: first };
  }
  const commaParts = cleaned.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    const [first, second] = commaParts;
    if (roleSignalPattern.test(first) && companySignalPattern.test(second)) {
      return { company: second, title: first };
    }
  }
  const knownCompany = knownExperienceCompanies.find((company) =>
    cleaned.toLowerCase().includes(company.toLowerCase()),
  );
  if (knownCompany) {
    const title = cleaned
      .replace(new RegExp(knownCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
      .replace(/[-–—|,]/g, " ")
      .replace(datePattern, "")
      .replace(/\s+/g, " ")
      .trim();
    return { company: knownCompany, title };
  }
  return null;
}

function extractProfile(lines: string[]): ResumeProfile {
  const profile = emptyProfile();
  const top = lines.slice(0, 10);
  const contact = top.join(" | ");
  profile.email = contact.match(emailPattern)?.[0] ?? "";
  profile.phone = contact.match(phonePattern)?.[0] ?? "";
  profile.linkedin = contact.match(linkedinPattern)?.[0] ?? "";
  profile.website = contact.match(websitePattern)?.[0] ?? "";
  profile.fullName =
    top.find((item) => /^[A-Z][A-Za-z .'-]{3,60}$/.test(item) && !roleSignalPattern.test(item) && !emailPattern.test(item)) ?? "";
  profile.professionalTitle =
    top.find((item) => item !== profile.fullName && roleSignalPattern.test(item) && item.length < 90) ?? "";
  profile.location =
    top.find((item) => /,\s*[A-Z]{2}\b|United States|Nigeria|Canada|United Kingdom|Germany|Lagos|London|Toronto/i.test(item)) ?? "";
  return profile;
}

function parseCertification(value: string): Certification | null {
  const cleaned = line(value);
  if (!certificationPattern.test(cleaned) || certificationRejectPattern.test(cleaned) || containsForbiddenOutput(cleaned)) return null;
  const year = parseYear(cleaned);
  const issuer =
    cleaned.match(/\bby\s+(.+)$/i)?.[1]?.replace(/\b(?:19|20)\d{2}\b/g, "").trim() ||
    (/\bgoogle\b/i.test(cleaned) ? "Google" : "") ||
    (/\bblockchain council\b/i.test(cleaned) ? "Blockchain Council" : "") ||
    (/\bdeeplearning\.?ai\b/i.test(cleaned) ? "DeepLearning.AI" : "");
  const name = cleaned.replace(/\s+by\s+.+$/i, "").replace(/\s*,?\s*(?:19|20)\d{2}\b/g, "").trim();
  return name ? { name, issuer, year } : null;
}

function parseAward(value: string): Award | null {
  const cleaned = line(value);
  if (!awardPattern.test(cleaned) || containsForbiddenOutput(cleaned)) return null;
  const year = parseYear(cleaned);
  const parts = cleaned.split(/\s*,\s*/).filter(Boolean);
  return {
    name: parts[0] ?? cleaned,
    issuer: parts.slice(1).join(", ").replace(/\b(?:19|20)\d{2}\b/g, "").trim(),
    year,
    description: "",
  };
}

function parseLeadership(value: string): Leadership | null {
  const cleaned = line(value);
  if (!leadershipPattern.test(cleaned) || volunteerPattern.test(cleaned) || containsForbiddenOutput(cleaned)) return null;
  const year = parseYear(cleaned);
  const parts = cleaned.split(/\s*,\s*/).filter(Boolean);
  return {
    title: parts[0] ?? cleaned,
    organization: parts.slice(1).join(", ").replace(/\b(?:19|20)\d{2}\b/g, "").trim(),
    year,
    description: "",
  };
}

function parseVolunteer(value: string): VolunteerExperience | null {
  const cleaned = line(value);
  if (!volunteerPattern.test(cleaned) || containsForbiddenOutput(cleaned)) return null;
  const year = parseYear(cleaned);
  const parts = cleaned.split(/\s*,\s*/).filter(Boolean);
  return {
    role: parts[0] ?? cleaned,
    organization: parts.slice(1).join(", ").replace(/\b(?:19|20)\d{2}\b/g, "").trim(),
    year,
    description: "",
  };
}

function parseEducation(value: string): Education | null {
  const cleaned = line(value);
  if (!/\b(university|college|school|institute|academy|bachelor|master|mba|ph\.?d|degree|b\.?s\.?|m\.?s\.?)\b/i.test(cleaned)) return null;
  if (awardPattern.test(cleaned) || certificationPattern.test(cleaned) || containsForbiddenOutput(cleaned)) return null;
  return {
    school: cleaned.match(/(?:at|from)\s+(.+)$/i)?.[1] ?? cleaned,
    degree: cleaned.match(/\b(?:bachelor|master|mba|ph\.?d|b\.?s\.?|m\.?s\.?|degree)[^,|]*/i)?.[0] ?? "",
    location: "",
    graduationDate: parseYear(cleaned),
    details: [],
  };
}

export function extractResumeSchemaFromFacts(candidateResumeFacts: string, targetRole = ""): ResumeSchema {
  const lines = cleanText(candidateResumeFacts).split(/\r?\n/).map(line).filter(Boolean);
  const schema = emptyResumeSchema();
  schema.profile = extractProfile(lines);
  if (targetRole) schema.profile.professionalTitle = targetRole;

  let currentExperience: Experience | null = null;
  const pushExperience = () => {
    if (!currentExperience) return;
    currentExperience.bullets = uniqueBy(currentExperience.bullets.map(cleanBullet).filter(Boolean), (item) => item);
    if (currentExperience.company || currentExperience.title || currentExperience.bullets.length > 0) {
      schema.resume.experience.push(currentExperience);
    }
    currentExperience = null;
  };

  for (const raw of lines) {
    if (containsForbiddenOutput(raw)) continue;
    const certification = parseCertification(raw);
    if (certification) {
      schema.resume.certifications.push(certification);
      continue;
    }
    const award = parseAward(raw);
    if (award) {
      schema.resume.awards.push(award);
      continue;
    }
    const volunteer = parseVolunteer(raw);
    if (volunteer) {
      schema.resume.volunteerExperience.push(volunteer);
      continue;
    }
    const leadership = parseLeadership(raw);
    if (leadership) {
      schema.resume.leadership.push(leadership);
      continue;
    }
    const education = parseEducation(raw);
    if (education) {
      schema.resume.education.push(education);
      continue;
    }
    const role = parseCompanyRole(raw);
    if (role && role.company && role.title) {
      pushExperience();
      currentExperience = {
        company: role.company,
        title: role.title,
        location: "",
        startDate: raw.match(datePattern)?.[0]?.replace(/^Date:\s*/i, "") ?? "",
        endDate: /\bpresent|current\b/i.test(raw) ? "Present" : "",
        current: /\bpresent|current\b/i.test(raw),
        bullets: [],
      };
      continue;
    }
    if (currentExperience && (raw.length > 45 || /^(led|built|managed|implemented|supported|coordinated|delivered|created|improved|owned)\b/i.test(raw))) {
      currentExperience.bullets.push(raw);
      continue;
    }
    if (/skills|expertise|tools/i.test(raw)) {
      const skills = raw.split(/[:|,;]+/).slice(1).map(line).filter(isMeaningfulSkill);
      schema.resume.skills.push(...skills);
    }
  }
  pushExperience();

  const supportedSkillText = candidateResumeFacts.toLowerCase();
  schema.resume.skills.push(
    ...prioritySkills.filter((skill) => {
      const words = skill.toLowerCase().split(/[^a-z0-9.+#]+/).filter((word) => word.length > 2);
      return words.some((word) => supportedSkillText.includes(word));
    }),
  );
  schema.resume.skills = uniqueBy(schema.resume.skills.filter(isMeaningfulSkill), (item) => item).slice(0, 24);
  schema.resume.experience = uniqueBy(schema.resume.experience, (item) => `${item.company}|${item.title}`);
  schema.resume.certifications = uniqueBy(schema.resume.certifications, (item) => `${item.name}|${item.issuer}`);
  schema.resume.awards = uniqueBy(schema.resume.awards, (item) => `${item.name}|${item.issuer}`);
  schema.resume.leadership = uniqueBy(schema.resume.leadership, (item) => `${item.title}|${item.organization}`);
  schema.resume.volunteerExperience = uniqueBy(schema.resume.volunteerExperience, (item) => `${item.role}|${item.organization}`);

  if (!schema.resume.summary) {
    const role = targetRole || schema.profile.professionalTitle || schema.resume.experience[0]?.title || "Career professional";
    const skills = schema.resume.skills.slice(0, 5).join(", ");
    schema.resume.summary = `${role} with experience in ${skills || "implementation delivery, stakeholder coordination, and structured career operations"}. Brings practical execution across product, operations, and cross-functional delivery while keeping career materials recruiter-ready and evidence-based.`;
  }

  return validateResumeSchema(schema).resume;
}

export function validateResumeSchema(input: ResumeSchema): ResumeSchemaValidationResult {
  const issues: ResumeSchemaIssue[] = [];
  const resume: ResumeSchema = {
    profile: {
      fullName: line(input.profile.fullName),
      professionalTitle: line(input.profile.professionalTitle),
      email: line(input.profile.email),
      phone: line(input.profile.phone),
      location: line(input.profile.location),
      linkedin: line(input.profile.linkedin),
      portfolio: line(input.profile.portfolio),
      website: line(input.profile.website),
    },
    resume: {
      summary: containsForbiddenOutput(input.resume.summary) ? "" : cleanText(input.resume.summary),
      skills: uniqueBy(input.resume.skills.map(line).filter(isMeaningfulSkill), (item) => item),
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      awards: [],
      leadership: [],
      volunteerExperience: [],
    },
  };

  for (const [index, entry] of input.resume.experience.entries()) {
    const parsed = parseCompanyRole(entry.title);
    const company = line(entry.company || parsed?.company);
    const title = line(parsed?.title || entry.title);
    const text = [company, title].join(" ");
    if (text.length > 160 || containsForbiddenOutput(text)) {
      issues.push({ code: "invalid_experience_identity", message: "Experience identity is malformed.", path: `resume.experience.${index}` });
      continue;
    }
    const bullets = entry.bullets.map(cleanBullet).filter(Boolean);
    if (!company && !title && bullets.length === 0) continue;
    if (parseCompanyRole(title)) {
      issues.push({ code: "combined_company_role", message: "Role/title contains a combined company and role.", path: `resume.experience.${index}.title` });
    }
    resume.resume.experience.push({
      company,
      title,
      location: line(entry.location),
      startDate: line(entry.startDate).replace(/^Date:\s*/i, ""),
      endDate: line(entry.endDate).replace(/^Date:\s*/i, ""),
      current: Boolean(entry.current),
      bullets,
    });
  }

  resume.resume.projects = input.resume.projects
    .map((project) => ({
      name: line(project.name),
      roleOrContext: line(project.roleOrContext),
      tools: uniqueBy(project.tools.map(line).filter(isMeaningfulSkill), (item) => item),
      bullets: project.bullets.map(cleanBullet).filter(Boolean),
    }))
    .filter((project) => project.name && !containsForbiddenOutput(JSON.stringify(project)));

  resume.resume.education = input.resume.education
    .map((education) => ({
      school: line(education.school),
      degree: line(education.degree),
      location: line(education.location),
      graduationDate: line(education.graduationDate),
      details: education.details.map(line).filter((item) => item && !awardPattern.test(item) && !certificationPattern.test(item)),
    }))
    .filter((education) => education.school || education.degree);

  resume.resume.certifications = input.resume.certifications
    .map((certification) => ({
      name: line(certification.name),
      issuer: line(certification.issuer),
      year: line(certification.year),
    }))
    .filter((certification) => parseCertification([certification.name, certification.issuer, certification.year].filter(Boolean).join(" ")));

  resume.resume.awards = input.resume.awards
    .map((award) => ({
      name: line(award.name),
      issuer: line(award.issuer),
      year: line(award.year),
      description: line(award.description),
    }))
    .filter((award) => awardPattern.test([award.name, award.issuer, award.description].join(" ")) && !containsForbiddenOutput(JSON.stringify(award)));

  resume.resume.leadership = input.resume.leadership
    .map((leadership) => ({
      title: line(leadership.title),
      organization: line(leadership.organization),
      year: line(leadership.year),
      description: line(leadership.description),
    }))
    .filter((leadership) => leadershipPattern.test([leadership.title, leadership.organization, leadership.description].join(" ")) && !containsForbiddenOutput(JSON.stringify(leadership)));

  resume.resume.volunteerExperience = input.resume.volunteerExperience
    .map((volunteer) => ({
      role: line(volunteer.role),
      organization: line(volunteer.organization),
      year: line(volunteer.year),
      description: line(volunteer.description),
    }))
    .filter((volunteer) => volunteerPattern.test([volunteer.role, volunteer.organization, volunteer.description].join(" ")) && !containsForbiddenOutput(JSON.stringify(volunteer)));

  if (containsForbiddenOutput(JSON.stringify(resume))) {
    issues.push({ code: "instruction_or_jd_contamination", message: "Instruction or job description text detected." });
  }
  if (resume.resume.skills.some((skill) => genericSkillRejectSet.has(skill.toLowerCase()))) {
    issues.push({ code: "generic_skill_debris", message: "Skills contain parser debris.", path: "resume.skills" });
  }
  if (resume.resume.certifications.length < input.resume.certifications.length) {
    issues.push({ code: "certification_sanitized", message: "Non-certification content was removed from certifications.", path: "resume.certifications" });
  }
  if (resume.resume.experience.some((entry) => entry.company.length > 120 || /[.!?]\s/.test(entry.company))) {
    issues.push({ code: "company_paragraph", message: "Company field appears to be a paragraph.", path: "resume.experience" });
  }
  const projectCounts = new Map<string, number>();
  for (const project of resume.resume.projects) {
    projectCounts.set(project.name.toLowerCase(), (projectCounts.get(project.name.toLowerCase()) ?? 0) + 1);
  }
  if ([...projectCounts.values()].some((count) => count >= 3)) {
    issues.push({ code: "repeated_project_names", message: "Projects repeat the same name too often.", path: "resume.projects" });
  }

  return { resume, issues };
}

export function resumeSchemaToCanonical(schema: ResumeSchema): CanonicalResume {
  const validation = validateResumeSchema(schema);
  const clean = validation.resume;
  return {
    header: {
      fullName: clean.profile.fullName,
      headline: clean.profile.professionalTitle,
      email: clean.profile.email,
      phone: clean.profile.phone,
      location: clean.profile.location,
      linkedin: clean.profile.linkedin,
      portfolio: clean.profile.portfolio || clean.profile.website,
    },
    professionalSummary: clean.resume.summary,
    coreSkills: clean.resume.skills,
    professionalExperience: clean.resume.experience.map<ResumeExperience>((entry) => ({
      title: entry.title,
      company: entry.company,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      employmentType: "",
      bullets: entry.bullets,
    })),
    projects: clean.resume.projects.map<ResumeProject>((project) => ({
      title: project.name,
      organization: project.roleOrContext,
      bullets: [...project.tools.map((tool) => `Tools: ${tool}`), ...project.bullets],
    })),
    education: clean.resume.education.map<ResumeEducation>((education) => ({
      institution: education.school,
      degree: education.degree,
      field: education.details.join(" | "),
      location: education.location,
      startDate: "",
      endDate: education.graduationDate,
    })),
    certifications: clean.resume.certifications.map((certification) =>
      [certification.name, certification.issuer ? `by ${certification.issuer}` : "", certification.year].filter(Boolean).join(" "),
    ),
    leadership: clean.resume.leadership.map((item) => [item.title, item.organization, item.year, item.description].filter(Boolean).join(" - ")),
    awards: clean.resume.awards.map((item) => [item.name, item.issuer, item.year, item.description].filter(Boolean).join(" - ")),
    volunteerExperience: clean.resume.volunteerExperience.map((item) => [item.role, item.organization, item.year, item.description].filter(Boolean).join(" - ")),
    publications: [],
    additionalSections: [],
  };
}

export function canonicalToResumeSchema(resume: CanonicalResume): ResumeSchema {
  return validateResumeSchema({
    profile: {
      fullName: resume.header.fullName,
      professionalTitle: resume.header.headline,
      email: resume.header.email,
      phone: resume.header.phone,
      location: resume.header.location,
      linkedin: resume.header.linkedin,
      portfolio: resume.header.portfolio,
      website: "",
    },
    resume: {
      summary: resume.professionalSummary,
      skills: resume.coreSkills,
      experience: resume.professionalExperience.map((entry) => ({
        company: entry.company,
        title: entry.title,
        location: entry.location,
        startDate: entry.startDate,
        endDate: entry.endDate,
        current: /present|current/i.test(entry.endDate),
        bullets: entry.bullets,
      })),
      projects: resume.projects.map((project) => ({
        name: project.title,
        roleOrContext: project.organization,
        tools: [],
        bullets: project.bullets,
      })),
      education: resume.education.map((education) => ({
        school: education.institution,
        degree: [education.degree, education.field].filter(Boolean).join(", "),
        location: education.location,
        graduationDate: education.endDate,
        details: [],
      })),
      certifications: resume.certifications.map((item) => parseCertification(item)).filter((item): item is Certification => Boolean(item)),
      awards: resume.awards.map((item) => parseAward(item)).filter((item): item is Award => Boolean(item)),
      leadership: resume.leadership.map((item) => parseLeadership(item)).filter((item): item is Leadership => Boolean(item)),
      volunteerExperience: resume.volunteerExperience.map((item) => parseVolunteer(item)).filter((item): item is VolunteerExperience => Boolean(item)),
    },
  }).resume;
}
