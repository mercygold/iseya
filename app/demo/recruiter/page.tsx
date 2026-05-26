"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { demoRecruiter } from "@/lib/demoData";
import TrackedLink from "@/components/TrackedLink";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { demoCard, demoLabel, demoPrimaryButton, demoSecondaryButton, demoStatusPill } from "../DemoShell";

type DemoJob = (typeof demoRecruiter.jobs)[number];
type DemoApplicant = DemoJob["previews"][number];
type ApplicantSelection = {
  applicant: DemoApplicant;
  jobTitle: string;
};

const interactiveSecondaryButton = `${demoSecondaryButton} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)]`;
const interactiveTextButton =
  "cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)]";

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
  const [applicantsJob, setApplicantsJob] = useState<DemoJob | null>(null);
  const [reviewSelection, setReviewSelection] = useState<ApplicantSelection | null>(null);
  const [noteSelection, setNoteSelection] = useState<ApplicantSelection | null>(null);
  const [postingPreviewOpen, setPostingPreviewOpen] = useState(false);

  return (
    <section className="mx-auto max-w-[84rem] space-y-5 px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={demoLabel}>Recruiter Experience</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{demoRecruiter.company}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{demoRecruiter.recruiter} | Talent Acquisition</p>
        </div>
        <TrackedLink href="/recruiters/signup" eventName="request_access_clicked" eventParameters={{ audience: "recruiter", source: "recruiter_demo" }} className={demoPrimaryButton}>
          Request Recruiter Access
        </TrackedLink>
      </div>

      <p className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] px-4 py-3 text-sm text-[var(--iseya-navy)]">
        <span className="rounded-full bg-[var(--iseya-navy)] px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
          Demo only
        </span>
        <span className="font-semibold">Sample data.</span>
        <span className="text-slate-700">Request recruiter access to manage real applicants.</span>
      </p>

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
          <button
            type="button"
            className={interactiveSecondaryButton}
            onClick={() => {
              trackAnalyticsEvent("recruiter_cta_clicked", {
                cta: "post_job_preview",
                source: "recruiter_demo",
              });
              setPostingPreviewOpen(true);
            }}
          >
            Post a Job Preview
          </button>
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
                <button type="button" className={interactiveSecondaryButton} onClick={() => setApplicantsJob(job)}>
                  View Applicants
                </button>
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
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={interactiveTextButton}
                        onClick={() => setReviewSelection({ applicant, jobTitle: job.title })}
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        className={interactiveTextButton}
                        onClick={() => setNoteSelection({ applicant, jobTitle: job.title })}
                      >
                        Internal note
                      </button>
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

      <article className={demoCard}>
        <p className={demoLabel}>Recruiter Demo Guide</p>
        <h2 className="mt-1.5 text-lg font-semibold text-[var(--iseya-navy)]">
          Review structured applicant activity in a private workflow
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          This guided sample illustrates recruiter job visibility, applicant grouping,
          review statuses, and private notes. It does not retrieve real applications or
          create live job posts; access-controlled recruiter accounts manage real hiring
          activity in the production workflow.
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/recruiters" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Recruiter Access
          </Link>
          <Link href="/recruiters/pricing" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Recruiter Plans
          </Link>
          <Link href="/demo" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            Demo Overview
          </Link>
        </div>
      </article>

      {applicantsJob ? (
        <DemoModal title={`${applicantsJob.title} applicants`} onClose={() => setApplicantsJob(null)}>
          <p className="text-sm leading-6 text-slate-600">
            Sample applicant preview for this role. Request recruiter access to review real submissions.
          </p>
          <div className="mt-4 space-y-3">
            {applicantsJob.previews.map((applicant) => (
              <article key={applicant.name} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--iseya-navy)]">{applicant.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{applicant.location} | {applicant.submittedDate}</p>
                  </div>
                  <Badge value={applicant.status} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{applicant.materials}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={interactiveTextButton}
                    onClick={() => {
                      setApplicantsJob(null);
                      setReviewSelection({ applicant, jobTitle: applicantsJob.title });
                    }}
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    className={interactiveTextButton}
                    onClick={() => {
                      setApplicantsJob(null);
                      setNoteSelection({ applicant, jobTitle: applicantsJob.title });
                    }}
                  >
                    Internal note
                  </button>
                </div>
              </article>
            ))}
          </div>
        </DemoModal>
      ) : null}

      {reviewSelection ? (
        <DemoModal title="Candidate review preview" onClose={() => setReviewSelection(null)}>
          <p className={demoLabel}>Sample data | {reviewSelection.jobTitle}</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[var(--iseya-navy)]">{reviewSelection.applicant.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{reviewSelection.applicant.headline}</p>
            </div>
            <Badge value={reviewSelection.applicant.status} />
          </div>
          <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            <DemoDetail label="Email" value={reviewSelection.applicant.email} />
            <DemoDetail label="Phone" value={reviewSelection.applicant.phone} />
            <DemoDetail label="Location" value={reviewSelection.applicant.location} />
            <DemoDetail label="Submitted" value={reviewSelection.applicant.submittedDate} />
            <DemoDetail label="Documents" value={reviewSelection.applicant.materials} />
            <DemoDetail label="Applied role" value={reviewSelection.jobTitle} />
          </div>
          <DisabledDemoAction />
        </DemoModal>
      ) : null}

      {noteSelection ? (
        <DemoModal title="Internal note preview" onClose={() => setNoteSelection(null)}>
          <p className={demoLabel}>Demo only | Private recruiter note</p>
          <h3 className="mt-3 text-lg font-semibold text-[var(--iseya-navy)]">
            {noteSelection.applicant.name} | {noteSelection.jobTitle}
          </h3>
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            {noteSelection.applicant.note}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase text-slate-500">
            Visible only to authorized recruiters in the live experience
          </p>
          <DisabledDemoAction />
        </DemoModal>
      ) : null}

      {postingPreviewOpen ? (
        <DemoModal title="Post a job preview" onClose={() => setPostingPreviewOpen(false)}>
          <p className="text-sm leading-6 text-slate-600">
            Preview the structured posting workflow available to verified recruiter accounts.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PreviewField label="Job title" value="Senior Product Operations Analyst" />
            <PreviewField label="Company" value={demoRecruiter.company} />
            <PreviewField label="Location" value="Remote, United States" />
            <PreviewField label="Workplace type" value="Remote" />
            <PreviewField label="Employment type" value="Full-time" />
            <PreviewField label="Salary" value="USD 95,000 - 118,000 yearly" />
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <p className={demoLabel}>Role Summary</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Guide hiring operations workflows and translate recruiter needs into measurable platform improvements.
            </p>
          </div>
          <DisabledDemoAction />
        </DemoModal>
      ) : null}
    </section>
  );
}

function DemoModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 cursor-pointer bg-[var(--iseya-navy)]/55"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className={demoLabel}>Demo only | Sample data</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">{title}</h2>
          </div>
          <button type="button" className={interactiveTextButton} onClick={onClose}>
            Close
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </section>
    </div>
  );
}

function DemoDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={demoLabel}>{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className={demoLabel}>{label}</p>
      <p className="mt-1.5 text-sm font-medium text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}

function DisabledDemoAction() {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">Available after recruiter access.</p>
      <TrackedLink href="/recruiters/signup" eventName="request_access_clicked" eventParameters={{ audience: "recruiter", source: "recruiter_demo_modal" }} className={demoPrimaryButton}>
        Request Recruiter Access
      </TrackedLink>
    </div>
  );
}
