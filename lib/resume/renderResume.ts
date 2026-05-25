import { renderingModel } from "@/lib/ai/models";
import type {
  CanonicalResume,
  RenderResumeSection,
  RenderResumeState,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
} from "./types";
import { validateResume } from "./validateResume";

function projectTitle(projects: ResumeProject[]) {
  const text = JSON.stringify(projects).toLowerCase();
  if (/research|publication|study|methodology/.test(text)) {
    return "Research Projects";
  }
  if (/product|roadmap|launch|user|customer|saas/.test(text)) {
    return "Product Projects";
  }
  if (/api|platform|automation|data|system|technical|software|ai|ml/.test(text)) {
    return "Technical Projects";
  }
  return "Projects";
}

function section(
  id: string,
  title: string,
  kind: RenderResumeSection["kind"],
  content: RenderResumeSection["content"],
): RenderResumeSection {
  return { id, title, kind, content };
}

function formatExperience(entry: ResumeExperience) {
  const meta = [
    entry.company,
    entry.location,
    [entry.startDate, entry.endDate].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(" | ");
  return [
    entry.title,
    meta,
    ...entry.bullets.map((bullet) => `• ${bullet}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatProject(project: ResumeProject) {
  return [
    [project.title, project.organization].filter(Boolean).join(" | "),
    ...project.bullets.map((bullet) => `• ${bullet}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatEducation(education: ResumeEducation) {
  const credential = [education.degree, education.field].filter(Boolean).join(", ");
  const meta = [
    education.institution,
    education.location,
    [education.startDate, education.endDate].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(" | ");
  return [credential, meta].filter(Boolean).join("\n");
}

function keyAchievements(resume: CanonicalResume) {
  return (
    resume.additionalSections.find((section) =>
      /^key achievements$/i.test(section.heading),
    )?.items ?? []
  );
}

export function resumeToPlainText(resume: CanonicalResume) {
  const validation = validateResume(resume);
  const clean = validation.resume;
  const contact = [
    clean.header.email,
    clean.header.phone,
    clean.header.location,
    clean.header.linkedin,
    clean.header.portfolio,
  ]
    .filter(Boolean)
    .join(" | ");
  const blocks = [
    [clean.header.fullName, clean.header.headline, contact].filter(Boolean).join("\n"),
    clean.professionalSummary
      ? `PROFESSIONAL SUMMARY\n${clean.professionalSummary}`
      : "",
    clean.coreSkills.length > 0 ? `CORE SKILLS\n${clean.coreSkills.join(" | ")}` : "",
    clean.professionalExperience.length > 0
      ? `PROFESSIONAL EXPERIENCE\n${clean.professionalExperience
          .map(formatExperience)
          .join("\n\n")}`
      : "",
    clean.projects.length > 0
      ? `${projectTitle(clean.projects).toUpperCase()}\n${clean.projects
          .map(formatProject)
          .join("\n\n")}`
      : "",
    clean.education.length > 0
      ? `EDUCATION\n${clean.education.map(formatEducation).join("\n\n")}`
      : "",
    clean.certifications.length > 0
      ? `CERTIFICATIONS\n${clean.certifications.join("\n")}`
      : "",
    keyAchievements(clean).length > 0
      ? `KEY ACHIEVEMENTS\n${keyAchievements(clean)
          .map((item) => `• ${item}`)
          .join("\n")}`
      : "",
    clean.leadership.length > 0 ? `LEADERSHIP\n${clean.leadership.join("\n")}` : "",
    clean.awards.length > 0 ? `AWARDS\n${clean.awards.join("\n")}` : "",
    clean.volunteerExperience.length > 0
      ? `VOLUNTEER EXPERIENCE\n${clean.volunteerExperience.join("\n")}`
      : "",
    clean.publications.length > 0
      ? `PUBLICATIONS\n${clean.publications.join("\n")}`
      : "",
  ].filter(Boolean);

  return blocks.join("\n\n").trim();
}

export function renderResume(resume: CanonicalResume): RenderResumeState {
  const validation = validateResume(resume);
  const clean = validation.resume;
  const sections: RenderResumeSection[] = [];

  if (clean.professionalSummary) {
    sections.push(section("professional-summary", "Professional Summary", "summary", clean.professionalSummary));
  }
  if (clean.coreSkills.length > 0) {
    sections.push(section("core-skills", "Core Skills", "skills", clean.coreSkills));
  }
  if (clean.professionalExperience.length > 0) {
    sections.push(
      section(
        "professional-experience",
        "Professional Experience",
        "experience",
        clean.professionalExperience,
      ),
    );
  }
  if (clean.projects.length > 0) {
    sections.push(section("projects", projectTitle(clean.projects), "projects", clean.projects));
  }
  if (clean.education.length > 0) {
    sections.push(section("education", "Education", "education", clean.education));
  }
  const achievements = keyAchievements(clean);

  const listSections: Array<[string, string, string[]]> = [
    ["certifications", "Certifications", clean.certifications],
    ["key-achievements", "Key Achievements", achievements],
    ["leadership", "Leadership", clean.leadership],
    ["awards", "Awards", clean.awards],
    ["volunteer-experience", "Volunteer Experience", clean.volunteerExperience],
    ["publications", "Publications", clean.publications],
  ];

  for (const [id, title, items] of listSections) {
    if (items.length > 0) {
      sections.push(section(id, title, "list", items));
    }
  }

  console.log("ISEYA Stage 3 render prepared", {
    model: renderingModel,
    sectionCount: sections.length,
    issueCount: validation.issues.length,
  });

  return {
    header: clean.header,
    sections,
    plainText: resumeToPlainText(clean),
    validationIssues: validation.issues,
  };
}
