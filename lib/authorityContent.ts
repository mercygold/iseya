export type AuthorityFaq = {
  question: string;
  answer: string;
};

export type AuthoritySection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type AuthorityLink = {
  label: string;
  href: string;
};

export type InsightArticle = {
  slug: string;
  category: string;
  title: string;
  description: string;
  publishedOn: string;
  readingTime: string;
  audience: string;
  sections: AuthoritySection[];
  faq: AuthorityFaq[];
  relatedLinks: AuthorityLink[];
};

export type SeoGuide = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  audience: string;
  sections: AuthoritySection[];
  faq: AuthorityFaq[];
  relatedLinks: AuthorityLink[];
};

export const insightTopics = [
  "Career insights",
  "Resume optimization",
  "Recruiter insights",
  "Hiring trends",
  "Responsible AI assistance",
  "Student career positioning",
  "Interview preparation",
  "Institution employability trends",
];

export const insightArticles: InsightArticle[] = [
  {
    slug: "tailoring-a-resume-for-a-specific-opportunity",
    category: "Resume optimization",
    title: "How to tailor a resume for a specific opportunity",
    description:
      "A practical framework for aligning career evidence to a role while keeping every claim accurate and recruiter-readable.",
    publishedOn: "2026-05-26",
    readingTime: "5 min read",
    audience: "Candidates and students",
    sections: [
      {
        heading: "Start with the employer's actual need",
        paragraphs: [
          "Strong tailoring begins with the role description, not with keyword repetition. Identify the outcomes, capabilities, tools, and operating context the employer emphasizes, then compare them with evidence you can honestly support.",
          "A product role may prioritize roadmap ownership, stakeholder alignment, experimentation, and analytics. A tailored resume should surface relevant achievements in those areas before unrelated responsibilities.",
        ],
      },
      {
        heading: "Translate experience into evidence",
        paragraphs: [
          "Recruiters scan for role, organization, dates, scope, and outcomes. Preserve that structure and strengthen the bullets underneath it with measurable or observable impact.",
        ],
        bullets: [
          "Lead with the action and business problem.",
          "Include scale, result, or decision impact where supported.",
          "Use terminology from the role only when it truthfully describes your work.",
        ],
      },
      {
        heading: "Use private tools responsibly",
        paragraphs: [
          "ISEYA supports role-specific preparation inside a private career workspace. Assistance can help organize material and identify alignment gaps, but candidates should review every statement and never submit invented outcomes.",
        ],
      },
    ],
    faq: [
      {
        question: "Should every application use a different resume?",
        answer:
          "Use a reliable master resume, then emphasize the most relevant accurate experience for each meaningful opportunity.",
      },
      {
        question: "Does tailoring mean adding more keywords?",
        answer:
          "No. Keywords help clarify relevance only when the underlying experience genuinely supports them.",
      },
    ],
    relatedLinks: [
      { label: "Explore resume optimization", href: "/guides/resume-optimization" },
      { label: "Browse opportunities", href: "/jobs" },
      { label: "View candidate demo", href: "/demo/candidate" },
    ],
  },
  {
    slug: "what-recruiters-look-for-in-structured-applications",
    category: "Recruiter insights",
    title: "What recruiters look for in structured applications",
    description:
      "Why clear evidence, source transparency, and organized review workflows matter in early applicant screening.",
    publishedOn: "2026-05-26",
    readingTime: "5 min read",
    audience: "Recruiters and candidates",
    sections: [
      {
        heading: "Readable evidence reduces review friction",
        paragraphs: [
          "Recruiter review is faster when applications present a clear professional summary, relevant skills, chronological experience, and role-aligned achievements. The goal is not decoration; it is decision-ready clarity.",
        ],
      },
      {
        heading: "Status workflows support fairer operations",
        paragraphs: [
          "A structured applicant queue lets hiring teams record reviewing, proceed, and rejected outcomes per application rather than losing decisions across scattered communication. Candidates also benefit when progress is understandable.",
        ],
      },
      {
        heading: "Trust requires source context",
        paragraphs: [
          "Candidates should be able to distinguish verified recruiter postings, direct employer roles, and curated external opportunities. Clear sourcing improves confidence without making claims about hiring outcomes.",
        ],
      },
    ],
    faq: [
      {
        question: "Does ISEYA make applicant profiles public?",
        answer: "No. Candidate career materials and applications are designed for private, authorized workflows.",
      },
      {
        question: "Why verify recruiter activity?",
        answer: "Verification and moderation help candidates interpret the trust context of native listings.",
      },
    ],
    relatedLinks: [
      { label: "Recruiter access", href: "/recruiters" },
      { label: "Recruiter hiring tools guide", href: "/guides/recruiter-hiring-tools" },
      { label: "Explore recruiter demo", href: "/demo/recruiter" },
    ],
  },
  {
    slug: "student-career-readiness-without-public-profiles",
    category: "Student career positioning",
    title: "Student career readiness without public profiles",
    description:
      "How private career preparation can support students and graduates while protecting personal materials.",
    publishedOn: "2026-05-26",
    readingTime: "4 min read",
    audience: "Students and career programs",
    sections: [
      {
        heading: "Readiness is more than a public identity",
        paragraphs: [
          "Students can improve professional summaries, resumes, application materials, and interview preparation without publishing their personal documents or building a public social presence.",
        ],
      },
      {
        heading: "Build evidence progressively",
        paragraphs: [
          "Career preparation becomes more usable when students capture coursework, projects, employment, leadership, and measurable contributions in a consistent workspace before an opportunity appears.",
        ],
      },
      {
        heading: "Institution support with privacy boundaries",
        paragraphs: [
          "Institution partnerships can help provide access and observe aggregate readiness signals while individual student documents remain private. This distinction supports trust for both learners and administrators.",
        ],
      },
    ],
    faq: [
      {
        question: "Do students need a public candidate page?",
        answer: "No. ISEYA is structured around private candidate workspaces and controlled application activity.",
      },
      {
        question: "Can an institution see individual resumes?",
        answer: "Institution insight is designed to remain aggregate rather than exposing private student materials.",
      },
    ],
    relatedLinks: [
      { label: "Student employability guide", href: "/guides/student-employability" },
      { label: "Institution partnerships", href: "/institutions" },
      { label: "View candidate experience", href: "/demo/candidate" },
    ],
  },
  {
    slug: "privacy-safe-employability-insights-for-institutions",
    category: "Institution employability trends",
    title: "Privacy-safe employability insight for institutions",
    description:
      "A practical model for understanding aggregate career activity without exposing student documents or applications.",
    publishedOn: "2026-05-26",
    readingTime: "5 min read",
    audience: "Universities and workforce programs",
    sections: [
      {
        heading: "Measure progress at the program level",
        paragraphs: [
          "Career centers and workforce programs need insight into access use, readiness participation, application activity, and recruiter engagement. Those questions can be addressed through aggregated indicators.",
        ],
      },
      {
        heading: "Preserve individual boundaries",
        paragraphs: [
          "Aggregate reporting should not become access to resumes, cover letters, application notes, or candidate documents. Explicit privacy boundaries allow institutions to support outcomes without becoming hiring reviewers.",
        ],
      },
      {
        heading: "Build procurement-ready trust",
        paragraphs: [
          "Institution access is stronger when domains, seat capacity, approval status, and reporting boundaries are defined clearly during partnership review.",
        ],
      },
    ],
    faq: [
      {
        question: "What can institution insight show?",
        answer:
          "It can show aggregate participation and readiness activity without identifying private candidate materials.",
      },
      {
        question: "Is institution access an instant checkout product?",
        answer: "No. ISEYA positions institution partnerships for manual review and structured access planning.",
      },
    ],
    relatedLinks: [
      { label: "University employability infrastructure", href: "/guides/university-employability-infrastructure" },
      { label: "Request institution partnership", href: "/institutions" },
      { label: "Institution demo", href: "/demo/institution" },
    ],
  },
  {
    slug: "interview-preparation-from-a-job-description",
    category: "Interview preparation",
    title: "Interview preparation that starts with the job description",
    description:
      "Turn role requirements into evidence-based interview preparation without rehearsing generic answers.",
    publishedOn: "2026-05-26",
    readingTime: "4 min read",
    audience: "Candidates and career switchers",
    sections: [
      {
        heading: "Extract the decisions behind the role",
        paragraphs: [
          "A job description reveals the problems a new hire is expected to handle. Group requirements into capabilities such as stakeholder management, analysis, execution, leadership, or technical fluency.",
        ],
      },
      {
        heading: "Prepare evidence, not slogans",
        paragraphs: [
          "For each capability, choose a truthful example that explains the situation, your action, the constraint, and the result. A smaller real example is stronger than a broad unsupported claim.",
        ],
      },
      {
        heading: "Align application and interview material",
        paragraphs: [
          "Your resume and interview examples should reinforce the same professional positioning. Reviewing them together makes gaps visible before a conversation with a recruiter.",
        ],
      },
    ],
    faq: [
      {
        question: "Should interview examples repeat resume bullets exactly?",
        answer: "They should be consistent, but interviews provide space for context, decisions, and learning.",
      },
    ],
    relatedLinks: [
      { label: "Interview preparation guide", href: "/guides/interview-preparation" },
      { label: "Discover opportunities", href: "/jobs" },
    ],
  },
  {
    slug: "responsible-ai-assisted-career-positioning",
    category: "Responsible AI assistance",
    title: "Responsible AI-assisted career positioning",
    description:
      "How candidates can use assisted career tools to improve clarity while keeping applications truthful and personal.",
    publishedOn: "2026-05-26",
    readingTime: "4 min read",
    audience: "Candidates and institutions",
    sections: [
      {
        heading: "Assistance should improve clarity",
        paragraphs: [
          "Career assistance is useful when it helps identify relevant evidence, improve structure, and strengthen readable language. It should not manufacture credentials, outcomes, or experiences.",
        ],
      },
      {
        heading: "Candidates remain the final reviewer",
        paragraphs: [
          "Before exporting or submitting any material, candidates should verify names, dates, claims, metrics, skills, and role fit. Truthful positioning protects candidates and employers alike.",
        ],
      },
      {
        heading: "Trust is a platform design decision",
        paragraphs: [
          "Private workspaces, source-transparent opportunities, and recruiter verification provide a stronger foundation than high-volume automated applications.",
        ],
      },
    ],
    faq: [
      {
        question: "Does assistance guarantee an interview?",
        answer: "No. Career tools can improve preparation, but employers make independent hiring decisions.",
      },
      {
        question: "Should generated suggestions be reviewed?",
        answer: "Yes. Every application statement should be accurate and approved by the candidate.",
      },
    ],
    relatedLinks: [
      { label: "AI resume assistance guide", href: "/guides/ai-resume-assistance" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Career workspace demo", href: "/demo/candidate" },
    ],
  },
  {
    slug: "source-transparent-opportunity-discovery",
    category: "Hiring trends",
    title: "Why source-transparent opportunity discovery matters",
    description:
      "Understand the difference between curated, recruiter-posted, verified recruiter, and direct employer opportunities.",
    publishedOn: "2026-05-26",
    readingTime: "4 min read",
    audience: "Candidates and recruiters",
    sections: [
      {
        heading: "Opportunity source changes the application path",
        paragraphs: [
          "Some jobs are sourced from external hiring channels and send candidates to an employer application page. Other roles are posted directly within ISEYA and support native application workflows.",
        ],
      },
      {
        heading: "Trust should be visible before action",
        paragraphs: [
          "Source badges allow candidates to understand whether a role is curated, recruiter-posted, verified, or direct employer-posted before tailoring materials or applying.",
        ],
      },
      {
        heading: "Preparation remains relevant across sources",
        paragraphs: [
          "Regardless of application path, candidates benefit from understanding the role and preparing accurate, aligned career materials before they apply.",
        ],
      },
    ],
    faq: [
      {
        question: "What is a curated opportunity?",
        answer: "It is an external opportunity reviewed for discovery and linked to its application source.",
      },
      {
        question: "Do all listings support native applications?",
        answer: "No. External opportunities direct candidates to the relevant hiring source.",
      },
    ],
    relatedLinks: [
      { label: "Browse source-transparent jobs", href: "/jobs" },
      { label: "Career visibility guide", href: "/guides/career-visibility" },
      { label: "Recruiter platform", href: "/recruiters" },
    ],
  },
];

export const seoGuides: SeoGuide[] = [
  {
    slug: "resume-optimization",
    eyebrow: "Career Asset Guide",
    title: "Resume optimization for role-specific applications",
    description:
      "Build an accurate, recruiter-readable resume that aligns evidence with a target role and remains ATS-friendly.",
    audience: "Candidates, students, and career switchers",
    sections: [
      {
        heading: "A structured resume improves decision-making",
        paragraphs: [
          "Resume optimization should make relevant evidence easier to understand: a clear summary, focused skills, chronological experience, projects, education, and certifications where applicable.",
        ],
      },
      {
        heading: "Tailoring is alignment, not invention",
        paragraphs: [
          "Use the job description to prioritize accurate evidence and language. Preserve truthful dates, employers, achievements, and capabilities while making fit easier to evaluate.",
        ],
        bullets: ["Identify target responsibilities.", "Select supported evidence.", "Review every final statement before applying."],
      },
    ],
    faq: [
      { question: "Can I start with a free workspace?", answer: "ISEYA provides an entry point for building and organizing career materials before selecting paid workflows." },
      { question: "Will optimization guarantee results?", answer: "No. It supports clearer preparation; hiring decisions remain with employers." },
    ],
    relatedLinks: [
      { label: "Start career assets", href: "/workspace" },
      { label: "Read the tailoring insight", href: "/insights/tailoring-a-resume-for-a-specific-opportunity" },
      { label: "View plans", href: "/pricing" },
    ],
  },
  {
    slug: "ats-resume-checker",
    eyebrow: "Readiness Guide",
    title: "ATS resume checking and readable career materials",
    description:
      "Understand ATS-focused preparation while keeping your resume structured, readable, and accurate for human recruiters.",
    audience: "Active job seekers",
    sections: [
      {
        heading: "Readable structure remains foundational",
        paragraphs: [
          "Clear section headings, conventional experience chronology, understandable skill language, and consistent formatting support both automated processing and human review.",
        ],
      },
      {
        heading: "Use role terms with evidence",
        paragraphs: [
          "Matching a role is not achieved by adding disconnected terms. Relevant keywords should appear where your summary, skills, or achievements genuinely establish capability.",
        ],
      },
    ],
    faq: [
      { question: "Is an ATS score a hiring decision?", answer: "No. It is a preparation signal and cannot predict recruiter or employer decisions." },
      { question: "Should formatting remain simple?", answer: "Professional, consistent, scannable formatting is generally safer for career documents." },
    ],
    relatedLinks: [
      { label: "Explore candidate demo", href: "/demo/candidate" },
      { label: "Resume optimization guide", href: "/guides/resume-optimization" },
    ],
  },
  {
    slug: "recruiter-hiring-tools",
    eyebrow: "Recruiter Guide",
    title: "Recruiter hiring tools for structured applicant review",
    description:
      "Manage opportunity publishing and candidate review in a private recruiter workflow with visible trust context.",
    audience: "Recruiters and hiring teams",
    sections: [
      {
        heading: "Organize job and applicant activity",
        paragraphs: [
          "A recruiter workspace should support drafted and published listings, applicant review by job, and individual decision status without mixing unrelated candidates or opportunities.",
        ],
      },
      {
        heading: "Visibility and verification support trust",
        paragraphs: [
          "Candidates make better decisions when recruiter verification and opportunity source are clearly represented. Structured moderation helps protect the quality of public listings.",
        ],
      },
    ],
    faq: [
      { question: "Are recruiter applicant notes public?", answer: "No. Internal recruiter review information is intended for authorized workflows." },
      { question: "Can recruiters explore the workflow first?", answer: "The recruiter demo illustrates the experience using sample information only." },
    ],
    relatedLinks: [
      { label: "Request recruiter access", href: "/recruiters" },
      { label: "Recruiter demo", href: "/demo/recruiter" },
      { label: "Recruiter insight", href: "/insights/what-recruiters-look-for-in-structured-applications" },
    ],
  },
  {
    slug: "student-employability",
    eyebrow: "Student Readiness Guide",
    title: "Student employability through private career preparation",
    description:
      "Support student and graduate career readiness with structured materials, opportunity access, and private workspaces.",
    audience: "Students, graduates, and career programs",
    sections: [
      {
        heading: "Turn early experience into professional evidence",
        paragraphs: [
          "Projects, campus leadership, internships, volunteering, and employment can become useful career evidence when written with context, skills, and outcomes.",
        ],
      },
      {
        heading: "Keep preparation private and purposeful",
        paragraphs: [
          "Students should be able to develop career assets and track opportunities without being required to create a public profile or expose private documents.",
        ],
      },
    ],
    faq: [
      { question: "Can graduates participate?", answer: "Institution and candidate pathways can be relevant to students, graduates, and approved program participants." },
      { question: "Are materials shared publicly?", answer: "ISEYA is positioned around private career workspaces and controlled application actions." },
    ],
    relatedLinks: [
      { label: "Candidate demo", href: "/demo/candidate" },
      { label: "Institution access", href: "/institutions" },
      { label: "Readiness insight", href: "/insights/student-career-readiness-without-public-profiles" },
    ],
  },
  {
    slug: "career-visibility",
    eyebrow: "Career Positioning Guide",
    title: "Career visibility built on accurate professional positioning",
    description:
      "Clarify your role direction, evidence, and opportunity fit without relying on a public social candidate profile.",
    audience: "Candidates and career switchers",
    sections: [
      {
        heading: "Visibility begins with relevance",
        paragraphs: [
          "Career visibility means employers can understand the problems you can solve. Focused summaries, credible achievements, and role-aligned materials make that signal clearer.",
        ],
      },
      {
        heading: "Opportunity discovery benefits from transparency",
        paragraphs: [
          "Knowing whether a role is sourced externally or posted through a verified hiring workflow helps candidates choose how to prepare and apply.",
        ],
      },
    ],
    faq: [
      { question: "Does career visibility require public publishing?", answer: "No. Candidates can prepare and apply through private workflows." },
    ],
    relatedLinks: [
      { label: "Browse jobs", href: "/jobs" },
      { label: "Opportunity source insight", href: "/insights/source-transparent-opportunity-discovery" },
    ],
  },
  {
    slug: "ai-resume-assistance",
    eyebrow: "Responsible Assistance Guide",
    title: "AI-assisted resume preparation with candidate accountability",
    description:
      "Use assisted career preparation to improve clarity and alignment while keeping professional claims truthful.",
    audience: "Candidates and career educators",
    sections: [
      {
        heading: "Use assistance as an editorial tool",
        paragraphs: [
          "Assisted tools can suggest clearer structure and identify possible role alignment. They should not replace candidate judgment or create unsupported experience.",
        ],
      },
      {
        heading: "Review before every application",
        paragraphs: [
          "Candidates should validate role titles, employer names, dates, metrics, certifications, and claims before using any final career document.",
        ],
      },
    ],
    faq: [
      { question: "Is assisted output automatically accurate?", answer: "No. Candidates must review and approve the accuracy of their materials." },
      { question: "Does ISEYA support spam applications?", answer: "ISEYA is positioned for purposeful preparation and trusted opportunity workflows, not automated spam." },
    ],
    relatedLinks: [
      { label: "Responsible assistance insight", href: "/insights/responsible-ai-assisted-career-positioning" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
  {
    slug: "interview-preparation",
    eyebrow: "Interview Guide",
    title: "Interview preparation aligned to real opportunities",
    description:
      "Prepare evidence-led interview stories from a role description and your verified career experience.",
    audience: "Candidates and career switchers",
    sections: [
      {
        heading: "Prepare against required capabilities",
        paragraphs: [
          "Extract the employer's stated needs, then match each major capability with a truthful example that shows your actions, constraints, and outcomes.",
        ],
      },
      {
        heading: "Maintain consistency with your materials",
        paragraphs: [
          "Interview examples should extend the evidence already shown in your resume rather than introduce claims you cannot support.",
        ],
      },
    ],
    faq: [
      { question: "What if I lack a requested skill?", answer: "Identify adjacent evidence honestly and be clear about learning or transferability." },
    ],
    relatedLinks: [
      { label: "Read interview insight", href: "/insights/interview-preparation-from-a-job-description" },
      { label: "Browse roles", href: "/jobs" },
    ],
  },
  {
    slug: "university-employability-infrastructure",
    eyebrow: "Institution Guide",
    title: "University employability infrastructure with privacy-safe insight",
    description:
      "Support student career readiness and aggregate outcome visibility through reviewed institution access.",
    audience: "Universities, colleges, bootcamps, and workforce programs",
    sections: [
      {
        heading: "Career systems for student communities",
        paragraphs: [
          "Institution partnerships can support domain-based access to private career preparation while helping programs understand aggregate engagement and readiness signals.",
        ],
      },
      {
        heading: "Privacy belongs in the architecture",
        paragraphs: [
          "Institution reporting should be aggregate-only: individual resumes, application details, files, and private notes remain outside institution analytics views.",
        ],
      },
    ],
    faq: [
      { question: "Is pricing publicly fixed for institutions?", answer: "No. Institution access is reviewed and packages are assigned manually based on partnership requirements." },
      { question: "Can institutions inspect student resumes?", answer: "Institution insight is designed for aggregate readiness, not private candidate material access." },
    ],
    relatedLinks: [
      { label: "Request partnership", href: "/institutions" },
      { label: "Institution demo", href: "/demo/institution" },
      { label: "Privacy-safe insight article", href: "/insights/privacy-safe-employability-insights-for-institutions" },
    ],
  },
];

export function findInsightArticle(slug: string) {
  return insightArticles.find((article) => article.slug === slug);
}

export function findSeoGuide(slug: string) {
  return seoGuides.find((guide) => guide.slug === slug);
}
