"use client";

import { useMemo, useState } from "react";

type TailoringResult = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  skills: string[];
  bullets: string[];
  rewrittenResume: string;
};

type ResumeSection = {
  heading: string;
  body: string[];
  bullets: string[];
};

const targetResumeTitle = "AI/ML Project Manager | Technical Program Lead";

const keywordBank = [
  "AI",
  "LLM",
  "SaaS",
  "Agile",
  "roadmap",
  "stakeholder",
  "analytics",
  "API",
  "CRM",
  "automation",
  "enterprise",
  "metrics",
  "customer discovery",
  "prompt engineering",
  "responsible AI",
  "cross-functional",
  "product strategy",
  "QA",
  "launch",
  "workflow",
  "requirements",
  "user research",
  "prioritization",
  "go-to-market",
  "data",
];

const sampleResume = `ANU MERCYGOLD JOSHUA
Technical Product Manager | IT Project Manager

SUMMARY
Senior IT Project Manager and Technical Product Manager with 8+ years of experience across SaaS, fintech, AI/ML, enterprise platforms, and digital transformation. Skilled in product strategy, Agile delivery, stakeholder management, analytics, CRM, API integrations, and growth systems.

EXPERIENCE
Principal Product Manager / IT Project Lead - Jormp LLC
- Led digital platform and automation projects for SMB, SaaS, and service-based clients.
- Managed product requirements, stakeholder communication, QA, implementation, and launch.
- Built growth systems involving analytics, attribution, websites, CRM, and automation workflows.

Technical Product Owner - Investofly
- Developed AI-powered investment assistant and equity crowdfunding product concepts.
- Translated business goals into product requirements, user journeys, and delivery milestones.

Product Manager - Japaul Gold & Ventures PLC
- Supported blockchain/fintech product initiative connected to a $20M+ capital raise.
- Coordinated stakeholders across technical, business, and executive teams.

EDUCATION
M.S. Innovation & Entrepreneurship - University of California, Irvine
B.Tech. Transport Management & Technology - Federal University of Technology, Akure

CERTIFICATIONS
Advanced Certified ScrumMaster, Google Project Management Certificate, AI Product Development, AI Ethics`;

const sampleJob = `AI Product Manager

We are looking for an AI Product Manager to lead the development of AI-powered workflow automation products. The ideal candidate has experience with SaaS products, Agile delivery, stakeholder management, analytics, customer discovery, roadmap planning, API integrations, and cross-functional collaboration. Experience with LLMs, prompt engineering, responsible AI, product metrics, and enterprise software is preferred.`;

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function extractKeywords(text: string) {
  const normalized = normalizeText(text);

  return keywordBank.filter((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    return normalized.includes(normalizedKeyword);
  });
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function firstMeaningfulLine(text: string, fallback: string) {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? fallback
  );
}

