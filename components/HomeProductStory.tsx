import type { MouseEventHandler } from "react";
import Link from "next/link";

const workflowSteps = [
  {
    number: "01",
    title: "Build your career workspace",
    copy: "Create your resume, profile, portfolio, and career assets in one organized space.",
    route: "workspace",
  },
  {
    number: "02",
    title: "Discover trusted opportunities",
    copy: "Explore jobs and pathways aligned with your skills, goals, and direction.",
    route: "/jobs",
  },
  {
    number: "03",
    title: "Stay visible and ready",
    copy: "Share structured career assets with recruiters, schools, and institutions when it matters.",
    route: "workspace",
  },
] as const;

const homepageStats = [
  { value: "100+", label: "Active Jobs" },
  { value: "1K+", label: "Candidates" },
  { value: "6+", label: "Countries" },
  { value: "4.9/5", label: "Platform Direction" },
] as const;

export function HowIseyaWorks({ workspaceHref = "/workspace" }: { workspaceHref?: string }) {
  return (
    <section className="mx-auto max-w-[92rem] px-5 py-6 sm:px-8 sm:py-9">
      <div className="max-w-2xl">
        <h2 className="text-[2rem] font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-[2.65rem] sm:leading-tight">
          How ISEYA works
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Optimize ATS-ready resumes, tailor materials for each role, track applications, and use career intelligence to stay aligned with the opportunities you want.
        </p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <Link
            key={step.number}
            href={step.route === "workspace" ? workspaceHref : step.route}
            className={`group rounded-xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(0_14_47_/_0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 motion-reduce:transform-none sm:p-6 ${
              index === 1
                ? "border-[var(--iseya-gold)]/28 bg-[#FFF9EC]"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--iseya-gold)]">{step.number}</p>
            <h3 className="mt-4 text-[1.35rem] font-semibold leading-7 text-[var(--iseya-navy)] transition group-hover:text-[var(--iseya-gold)]">{step.title}</h3>
            <p className="mt-3 text-base leading-7 text-slate-600">{step.copy}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomepageStatsStrip() {
  return (
    <section className="border-y border-slate-200/70 bg-[#FCFCFA]">
      <div className="mx-auto grid max-w-[92rem] grid-cols-2 gap-x-5 gap-y-8 px-5 py-9 sm:px-8 sm:py-11 lg:grid-cols-4">
        {homepageStats.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left lg:text-center">
            <p className="text-3xl font-semibold tracking-tight text-[var(--iseya-gold)] sm:text-[2.65rem]">
              {stat.value}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[var(--iseya-navy)]/70">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalConversionCta({
  startHref,
  onStartFree,
  onExploreJobs,
}: {
  startHref: string;
  onStartFree?: MouseEventHandler<HTMLAnchorElement>;
  onExploreJobs?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <section className="mx-auto max-w-[92rem] px-5 pb-9 sm:px-8 sm:pb-12">
      <div className="rounded-xl bg-[var(--iseya-navy)] px-5 py-6 text-white shadow-[0_12px_32px_rgb(0_14_47_/_0.13)] sm:px-7 sm:py-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            Take the next step
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Start building your career workspace.
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
            Create your resume, organize your assets, and begin discovering opportunities from one place.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
          <Link
            href={startHref}
            onClick={onStartFree}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-gold)] bg-[var(--iseya-gold)] px-5 py-2 text-sm font-semibold text-[var(--iseya-navy)] transition hover:border-white hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]"
          >
            Start Free
          </Link>
          <Link
            href="/jobs"
            onClick={onExploreJobs}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/35 bg-transparent px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--iseya-gold)] hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]"
          >
            Explore Jobs
          </Link>
        </div>
      </div>
    </section>
  );
}
