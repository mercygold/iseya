import Link from "next/link";
import { demoCard, demoPrimaryButton, demoSecondaryButton } from "./DemoShell";

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
      <section className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">ISEYA Demo</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
            Explore how ISEYA connects students, institutions, and recruiters through career readiness infrastructure.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            This guided experience uses fictional, local-only sample information to demonstrate platform workflows without creating accounts, records, applications, or analytics activity.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pathways.map((pathway) => (
            <article key={pathway.label} className={`${demoCard} flex flex-col`}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">{pathway.label}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">{pathway.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{pathway.copy}</p>
              <Link href={pathway.href} className={`${demoPrimaryButton} mt-6`}>
                {pathway.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[92rem] px-5 pb-10 sm:px-8">
        <article className={`${demoCard} border-[var(--iseya-gold)]/40`}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Platform Journey</p>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {flow.map((step, index) => (
              <div key={step} className="relative rounded-xl bg-[var(--iseya-soft-bg)] p-4">
                <p className="text-xs font-bold text-[var(--iseya-gold)]">0{index + 1}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--iseya-navy)]">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup" className={demoPrimaryButton}>Start Free</Link>
            <Link href="/institutions" className={demoSecondaryButton}>Request Partnership</Link>
          </div>
        </article>
      </section>
    </>
  );
}