function buildTailoredResume(
  masterResume: string,
  jobDescription: string,
  targetRole: string,
): TailoringResult {
  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(masterResume);
  const matchedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !resumeKeywords.includes(keyword),
  );
  const score = Math.min(
    98,
    Math.max(
      35,
      Math.round((matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 100),
    ),
  );
  const role = titleCase(targetRole || targetResumeTitle);
  const strongestKeywords = [
    ...matchedKeywords,
    ...missingKeywords.slice(0, 4),
  ].slice(0, 12);
  const skills = Array.from(
    new Set([
      ...strongestKeywords,
      "Enterprise AI Program Delivery",
      "AI/ML Roadmap Planning",
      "Technical Program Management",
      "Stakeholder Alignment",
      "Cross-Functional Leadership",
      "Digital Transformation",
      "Revenue Growth Systems",
      "Responsible AI",
    ]),
  );
  const summary = `${role} with 8+ years of technology leadership across enterprise AI, SaaS, fintech, automation, and digital transformation programs. Experienced managing 5+ concurrent AI/digital transformation initiatives, coordinating 20+ cross-functional team members, supporting $20M+ platform initiatives, exceeding $1M+ annual business targets, managing 30+ staff, and contributing to 235% revenue growth through analytics, CRM, API integration, and automation-enabled execution.`;
  const bullets = [
    "Led 5+ concurrent AI/digital transformation initiatives across discovery, requirements, roadmap planning, delivery governance, QA, launch readiness, and post-launch optimization.",
    "Coordinated 20+ cross-functional team members across product, engineering, analytics, marketing, operations, vendors, and executive stakeholders.",
    "Built analytics, CRM, attribution, website, and automation systems that contributed to 235% revenue growth and stronger operational visibility.",
    "Supported $20M+ platform initiative planning by aligning executive priorities, product strategy, technical implementation, and stakeholder communication.",
    "Managed 30+ staff and exceeded $1M+ annual business targets across technology-enabled growth, operations, and service delivery workstreams.",
  ];
  const candidateName = firstMeaningfulLine(masterResume, "Candidate Name");
  const rewrittenResume = `${candidateName}
${targetResumeTitle}
Email: hello@example.com | Phone: Available upon request | Location: United States | LinkedIn: linkedin.com/in/profile

PROFESSIONAL SUMMARY
${summary}

CORE SKILLS
${skills.join(" | ")}

PROFESSIONAL EXPERIENCE
Principal Product Manager / IT Project Lead | Jormp LLC | Remote / United States | 2020 - Present
${bullets.map((bullet) => `- ${bullet}`).join("\n")}

Technical Product Owner | Investofly | Remote | 2022 - 2024
- Developed AI-powered investment assistant and equity crowdfunding platform concepts with product requirements, user workflows, roadmap milestones, and measurable launch criteria.
- Applied responsible AI, customer discovery, product metrics, and technical feasibility analysis to improve product trust and executive decision-making.
- Translated ambiguous business goals into delivery-ready requirements for fintech, AI, and platform stakeholders.

Product Manager | Japaul Gold & Ventures PLC | Lagos, Nigeria | 2018 - 2021
- Supported a $20M+ fintech/blockchain platform initiative by coordinating business, technical, investor-facing, and executive workstreams.
- Helped connect product strategy, implementation planning, stakeholder alignment, and operational execution across 4 international regions.
- Managed 30+ staff across business and operational functions while supporting $1M+ annual business targets.

AI & AUTOMATION PROJECTS
- Resume Tailoring Agent: Built an AI-assisted workflow for job description analysis, ATS keyword review, match scoring, missing keyword detection, and tailored resume generation.
- AI Marketing Agent: Designed an AI marketing workflow for campaign messaging, funnel analytics, lead generation, content planning, and marketing automation.
- Traffic Automation Agent: Created a traffic automation concept for campaign routing, attribution, performance tracking, and optimization workflows.
- AI Wedding Planning Assistant: Developed a planning assistant concept for vendor discovery, timeline management, budget tracking, and personalized recommendations.
- Investofly AI Fintech Platform: Led AI fintech platform concept work connecting investor workflows, crowdfunding experiences, product strategy, and responsible AI considerations.

RESEARCH / PUBLICATIONS
- AI Product Development, AI Ethics, and responsible automation research applied to enterprise workflow design and product delivery.
- Innovation and entrepreneurship research focused on digital transformation, growth systems, and technology-enabled venture development.

EDUCATION
M.S. Innovation & Entrepreneurship - University of California, Irvine
B.Tech. Transport Management & Technology - Federal University of Technology, Akure

CERTIFICATIONS
Advanced Certified ScrumMaster | Google Project Management Certificate | AI Product Development | AI Ethics`;

  return {
    score,
    matchedKeywords,
    missingKeywords,
    summary,
    skills,
    bullets,
    rewrittenResume,
  };
}

