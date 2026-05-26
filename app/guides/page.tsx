import type { Metadata } from "next";
import Link from "next/link";
import { AuthorityCta, AuthorityPageShell, Breadcrumbs } from "@/components/AuthorityPageShell";
import StructuredData from "@/components/StructuredData";
import { seoGuides } from "@/lib/authorityContent";
import { breadcrumbStructuredData, publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata(
  "/guides",
  "Career Infrastructure Guides | ISEYA",
  "Explore ISEYA guidance for resume optimization, ATS readiness, recruiter workflows, student employability, interview preparation, and institution career infrastructure.",
);

export default function GuidesPage() {
  return (
    <AuthorityPageShell>
      <StructuredData
        data={breadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <section className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides" }]} />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          Career Infrastructure Guides
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
          Practical pathways for career readiness and trusted hiring.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
          Focused guidance for readable career assets, accountable opportunity workflows, and privacy-safe employability systems.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-12 sm:px-8 md:grid-cols-2">
        {seoGuides.map((guide) => (
          <article key={guide.slug} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              {guide.eyebrow}
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-7 text-[var(--iseya-navy)]">
              <Link className="transition hover:text-[var(--iseya-gold)]" href={`/guides/${guide.slug}`}>
                {guide.title}
              </Link>
            </h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{guide.description}</p>
            <p className="mt-4 text-xs font-medium text-slate-500">For {guide.audience}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <AuthorityCta
          title="Explore current career infrastructure insight"
          copy="Read practical perspectives on structured applications, student readiness, source transparency, and institution-safe reporting."
          links={[
            { label: "Read Insights", href: "/insights", primary: true },
            { label: "Explore Demo", href: "/demo" },
          ]}
        />
      </section>
    </AuthorityPageShell>
  );
}
