import type { Metadata } from "next";
import Link from "next/link";
import { demoInstitution } from "@/lib/demoData";
import { publicPageMetadata } from "@/lib/seo";
import { demoCard, demoLabel, demoPrimaryButton } from "../DemoShell";

export const metadata: Metadata = publicPageMetadata(
  "/demo/institution",
  "Institution Career Readiness Demo | ISEYA",
  "Explore privacy-safe aggregate career readiness insights and institution access reporting in ISEYA.",
);

export default function InstitutionDemoPage() {
  const remainingSeats = demoInstitution.seats - demoInstitution.activeStudents;
  const activityTotal = Object.values(demoInstitution.applicationActivity).reduce((total, value) => total + value, 0);

  return (
    <section className="mx-auto max-w-[84rem] space-y-5 px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={demoLabel}>Institution Experience</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{demoInstitution.name}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {demoInstitution.package} | Access status: {demoInstitution.status}
          </p>
        </div>
        <Link href="/institutions" className={demoPrimaryButton}>Request Institution Partnership</Link>
      </div>

      <p className="rounded-md border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] px-4 py-3 text-sm font-medium leading-6 text-[var(--iseya-navy)]">
        Student privacy is protected. Institution insights are shown in aggregate only.
      </p>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Seats Used", `${demoInstitution.seatsUsed}%`],
          ["Active Students", String(demoInstitution.activeStudents)],
          ["Applications Submitted", demoInstitution.applicationsSubmitted.toLocaleString()],
          ["Recruiter Engagements", String(demoInstitution.recruiterEngagements)],
          ["Career Materials Improved", demoInstitution.materialsImproved.toLocaleString()],
          ["Average Readiness Score", `${demoInstitution.readinessScore}%`],
        ].map(([label, value], index) => (
          <article key={label} className={demoCard}>
            <p className={demoLabel}>{label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-semibold leading-none text-[var(--iseya-navy)]">{value}</p>
              <p className="text-xs font-medium text-emerald-700">{index === 0 ? "Active" : "+ this term"}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className={demoCard}>
          <p className={demoLabel}>Seat Utilization</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">
            {demoInstitution.activeStudents.toLocaleString()} of {demoInstitution.seats.toLocaleString()} seats used
          </h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[var(--iseya-gold)]" style={{ width: `${demoInstitution.seatsUsed}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">{remainingSeats.toLocaleString()} seats available for additional students</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Remaining Seats" value={remainingSeats.toLocaleString()} />
            <Metric label="Institution Access Package" value={demoInstitution.package} />
          </div>
        </article>
        <article className={demoCard}>
          <p className={demoLabel}>Career Readiness</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Aggregate student activity</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Career materials improved" value={demoInstitution.materialsImproved.toLocaleString()} />
            <Metric label="Applications submitted" value={demoInstitution.applicationsSubmitted.toLocaleString()} />
            <Metric label="Active students" value={String(demoInstitution.activeStudents)} />
            <Metric label="Readiness score" value={`${demoInstitution.readinessScore}%`} />
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={demoCard}>
          <p className={demoLabel}>Application Activity</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Aggregate outcomes</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(demoInstitution.applicationActivity).map(([label, value]) => (
              <div key={label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="text-sm font-semibold text-[var(--iseya-navy)]">{value.toLocaleString()}</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--iseya-gold)]"
                    style={{ width: `${Math.round((value / activityTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className={demoCard}>
          <p className={demoLabel}>Privacy-Safe Insight</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Institution reporting boundary</h2>
          <p className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3.5 text-sm leading-6 text-slate-600">
            Institution administrators see aggregated readiness and engagement outcomes only. Private student resumes, cover letters, notes, files, and individual applications are not exposed.
          </p>
          <p className="mt-3 text-sm font-semibold text-[var(--iseya-navy)]">
            Recruiter engagement: {demoInstitution.recruiterEngagements} aggregate interactions
          </p>
        </article>
      </section>
      <article className={demoCard}>
        <p className={demoLabel}>Institution Demo Guide</p>
        <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">
          Aggregate employability insight with student privacy protected
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          This sample dashboard demonstrates how an approved institution may view seat
          utilization, career readiness activity, application outcomes, and recruiter
          engagement at an aggregate level. It uses fictional data and does not disclose
          individual student materials or applications.
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/institutions" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Institution Partnerships
          </Link>
          <Link href="/contact" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Contact ISEYA
          </Link>
          <Link href="/demo" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Demo Overview
          </Link>
        </div>
      </article>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1.5 text-base font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}
