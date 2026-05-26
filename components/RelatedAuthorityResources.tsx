import Link from "next/link";

type RelatedResourcesContext = "jobs" | "pricing" | "recruiters" | "institutions";

const relatedResources = {
  jobs: {
    eyebrow: "Candidate Preparation",
    copy: "Prepare for opportunities with clear sourcing, accurate career materials, and a private application workflow.",
    links: [
      {
        kind: "Guide",
        title: "Resume optimization for role-specific applications",
        copy: "Align evidence and keywords to a published opportunity without overstating experience.",
        href: "/guides/resume-optimization",
      },
      {
        kind: "Insight",
        title: "Why source-transparent opportunity discovery matters",
        copy: "Understand curated, recruiter-posted, verified, and direct employer opportunities.",
        href: "/insights/source-transparent-opportunity-discovery",
      },
    ],
  },
  pricing: {
    eyebrow: "Plan Guidance",
    copy: "Compare candidate access alongside practical guidance for structured, recruiter-readable career materials.",
    links: [
      {
        kind: "Guide",
        title: "ATS resume checker workflows",
        copy: "Learn how structured review supports active application preparation.",
        href: "/guides/ats-resume-checker",
      },
      {
        kind: "Insight",
        title: "Tailoring a resume for a specific opportunity",
        copy: "See how targeted preparation connects career assets to an actual role.",
        href: "/insights/tailoring-a-resume-for-a-specific-opportunity",
      },
    ],
  },
  recruiters: {
    eyebrow: "Hiring Workflow",
    copy: "Explore structured review practices and secure recruiter infrastructure built for credible hiring activity.",
    links: [
      {
        kind: "Guide",
        title: "Recruiter hiring tools and structured review",
        copy: "Understand verified posting, applicant review, and private recruiter workflows.",
        href: "/guides/recruiter-hiring-tools",
      },
      {
        kind: "Insight",
        title: "What recruiters look for in structured applications",
        copy: "Review the evidence and clarity that support sound applicant decisions.",
        href: "/insights/what-recruiters-look-for-in-structured-applications",
      },
    ],
  },
  institutions: {
    eyebrow: "Institution Readiness",
    copy: "Support student communities through institution-ready career infrastructure and privacy-safe aggregate insight.",
    links: [
      {
        kind: "Guide",
        title: "University employability infrastructure",
        copy: "Explore access, readiness pathways, and aggregate reporting boundaries.",
        href: "/guides/university-employability-infrastructure",
      },
      {
        kind: "Insight",
        title: "Privacy-safe employability insights for institutions",
        copy: "Understand how outcomes can be assessed without exposing private student materials.",
        href: "/insights/privacy-safe-employability-insights-for-institutions",
      },
    ],
  },
} satisfies Record<
  RelatedResourcesContext,
  {
    eyebrow: string;
    copy: string;
    links: Array<{ kind: string; title: string; copy: string; href: string }>;
  }
>;

export default function RelatedAuthorityResources({
  context,
  maxWidth = "max-w-[92rem]",
}: {
  context: RelatedResourcesContext;
  maxWidth?: string;
}) {
  const resources = relatedResources[context];
  const headingId = `related-resources-${context}`;

  return (
    <section aria-labelledby={headingId} className={`mx-auto ${maxWidth} px-5 pb-10 sm:px-8`}>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
          {resources.eyebrow}
        </p>
        <h2 id={headingId} className="mt-3 text-xl font-semibold text-[var(--iseya-navy)] sm:text-2xl">
          Related guides and insights
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{resources.copy}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {resources.links.map((resource) => (
            <Link
              key={resource.href}
              href={resource.href}
              className="group rounded-xl border border-slate-200 bg-slate-50/45 p-4 transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                {resource.kind}
              </p>
              <h3 className="mt-2 font-semibold text-[var(--iseya-navy)]">{resource.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{resource.copy}</p>
              <span className="mt-3 inline-flex text-sm font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
                Read {resource.kind}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
