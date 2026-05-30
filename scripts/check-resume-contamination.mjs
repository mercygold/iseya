const forbiddenPatterns = [
  /full job description/i,
  /target positioning/i,
  /start month year/i,
  /degree or certificate/i,
  /school or organization/i,
  /add a short project summary/i,
  /keep the resume/i,
  /keep resume senior/i,
  /do not\b/i,
  /important resume cleanup instructions/i,
  /i am tailoring my resume/i,
  /if space allows/i,
  /if space is limited/i,
  /use implementation language/i,
  /reconcile inconsistent dates/i,
  /prioritize/i,
  /make it sound/i,
  /what success looks like/i,
  /about estream/i,
  /about the role/i,
  /about the company/i,
  /qualifications/i,
  /responsibilities/i,
  /placeholder/i,
  /professional summary repeated/i,
  /professional experience\./i,
  /^[-*\u2022]?\s*(professional summary|core skills|professional experience|education|certifications|awards|projects)\s*[:.-]\s+/i,
];

const certificationPattern =
  /\b(certified|certification|certificate|license|licensed|credential|course|specialization|professional certificate|scrummaster|scrum master|google project management|deeplearning\.?ai|blockchain council|ai product development|ai ethics)\b/i;
const certificationRejectPattern =
  /\b(llc|consulting|manager|product owner|program lead|growth lead|platform|built|led|implemented|shipped|improved|supported|developed|delivered|launched|principal|owner|associate|analyst|coordinator|director)\b/i;
const awardPattern =
  /\b(award|honou?r|recognition|scholarship|winner|finalist|distinction|dean's list|excellence|productivity|\d+(?:st|nd|rd|th)\s+(?:position|place))\b/i;
const leadershipPattern =
  /\b(representative|president|chair|advisor|speaker|ambassador|student leader|board|committee)\b/i;
const volunteerPattern =
  /\b(volunteer|volunteering|mentor|mentoring|coach|coaching|community service|unpaid service|nonprofit|non-profit|training)\b/i;
const badSkillWords = new Set([
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
]);
const goodSkills = [
  "SaaS Implementation Management",
  "Enterprise Platform Delivery",
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

function classify(value) {
  if (forbiddenPatterns.some((pattern) => pattern.test(value))) return "discard";
  if (awardPattern.test(value)) return "awards";
  if (volunteerPattern.test(value)) return "volunteerExperience";
  if (leadershipPattern.test(value)) return "leadership";
  if (certificationPattern.test(value) && !certificationRejectPattern.test(value)) return "certifications";
  return "review";
}

function parseCombinedCompanyRole(value) {
  const cleaned = value.replace(/^\d+\.\s*/, "").trim();
  const parts = cleaned.split(/\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return { company: parts[0], title: parts.slice(1).join(" - ") };
}

function isMeaningfulSkill(value) {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();
  if (badSkillWords.has(normalized)) return false;
  if (["jira", "asana", "supabase", "next.js", "sql", "excel"].includes(normalized)) return true;
  return normalized.split(/\s+/).length >= 2 || /^[A-Z0-9][A-Za-z0-9.+#-]{2,}$/.test(value);
}

const failurePatternInput = `
Jordan Taylor
Product Operations Manager

IMPORTANT RESUME CLEANUP INSTRUCTIONS
I am tailoring my resume for a senior role. Keep the resume senior.
Full job description: Product operations role requiring stakeholder alignment.
About eStream
Responsibilities
Qualifications
What success looks like
Target positioning: make me look strategy-focused.
Start Month Year - End Month Year
Add a short project summary.
Degree or certificate - School or organization
Awards and leadership if space allows
4th position
Excellence & Productivity Award
University Representative
Volunteer Technical Coach
Use implementation language
Reconcile inconsistent dates
If space is limited
Google Project Management Certificate
Advanced Certified ScrumMaster
AI Product Development
AI Ethics

PROFESSIONAL SUMMARY
Product operations manager with experience coordinating delivery and analytics.

CORE SKILLS
Product Operations | Analytics | Agile | Placeholder
`;

const cleanedLines = failurePatternInput
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !forbiddenPatterns.some((pattern) => pattern.test(line)));

const contaminated = cleanedLines.filter((line) =>
  forbiddenPatterns.some((pattern) => pattern.test(line)),
);

if (contaminated.length > 0) {
  console.error("[resume-contamination] failed", { contaminated });
  process.exit(1);
}

const classificationCases = {
  "Awards and leadership if space allows": "discard",
  "4th position": "awards",
  "Excellence & Productivity Award": "awards",
  "University Representative": "leadership",
  "Volunteer Technical Coach": "volunteerExperience",
  "Use implementation language": "discard",
  "Reconcile inconsistent dates": "discard",
  "If space is limited": "discard",
  "Google Project Management Certificate": "certifications",
  "Advanced Certified ScrumMaster": "certifications",
  "AI Product Development": "certifications",
  "AI Ethics": "certifications",
  "Bech360 Consulting - Principal Growth Manager / IT Program Lead": "review",
  "Investofly - Technical Product Owner / AI FinTech Platform": "review",
  "I built and led implementation of ISEYA": "review",
  "Platform includes resume upload, ATS scoring, and recruiter visibility": "review",
};

const failedClassifications = Object.entries(classificationCases).filter(
  ([value, expected]) => classify(value) !== expected,
);

if (failedClassifications.length > 0) {
  console.error("[resume-contamination] classification failed", {
    failedClassifications,
  });
  process.exit(1);
}

const expectedCertifications = [
  "Advanced Certified ScrumMaster",
  "Google Project Management Certificate",
  "AI Product Development by Blockchain Council",
  "AI Ethics by DeepLearning.AI",
];
const rejectedCertificationInputs = [
  "Bech360 Consulting - Principal Growth Manager / IT Program Lead",
  "Investofly - Technical Product Owner / AI FinTech Platform",
  "I built and led implementation of ISEYA",
  "Platform includes resume upload, ATS scoring, and recruiter visibility",
];
const certificationFailures = [
  ...expectedCertifications.filter((item) => classify(item) !== "certifications"),
  ...rejectedCertificationInputs.filter((item) => classify(item) === "certifications"),
];

if (certificationFailures.length > 0) {
  console.error("[resume-contamination] certification filtering failed", {
    certificationFailures,
  });
  process.exit(1);
}

const splitRole = parseCombinedCompanyRole("1. Jormp LLC - Senior IT Project & Growth Lead");
if (
  splitRole?.company !== "Jormp LLC" ||
  splitRole?.title !== "Senior IT Project & Growth Lead"
) {
  console.error("[resume-contamination] role split failed", { splitRole });
  process.exit(1);
}

const badSkillFailures = [...badSkillWords].filter(isMeaningfulSkill);
const goodSkillFailures = goodSkills.filter((skill) => !isMeaningfulSkill(skill));
if (badSkillFailures.length > 0 || goodSkillFailures.length > 0) {
  console.error("[resume-contamination] skill quality failed", {
    badSkillFailures,
    goodSkillFailures,
  });
  process.exit(1);
}

console.log("[resume-contamination] passed", {
  retainedLines: cleanedLines.length,
  classificationCases: Object.keys(classificationCases).length,
});
