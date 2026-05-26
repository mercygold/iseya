import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorityCta, AuthorityPageShell, Breadcrumbs } from "@/components/AuthorityPageShell";
import StructuredData from "@/components/StructuredData";
import { findSeoGuide, seoGuides } from "@/lib/authorityContent";
import { breadcrumbStructuredData, faqStructuredData, publicPageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return seoGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = findSeoGuide(slug);

  if (!guide) {
    return {};
  }

  return publicPageMetadata(`/guides/${guide.slug}`, `${guide.title} | ISEYA`, guide.description);
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = findSeoGuide(slug);

  if (!guide) {
    notFound();
  }

  const path = `/guides/${guide.slug}`;

  return (
    <AuthorityPageShell>
      <StructuredData
        data={[
          breadcrumbStructuredData([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path },
          ]),
          faqStructuredData(guide.faq),
        ]}
      />
      <article className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/guides" },
            { label: guide.title },
          ]}
        />
        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            {guide.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">{guide.description}</p>
          <p className="mt-5 text-sm font-medium text-slate-500">Built for {guide.audience}</p>
        </header>

        <div className="space-y-9 py-9">
          {guide.sections.map((section) => (
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
          <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">Frequently asked questions</h2>
          <div className="mt-5 space-y-5">
            {guide.faq.map((item) => (
              <div key={item.question}>
                <h3 className="font-semibold text-[var(--iseya-navy)]">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--iseya-navy)]">Continue exploring</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            {guide.relatedLinks.map((link) => (
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
            title="Explore the platform pathway"
            copy="See how private career assets, source-transparent opportunities, recruiter workflows, and institution insight connect."
            links={[
              { label: "Explore Demo", href: "/demo", primary: true },
              { label: "Read Insights", href: "/insights" },
            ]}
          />
        </div>
      </article>
    </AuthorityPageShell>
  );
}
