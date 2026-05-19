"use client";

import { useEffect, useMemo, useState } from "react";

type TemplateId = "modern" | "classic" | "compact";
type ThemeId = "teal" | "indigo" | "rose" | "slate";

type TailoringResult = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  skills: string[];
  bullets: string[];
  rewrittenResume: string;
  coverLetter: string;
  scoreNotes: string[];
};

type ResumeSection = {
  heading: string;
  body: string[];
  bullets: string[];
};

type SavedState = {
  masterResume: string;
  jobDescription: string;
  targetRole: string;
  template: TemplateId;
  theme: ThemeId;
  result: TailoringResult | null;
};

const storageKey = "resume-agent-state-v2";

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
  "experimentation",
  "delivery",
  "technical",
  "integration",
  "leadership",
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

const themeClasses: Record<
  ThemeId,
  {
    accentText: string;
    accentBg: string;
    accentHover: string;
    accentSoft: string;
    accentBorder: string;
    headerBg: string;
    ring: string;
  }
> = {
  teal: {
    accentText: "text-teal-700",
    accentBg: "bg-teal-700",
    accentHover: "hover:bg-teal-800",
    accentSoft: "bg-teal-50 text-teal-900",
    accentBorder: "border-teal-200",
    headerBg: "bg-zinc-950",
    ring: "focus:border-teal-600 focus:ring-teal-100",
  },
  indigo: {
    accentText: "text-indigo-700",
    accentBg: "bg-indigo-700",
    accentHover: "hover:bg-indigo-800",
    accentSoft: "bg-indigo-50 text-indigo-900",
    accentBorder: "border-indigo-200",
    headerBg: "bg-indigo-950",
    ring: "focus:border-indigo-600 focus:ring-indigo-100",
  },
  rose: {
    accentText: "text-rose-700",
    accentBg: "bg-rose-700",
    accentHover: "hover:bg-rose-800",
    accentSoft: "bg-rose-50 text-rose-900",
    accentBorder: "border-rose-200",
    headerBg: "bg-rose-950",
    ring: "focus:border-rose-600 focus:ring-rose-100",
  },
  slate: {
    accentText: "text-slate-700",
    accentBg: "bg-slate-800",
    accentHover: "hover:bg-slate-900",
    accentSoft: "bg-slate-100 text-slate-900",
    accentBorder: "border-slate-300",
    headerBg: "bg-slate-950",
    ring: "focus:border-slate-600 focus:ring-slate-100",
  },
};

const templates: Record<TemplateId, { label: string; description: string }> = {
  modern: {
    label: "Modern",
    description: "Balanced summary, skills, and experience highlights.",
  },
  classic: {
    label: "Classic",
    description: "Conservative resume structure for traditional ATS scans.",
  },
  compact: {
    label: "Compact",
    description: "Tighter output for fast recruiter review.",
  },
};

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

