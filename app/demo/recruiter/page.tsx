import Link from "next/link";
import { demoRecruiter } from "@/lib/demoData";
import { demoCard, demoPrimaryButton, demoSecondaryButton } from "../DemoShell";

function Badge({ value }: { value: string }) {
  const style =
    value === "Proceed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : value === "Reviewing"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : value === "Rejected"
          ? "border-slate-200 bg-slate-100 text-slate-700"
          : "border-[var(--iseya-gold)]/45 bg-[#FFF8E6] text-[var(--iseya-navy)]";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}

export default function RecruiterDemoPage() {
  const totalApplicants = demoRecruiter.jobs.reduce((sum, job) => sum + job.applicants, 0);

  return (
    <section className="mx-auto max-w-[92rem] space-y-6 px-5 py-9 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Recruiter Experience</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{demoRecruiter.company}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{demoRecruiter.recruiter} | Talent Acquisition</p>
        </div>
        <Link href="/recruiters" className={demoPrimaryButton}>Request Recruiter Access</Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`${demoCard} border-[var(--iseya-gold)]/40 bg-[#FFF8E6]`}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Company Verification</p>
          <p className="mt-3 text-lg font-semibold text-[var(--iseya-navy)]">{demoRecruiter.verificationStatus}</p>
          <p className="mt-2 text-xs text-slate-600">Eligible to submit jobs for publishing</p>
        </article>
        {[
          ["Active Job Posts", String(demoRecruiter.jobs.length)],
          ["Total Applicants", String(totalApplicants)],
          ["Proceed Candidates", "4"],
        ].map(([label, value]) => (
          <article key={label} className={demoCard}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
          </article>
        ))}
      </section>

      <article className={demoCard}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">My Jobs</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">Applicants grouped by role</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Applicants remain organized within the job they expressed interest in.</p>
          </div>
          <button disabled type="button" className={`${demoSecondaryButton} cursor-default`}>Post a Job Preview</button>
        </div>
        <div className="mt-6 space-y-4">
          {demoRecruiter.jobs.map((job) => (
            <section key={job.title} className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--iseya-navy)]">{job.title}</h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                    Published | {job.applicants} applicants
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(job.statusCounts).map(([status, count]) => (
                      <span key={status} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {status} {count}
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" disabled className={`${demoSecondaryButton} cursor-default`}>View Applicants</button>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {job.previews.map((applicant) => (
                  <article key={applicant.name} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--iseya-navy)]">{applicant.name}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{applicant.materials}</p>
                      </div>
                      <Badge value={applicant.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      <span className="rounded-md border border-slate-200 bg-white px-3 py-2">Review</span>
                      <span className="rounded-md border border-slate-200 bg-white px-3 py-2">Internal note</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Applicant Review Panel</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Private recruiter notes</h2>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            Amara has product analysis experience and submitted a complete resume and cover letter. Review role alignment before moving forward.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Visible only to recruiter and administrators</p>
        </article>
        <article className={demoCard}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">Notifications</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Hiring activity</h2>
          <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">2 new interests submitted for Associate Product Manager.</p>
          <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">AI Operations Analyst listing is active and receiving interest.</p>
        </article>
      </section>
    </section>
  );
}
