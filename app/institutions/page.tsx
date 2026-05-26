import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PublicTrustFooter from "@/components/PublicTrustFooter";
import RelatedAuthorityResources from "@/components/RelatedAuthorityResources";
import StructuredData from "@/components/StructuredData";
import TrackedLink from "@/components/TrackedLink";
import { faqStructuredData, publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata(
  "/institutions",
  "Institution Career Readiness Infrastructure | ISEYA",
  "Support student career readiness with private career tools, verified opportunities, and aggregate institution insight.",
);

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-gold)] bg-[var(--iseya-gold)] px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-white hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 bg-transparent px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]";
const navigationLink =
  "rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]";

export default function InstitutionsPage() {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <StructuredData
        data={faqStructuredData([
          {
            question: "Is institution access self-serve?",
            answer: "No. Partnership requests are reviewed and access packages are assigned directly.",
          },
          {
            question: "What insights are available?",
            answer: "Institution reporting is designed for aggregate readiness and engagement insight.",
          },
          {
            question: "Are student materials visible to institutions?",
            answer: "No. Private career assets remain protected from institution-level reporting views.",
          },
        ])}
      />
      <section className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-7 px-5 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Link href="/" aria-label="ISEYA homepage" className="inline-flex items-center">
              <Image src="/brand/iseya-logo2.png" alt="ISEYA" width={260} height={130} priority className="h-auto w-[170px] object-contain sm:w-[240px]" />
            </Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              Institution Access
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Career readiness infrastructure for institutions.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/82">
              Equip students and participants with private career tools, trusted opportunities, and aggregate readiness insight.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackedLink href="/institutions/signup" eventName="request_access_clicked" eventParameters={{ audience: "institution", source: "institutions_hero" }} className={`${primaryButton} w-full sm:w-auto`}>
                Request Institution Partnership
              </TrackedLink>
              <TrackedLink href="/institutions/access" eventName="institution_cta_clicked" eventParameters={{ cta: "student_access", source: "institutions_hero" }} className={`${secondaryButton} w-full sm:w-auto`}>
                Access through my institution
              </TrackedLink>
            </div>
            <p className="mt-4 text-xs font-medium leading-6 text-white/72">
              Reviewed partnerships &middot; Domain-based access &middot; Aggregate-only institution insight
            </p>
          </div>
          <nav aria-label="Public navigation" className="flex flex-wrap gap-4 text-sm font-semibold text-white/80 lg:justify-end">
            <Link className={navigationLink} href="/">For Candidates</Link>
            <Link className={navigationLink} href="/recruiters">For Recruiters</Link>
            <Link className={navigationLink} href="/jobs">Jobs</Link>
            <Link className={navigationLink} href="/demo">Demo</Link>
            <Link className={navigationLink} href="/pricing">Pricing</Link>
            <Link className={navigationLink} href="/login">Sign In</Link>
          </nav>
        </div>
      </section>
      <section className="mx-auto grid max-w-[92rem] gap-5 px-5 pt-10 sm:px-8 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Institution Admin</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">Partnership access for programs</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Universities, colleges, bootcamps, workforce programs, and career centers can request managed student and participant access.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Packages are assigned after review. Contracting and payment are handled directly with ISEYA; public checkout is not used for institution access.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <TrackedLink href="/institutions/signup" eventName="request_access_clicked" eventParameters={{ audience: "institution", source: "institution_admin_card" }} className={`${primaryButton} w-full sm:w-auto`}>
              Request Institution Partnership
            </TrackedLink>
            <Link href="/login?redirectedFrom=/institutions/dashboard" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-bold text-[var(--iseya-navy)] transition hover:text-[var(--iseya-gold)] sm:w-auto">
              Institution Admin Sign In
            </Link>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Student / Participant</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">Access covered by your institution</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Students, graduates, and program participants can connect an eligible institution email to their private ISEYA workspace.
          </p>
          <TrackedLink href="/institutions/access" eventName="institution_cta_clicked" eventParameters={{ cta: "student_access", source: "student_access_card" }} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] sm:w-auto">
            Access through my institution
          </TrackedLink>
        </article>
      </section>
      <section className="mx-auto grid max-w-[92rem] gap-5 px-5 py-10 sm:px-8 lg:grid-cols-3">
        {[
          ["Domain-based access", "Prepare student access through approved institution email domains without public candidate profiles."],
          ["Career readiness", "Support structured resumes, applications, and career materials through private student workspaces."],
          ["Verified opportunity access", "Connect students and participants to published roles while protecting private career materials."],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">ISEYA</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--iseya-navy)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto grid max-w-[92rem] gap-5 px-5 pb-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Institution Partnership</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
            Career infrastructure for student communities
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            ISEYA supports universities, colleges, bootcamps, workforce development
            programs, and career centers seeking a structured pathway for student and
            participant career readiness.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Approved institutions can support access through eligible email domains and
            view aggregate employability insight without accessing private candidate
            resumes, documents, or individual application details.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <TrackedLink href="/demo/institution" eventName="institution_demo_opened" eventParameters={{ source: "institution_partnership" }} className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
              View Institution Demo
            </TrackedLink>
            <Link href="/contact" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
              Contact ISEYA
            </Link>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Institution FAQ</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--iseya-navy)]">Partnership questions</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <div>
              <h3 className="font-semibold text-[var(--iseya-navy)]">Is institution access self-serve?</h3>
              <p>No. Partnership requests are reviewed and access packages are assigned directly.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--iseya-navy)]">What insights are available?</h3>
              <p>Institution reporting is designed for aggregate readiness and engagement insight.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--iseya-navy)]">Are student materials visible to institutions?</h3>
              <p>No. Private career assets remain protected from institution-level reporting views.</p>
            </div>
          </div>
        </article>
      </section>
      <RelatedAuthorityResources context="institutions" />
      <PublicTrustFooter />
    </main>
  );
}