function extractSignals(text: string) {
  const normalized = normalizeText(text);
  return Array.from(new Set(normalized.match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []));
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

function scoreResume(
  masterResume: string,
  jobDescription: string,
  jobKeywords: string[],
  matchedKeywords: string[],
) {
  const resumeSignals = new Set(extractSignals(masterResume));
  const jobSignals = extractSignals(jobDescription).filter(
    (word) =>
      ![
        "with",
        "that",
        "this",
        "will",
        "from",
        "have",
        "looking",
        "ideal",
        "candidate",
        "experience",
        "preferred",
      ].includes(word),
  );
  const signalMatches = jobSignals.filter((word) => resumeSignals.has(word));
  const keywordCoverage = matchedKeywords.length / Math.max(jobKeywords.length, 1);
  const signalCoverage = signalMatches.length / Math.max(jobSignals.length, 1);
  const lengthReadiness =
    masterResume.trim().length > 700 && jobDescription.trim().length > 250
      ? 1
      : masterResume.trim().length > 350 && jobDescription.trim().length > 120
        ? 0.7
        : 0.45;
  const score = Math.round(
    Math.min(98, Math.max(28, keywordCoverage * 55 + signalCoverage * 30 + lengthReadiness * 15)),
  );

  return {
    score,
    notes: [
      `Keyword coverage: ${Math.round(keywordCoverage * 100)}%`,
      `Role language overlap: ${Math.round(signalCoverage * 100)}%`,
      `Input readiness: ${Math.round(lengthReadiness * 100)}%`,
    ],
  };
}

function buildCoverLetter(
  role: string,
  candidateName: string,
  result: Omit<TailoringResult, "coverLetter">,
) {
  return `Dear Hiring Team,

I am excited to apply for the ${role} role. My background combines technical product management, IT project leadership, and hands-on delivery across SaaS, AI, fintech, enterprise platforms, CRM systems, analytics, and automation.

In recent roles, I have translated stakeholder goals into product requirements, prioritized delivery plans, coordinated technical and business teams, and supported launch-ready workflows. The experience highlighted in my resume aligns especially well with ${result.matchedKeywords.slice(0, 6).join(", ") || "the core needs of this position"}.

I would welcome the opportunity to bring structured product thinking, cross-functional execution, and practical AI/product delivery experience to your team.

Sincerely,
${candidateName}`;
}

function buildTailoredResume(
  masterResume: string,
  jobDescription: string,
  targetRole: string,
  template: TemplateId,
): TailoringResult {
  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(masterResume);
  const matchedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.includes(keyword),
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !resumeKeywords.includes(keyword),
  );
  const scoreResult = scoreResume(
    masterResume,
    jobDescription,
    jobKeywords,
    matchedKeywords,
  );
  const role = titleCase(
    targetRole || firstMeaningfulLine(jobDescription, "Target Role"),
  );
  const strongestKeywords = [
    ...matchedKeywords,
    ...missingKeywords.slice(0, 4),
  ].slice(0, 12);
  const skills = Array.from(
    new Set([
      ...strongestKeywords,
      "Product Requirements",
      "Stakeholder Alignment",
      "Delivery Planning",
      "Resume Keyword Optimization",
    ]),
  );
  const summary = `${role} with experience aligning business goals, user needs, and technical delivery. Brings hands-on strengths in ${strongestKeywords
    .slice(0, 6)
    .join(", ")} while translating complex requirements into clear roadmaps, launch plans, and measurable outcomes.`;
  const bullets = [
    `Repositioned product and delivery experience around ${role} responsibilities, emphasizing the keywords and outcomes requested in the job description.`,
    "Translated stakeholder goals into requirements, prioritized delivery plans, and launch-ready workflows for technical and business teams.",
    "Applied analytics, customer context, and quality review to improve product decisions, implementation readiness, and post-launch iteration.",
    missingKeywords.length > 0
      ? `Strengthened alignment with role expectations by weaving in ${missingKeywords
          .slice(0, 5)
          .join(", ")} where supported by the master resume.`
      : "Preserved strong keyword coverage while tightening the language for ATS scanning and recruiter readability.",
  ];
  const candidateName = firstMeaningfulLine(masterResume, "Candidate Name");
  const templateHeading =
    template === "classic"
      ? "PROFESSIONAL EXPERIENCE"
      : template === "compact"
        ? "SELECTED HIGHLIGHTS"
        : "EXPERIENCE HIGHLIGHTS";
  const sourceExcerpt =
    template === "compact" ? masterResume.trim().slice(0, 900) : masterResume.trim();
  const rewrittenResume = `${candidateName}
${role}

PROFESSIONAL SUMMARY
${summary}

CORE SKILLS
${skills.join(" | ")}

${templateHeading}
${bullets.map((bullet) => `- ${bullet}`).join("\n")}

TAILORING NOTES
- Matched keywords: ${matchedKeywords.length > 0 ? matchedKeywords.join(", ") : "None found yet"}
- Keywords to strengthen: ${missingKeywords.length > 0 ? missingKeywords.join(", ") : "No major gaps found"}
- Template: ${templates[template].label}

SOURCE RESUME EXCERPT
${sourceExcerpt}`;
  const baseResult = {
    score: scoreResult.score,
    matchedKeywords,
    missingKeywords,
    summary,
    skills,
    bullets,
    rewrittenResume,
    scoreNotes: scoreResult.notes,
  };

  return {
    ...baseResult,
    coverLetter: buildCoverLetter(role, candidateName, baseResult),
  };
}

