import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorityCta, AuthorityPageShell, Breadcrumbs } from "@/components/AuthorityPageShell";
import StructuredData from "@/components/StructuredData";
import { findInsightArticle, insightArticles } from "@/lib/authorityContent";
import {
  articleStructuredData,
  breadcrumbStructuredData,
  faqStructuredData,
  publicPageMetadata,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return insightArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = findInsightArticle(slug);

  if (!article) {
    return {};
  }

  return publicPageMetadata(
    `/insights/${article.slug}`,
    `${article.title} | ISEYA Insights`,
    article.description,
    { type: "article", publishedTime: article.publishedOn },
  );
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = findInsightArticle(slug);

  if (!article) {
    notFound();
  }

  const path = `/insights/${article.slug}`;

  return (
    <AuthorityPageShell>
      <StructuredData
        data={[
          breadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: "Insights", path: "/insights" },
            { name: article.title, path },
          ]),
          articleStructuredData({
            path,
            title: article.title,
            description: article.description,
            publishedOn: article.publishedOn,
          }),
          faqStructuredData(article.faq),
        ]}
      />
      <article className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Insights", href: "/insights" },
            { label: article.title },
          ]}
        />
        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            {article.category}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">{article.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-500">
            <time dateTime={article.publishedOn}>Published May 26, 2026</time>
            <span>{article.readingTime}</span>
            <span>{article.audience}</span>
          </div>
        </header>

        <div className="space-y-9 py-9">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets ? (
                <ul className="mt-4 space-y-2 pl-5 text-base leading-7 text-slate-700">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="list-disc pl-1">
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">Questions to consider</h2>
          <div className="mt-5 space-y-5">
            {article.faq.map((item) => (
              <div key={item.question}>
                <h3 className="font-semibold text-[var(--iseya-navy)]">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--iseya-navy)]">Related pathways</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            {article.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-8">
          <AuthorityCta
            title="Prepare for real opportunities"
            copy="Build career assets privately, understand opportunity sources, and choose the next action that matches your goals."
            links={[
              { label: "Browse Jobs", href: "/jobs", primary: true },
              { label: "Explore Demo", href: "/demo" },
            ]}
          />
        </div>
      </article>
    </AuthorityPageShell>
  );
}
