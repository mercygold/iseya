import Link from "next/link";
import { demoCandidate } from "@/lib/demoData";
import { demoCard, demoPrimaryButton, demoSecondaryButton } from "../DemoShell";

const statusStyles: Record<string, string> = {
  Submitted: "border-[#F4B321]/45 bg-[#FFF8E6] text-[var(--iseya-navy)]",
  Reviewing: "border-amber-200 bg-amber-50 text-amber-800",
  Proceed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function CandidateDemoPage() {
  return (
    <section className="mx-auto max-w-[92rem] space-y-6 px-5 py-9 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Candidate Experience</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{demoCandidate.name}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
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
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Career Assets</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Readiness progress</h2>
          <div className="mt-5 space-y-4">
            {demoCandidate.careerAssets.map((asset) => (
              <div key={asset.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="font-semibold text-[var(--iseya-navy)]">{asset.label}</p>
                  <p className="font-medium text-slate-500">{asset.status}</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-[var(--iseya-gold)]" style={{ width: `${asset.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" disabled className={`${demoSecondaryButton} mt-6 cursor-default opacity-90`}>
            Improve Career Materials Preview
          </button>
        </article>

        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">My Applications</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Application tracking</h2>
          <div className="mt-5 space-y-3">
            {demoCandidate.applications.map((application) => (
              <div key={application.title} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--iseya-navy)]">{application.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{application.company} | {application.date}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[application.status]}`}>
                    {application.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Job Discovery Preview</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Recommended role direction</h2>
          <p className="mt-4 rounded-xl border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] p-4 text-sm leading-7 text-slate-700">
            Product analyst and associate product roles align with your selected positioning and application material progress.
          </p>
        </article>
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Notifications</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Recent updates</h2>
          <div className="mt-4 space-y-3">
            {demoCandidate.notifications.map((notice) => (
              <p key={notice} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {notice}
              </p>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
