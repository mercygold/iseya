import type { MouseEventHandler } from "react";
import Link from "next/link";
import {
  Building2,
  FolderOpen,
  UsersRound,
} from "lucide-react";

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

const trustAudiences = [
  {
    title: "For candidates",
    copy: "Organize your resume, profile, career assets, and opportunity search in one workspace.",
    icon: FolderOpen,
    href: "/workspace",
  },
  {
    title: "For recruiters",
    copy: "Review clearer candidate signals and structured career assets before starting the conversation.",
    icon: UsersRound,
    href: "/recruiters",
  },
  {
    title: "For institutions",
    copy: "Support students and alumni with a more organized path from preparation to visibility.",
    icon: Building2,
    href: "/institutions",
  },
] as const;

export function HowIseyaWorks({ workspaceHref = "/workspace" }: { workspaceHref?: string }) {
  return (
    <section className="mx-auto max-w-[92rem] px-5 py-7 sm:px-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          Workflow
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-4xl">
          How ISEYA works
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Build your career foundation, discover better opportunities, and stay ready for what comes next.
        </p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <Link
            key={step.number}
            href={step.route === "workspace" ? workspaceHref : step.route}
            className={`group rounded-xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(0_14_47_/_0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 motion-reduce:transform-none ${
              index === 1
                ? "border-[var(--iseya-gold)]/28 bg-[#FFF9EC]"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--iseya-gold)]">{step.number}</p>
            <h3 className="mt-4 text-xl font-semibold leading-7 text-[var(--iseya-navy)] transition group-hover:text-[var(--iseya-gold)]">{step.title}</h3>
            <p className="mt-3 text-base leading-7 text-slate-600">{step.copy}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TrustAudienceSection() {
  return (
    <section className="mx-auto max-w-[92rem] px-5 py-9 sm:px-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          Trusted Direction
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-3xl">
          Built for serious career movement.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          ISEYA helps candidates, recruiters, and institutions work from clearer career signals - not scattered documents.
        </p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {trustAudiences.map((audience) => (
          <Link
            key={audience.title}
            href={audience.href}
            className="group rounded-xl border border-slate-200/85 bg-white p-4 shadow-[0_6px_20px_rgb(0_14_47_/_0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--iseya-gold)]/38 hover:shadow-[0_10px_25px_rgb(0_14_47_/_0.065)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 motion-reduce:transform-none sm:p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--iseya-gold)]/24 bg-[#FFF9EC] text-[var(--iseya-navy)]">
              <audience.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-[var(--iseya-navy)]">{audience.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{audience.copy}</p>
            <p className="mt-4 text-sm font-semibold text-[var(--iseya-navy)] transition group-hover:text-[var(--iseya-gold)]">
              Explore <span aria-hidden="true">&rarr;</span>
            </p>
          </Link>
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
