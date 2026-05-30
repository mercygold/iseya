const savedWorkspace = {
  masterResume: "User source materials",
  jobDescription: "Target role details",
  targetRole: "Senior Implementation Project Manager",
  template: "executive-navy",
  theme: "deep-navy",
  personalBranding: {
    fullName: "Manual Name",
    phone: "+1 555 0100",
    location: "Toronto, Canada",
  },
  editableResumeSession: {
    resumeText: "Manual Name\nSenior Implementation Project Manager",
    manualOverrides: ["summary", "experience.0", "publications", "projects"],
    lockedFields: ["summary", "experience.0", "publications", "projects"],
    draft: {
      summaryText: "Senior implementation leader with source-verified delivery experience across SaaS implementation, UAT, release readiness, and stakeholder communication.",
      skillsText: "SaaS Implementation Management | UAT & QA Coordination | Release Readiness",
      experience: [
        {
          id: "experience-1",
          title: "Senior IT Project & Growth Lead",
          company: "Jormp LLC",
          location: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          bulletsText: "Built and led implementation of ISEYA.",
        },
      ],
      publications: [
        {
          id: "publication-1",
          title: "AI Agent Study & Applied LLM Implementation Notes",
          description: "Completed 100+ hours of AI agent study and synthesized 64 study notes.",
          link: "https://example.com/ai-agent-study",
          publisher: "",
          date: "",
        },
        {
          id: "publication-2",
          title: "Adoption Depth and Organizational-Labor Transformation in the AI Era",
          description: "Research exploring organizational embedding and practitioner mastery.",
          link: "https://example.com/adoption-depth",
          publisher: "",
          date: "",
        },
      ],
      projects: [
        {
          id: "project-1",
          name: "ISEYA Resume Workspace",
          context: "Product implementation",
          tools: "Next.js, Supabase",
          link: "https://iseya.jormp.com",
          details: "Implemented structured resume workflows.",
        },
        {
          id: "project-2",
          name: "AI Workflow Prototype",
          context: "Applied LLM implementation",
          tools: "OpenAI API",
          link: "",
          details: "Created workflow experiments for resume review.",
        },
      ],
    },
  },
};

const restored = JSON.parse(JSON.stringify(savedWorkspace));
const failures = [];

if (restored.personalBranding.fullName !== "Manual Name") failures.push("manual name did not persist");
if (restored.personalBranding.phone !== "+1 555 0100") failures.push("manual phone did not persist");
if (restored.personalBranding.location !== "Toronto, Canada") failures.push("manual location did not persist");
if (restored.editableResumeSession.draft.experience[0].company !== "Jormp LLC") failures.push("experience did not persist");
if (restored.editableResumeSession.draft.publications.length !== 2) failures.push("publications merged or disappeared");
if (restored.editableResumeSession.draft.projects.length !== 2) failures.push("projects merged or disappeared");
if (!restored.editableResumeSession.lockedFields.includes("summary")) failures.push("manual summary was not locked");
if (!restored.editableResumeSession.lockedFields.includes("publications")) failures.push("publications were not locked");
if (/Avery Morgan|dummy|sample/i.test(JSON.stringify(restored))) failures.push("dummy data returned after manual edits");

const badSummary = "Known for Date Accuracy Description Field Full Job";
if (!/\b(accuracy|description|field|full|job|known for date)\b/i.test(badSummary)) {
  failures.push("summary quality gate fixture is invalid");
}

if (failures.length > 0) {
  console.error("[resume-persistence] failed", { failures });
  process.exit(1);
}

console.log("[resume-persistence] passed", {
  publications: restored.editableResumeSession.draft.publications.length,
  projects: restored.editableResumeSession.draft.projects.length,
  lockedFields: restored.editableResumeSession.lockedFields,
});
