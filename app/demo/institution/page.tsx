import Link from "next/link";
import { demoInstitution } from "@/lib/demoData";
import { demoCard, demoPrimaryButton } from "../DemoShell";

export default function InstitutionDemoPage() {
  const remainingSeats = demoInstitution.seats - demoInstitution.activeStudents;

  return (
    <section className="mx-auto max-w-[92rem] space-y-6 px-5 py-9 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Institution Experience</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{demoInstitution.name}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {demoInstitution.package} | Access status: {demoInstitution.status}
          </p>
        </div>
        <Link href="/institutions" className={demoPrimaryButton}>Request Institution Partnership</Link>
      </div>

      <p className="rounded-xl border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] p-4 text-sm font-semibold leading-7 text-[var(--iseya-navy)]">
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
        ].map(([label, value]) => (
          <article key={label} className={demoCard}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Seat Utilization</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
            {demoInstitution.activeStudents.toLocaleString()} of {demoInstitution.seats.toLocaleString()} seats used
          </h2>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[var(--iseya-gold)]" style={{ width: `${demoInstitution.seatsUsed}%` }} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Metric label="Remaining Seats" value={remainingSeats.toLocaleString()} />
            <Metric label="Institution Access Package" value={demoInstitution.package} />
          </div>
        </article>
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Career Readiness</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Aggregate student activity</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Career materials improved" value={demoInstitution.materialsImproved.toLocaleString()} />
            <Metric label="Applications submitted" value={demoInstitution.applicationsSubmitted.toLocaleString()} />
            <Metric label="Active students" value={String(demoInstitution.activeStudents)} />
            <Metric label="Readiness score" value={`${demoInstitution.readinessScore}%`} />
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Application Activity</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Aggregate outcomes</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(demoInstitution.applicationActivity).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="text-lg font-semibold text-[var(--iseya-navy)]">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Privacy-Safe Insight</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Institution reporting boundary</h2>
          <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            Institution administrators see aggregated readiness and engagement outcomes only. Private student resumes, cover letters, notes, files, and individual applications are not exposed.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--iseya-navy)]">
            Recruiter engagement: {demoInstitution.recruiterEngagements} aggregate interactions
          </p>
        </article>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}
