import type { MouseEventHandler } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  FileText,
  FolderOpen,
  UsersRound,
} from "lucide-react";

const workflowSteps = [
  {
    number: "01",
    title: "Build your career workspace",
    copy: "Create your resume, profile, portfolio, and career assets in one organized space.",
  },
  {
    number: "02",
    title: "Discover trusted opportunities",
    copy: "Explore jobs and pathways aligned with your skills, goals, and direction.",
  },
  {
    number: "03",
    title: "Stay visible and ready",
    copy: "Share structured career assets with recruiters, schools, and institutions when it matters.",
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

export function HowIseyaWorks() {
  return (
    <section className="mx-auto max-w-[92rem] px-5 py-9 sm:px-8 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          Workflow
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-3xl">
          How ISEYA works
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Build your career foundation, discover better opportunities, and stay ready for what comes next.
        </p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <article
            key={step.number}
            className={`rounded-xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(0_14_47_/_0.06)] motion-reduce:transform-none ${
              index === 1
                ? "border-[var(--iseya-gold)]/28 bg-[#FFF9EC]"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--iseya-gold)]">{step.number}</p>
            <h3 className="mt-4 text-lg font-semibold leading-6 text-[var(--iseya-navy)] sm:text-xl">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function protectedPreviewHref(destination: string, isSignedIn: boolean) {
  return isSignedIn
    ? destination
    : `/signup?redirectedFrom=${encodeURIComponent(destination)}`;
}

export function CareerWorkspacePreview({ isSignedIn }: { isSignedIn: boolean }) {
  const previewCards = [
    {
      title: "Career Workspace",
      copy: "Build structured career assets and keep application materials organized.",
      highlight: "Career assets structured",
      icon: FolderOpen,
      iconClass: "bg-blue-50 text-blue-600",
      href: protectedPreviewHref("/workspace", isSignedIn),
    },
    {
      title: "Professional Visibility",
      copy: "Present recruiter-ready materials with stronger career positioning.",
      highlight: "Recruiter-ready presentation",
      icon: UsersRound,
      iconClass: "bg-emerald-50 text-emerald-600",
      href: protectedPreviewHref("/workspace", isSignedIn),
    },
    {
      title: "Trusted Opportunities",
      copy: "Explore transparent opportunity sources and tailor assets for each role.",
      highlight: "ATS readiness improved",
      icon: Building2,
      iconClass: "bg-amber-50 text-amber-700",
      href: "/jobs",
    },
  ] as const;

  return (
    <section className="border-y border-slate-200/70 bg-white">
      <div className="mx-auto max-w-[92rem] px-5 py-9 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            Product Preview
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-3xl">
            Your career workspace, organized.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            From resume building to opportunity discovery, ISEYA helps you manage the assets that move your career forward.
          </p>
        </div>

        <div className="mt-7 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.57fr)] lg:gap-5">
          <div className="grid gap-3">
            {previewCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex items-start gap-4 rounded-xl border border-slate-200/85 bg-white p-4 shadow-[0_8px_22px_rgb(0_14_47_/_0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--iseya-gold)]/40 hover:shadow-[0_14px_30px_rgb(0_14_47_/_0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 motion-reduce:transform-none sm:p-5"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}>
                  <card.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-[var(--iseya-navy)] sm:text-lg">
                    {card.title}
                  </span>
                  <span className="mt-1.5 block text-sm leading-6 text-slate-600">
                    {card.copy}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--iseya-navy)] transition group-hover:text-[var(--iseya-gold)]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    {card.highlight}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <article className="rounded-xl border border-slate-200/85 bg-[#F8FAFD] p-4 shadow-[0_14px_34px_rgb(0_14_47_/_0.065)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                Resume Snapshot
              </p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                82% Ready
              </span>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200/80 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#FFF8E6] text-[var(--iseya-gold)]">
                  <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-[var(--iseya-navy)]">Candidate Name</p>
                  <p className="mt-0.5 text-xs text-slate-500">Product Operations Manager</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-600">
                Product leader aligning operations, analytics, and delivery for scalable growth.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Strategy", "SQL", "Agile", "Analytics"].map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Experience
                </p>
                <div className="mt-2 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--iseya-navy)]">Senior Product Manager</p>
                    <p className="mt-1 text-slate-500">Northline Technologies</p>
                  </div>
                  <span className="shrink-0 text-slate-400">2022 - Present</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>ATS readiness</span>
                  <span className="text-[var(--iseya-navy)]">82%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 w-[82%] rounded-full bg-[var(--iseya-gold)]" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Build a clear, recruiter-readable resume in your career workspace.
            </p>
          </article>
        </div>
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
