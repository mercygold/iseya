"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type RecruiterProfile = {
  company_name: string;
  recruiter_name: string;
  work_email: string;
  company_website: string | null;
  company_location: string | null;
  industry: string | null;
  company_size: string | null;
  hiring_focus: string | null;
  verification_status: string;
};

type JobPost = {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  workplace_type: string;
  employment_type: string;
  salary_range: string | null;
  role_summary: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  application_deadline: string | null;
  application_url: string | null;
  status: string;
  applicants_count: number;
  created_at: string;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25";
const primaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-3 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] disabled:cursor-not-allowed disabled:opacity-60";
const dangerButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

const emptyJob = {
  jobTitle: "",
  companyName: "",
  location: "",
  workplaceType: "remote",
  employmentType: "full-time",
  salaryRange: "",
  roleSummary: "",
  responsibilities: "",
  requirements: "",
  skills: "",
  applicationDeadline: "",
  applicationUrl: "",
  status: "draft",
};

function statusLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RecruiterDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [profileDraft, setProfileDraft] = useState({
    companyName: "",
    recruiterName: "",
    workEmail: "",
    companyWebsite: "",
    companyLocation: "",
    industry: "",
    companySize: "",
    hiringFocus: "",
  });
  const [jobDraft, setJobDraft] = useState(emptyJob);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingJobId, setEditingJobId] = useState("");

  const stats = useMemo(
    () => ({
      total: jobs.length,
      published: jobs.filter((job) => job.status === "published").length,
      draft: jobs.filter((job) => job.status === "draft").length,
      applicants: jobs.reduce((sum, job) => sum + (job.applicants_count ?? 0), 0),
    }),
    [jobs],
  );

  async function loadDashboard() {
    setLoading(true);
    setStatus("");

    try {
      const [profileResponse, jobsResponse] = await Promise.all([
        fetch("/api/recruiter/profile", { cache: "no-store" }),
        fetch("/api/recruiter/jobs", { cache: "no-store" }),
      ]);
      const profileData = (await profileResponse.json()) as {
        recruiterProfile?: RecruiterProfile | null;
        error?: string;
      };
      const jobsData = (await jobsResponse.json()) as { jobs?: JobPost[]; error?: string };

      if (!profileResponse.ok) throw new Error(profileData.error || "Unable to load profile.");

      setProfile(profileData.recruiterProfile ?? null);
      if (profileData.recruiterProfile) {
        setProfileDraft({
          companyName: profileData.recruiterProfile.company_name,
          recruiterName: profileData.recruiterProfile.recruiter_name,
          workEmail: profileData.recruiterProfile.work_email,
          companyWebsite: profileData.recruiterProfile.company_website ?? "",
          companyLocation: profileData.recruiterProfile.company_location ?? "",
          industry: profileData.recruiterProfile.industry ?? "",
          companySize: profileData.recruiterProfile.company_size ?? "",
          hiringFocus: profileData.recruiterProfile.hiring_focus ?? "",
        });
      }
      if (jobsResponse.ok) {
        setJobs(jobsData.jobs ?? []);
      } else {
        setJobs([]);
        setStatus("Complete and save your company profile to activate recruiter job posting.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load recruiter dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function saveJob() {
    setStatus("");

    try {
      const endpoint = editingJobId
        ? `/api/recruiter/jobs/${editingJobId}`
        : "/api/recruiter/jobs";
      const response = await fetch(endpoint, {
        method: editingJobId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobDraft),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save job.");
      }

      setStatus(editingJobId ? "Job post updated." : "Job post created.");
      setEditingJobId("");
      setJobDraft(emptyJob);
      await loadDashboard();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save job.");
    }
  }

  async function saveProfile() {
    setStatus("");

    try {
      const response = await fetch("/api/recruiter/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save recruiter profile.");
      }

      setStatus("Company profile saved.");
      await loadDashboard();
      if (pathname.startsWith("/recruiters/onboarding")) {
        router.replace("/recruiters/dashboard");
        router.refresh();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save recruiter profile.");
    }
  }

  function editJob(job: JobPost) {
    setEditingJobId(job.id);
    setJobDraft({
      jobTitle: job.job_title,
      companyName: job.company_name,
      location: job.location,
      workplaceType: job.workplace_type,
      employmentType: job.employment_type,
      salaryRange: job.salary_range ?? "",
      roleSummary: job.role_summary,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      skills: job.skills.join(", "),
      applicationDeadline: job.application_deadline ?? "",
      applicationUrl: job.application_url ?? "",
      status: job.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateJobStatus(job: JobPost, nextStatus: string) {
    await fetch(`/api/recruiter/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadDashboard();
  }

  async function deleteJob(job: JobPost) {
    if (!window.confirm(`Delete ${job.job_title}?`)) {
      return;
    }

    await fetch(`/api/recruiter/jobs/${job.id}`, { method: "DELETE" });
    await loadDashboard();
  }

  return (
    <section className="mx-auto max-w-[92rem] px-5 py-8 sm:px-8">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          Recruiter Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-4xl">
          Career infrastructure for modern talent.
        </h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Post jobs, manage listings, and prepare to review candidates through career readiness, skill alignment, and role-fit signals.
        </p>
      </div>

      {status ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
          {status}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--iseya-navy)]">Loading recruiter workspace...</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Open listings", stats.published],
              ["Draft jobs", stats.draft],
              ["Total job posts", stats.total],
              ["Applicants", stats.applicants],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
              </div>
            ))}
          </section>

          <section id="company-profile" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Company Profile
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
                  {profile?.company_name || "Recruiter profile pending"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Verification status: {statusLabel(profile?.verification_status ?? "pending_review")}
                </p>
              </div>
              <button type="button" onClick={saveProfile} className={secondaryButton}>
                Save Company Profile
              </button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Field label="Company name" value={profileDraft.companyName} onChange={(value) => setProfileDraft((draft) => ({ ...draft, companyName: value }))} required />
              <Field label="Recruiter name" value={profileDraft.recruiterName} onChange={(value) => setProfileDraft((draft) => ({ ...draft, recruiterName: value }))} required />
              <Field label="Work email" value={profileDraft.workEmail} onChange={(value) => setProfileDraft((draft) => ({ ...draft, workEmail: value }))} required />
              <Field label="Company website" value={profileDraft.companyWebsite} onChange={(value) => setProfileDraft((draft) => ({ ...draft, companyWebsite: value }))} />
              <Field label="Company location" value={profileDraft.companyLocation} onChange={(value) => setProfileDraft((draft) => ({ ...draft, companyLocation: value }))} />
              <Field label="Industry" value={profileDraft.industry} onChange={(value) => setProfileDraft((draft) => ({ ...draft, industry: value }))} />
              <Field label="Company size" value={profileDraft.companySize} onChange={(value) => setProfileDraft((draft) => ({ ...draft, companySize: value }))} />
              <TextArea label="Hiring focus" value={profileDraft.hiringFocus} onChange={(value) => setProfileDraft((draft) => ({ ...draft, hiringFocus: value }))} />
            </div>
          </section>

          <section id="post-job" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Post Job
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
                  {editingJobId ? "Edit job post" : "Create a job post"}
                </h2>
              </div>
              <button type="button" onClick={saveJob} className={primaryButton}>
                {editingJobId ? "Save Changes" : "Post a Job"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Field label="Job title" value={jobDraft.jobTitle} onChange={(value) => setJobDraft((draft) => ({ ...draft, jobTitle: value }))} required />
              <Field label="Company name" value={jobDraft.companyName} onChange={(value) => setJobDraft((draft) => ({ ...draft, companyName: value }))} required />
              <Field label="Location" value={jobDraft.location} onChange={(value) => setJobDraft((draft) => ({ ...draft, location: value }))} />
              <Select label="Workplace" value={jobDraft.workplaceType} options={["remote", "hybrid", "onsite"]} onChange={(value) => setJobDraft((draft) => ({ ...draft, workplaceType: value }))} />
              <Select label="Employment type" value={jobDraft.employmentType} options={["full-time", "part-time", "contract", "internship"]} onChange={(value) => setJobDraft((draft) => ({ ...draft, employmentType: value }))} />
              <Field label="Salary range optional" value={jobDraft.salaryRange} onChange={(value) => setJobDraft((draft) => ({ ...draft, salaryRange: value }))} />
              <Field label="Application deadline optional" type="date" value={jobDraft.applicationDeadline} onChange={(value) => setJobDraft((draft) => ({ ...draft, applicationDeadline: value }))} />
              <Field label="Application URL optional" value={jobDraft.applicationUrl} onChange={(value) => setJobDraft((draft) => ({ ...draft, applicationUrl: value }))} />
              <TextArea label="Role summary" value={jobDraft.roleSummary} onChange={(value) => setJobDraft((draft) => ({ ...draft, roleSummary: value }))} />
              <TextArea label="Responsibilities" value={jobDraft.responsibilities} onChange={(value) => setJobDraft((draft) => ({ ...draft, responsibilities: value }))} />
              <TextArea label="Requirements" value={jobDraft.requirements} onChange={(value) => setJobDraft((draft) => ({ ...draft, requirements: value }))} />
              <TextArea label="Skills" value={jobDraft.skills} onChange={(value) => setJobDraft((draft) => ({ ...draft, skills: value }))} placeholder="Product strategy, SQL, stakeholder management" />
              <Select label="Status" value={jobDraft.status} options={["draft", "pending_review", "published", "closed"]} onChange={(value) => setJobDraft((draft) => ({ ...draft, status: value }))} />
            </div>
          </section>

          <section id="my-jobs" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  My Jobs
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
                  Job posts
                </h2>
              </div>
              <a href="#post-job" className={secondaryButton}>
                Post a Job
              </a>
            </div>

            <div className="mt-5 space-y-3">
              {jobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-600">
                  No job posts yet. Create your first listing to start attracting career-ready candidates.
                </div>
              ) : (
                jobs.map((job) => (
                  <article key={job.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--iseya-navy)]">
                          {job.job_title}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {job.company_name} | {job.location || "Location flexible"} | {statusLabel(job.workplace_type)}
                        </p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                          {statusLabel(job.status)} | {job.applicants_count} applicants
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => editJob(job)} className={secondaryButton}>
                          Edit Job
                        </button>
                        <button type="button" onClick={() => updateJobStatus(job, "closed")} className={secondaryButton}>
                          Close Job
                        </button>
                        <button type="button" onClick={() => deleteJob(job)} className={dangerButton}>
                          Delete Job
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${inputClass} min-h-28 resize-y leading-6`}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {statusLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
