import type { Metadata } from "next";
import Link from "next/link";
import { AuthorityCta, AuthorityPageShell, Breadcrumbs } from "@/components/AuthorityPageShell";
import StructuredData from "@/components/StructuredData";
import { insightArticles, insightTopics, seoGuides } from "@/lib/authorityContent";
import { breadcrumbStructuredData, publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata(
  "/insights",
  "Career Insights and Employability Guidance | ISEYA",
  "Explore practical ISEYA insights on career assets, recruiter workflows, student readiness, interview preparation, and privacy-safe institution outcomes.",
);

export default function InsightsPage() {
  return (
    <AuthorityPageShell>
      <StructuredData
        data={breadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
        ])}
      />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Insights" }]} />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          ISEYA Insights
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
          Career readiness insight built for trusted opportunity systems.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          Practical guidance for candidates, recruiters, and institutions navigating
          career assets, hiring workflows, student employability, and privacy-first
          professional preparation.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">Topics covered</h2>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {insightTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">Latest insights</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {insightArticles.map((article) => (
            <article key={article.slug} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                {article.category}
              </p>
              <h2 className="mt-3 text-xl font-semibold leading-7 text-[var(--iseya-navy)]">
                <Link className="transition hover:text-[var(--iseya-gold)]" href={`/insights/${article.slug}`}>
                  {article.title}
                </Link>
              </h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{article.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                <span>{article.audience}</span>
                <span>{article.readingTime}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            Practical Guides
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
            Explore role and audience-specific guidance
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {seoGuides.slice(0, 4).map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="rounded-lg border border-slate-200 p-3.5 text-sm font-semibold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]"
              >
                {guide.title}
              </Link>
            ))}
          </div>
          <Link
            href="/guides"
            className="mt-5 inline-flex text-sm font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4"
          >
            View all career guides
          </Link>
        </article>
        <AuthorityCta
          title="See ISEYA in context"
          copy="Explore how private career preparation, recruiter access, and institution insight connect through the guided demo."
          links={[
            { label: "Explore Demo", href: "/demo", primary: true },
            { label: "Browse Jobs", href: "/jobs" },
          ]}
        />
      </section>
    </AuthorityPageShell>
  );
}
