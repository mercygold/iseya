import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PublicTrustFooter from "@/components/PublicTrustFooter";
import TrackedLink from "@/components/TrackedLink";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata(
  "/recruiters",
  "Recruiter Platform | ISEYA",
  "Post opportunities, review structured applications, and connect with career-ready talent through ISEYA.",
);

const cardClass = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-gold)] bg-[var(--iseya-gold)] px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-white hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 bg-transparent px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]";

export default function RecruitersPage() {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-8 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/brand/iseya-logo2.png"
                alt="ISEYA"
                width={260}
                height={130}
                priority
                className="h-auto w-[170px] object-contain sm:w-[240px]"
              />
            </Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              Recruiter access
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Post jobs and discover career-ready talent.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/82">
              ISEYA helps recruiters connect with candidates who have structured
              career profiles, optimized career assets, and clearer role-fit signals.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Company verification and moderated publishing support a protected
              opportunity ecosystem for candidates and hiring teams.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackedLink href="/recruiters/signup" eventName="request_access_clicked" eventParameters={{ audience: "recruiter", source: "recruiters_hero" }} className={`${primaryButton} w-full sm:w-auto`}>
                Create Recruiter Account
              </TrackedLink>
              <TrackedLink href="/recruiters/dashboard" eventName="recruiter_cta_clicked" eventParameters={{ cta: "post_a_job", source: "recruiters_hero" }} className={`${secondaryButton} w-full sm:w-auto`}>
                Access Recruiter Dashboard
              </TrackedLink>
            </div>
            <p className="mt-4 text-xs leading-6 text-white/68">
              Protected recruiter workspace. Company verification supports trusted public listings.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-white/80 lg:justify-end">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/">
              For Candidates
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/jobs">
              Jobs
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/institutions">
              For Institutions
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/demo">
              Demo
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/pricing">
              Pricing
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/login?redirectedFrom=/recruiters/dashboard">
              Sign In
            </Link>
          </nav>
        </div>
      </section>

      <section className="mx-auto grid max-w-[92rem] gap-5 px-5 py-10 sm:px-8 lg:grid-cols-3">
        {[
          [
            "Structured candidate signals",
            "Review applicants with stronger career profiles, clearer career assets, and more role-fit context.",
          ],
          [
            "Recruiter job posting",
            "Create drafts, submit jobs for review, and manage closed listings from one focused recruiter workspace.",
          ],
          [
            "Career infrastructure",
            "Connect job demand with candidate readiness across resumes, LinkedIn, cover letters, and application materials.",
          ],
        ].map(([title, copy]) => (
          <div key={title} className={cardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              ISEYA
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--iseya-navy)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-[92rem] gap-5 px-5 pb-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <article className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Recruiter Workflow
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
            A private dashboard for verified hiring activity
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Recruiters can manage job drafts, submit listings for review, monitor active
            job visibility, and review applicants within an organization-scoped dashboard.
            Verified recruiter workflows help candidates distinguish trusted native listings
            from externally sourced opportunities.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Recruiter access is structured around active job capacity and listing duration,
            while applicant management remains available within the recruiter workspace.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/recruiters/pricing" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
              View Recruiter Plans
            </Link>
            <TrackedLink href="/demo/recruiter" eventName="recruiter_demo_opened" eventParameters={{ source: "recruiters_workflow" }} className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
              Explore Recruiter Demo
            </TrackedLink>
          </div>
        </article>
        <article className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Recruiter FAQ
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--iseya-navy)]">
            Common access questions
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <div>
              <h3 className="font-semibold text-[var(--iseya-navy)]">How are recruiter listings reviewed?</h3>
              <p>Company profiles and job submissions can be moderated before public publishing.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--iseya-navy)]">What does active job capacity mean?</h3>
              <p>Published active listings count toward plan capacity; drafts do not use active slots.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--iseya-navy)]">Are applicant records public?</h3>
              <p>No. Application review takes place within authorized recruiter workflows.</p>
            </div>
          </div>
        </article>
      </section>
      <PublicTrustFooter />
    </main>
  );
}
