import type { Metadata } from "next";
import Link from "next/link";
import { demoCandidate } from "@/lib/demoData";
import { publicPageMetadata } from "@/lib/seo";
import { demoCard, demoLabel, demoPrimaryButton, demoSecondaryButton, demoStatusPill } from "../DemoShell";

export const metadata: Metadata = publicPageMetadata(
  "/demo/candidate",
  "Candidate Career Workspace Demo | ISEYA",
  "Explore a sample private candidate workspace with career assets, application tracking, and opportunity readiness workflows.",
);

const statusStyles: Record<string, string> = {
  Submitted: "border-[#F4B321]/45 bg-[#FFF8E6] text-[var(--iseya-navy)]",
  Reviewing: "border-amber-200 bg-amber-50 text-amber-800",
  Proceed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function CandidateDemoPage() {
  return (
    <section className="mx-auto max-w-[84rem] space-y-5 px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={demoLabel}>Candidate Experience</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{demoCandidate.name}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {demoCandidate.roleGoal} | {demoCandidate.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className={demoPrimaryButton}>Start Building My Career Assets</Link>
          <Link href="/jobs" className={demoSecondaryButton}>Browse Opportunities</Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Career readiness", `${demoCandidate.readinessScore}%`, "Profile progress"],
          ["Career assets", "4", "Resume, cover letter, LinkedIn, kit"],
          ["Applications", String(demoCandidate.applications.length), "Tracked privately"],
          ["Active outcomes", "2", "Reviewing or proceeding"],
        ].map(([label, value, detail]) => (
          <article key={label} className={demoCard}>
            <p className={demoLabel}>{label}</p>
            <p className="mt-2 text-3xl font-semibold leading-none text-[var(--iseya-navy)]">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className={demoCard}>
          <p className={demoLabel}>Career Assets</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Readiness progress</h2>
          <div className="mt-4 space-y-3.5">
            {demoCandidate.careerAssets.map((asset) => (
              <div key={asset.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="font-semibold text-[var(--iseya-navy)]">{asset.label}</p>
                  <p className="font-medium text-slate-500">{asset.status}</p>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-[var(--iseya-gold)]" style={{ width: `${asset.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" disabled className={`${demoSecondaryButton} mt-5 cursor-default opacity-90`}>
            Improve Career Materials Preview
          </button>
        </article>

        <article className={demoCard}>
          <p className={demoLabel}>My Applications</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Application tracking</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-100">
            {demoCandidate.applications.map((application) => (
              <div key={application.title} className="px-3.5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--iseya-navy)]">{application.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{application.company} | {application.date}</p>
                  </div>
                  <span className={`${demoStatusPill} ${statusStyles[application.status]}`}>
                    {application.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={demoCard}>
          <p className={demoLabel}>Job Discovery Preview</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Recommended role direction</h2>
          <p className="mt-3 rounded-md border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] p-3.5 text-sm leading-6 text-slate-700">
            Product analyst and associate product roles align with your selected positioning and application material progress.
          </p>
        </article>
        <article className={demoCard}>
          <p className={demoLabel}>Notifications</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Recent updates</h2>
          <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-100 bg-slate-50/60">
            {demoCandidate.notifications.map((notice) => (
              <p key={notice} className="p-3.5 text-sm leading-6 text-slate-600">
                {notice}
              </p>
            ))}
          </div>
        </article>
      </section>
      <article className={demoCard}>
        <p className={demoLabel}>Candidate Demo Guide</p>
        <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">
          Private career preparation and application tracking
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          This sample candidate workspace demonstrates how career assets, opportunity
          discovery, and application statuses can remain organized in a private
          candidate experience. The records shown here are fictional and do not create
          a public candidate profile.
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/jobs" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Explore Opportunities
          </Link>
          <Link href="/pricing" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            View Candidate Plans
          </Link>
          <Link href="/demo" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Back to Demo Overview
          </Link>
        </div>
      </article>
    </section>
  );
}