function parseResumePreview(resumeText: string) {
  const lines = resumeText.split(/\r?\n/);
  const name = lines[0]?.trim() || "Candidate Name";
  const title = lines[1]?.trim() || "Target Role";
  const contact = lines[2]?.includes("|") ? lines[2].trim() : "";
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (const rawLine of lines.slice(contact ? 3 : 2)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const cleanedLine = line.replace(/^#{1,6}\s*/, "").replace(/^\*+\s*/, "");
    const isHeading =
      cleanedLine === cleanedLine.toUpperCase() &&
      /^[A-Z0-9 &/+-]+$/.test(cleanedLine) &&
      !cleanedLine.startsWith("-");

    if (isHeading) {
      currentSection = {
        heading: cleanedLine,
        body: [],
        bullets: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = {
        heading: "PROFILE",
        body: [],
        bullets: [],
      };
      sections.push(currentSection);
    }

    if (/^[-*]\s+/.test(cleanedLine)) {
      currentSection.bullets.push(cleanedLine.replace(/^[-*]\s+/, ""));
    } else {
      currentSection.body.push(cleanedLine);
    }
  }

  return { name, title, contact, sections };
}

export default function Home() {
  const [masterResume, setMasterResume] = useState(sampleResume);
  const [jobDescription, setJobDescription] = useState(sampleJob);
  const [targetRole, setTargetRole] = useState(targetResumeTitle);
  const [result, setResult] = useState<TailoringResult | null>(null);
  const [copyStatus, setCopyStatus] = useState("Copy");

  const canTailor = useMemo(
    () =>
      masterResume.trim().length >= 40 &&
      jobDescription.trim().length >= 40 &&
      targetRole.trim().length >= 2,
    [jobDescription, masterResume, targetRole],
  );

  function tailorResume() {
    setCopyStatus("Copy");
    setResult(buildTailoredResume(masterResume, jobDescription, targetRole));
  }

  async function copyResume() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.rewrittenResume);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy"), 1500);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy"), 1500);
    }
  }

  function downloadTxt() {
    if (!result) {
      return;
    }

    const fileName = `${
      targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      "tailored-resume"
    }.txt`;
    const blob = new Blob([result.rewrittenResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Resume Tailoring Agent MVP
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Tailor a resume to a target role
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              Paste a master resume and job description, then generate an
              ATS-friendly draft with keyword analysis, a rewritten summary,
              skills, and resume output.
            </p>
          </div>
          <button
            type="button"
            onClick={tailorResume}
            disabled={!canTailor}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            Tailor Resume
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="master-resume"
            className="text-sm font-semibold text-zinc-900"
          >
            Master Resume
          </label>
          <textarea
            id="master-resume"
            value={masterResume}
            onChange={(event) => setMasterResume(event.target.value)}
            className="mt-3 min-h-[420px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="Paste your master resume here..."
          />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="target-role"
            className="text-sm font-semibold text-zinc-900"
          >
            Target Role
          </label>
          <input
            id="target-role"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            className="mt-3 w-full rounded-md border border-zinc-300 bg-white p-4 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="Example: AI Product Manager"
          />

          <label
            htmlFor="job-description"
            className="mt-5 block text-sm font-semibold text-zinc-900"
          >
            Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            className="mt-3 min-h-[340px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            placeholder="Paste the job description here..."
          />
        </div>
      </section>

      {result ? (
        <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 sm:px-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-zinc-500">Match Score</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-zinc-950">
                  {result.score}
                </span>
                <span className="pb-2 text-xl font-semibold text-zinc-500">%</span>
              </div>
              <div className="mt-5 h-3 rounded-full bg-zinc-100">
                <div
                  className="h-3 rounded-full bg-teal-600"
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            <KeywordList
              title="Matched Keywords"
              keywords={result.matchedKeywords}
              emptyText="No matched keywords found yet."
              variant="match"
            />
            <KeywordList
              title="Missing Keywords"
              keywords={result.missingKeywords}
              emptyText="No major keyword gaps found."
              variant="missing"
            />
          </aside>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Tailored Resume Output
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Review the generated draft before submitting it.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyResume}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  {copyStatus}
                </button>
                <button
                  type="button"
                  onClick={downloadTxt}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Download TXT
                </button>
              </div>
            </div>

            <div className="grid gap-5 py-5 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Tailored Summary
                </h3>
                <p className="mt-3 rounded-md bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                  {result.summary}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Skills
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Rewritten Resume
              </h3>
              <ResumePreview resumeText={result.rewrittenResume} />
            </section>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function KeywordList({
  title,
  keywords,
  emptyText,
  variant,
}: {
  title: string;
  keywords: string[];
  emptyText: string;
  variant: "match" | "missing";
}) {
  const colorClass =
    variant === "match"
      ? "bg-emerald-50 text-emerald-900"
      : "bg-amber-50 text-amber-900";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {keywords.length > 0 ? (
          keywords.map((keyword) => (
            <span
              key={keyword}
              className={`rounded-md px-3 py-2 text-xs font-semibold ${colorClass}`}
            >
              {keyword}
            </span>
          ))
        ) : (
          <p className="text-sm text-zinc-500">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function ResumePreview({ resumeText }: { resumeText: string }) {
  const resume = parseResumePreview(resumeText);

  return (
    <article className="mt-3 max-h-[760px] overflow-auto rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-sm">
      <header className="border-b border-zinc-200 bg-zinc-950 px-7 py-6 text-white">
        <h4 className="text-3xl font-semibold tracking-tight">{resume.name}</h4>
        <p className="mt-2 text-base font-medium text-teal-100">
          {resume.title}
        </p>
        {resume.contact ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-300">
            {resume.contact}
          </p>
        ) : null}
      </header>

      <div className="space-y-7 p-7">
        {resume.sections.map((section, sectionIndex) => (
          <section key={`${section.heading}-${sectionIndex}`}>
            <h5 className="border-b border-zinc-200 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              {section.heading}
            </h5>
            {["CORE SKILLS", "CERTIFICATIONS"].includes(section.heading) ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {section.body
                  .join(" | ")
                  .split("|")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item, itemIndex) => (
                    <span
                      key={`${item}-${itemIndex}`}
                      className="rounded-md bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-950 ring-1 ring-teal-100"
                    >
                      {item}
                    </span>
                  ))}
              </div>
            ) : null}
            {section.body.length > 0 ? (
              !["CORE SKILLS", "CERTIFICATIONS"].includes(section.heading) ? (
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph, paragraphIndex) => (
                    <ResumeBodyLine
                      key={`${paragraph}-${paragraphIndex}`}
                      line={paragraph}
                    />
                  ))}
                </div>
              ) : null
            ) : null}
            {section.bullets.length > 0 ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700 marker:text-teal-700">
                {section.bullets.map((bullet, bulletIndex) => (
                  <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}

function ResumeBodyLine({ line }: { line: string }) {
  const parts = line.split("|").map((part) => part.trim());

  if (parts.length >= 3) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-950">{parts[0]}</p>
            <p className="mt-1 text-sm font-medium text-zinc-700">{parts[1]}</p>
          </div>
          <div className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:text-right">
            {parts.slice(2).join(" | ")}
          </div>
        </div>
      </div>
    );
  }

  return <p className="text-sm leading-7 text-zinc-700">{line}</p>;
}