function parseResumePreview(resumeText: string) {
  const lines = resumeText.split(/\r?\n/);
  const name = lines[0]?.trim() || "Candidate Name";
  const title = lines[1]?.trim() || "Target Role";
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (const rawLine of lines.slice(2)) {
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

  return { name, title, sections };
}

export default function Home() {
  const [masterResume, setMasterResume] = useState(sampleResume);
  const [jobDescription, setJobDescription] = useState(sampleJob);
  const [targetRole, setTargetRole] = useState("AI Product Manager");
  const [template, setTemplate] = useState<TemplateId>("modern");
  const [theme, setTheme] = useState<ThemeId>("teal");
  const [result, setResult] = useState<TailoringResult | null>(null);
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [activeOutput, setActiveOutput] = useState<"resume" | "cover">("resume");
  const [hydrated, setHydrated] = useState(false);
  const colors = themeClasses[theme];

  useEffect(() => {
    window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);

        if (saved) {
          const parsed = JSON.parse(saved) as Partial<SavedState>;
          setMasterResume(parsed.masterResume ?? sampleResume);
          setJobDescription(parsed.jobDescription ?? sampleJob);
          setTargetRole(parsed.targetRole ?? "AI Product Manager");
          setTemplate(parsed.template ?? "modern");
          setTheme(parsed.theme ?? "teal");
          setResult(parsed.result ?? null);
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      } finally {
        setHydrated(true);
      }
    }, 0);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const savedState: SavedState = {
      masterResume,
      jobDescription,
      targetRole,
      template,
      theme,
      result,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(savedState));
  }, [hydrated, jobDescription, masterResume, result, targetRole, template, theme]);

  const canTailor = useMemo(
    () =>
      masterResume.trim().length >= 40 &&
      jobDescription.trim().length >= 40 &&
      targetRole.trim().length >= 2,
    [jobDescription, masterResume, targetRole],
  );

  function tailorResume() {
    setCopyStatus("Copy");
    setActiveOutput("resume");
    setResult(buildTailoredResume(masterResume, jobDescription, targetRole, template));
  }

  function updateResumeOutput(value: string) {
    setResult((current) =>
      current
        ? {
            ...current,
            rewrittenResume: value,
          }
        : current,
    );
  }

  function updateCoverLetter(value: string) {
    setResult((current) =>
      current
        ? {
            ...current,
            coverLetter: value,
          }
        : current,
    );
  }

  async function copyOutput() {
    if (!result) {
      return;
    }

    const output =
      activeOutput === "cover" ? result.coverLetter : result.rewrittenResume;

    try {
      await navigator.clipboard.writeText(output);
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
    }-${activeOutput}.txt`;
    const output =
      activeOutput === "cover" ? result.coverLetter : result.rewrittenResume;
    const blob = new Blob([output], { type: "text/plain" });
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
        <div className="mx-auto flex max-w-[96rem] flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p
              className={`text-sm font-semibold uppercase tracking-[0.18em] ${colors.accentText}`}
            >
              Resume Tailoring Agent MVP
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Tailor a resume to a target role
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              Paste a master resume and job description, then generate an
              ATS-friendly resume, cover letter, keyword analysis, and editable
              output.
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

      <section className="mx-auto grid max-w-[96rem] gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_1fr]">
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
            className={`mt-3 min-h-[420px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:ring-4 ${colors.ring}`}
            placeholder="Paste your master resume here..."
          />
        </div>

        <div className="space-y-5">
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
              className={`mt-3 w-full rounded-md border border-zinc-300 bg-white p-4 text-sm text-zinc-800 outline-none transition focus:ring-4 ${colors.ring}`}
              placeholder="Example: AI Product Manager"
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-zinc-900">
                Template
                <select
                  value={template}
                  onChange={(event) => setTemplate(event.target.value as TemplateId)}
                  className={`mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:ring-4 ${colors.ring}`}
                >
                  {Object.entries(templates).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-zinc-900">
                Theme
                <select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as ThemeId)}
                  className={`mt-3 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none transition focus:ring-4 ${colors.ring}`}
                >
                  <option value="teal">Teal</option>
                  <option value="indigo">Indigo</option>
                  <option value="rose">Rose</option>
                  <option value="slate">Slate</option>
                </select>
              </label>
            </div>

            <p className="mt-3 text-sm text-zinc-500">
              {templates[template].description}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <label
              htmlFor="job-description"
              className="block text-sm font-semibold text-zinc-900"
            >
              Job Description
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className={`mt-3 min-h-[300px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-800 outline-none transition focus:ring-4 ${colors.ring}`}
              placeholder="Paste the job description here..."
            />
          </div>
        </div>
      </section>

      {result ? (
        <section className="mx-auto grid max-w-[96rem] gap-5 px-5 pb-10 sm:px-8 xl:grid-cols-[360px_1fr]">
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
                  className={`h-3 rounded-full ${colors.accentBg}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                {result.scoreNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
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
                  Tailored Output
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Edit the generated resume fields and cover letter before use.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOutput("resume")}
                  className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                    activeOutput === "resume"
                      ? `${colors.accentBg} text-white ${colors.accentHover}`
                      : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOutput("cover")}
                  className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                    activeOutput === "cover"
                      ? `${colors.accentBg} text-white ${colors.accentHover}`
                      : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  Cover Letter
                </button>
                <button
                  type="button"
                  onClick={copyOutput}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  {copyStatus}
                </button>
                <button
                  type="button"
                  onClick={downloadTxt}
                  className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition ${colors.accentBg} ${colors.accentHover}`}
                >
                  Download TXT
                </button>
              </div>
            </div>

            {activeOutput === "resume" ? (
              <>
                <div className="grid gap-5 py-5 lg:grid-cols-2">
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Tailored Summary
                    </h3>
                    <textarea
                      value={result.summary}
                      onChange={(event) =>
                        setResult((current) =>
                          current
                            ? { ...current, summary: event.target.value }
                            : current,
                        )
                      }
                      className={`mt-3 min-h-36 w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 outline-none transition focus:ring-4 ${colors.ring}`}
                    />
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Skills
                    </h3>
                    <textarea
                      value={result.skills.join(", ")}
                      onChange={(event) =>
                        setResult((current) =>
                          current
                            ? {
                                ...current,
                                skills: event.target.value
                                  .split(",")
                                  .map((skill) => skill.trim())
                                  .filter(Boolean),
                              }
                            : current,
                        )
                      }
                      className={`mt-3 min-h-36 w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 outline-none transition focus:ring-4 ${colors.ring}`}
                    />
                  </section>
                </div>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Rewritten Resume
                  </h3>
                  <textarea
                    value={result.rewrittenResume}
                    onChange={(event) => updateResumeOutput(event.target.value)}
                    className={`mt-3 min-h-[360px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 font-mono text-sm leading-6 text-zinc-800 outline-none transition focus:ring-4 ${colors.ring}`}
                  />
                  <ResumePreview
                    resumeText={result.rewrittenResume}
                    colors={colors}
                    template={template}
                  />
                </section>
              </>
            ) : (
              <section className="py-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Cover Letter
                </h3>
                <textarea
                  value={result.coverLetter}
                  onChange={(event) => updateCoverLetter(event.target.value)}
                  className={`mt-3 min-h-[560px] w-full resize-y rounded-md border border-zinc-300 bg-white p-4 text-sm leading-7 text-zinc-800 outline-none transition focus:ring-4 ${colors.ring}`}
                />
              </section>
            )}
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

function ResumePreview({
  resumeText,
  colors,
  template,
}: {
  resumeText: string;
  colors: (typeof themeClasses)[ThemeId];
  template: TemplateId;
}) {
  const resume = parseResumePreview(resumeText);
  const compactClass = template === "compact" ? "space-y-4 p-5" : "space-y-6 p-6";

  return (
    <article className="mt-5 max-h-[760px] overflow-auto rounded-md border border-zinc-200 bg-white text-zinc-850">
      <header className={`border-b border-zinc-200 px-6 py-5 text-white ${colors.headerBg}`}>
        <h4 className="text-2xl font-semibold tracking-tight">{resume.name}</h4>
        <p className="mt-1 text-sm font-medium text-zinc-200">{resume.title}</p>
      </header>

      <div className={compactClass}>
        {resume.sections.map((section) => (
          <section key={section.heading}>
            <h5
              className={`border-b pb-2 text-xs font-bold uppercase tracking-[0.16em] ${colors.accentText} ${colors.accentBorder}`}
            >
              {section.heading}
            </h5>
            {section.body.length > 0 ? (
              <div className="mt-3 space-y-2">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-7 text-zinc-700"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            {section.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
