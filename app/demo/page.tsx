import Link from "next/link";
import { demoCard, demoLabel, demoPrimaryButton, demoSecondaryButton } from "./DemoShell";

const pathways = [
  {
    label: "Candidate Demo",
    title: "Private career workspace",
    copy: "See how a candidate prepares career assets, finds opportunities, and tracks outcomes.",
    href: "/demo/candidate",
    cta: "Explore Candidate Demo",
  },
  {
    label: "Recruiter Demo",
    title: "Verified hiring workflow",
    copy: "See job management, grouped applicants, review status, and private recruiter notes.",
    href: "/demo/recruiter",
    cta: "Explore Recruiter Demo",
  },
  {
    label: "Institution Demo",
    title: "Aggregate readiness insight",
    copy: "See privacy-safe program intelligence, seat use, and career engagement outcomes.",
    href: "/demo/institution",
    cta: "Explore Institution Demo",
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
      <section className="mx-auto max-w-[84rem] px-5 py-8 sm:px-8 sm:py-10">
        <div className="max-w-4xl">
          <p className={demoLabel}>ISEYA Demo</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--iseya-navy)] sm:text-5xl">
            Explore how ISEYA connects students, institutions, and recruiters through career readiness infrastructure.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            This guided experience uses fictional, local-only sample information to demonstrate platform workflows without creating accounts, records, applications, or analytics activity.
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {pathways.map((pathway) => (
            <article key={pathway.label} className={`${demoCard} flex flex-col`}>
              <p className={demoLabel}>{pathway.label}</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">{pathway.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{pathway.copy}</p>
              <Link href={pathway.href} className={`${demoPrimaryButton} mt-5`}>
                {pathway.cta}
              </Link>
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
            <Link href="/signup" className={demoPrimaryButton}>Start Free</Link>
            <Link href="/institutions" className={demoSecondaryButton}>Request Partnership</Link>
          </div>
        </article>
      </section>
    </>
  );
}
