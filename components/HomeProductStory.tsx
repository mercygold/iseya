import type { MouseEventHandler } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  FolderOpen,
  Gauge,
  Target,
  UsersRound,
} from "lucide-react";

type SnapshotCard = {
  title: string;
  value: string;
  icon: LucideIcon;
};

const snapshotCards: SnapshotCard[] = [
  { title: "Resume Score", value: "82% Ready", icon: Gauge },
  { title: "Recruiter Visibility", value: "Active", icon: UsersRound },
  { title: "Trusted Opportunities", value: "12 Matches", icon: BriefcaseBusiness },
  { title: "Career Assets", value: "Organized", icon: FolderOpen },
  { title: "Institution Ready", value: "Verified", icon: Building2 },
];

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

const workspaceAssets = ["Resume", "Career Profile", "Portfolio", "Application Kit"] as const;

const trustAudiences = [
  {
    title: "For candidates",
    copy: "Organize your resume, profile, career assets, and opportunity search in one workspace.",
    icon: FolderOpen,
  },
  {
    title: "For recruiters",
    copy: "Review clearer candidate signals and structured career assets before starting the conversation.",
    icon: UsersRound,
  },
  {
    title: "For institutions",
    copy: "Support students and alumni with a more organized path from preparation to visibility.",
    icon: Building2,
  },
] as const;

export function FloatingProductCards() {
  return (
    <section
      aria-label="ISEYA product readiness snapshot"
      className="relative z-10 mx-auto -mt-2 max-w-[92rem] px-5 sm:-mt-4 sm:px-8"
    >
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-3">
        {snapshotCards.map((card) => (
          <article
            key={card.title}
            className="group rounded-lg border border-slate-200/85 bg-white p-3 shadow-[0_8px_20px_rgb(0_14_47_/_0.055)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--iseya-gold)]/45 hover:shadow-[0_12px_26px_rgb(0_14_47_/_0.09)] motion-reduce:transform-none last:col-span-2 md:last:col-span-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-[var(--iseya-navy)]">
                <card.icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="h-2 w-2 rounded-full bg-[var(--iseya-gold)]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[11px] font-medium leading-4 text-slate-500">{card.title}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--iseya-navy)]">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

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
            <h3 className="mt-4 text-lg font-semibold leading-6 text-[var(--iseya-navy)]">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CareerWorkspacePreview() {
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

        <div className="mt-7 overflow-hidden rounded-xl border border-slate-200/90 bg-[#F8FAFD] shadow-[0_16px_38px_rgb(0_14_47_/_0.07)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--iseya-gold)]" aria-hidden="true" />
              <p className="text-sm font-semibold text-[var(--iseya-navy)]">Career Workspace</p>
            </div>
            <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
              Ready for review
            </p>
          </div>

          <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[190px_minmax(0,1fr)_260px]">
            <div className="rounded-lg border border-slate-200/80 bg-white p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Career Assets</p>
              <div className="mt-3 grid gap-2">
                {workspaceAssets.map((asset, index) => (
                  <div
                    key={asset}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold ${
                      index === 0 ? "bg-[#FFF8E6] text-[var(--iseya-navy)]" : "text-slate-600"
                    }`}
                  >
                    <FileText className={`h-3.5 w-3.5 ${index === 0 ? "text-[var(--iseya-gold)]" : "text-slate-400"}`} aria-hidden="true" />
                    {asset}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Profile Strength</p>
                      <p className="mt-1 text-xl font-semibold text-[var(--iseya-navy)]">82%</p>
                    </div>
                    <Gauge className="h-5 w-5 text-[var(--iseya-gold)]" aria-hidden="true" />
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 w-[82%] rounded-full bg-[var(--iseya-gold)]" />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Opportunity Matches</p>
                      <p className="mt-1 text-xl font-semibold text-[var(--iseya-navy)]">12</p>
                    </div>
                    <Target className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">4 roles aligned this week</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--iseya-navy)]">Resume Builder</p>
                    <p className="mt-1 text-xs text-slate-500">Product Manager | Modern profile</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Updated
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-[70%] rounded-full bg-slate-200" />
                  <div className="h-2 w-full rounded-full bg-slate-100" />
                  <div className="h-2 w-[88%] rounded-full bg-slate-100" />
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                <p className="text-sm font-semibold text-[var(--iseya-navy)]">Recruiter View</p>
                <p className="mt-1 text-xs text-slate-500">Structured profile visibility</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Active and ready
                </div>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                <p className="text-sm font-semibold text-[var(--iseya-navy)]">Career Timeline</p>
                <div className="mt-3 grid gap-3 text-xs text-slate-600">
                  {["Resume updated", "Role matches reviewed", "Profile ready"].map((event) => (
                    <div key={event} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--iseya-gold)]" aria-hidden="true" />
                      {event}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
          <article
            key={audience.title}
            className="rounded-xl border border-slate-200/85 bg-white p-4 shadow-[0_6px_20px_rgb(0_14_47_/_0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--iseya-gold)]/38 hover:shadow-[0_10px_25px_rgb(0_14_47_/_0.065)] motion-reduce:transform-none sm:p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--iseya-gold)]/24 bg-[#FFF9EC] text-[var(--iseya-navy)]">
              <audience.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-[var(--iseya-navy)]">{audience.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{audience.copy}</p>
          </article>
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
