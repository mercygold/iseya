import type { Metadata } from "next";
import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import { publicPageMetadata } from "@/lib/seo";
import { demoCard, demoLabel, demoPrimaryButton, demoSecondaryButton } from "./DemoShell";

export const metadata: Metadata = publicPageMetadata(
  "/demo",
  "Interactive Demo | ISEYA",
  "Explore sample candidate, recruiter, and institution workflows in the ISEYA career infrastructure platform.",
);

const pathways = [
  {
    label: "Candidate Demo",
    title: "Private career workspace",
    copy: "See how a candidate prepares career assets, finds opportunities, and tracks outcomes.",
    href: "/demo/candidate",
    cta: "Explore Candidate Demo",
    eventName: "demo_opened" as const,
  },
  {
    label: "Recruiter Demo",
    title: "Verified hiring workflow",
    copy: "See job management, grouped applicants, review status, and private recruiter notes.",
    href: "/demo/recruiter",
    cta: "Explore Recruiter Demo",
    eventName: "recruiter_demo_opened" as const,
  },
  {
    label: "Institution Demo",
    title: "Aggregate readiness insight",
    copy: "See privacy-safe program intelligence, seat use, and career engagement outcomes.",
    href: "/demo/institution",
    cta: "Explore Institution Demo",
    eventName: "institution_demo_opened" as const,
  },
];

const flow = [
  "Students build career assets",
  "Recruiters post verified opportunities",
  "Candidates express interest",
  "Recruiters review applicants",
  "Institutions view aggregate career readiness insights",
];

export default function DemoPage() {
  return (
    <>
      <section className="mx-auto max-w-[84rem] px-5 py-7 sm:px-8 sm:py-9">
        <div className="max-w-4xl">
          <p className={demoLabel}>ISEYA Demo</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--iseya-navy)] sm:text-5xl">
            Explore the ISEYA career infrastructure experience.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            See how candidates, recruiters, and institutions connect through structured, privacy-safe workflows.
          </p>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Guided demo &middot; Sample information only &middot; No account required
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {pathways.map((pathway) => (
            <article key={pathway.label} className={`${demoCard} flex flex-col`}>
              <p className={demoLabel}>{pathway.label}</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">{pathway.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{pathway.copy}</p>
              <TrackedLink
                href={pathway.href}
                eventName={pathway.eventName}
                eventParameters={{ source: "demo_overview" }}
                className={`${demoPrimaryButton} mt-5`}
              >
                {pathway.cta}
              </TrackedLink>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[84rem] px-5 pb-9 sm:px-8">
        <article className={`${demoCard} border-[var(--iseya-gold)]/40`}>
          <p className={demoLabel}>Platform Journey</p>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {flow.map((step, index) => (
              <div key={step} className="relative rounded-md border border-slate-100 bg-[var(--iseya-soft-bg)] p-3.5">
                <p className="text-xs font-bold text-[var(--iseya-gold)]">0{index + 1}</p>
                <p className="mt-1.5 text-sm font-semibold leading-5 text-[var(--iseya-navy)]">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <TrackedLink
              href="/signup"
              eventName="signup_initiated"
              eventParameters={{ source: "demo_journey" }}
              className={demoPrimaryButton}
            >
              Start Free
            </TrackedLink>
            <Link href="/institutions" className={demoSecondaryButton}>Request Partnership</Link>
          </div>
        </article>
      </section>
      <section className="mx-auto max-w-[84rem] px-5 pb-10 sm:px-8">
        <article className={demoCard}>
          <p className={demoLabel}>How the demo works</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
            Explore workflows without creating platform records
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            The candidate, recruiter, and institution demos present sample information
            only. They illustrate private career asset preparation, structured applicant
            review, and privacy-safe institution insight without using real applicants,
            seats, job posts, or private documents.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/demo/candidate" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
              Candidate Experience
            </Link>
            <Link href="/demo/recruiter" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
              Recruiter Experience
            </Link>
            <Link href="/demo/institution" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
              Institution Experience
            </Link>
          </div>
        </article>
      </section>
    </>
  );
}
