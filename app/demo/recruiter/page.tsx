import Link from "next/link";
import { demoRecruiter } from "@/lib/demoData";
import { demoCard, demoLabel, demoPrimaryButton, demoSecondaryButton, demoStatusPill } from "../DemoShell";

function Badge({ value }: { value: string }) {
  const style =
    value === "Proceed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : value === "Reviewing"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : value === "Rejected"
          ? "border-slate-200 bg-slate-100 text-slate-700"
          : "border-[var(--iseya-gold)]/45 bg-[#FFF8E6] text-[var(--iseya-navy)]";
  return <span className={`${demoStatusPill} ${style}`}>{value}</span>;
}

export default function RecruiterDemoPage() {
  const totalApplicants = demoRecruiter.jobs.reduce((sum, job) => sum + job.applicants, 0);

  return (
    <section className="mx-auto max-w-[84rem] space-y-5 px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={demoLabel}>Recruiter Experience</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{demoRecruiter.company}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{demoRecruiter.recruiter} | Talent Acquisition</p>
        </div>
        <Link href="/recruiters" className={demoPrimaryButton}>Request Recruiter Access</Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`${demoCard} border-[var(--iseya-gold)]/40 bg-[#FFF8E6]`}>
          <p className={demoLabel}>Company Verification</p>
          <p className="mt-2 text-lg font-semibold text-[var(--iseya-navy)]">{demoRecruiter.verificationStatus}</p>
          <p className="mt-1.5 text-xs text-slate-600">Eligible to submit jobs for publishing</p>
        </article>
        {[
          ["Active Job Posts", String(demoRecruiter.jobs.length)],
          ["Total Applicants", String(totalApplicants)],
          ["Proceed Candidates", "4"],
        ].map(([label, value]) => (
          <article key={label} className={demoCard}>
            <p className={demoLabel}>{label}</p>
            <p className="mt-2 text-3xl font-semibold leading-none text-[var(--iseya-navy)]">{value}</p>
          </article>
        ))}
      </section>

      <article className={demoCard}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={demoLabel}>My Jobs</p>
            <h2 className="mt-1.5 text-xl font-semibold text-[var(--iseya-navy)]">Applicants grouped by role</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">Applicants remain organized within the job they expressed interest in.</p>
          </div>
          <button disabled type="button" className={`${demoSecondaryButton} cursor-default`}>Post a Job Preview</button>
        </div>
        <div className="mt-4 space-y-3">
          {demoRecruiter.jobs.map((job) => (
            <section key={job.title} className="rounded-md border border-slate-200 p-3.5 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--iseya-navy)]">{job.title}</h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase text-[var(--iseya-gold)]">
                    Published | {job.applicants} applicants
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {Object.entries(job.statusCounts).map(([status, count]) => (
                      <span key={status} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {status} {count}
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" disabled className={`${demoSecondaryButton} cursor-default`}>View Applicants</button>
              </div>
              <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
                {job.previews.map((applicant) => (
                  <article key={applicant.name} className="rounded-md border border-slate-100 bg-slate-50/80 p-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--iseya-navy)]">{applicant.name}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{applicant.materials}</p>
                      </div>
                      <Badge value={applicant.status} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs font-medium text-slate-600">
                      <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">Review</span>
                      <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">Internal note</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={demoCard}>
          <p className={demoLabel}>Applicant Review Panel</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Private recruiter notes</h2>
          <p className="mt-3 rounded-md bg-slate-50 p-3.5 text-sm leading-6 text-slate-600">
            Amara has product analysis experience and submitted a complete resume and cover letter. Review role alignment before moving forward.
          </p>
          <p className="mt-2.5 text-xs font-semibold uppercase text-slate-500">Visible only to recruiter and administrators</p>
        </article>
        <article className={demoCard}>
          <p className={demoLabel}>Notifications</p>
          <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">Hiring activity</h2>
          <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-100 bg-slate-50/60 text-sm text-slate-600">
            <p className="p-3.5">2 new interests submitted for Associate Product Manager.</p>
            <p className="p-3.5">AI Operations Analyst listing is active and receiving interest.</p>
          </div>
        </article>
      </section>
    </section>
  );
}
