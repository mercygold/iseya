import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const routePath = "app/api/tailor/route.ts";
const enginePath = "lib/resume/qualityEngine.ts";

const route = fs.readFileSync(routePath, "utf8");
const engine = fs.readFileSync(enginePath, "utf8");

const requiredEngineExports = [
  "buildAiQualityAnalysis",
  "buildEvaluatedQualityOutputs",
  "evaluateQualityOutput",
  "reviseOutputWithQuality",
  "roleRubric",
];

const requiredRouteWiring = [
  "buildSharedAiQualityAnalysis",
  "buildEvaluatedQualityOutputs",
  "qualityEvaluations",
  "resumeSummary",
  "resumeBullets",
  "coverLetter",
  "linkedInHeadline",
  "linkedInAbout",
  "recruiterMessage",
  "interviewTalkingPoints",
  "skillGaps",
  "careerRoadmap",
];

const forbidden = [
  /General ATS/i,
  /Relevant source material/i,
  /without inventing/i,
  /recruiter readability/i,
  /placeholder intelligence/i,
];

const failures = [];

for (const exportName of requiredEngineExports) {
  if (!engine.includes(exportName)) {
    failures.push(`Missing quality engine export or function: ${exportName}`);
  }
}

for (const token of requiredRouteWiring) {
  if (!route.includes(token)) {
    failures.push(`Missing /api/tailor quality wiring token: ${token}`);
  }
}

for (const pattern of forbidden) {
  if (pattern.test(route) || pattern.test(engine)) {
    failures.push(`Forbidden generic phrase found: ${pattern}`);
  }
}

const transpiled = ts.transpileModule(engine, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
});
const moduleExports = {};
vm.runInNewContext(transpiled.outputText, {
  exports: moduleExports,
  module: { exports: moduleExports },
  console,
});

const realisticResume = `
Maya Okafor
Technical Product Manager

Experience
Product Operations Lead, BrightCare Systems
- Led implementation planning for a healthcare SaaS workflow, coordinating product, engineering, and client operations.
- Translated stakeholder requirements into Jira tickets, QA checks, and release-readiness milestones.
- Built analytics dashboards that helped operations leaders monitor onboarding progress and support risk.

Projects
Clinical Workflow Implementation Dashboard
- Designed a dashboard concept connecting onboarding workflow, UAT status, API handoff risks, and implementation readiness.

Skills
SaaS Implementation, SQL, Jira, UAT, Stakeholder Management, API Integration, Analytics
`;

const realisticJobDescription = `
Northstar Health is hiring a Technical Product Manager for an AI-enabled healthcare SaaS platform. The role owns roadmap execution, stakeholder discovery, requirements translation, UAT coordination, release readiness, analytics, API workflow decisions, and collaboration with engineering, clinical operations, and customer success. Preferred experience includes HIPAA-aware workflows, EHR integrations, AI workflow design, healthcare data quality, and customer-facing implementation.
`;

const realisticContext = {
  candidateName: "Maya Okafor",
  role: "Technical Product Manager",
  companyName: "Northstar Health",
  industryName: "healthcare SaaS",
  hasJobDescription: true,
  hasResumeEvidence: true,
  skills: ["SaaS Implementation", "SQL", "Jira", "UAT", "Stakeholder Management", "API Integration"],
  matchedKeywords: ["SaaS", "stakeholder", "UAT", "workflow", "API", "analytics"],
  missingKeywords: ["HIPAA", "EHR", "release readiness"],
  bullets: [
    "Led implementation planning for a healthcare SaaS workflow, coordinating product, engineering, and client operations.",
    "Translated stakeholder requirements into Jira tickets, QA checks, and release-readiness milestones.",
    "Built analytics dashboards that helped operations leaders monitor onboarding progress and support risk.",
  ],
  projectNames: ["Clinical Workflow Implementation Dashboard"],
  strongestEvidence: [
    "Translated stakeholder requirements into Jira tickets, QA checks, and release-readiness milestones.",
    "Built analytics dashboards that helped operations leaders monitor onboarding progress and support risk.",
  ],
  sourceSignals: ["SaaS", "Healthcare", "Jira", "SQL", "UAT", "API Integration"],
};

