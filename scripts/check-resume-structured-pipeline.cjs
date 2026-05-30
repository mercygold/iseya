/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  module._compile(output, filename);
};

const {
  extractResumeSchemaFromFacts,
  resumeSchemaToCanonical,
  validateResumeSchema,
} = require(path.join(__dirname, "../lib/resume/schema.ts"));
const { renderResume } = require(path.join(__dirname, "../lib/resume/renderResume.ts"));
const {
  generatedResumeContainsContamination,
  separateResumeInputs,
} = require(path.join(__dirname, "../lib/resume/inputSeparation.ts"));

const eStreamFailureSource = `
Jordan Taylor
Senior Implementation Project Manager
jordan@example.com | Lagos, Nigeria | linkedin.com/in/jordantaylor

IMPORTANT RESUME CLEANUP INSTRUCTIONS
I am tailoring my resume for a Senior Implementation Project Manager role.
Professional summary direction: position me as implementation-focused.
Core skills to prioritize: SaaS implementation, UAT, QA coordination, release readiness.
Use implementation language.
Reconcile inconsistent dates.
If space allows, include awards and leadership.
Do not over-focus on generic AI.
Make the resume sound senior.

Full job description
About eStream
Responsibilities
Qualifications
What success looks like
The Senior Implementation Project Manager will gather requirements, create tickets/specs/mockups, manage sprint cadence, coordinate QA, UAT, release readiness, go-live, training, onboarding, compliance, security, and stakeholder communication.

1. Jormp LLC — Senior IT Project & Growth Lead
Built and led implementation of ISEYA, a career infrastructure platform with resume upload, ATS scoring, recruiter visibility, structured job tracking, and AI workflow prototyping.
Coordinated product requirements, implementation tickets, release readiness, QA review, and go-live planning across a lean build environment.

2. Bech360 Consulting — Principal Growth Manager / IT Program Lead
Led technical program planning, stakeholder communication, and client delivery workflows across business transformation initiatives.

3. Japaul Gold & Ventures PLC — Business Transformation Lead
Supported reporting cadence, operational analysis, and internal implementation planning.

4. PATJEDA Group — Operations & Project Lead
Managed cross-functional coordination and process improvement efforts.

5. Choice Foods — Operations Manager
Coordinated operations, vendor communication, and service delivery improvements.

Investofly — Technical Product Owner / AI FinTech Platform
Led product discovery and implementation planning for a fintech platform concept.

Google Project Management Certificate
Advanced Certified ScrumMaster
AI Product Development by Blockchain Council
AI Ethics by DeepLearning.AI

4th position, UCI Black Management Innovate-25
Excellence & Productivity Award, Federal University of Technology
University Representative, International Technology & Leadership Programs
Volunteer Technical Coach, CodeCrammers
`;

const buckets = separateResumeInputs({
  sourceResumeText: eStreamFailureSource,
  explicitJobDescription: "",
  targetRole: "Senior Implementation Project Manager",
});
const structured = extractResumeSchemaFromFacts(
  buckets.candidateResumeFacts,
  buckets.targetRole,
);
const validation = validateResumeSchema(structured);
const canonical = resumeSchemaToCanonical(validation.resume);
const rendered = renderResume(canonical);
const renderedText = rendered.plainText.toLowerCase();

const forbidden = [
  "full job description",
  "target positioning",
  "resume writing instructions",
  "if space allows",
  "do not",
  "make the resume",
  "use implementation language",
  "qualifications",
  "responsibilities",
  "about the role",
  "about estream",
  "what success looks like",
];
const badSkills = ["accuracy", "description", "field", "full", "job", "manage", "national", "platform"];
const expectedCompanies = [
  "Jormp LLC",
  "Bech360 Consulting",
  "Japaul Gold & Ventures PLC",
  "PATJEDA Group",
  "Choice Foods",
  "Investofly",
];
const expectedCertifications = [
  "Advanced Certified ScrumMaster",
  "Google Project Management Certificate",
  "AI Product Development",
  "AI Ethics",
];

const failures = [];

for (const phrase of forbidden) {
  if (renderedText.includes(phrase)) failures.push(`forbidden phrase rendered: ${phrase}`);
}

for (const skill of badSkills) {
  if (structured.resume.skills.some((item) => item.toLowerCase() === skill)) {
    failures.push(`bad skill retained: ${skill}`);
  }
}

for (const company of expectedCompanies) {
  if (!structured.resume.experience.some((entry) => entry.company === company)) {
    failures.push(`missing separated experience: ${company}`);
  }
}

if (
  structured.resume.experience.some((entry) =>
    /^\d+\./.test(entry.title) || /[-–—]/.test(entry.title) && expectedCompanies.some((company) => entry.title.includes(company)),
  )
) {
  failures.push("experience title contains numbering or combined company/title");
}

for (const certification of expectedCertifications) {
  if (!structured.resume.certifications.some((entry) => entry.name.includes(certification))) {
    failures.push(`missing certification: ${certification}`);
  }
}

if (structured.resume.certifications.some((entry) => /Jormp|Bech360|Investofly|Manager|Lead|Platform/i.test(`${entry.name} ${entry.issuer}`))) {
  failures.push("certifications contain experience or company content");
}

if (!structured.resume.awards.some((entry) => /4th position/i.test(entry.name))) {
  failures.push("4th position did not map to awards");
}
if (!structured.resume.awards.some((entry) => /Excellence & Productivity Award/i.test(entry.name))) {
  failures.push("Excellence award did not map to awards");
}
if (!structured.resume.leadership.some((entry) => /University Representative/i.test(entry.title))) {
  failures.push("University Representative did not map to leadership");
}
if (!structured.resume.volunteerExperience.some((entry) => /Volunteer Technical Coach/i.test(entry.role))) {
  failures.push("Volunteer Technical Coach did not map to volunteer experience");
}

if (generatedResumeContainsContamination(rendered.plainText, {
  userResumeInstructions: buckets.userResumeInstructions,
  targetJobDescription: buckets.targetJobDescription,
})) {
  failures.push("rendered resume contains source bucket contamination");
}

if (failures.length > 0) {
  console.error("[resume-structured-pipeline] failed", { failures, structured });
  process.exit(1);
}

console.log("[resume-structured-pipeline] passed", {
  experience: structured.resume.experience.map((entry) => `${entry.company} | ${entry.title}`),
  certifications: structured.resume.certifications.map((entry) => entry.name),
  awards: structured.resume.awards.map((entry) => entry.name),
  leadership: structured.resume.leadership.map((entry) => entry.title),
  volunteer: structured.resume.volunteerExperience.map((entry) => entry.role),
});
console.log("[resume-structured-pipeline] sample", JSON.stringify(structured, null, 2));