const analysis = moduleExports.buildAiQualityAnalysis(realisticContext);
const outputs = moduleExports.buildEvaluatedQualityOutputs(realisticContext, analysis);
const outputText = [
  outputs.resumeSummary.output,
  outputs.resumeBullets.output,
  outputs.coverLetter.output,
  outputs.linkedInHeadline.output,
  outputs.linkedInAbout.output,
  outputs.recruiterMessage.output,
  outputs.interviewTalkingPoints.output,
  outputs.skillGaps.output,
  outputs.careerRoadmap.output,
].join("\n\n");

for (const pattern of forbidden) {
  if (pattern.test(outputText)) {
    failures.push(`Sample output contained forbidden generic phrase: ${pattern}`);
  }
}

const sectionNames = [
  "resumeSummary",
  "resumeBullets",
  "coverLetter",
  "linkedInHeadline",
  "linkedInAbout",
  "recruiterMessage",
  "interviewTalkingPoints",
  "skillGaps",
  "careerRoadmap",
];

for (const sectionName of sectionNames) {
  const section = outputs[sectionName];
  if (!section?.output?.trim()) {
    failures.push(`Sample ${sectionName} output was empty.`);
  }
  if (!section?.evaluation?.badge) {
    failures.push(`Sample ${sectionName} missing quality badge.`);
  }
}

if (!/Technical Product Manager/i.test(outputText)) {
  failures.push("Sample output did not preserve the target role.");
}

if (!/SaaS|UAT|Jira|API|analytics/i.test(outputText)) {
  failures.push("Sample output did not use resume/job evidence.");
}

if (/\b\d+%|\$\d|\b\d+x\b/i.test(outputText)) {
  failures.push("Sample output introduced unsupported metric-looking claims.");
}

if (outputs.recruiterMessage.output.length > 380) {
  failures.push("Recruiter message is too long for direct outreach.");
}

if (!/Missing hard skills:/i.test(outputs.skillGaps.output) || !/Weak evidence areas:/i.test(outputs.skillGaps.output) || !/Optional improvements:/i.test(outputs.skillGaps.output) || !/Immediate resume fixes:/i.test(outputs.skillGaps.output)) {
  failures.push("Skill gap output does not separate hard skills, weak evidence, optional improvements, and immediate fixes.");
}

if (outputs.linkedInAbout.output.split(/\n\s*\n/).filter(Boolean).length < 3) {
  failures.push("LinkedIn About output does not follow the required three-part structure.");
}

if (!/roadmap|release|stakeholder|project|interview/i.test(outputs.careerRoadmap.output)) {
  failures.push("Career roadmap is not role-specific enough.");
}

if (!/motivation|opportunity|stands out|need for someone/i.test(outputs.coverLetter.output)) {
  failures.push("Cover letter does not explain fit and motivation beyond resume repetition.");
}

if (failures.length > 0) {
  console.error("AI quality engine check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("AI quality engine wiring check passed.");
console.log("Sample quality badges:", Object.fromEntries(sectionNames.map((name) => [name, outputs[name].evaluation.badge])));
console.log("Realistic journey input:", {
  resumeCharacters: realisticResume.trim().length,
  jobDescriptionCharacters: realisticJobDescription.trim().length,
  targetRole: realisticContext.role,
});
console.log("Sample output review:", {
  recruiterMessageCharacters: outputs.recruiterMessage.output.length,
  linkedInAboutParagraphs: outputs.linkedInAbout.output.split(/\n\s*\n/).filter(Boolean).length,
  skillGapStructured: /Missing hard skills:/.test(outputs.skillGaps.output),
  roadmapMentionsRole: /Technical Product Manager|roadmap|release|stakeholder/i.test(outputs.careerRoadmap.output),
});

if (process.env.SHOW_AI_QUALITY_OUTPUTS === "1") {
  console.log("Generated user-facing sample outputs:", {
    coverLetter: outputs.coverLetter.output,
    linkedInAbout: outputs.linkedInAbout.output,
    recruiterMessage: outputs.recruiterMessage.output,
    skillGaps: outputs.skillGaps.output,
    careerRoadmap: outputs.careerRoadmap.output,
  });
}
