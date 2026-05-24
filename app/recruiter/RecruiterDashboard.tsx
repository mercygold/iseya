"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  countryOptions,
  countryRegions,
  manualLocationOption,
} from "@/lib/recruiterLocationOptions";

type RecruiterProfile = {
  company_name: string;
  recruiter_name: string;
  work_email: string;
  company_website: string | null;
  linkedin_company_url: string | null;
  phone_number: string;
  phone_verified: boolean;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state_region: string;
  postal_code: string | null;
  country: string;
  company_location: string | null;
  industry: string | null;
  industry_other: string | null;
  company_size: string | null;
  hiring_focus: string | null;
  verification_status: string;
  verification_notes: string | null;
};

type JobPost = {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  workplace_type: string;
  employment_type: string;
  salary_range: string | null;
  salary_currency: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
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

type Application = {
  id: string;
  job_id: string;
  job_title: string;
  candidate_email: string | null;
  full_name: string;
  phone_number: string;
  location: string;
  short_note: string;
  resume_file_url: string | null;
  cover_letter_file_url: string | null;
  status: string;
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
const companySizeOptions = ["", "1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];
const industryOptions = [
  "",
  "Technology",
  "Software / SaaS",
  "Artificial Intelligence",
  "Cybersecurity",
  "Fintech",
  "Healthcare",
  "Education",
  "Consulting",
  "Marketing / Advertising",
  "Media / Entertainment",
  "E-commerce",
  "Retail",
  "Finance / Banking",
  "Real Estate",
  "Construction",
  "Manufacturing",
  "Logistics / Transportation",
  "Energy",
  "Agriculture",
  "Hospitality",
  "Legal",
  "Government / Public Sector",
  "Nonprofit",
  "Staffing / Recruiting",
  "Other",
];

const emptyJob = {
  jobTitle: "",
  companyName: "",
  location: "",
  workplaceType: "remote",
  employmentType: "full-time",
  salaryRange: "",
  salaryCurrency: "",
  salaryMin: "",
  salaryMax: "",
  salaryPeriod: "",
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

function normalizeCompanySize(value: string | null) {
  return (value ?? "").replace(/-/g, "–");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecruiterDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profileDraft, setProfileDraft] = useState({
    companyName: "",
    recruiterName: "",
    workEmail: "",
    companyWebsite: "",
    linkedinCompanyUrl: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateRegion: "",
    postalCode: "",
    country: "",
    companyLocation: "",
    industry: "",
    industryOther: "",
    companySize: "",
    hiringFocus: "",
  });
  const [jobDraft, setJobDraft] = useState(emptyJob);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingJobId, setEditingJobId] = useState("");
  const [profileSaveState, setProfileSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [jobSaveAction, setJobSaveAction] = useState<"" | "draft" | "pending_review">("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [expandedApplicantsJobId, setExpandedApplicantsJobId] = useState("");

  const stats = useMemo(
    () => ({
      total: jobs.length,
      published: jobs.filter((job) => job.status === "published").length,
      draft: jobs.filter((job) => job.status === "draft").length,
      applicants: applications.length,
    }),
    [applications.length, jobs],
  );
  const profileComplete = Boolean(
    profile?.company_name &&
      profile.recruiter_name &&
      profile.work_email &&
      profile.company_website &&
      profile.phone_number &&
      profile.address_line_1 &&
      profile.city &&
      profile.state_region &&
      profile.country &&
      profile.hiring_focus,
  );
  const applicationsByJobId = useMemo(() => {
    const grouped = new Map<string, Application[]>();
    for (const application of applications) {
      const existing = grouped.get(application.job_id) ?? [];
      existing.push(application);
      grouped.set(application.job_id, existing);
    }
    return grouped;
  }, [applications]);
  const selectedCountryOption = countryOptions.includes(profileDraft.country)
    ? profileDraft.country
    : profileDraft.country
      ? manualLocationOption
      : "";
  const countryStateOptions =
    selectedCountryOption && selectedCountryOption !== manualLocationOption
      ? countryRegions[selectedCountryOption] ?? [manualLocationOption]
      : [manualLocationOption];
  const selectedStateOption = countryStateOptions.includes(profileDraft.stateRegion)
    ? profileDraft.stateRegion
    : profileDraft.stateRegion
      ? manualLocationOption
      : "";
  const needsManualCountry = selectedCountryOption === manualLocationOption;
  const needsManualState =
    selectedCountryOption === manualLocationOption || selectedStateOption === manualLocationOption;
  const needsOtherIndustry = profileDraft.industry === "Other";
  const verificationStatus = profile?.verification_status ?? "pending_review";
  const canEditJobDraft = profileComplete;
  const canSubmitJobForReview = profileComplete && verificationStatus === "verified";
  const verificationMessage =
    !profileComplete
      ? "Create your company profile before posting jobs."
      : verificationStatus === "verified"
        ? "Your company profile is verified. You can submit jobs for publishing."
        : verificationStatus === "rejected"
          ? "Your company profile needs updates before jobs can be published."
          : "Your company profile is under review. You can prepare job drafts, but jobs will not be published until verification is complete.";

  async function loadDashboard(options?: { preserveStatus?: boolean }) {
    setLoading(true);
    if (!options?.preserveStatus) {
      setStatus("");
    }

    try {
      const [profileResponse, jobsResponse, applicationsResponse] = await Promise.all([
        fetch("/api/recruiter/profile", { cache: "no-store" }),
        fetch("/api/recruiter/jobs", { cache: "no-store" }),
        fetch("/api/recruiter/applications", { cache: "no-store" }),
      ]);
      const profileData = (await profileResponse.json()) as {
        recruiterProfile?: RecruiterProfile | null;
        error?: string;
      };
      const jobsData = (await jobsResponse.json()) as { jobs?: JobPost[]; error?: string };
      const applicationsData = (await applicationsResponse.json()) as {
        applications?: Application[];
        error?: string;
      };

      if (!profileResponse.ok) throw new Error(profileData.error || "Unable to load profile.");

      setProfile(profileData.recruiterProfile ?? null);
      if (profileData.recruiterProfile) {
        setProfileDraft({
          companyName: profileData.recruiterProfile.company_name,
          recruiterName: profileData.recruiterProfile.recruiter_name,
          workEmail: profileData.recruiterProfile.work_email,
          companyWebsite: profileData.recruiterProfile.company_website ?? "",
          linkedinCompanyUrl: profileData.recruiterProfile.linkedin_company_url ?? "",
          phoneNumber: profileData.recruiterProfile.phone_number ?? "",
          addressLine1: profileData.recruiterProfile.address_line_1 ?? "",
          addressLine2: profileData.recruiterProfile.address_line_2 ?? "",
          city: profileData.recruiterProfile.city ?? "",
          stateRegion: profileData.recruiterProfile.state_region ?? "",
          postalCode: profileData.recruiterProfile.postal_code ?? "",
          country: profileData.recruiterProfile.country ?? "",
          companyLocation: profileData.recruiterProfile.company_location ?? "",
          industry: profileData.recruiterProfile.industry ?? "",
          industryOther: profileData.recruiterProfile.industry_other ?? "",
          companySize: normalizeCompanySize(profileData.recruiterProfile.company_size),
          hiringFocus: profileData.recruiterProfile.hiring_focus ?? "",
        });
        setJobDraft((draft) => ({
          ...draft,
          companyName: draft.companyName || profileData.recruiterProfile?.company_name || "",
        }));
      }
      if (jobsResponse.ok) {
        setJobs(jobsData.jobs ?? []);
      } else if (!options?.preserveStatus) {
        setJobs([]);
        setStatus(
          profileData.recruiterProfile
            ? "Unable to load job posts right now. Please try again."
            : "Create your company profile before posting jobs.",
        );
      }
      if (applicationsResponse.ok) {
        setApplications(applicationsData.applications ?? []);
      } else {
        setApplications([]);
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

  useEffect(() => {
    if (profileSaveState !== "saved") {
      return;
    }

    const timer = window.setTimeout(() => setProfileSaveState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [profileSaveState]);

  async function saveJob(nextStatus: "draft" | "pending_review") {
    setStatus("");
    setJobSaveAction(nextStatus);

    try {
      if (!profileComplete) {
        setStatus("Create your company profile before posting jobs.");
        return;
      }

      if (verificationStatus !== "verified" && nextStatus === "pending_review") {
        setStatus(
          verificationStatus === "rejected"
            ? "Update your company profile before submitting jobs for review."
            : "Your company profile must be verified before submitting jobs for review.",
        );
        return;
      }

      const endpoint = editingJobId
        ? `/api/recruiter/jobs/${editingJobId}`
        : "/api/recruiter/jobs";
      const response = await fetch(endpoint, {
        method: editingJobId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...jobDraft, status: nextStatus }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        sentForReview?: boolean;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create job post right now. Please check the required fields and try again.",
        );
      }

      setStatus(
        nextStatus === "pending_review"
          ? "Job submitted for review."
          : editingJobId
            ? "Job draft saved successfully."
            : "Job draft saved successfully.",
      );
      setEditingJobId("");
      setJobDraft(emptyJob);
      await loadDashboard({ preserveStatus: true });
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to create job post right now. Please check the required fields and try again.",
      );
    } finally {
      setJobSaveAction("");
    }
  }

  async function saveProfile() {
    setStatus("");
    setProfileSaveState("saving");

    try {
      const missingFields = [
        ["Company name", profileDraft.companyName],
        ["Recruiter name", profileDraft.recruiterName],
        ["Work email", profileDraft.workEmail],
        ["Company website", profileDraft.companyWebsite],
        ["Phone number", profileDraft.phoneNumber],
        ["Address line 1", profileDraft.addressLine1],
        ["City", profileDraft.city],
        ["State/Region", needsManualState ? profileDraft.stateRegion : profileDraft.stateRegion],
        ["Country", profileDraft.country],
        ["Hiring focus", profileDraft.hiringFocus],
      ].filter(([, value]) => !String(value).trim());

      if (missingFields.length > 0) {
        setStatus(`Missing required fields: ${missingFields.map(([label]) => label).join(", ")}.`);
        setProfileSaveState("idle");
        return;
      }

      const response = await fetch("/api/recruiter/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        sentForReview?: boolean;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save recruiter profile right now. Please try again.",
        );
      }

      setProfileSaveState("saved");
      setStatus(
        data.sentForReview
          ? "Your company profile changes were saved and sent for review."
          : "Company profile saved successfully.",
      );
      await loadDashboard({ preserveStatus: true });
      if (pathname.startsWith("/recruiters/onboarding")) {
        router.replace("/recruiters/dashboard");
        router.refresh();
      }
    } catch (error) {
      setProfileSaveState("idle");
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save recruiter profile right now. Please try again.",
      );
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
      salaryCurrency: job.salary_currency ?? "",
      salaryMin: job.salary_min === null ? "" : String(job.salary_min),
      salaryMax: job.salary_max === null ? "" : String(job.salary_max),
      salaryPeriod: job.salary_period ?? "",
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

  async function updateApplicationStatus(application: Application, nextStatus: string) {
    setStatus("");

    try {
      const response = await fetch("/api/recruiter/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id, status: nextStatus }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to update applicant status right now.");
      }

      setStatus("Applicant status updated.");
      setSelectedApplication((current) =>
        current?.id === application.id ? { ...current, status: nextStatus } : current,
      );
      await loadDashboard({ preserveStatus: true });
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to update applicant status right now.",
      );
    }
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
              <button
                type="button"
                onClick={saveProfile}
                disabled={profileSaveState === "saving"}
                className={secondaryButton}
              >
                {profileSaveState === "saving"
                  ? "Saving..."
                  : profileSaveState === "saved"
                    ? "Saved"
                    : "Save Company Profile"}
              </button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Field label="Company name" value={profileDraft.companyName} onChange={(value) => setProfileDraft((draft) => ({ ...draft, companyName: value }))} required />
              <Field label="Recruiter name" value={profileDraft.recruiterName} onChange={(value) => setProfileDraft((draft) => ({ ...draft, recruiterName: value }))} required />
              <Field label="Work email" value={profileDraft.workEmail} onChange={(value) => setProfileDraft((draft) => ({ ...draft, workEmail: value }))} required />
              <Field label="Company website" value={profileDraft.companyWebsite} onChange={(value) => setProfileDraft((draft) => ({ ...draft, companyWebsite: value }))} required />
              <Field label="LinkedIn company URL optional" value={profileDraft.linkedinCompanyUrl} onChange={(value) => setProfileDraft((draft) => ({ ...draft, linkedinCompanyUrl: value }))} />
              <Field label="Phone number" value={profileDraft.phoneNumber} onChange={(value) => setProfileDraft((draft) => ({ ...draft, phoneNumber: value }))} required />
              <Field label="Address line 1" value={profileDraft.addressLine1} onChange={(value) => setProfileDraft((draft) => ({ ...draft, addressLine1: value }))} required />
              <Field label="Address line 2 optional" value={profileDraft.addressLine2} onChange={(value) => setProfileDraft((draft) => ({ ...draft, addressLine2: value }))} />
              <Field label="City" value={profileDraft.city} onChange={(value) => setProfileDraft((draft) => ({ ...draft, city: value }))} required />
              <Select label="Country" value={selectedCountryOption} options={countryOptions} onChange={(value) => setProfileDraft((draft) => ({ ...draft, country: value, stateRegion: "" }))} required />
              {needsManualCountry ? (
                <Field label="Enter country/region manually" value={profileDraft.country === manualLocationOption ? "" : profileDraft.country} onChange={(value) => setProfileDraft((draft) => ({ ...draft, country: value, stateRegion: "" }))} required />
              ) : null}
              {needsManualState ? (
                <Field label="Enter state/region manually" value={profileDraft.stateRegion === manualLocationOption ? "" : profileDraft.stateRegion} onChange={(value) => setProfileDraft((draft) => ({ ...draft, stateRegion: value }))} required />
              ) : (
                <Select label="State/Region" value={selectedStateOption} options={["", ...countryStateOptions]} onChange={(value) => setProfileDraft((draft) => ({ ...draft, stateRegion: value }))} required />
              )}
              <Field label="Postal code optional" value={profileDraft.postalCode} onChange={(value) => setProfileDraft((draft) => ({ ...draft, postalCode: value }))} />
              <Select label="Industry optional" value={profileDraft.industry} options={industryOptions} onChange={(value) => setProfileDraft((draft) => ({ ...draft, industry: value, industryOther: value === "Other" ? draft.industryOther : "" }))} />
              {needsOtherIndustry ? (
                <Field label="Specify industry optional" value={profileDraft.industryOther} onChange={(value) => setProfileDraft((draft) => ({ ...draft, industryOther: value }))} />
              ) : null}
              <Select label="Company size optional" value={profileDraft.companySize} options={companySizeOptions} onChange={(value) => setProfileDraft((draft) => ({ ...draft, companySize: value }))} />
              <TextArea label="Hiring focus" value={profileDraft.hiringFocus} onChange={(value) => setProfileDraft((draft) => ({ ...draft, hiringFocus: value }))} required />
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveJob("draft")}
                  disabled={!profileComplete || Boolean(jobSaveAction)}
                  className={secondaryButton}
                >
                  {jobSaveAction === "draft" ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => saveJob("pending_review")}
                  disabled={!canSubmitJobForReview || Boolean(jobSaveAction)}
                  className={primaryButton}
                >
                  {jobSaveAction === "pending_review" ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
              {verificationMessage}{" "}
              {!profileComplete || verificationStatus === "rejected" ? (
                <a href="#company-profile" className="underline decoration-[var(--iseya-gold)] underline-offset-4">
                  {profileComplete ? "Update Company Profile" : "Complete Company Profile"}
                </a>
              ) : null}
            </div>

            <fieldset disabled={!canEditJobDraft} className={!canEditJobDraft ? "opacity-60" : ""}>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Field label="Job title" value={jobDraft.jobTitle} onChange={(value) => setJobDraft((draft) => ({ ...draft, jobTitle: value }))} required />
                <Field label="Company name" value={jobDraft.companyName} onChange={(value) => setJobDraft((draft) => ({ ...draft, companyName: value }))} required />
                <Field label="Location" value={jobDraft.location} onChange={(value) => setJobDraft((draft) => ({ ...draft, location: value }))} required />
                <Select label="Workplace" value={jobDraft.workplaceType} options={["remote", "hybrid", "onsite"]} onChange={(value) => setJobDraft((draft) => ({ ...draft, workplaceType: value }))} required />
                <Select label="Employment type" value={jobDraft.employmentType} options={["full-time", "part-time", "contract", "internship"]} onChange={(value) => setJobDraft((draft) => ({ ...draft, employmentType: value }))} required />
                <Select label="Salary currency optional" value={jobDraft.salaryCurrency} options={["", "USD", "CAD", "GBP", "EUR", "NGN", "INR", "AUD", "AED", "ZAR", "JPY", "CNY", "GHS", "KES"]} onChange={(value) => setJobDraft((draft) => ({ ...draft, salaryCurrency: value }))} />
                <Field label="Salary min optional" type="number" value={jobDraft.salaryMin} onChange={(value) => setJobDraft((draft) => ({ ...draft, salaryMin: value }))} />
                <Field label="Salary max optional" type="number" value={jobDraft.salaryMax} onChange={(value) => setJobDraft((draft) => ({ ...draft, salaryMax: value }))} />
                <Select label="Salary period optional" value={jobDraft.salaryPeriod} options={["", "yearly", "monthly", "hourly", "project"]} onChange={(value) => setJobDraft((draft) => ({ ...draft, salaryPeriod: value }))} />
                <Field label="Application deadline optional" type="date" value={jobDraft.applicationDeadline} onChange={(value) => setJobDraft((draft) => ({ ...draft, applicationDeadline: value }))} />
                <Field label="Application URL optional" value={jobDraft.applicationUrl} onChange={(value) => setJobDraft((draft) => ({ ...draft, applicationUrl: value }))} />
                <TextArea label="Role summary" value={jobDraft.roleSummary} onChange={(value) => setJobDraft((draft) => ({ ...draft, roleSummary: value }))} required />
                <TextArea label="Responsibilities" value={jobDraft.responsibilities} onChange={(value) => setJobDraft((draft) => ({ ...draft, responsibilities: value }))} required />
                <TextArea label="Requirements" value={jobDraft.requirements} onChange={(value) => setJobDraft((draft) => ({ ...draft, requirements: value }))} required />
                <TextArea label="Skills" value={jobDraft.skills} onChange={(value) => setJobDraft((draft) => ({ ...draft, skills: value }))} placeholder="Product strategy, SQL, stakeholder management" />
              </div>
            </fieldset>
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
                jobs.map((job) => {
                  const jobApplications = applicationsByJobId.get(job.id) ?? [];
                  const applicantsExpanded = expandedApplicantsJobId === job.id;
                  return (
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
                          {statusLabel(job.status)} | {jobApplications.length} applicants
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Created {formatDate(job.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedApplicantsJobId(applicantsExpanded ? "" : job.id)}
                          className={secondaryButton}
                        >
                          {applicantsExpanded ? "Hide Applicants" : "View Applicants"}
                        </button>
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
                    {applicantsExpanded ? (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        {jobApplications.length === 0 ? (
                          <p className="rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-600">
                            No submitted interests for this job yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {jobApplications.map((application) => (
                              <article key={application.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0">
                                    <h4 className="text-base font-semibold text-[var(--iseya-navy)]">
                                      {application.full_name || "Applicant"}
                                    </h4>
                                    <p className="mt-1 text-sm font-medium text-slate-600">
                                      {application.candidate_email || "No email"} | {application.phone_number}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">{application.location}</p>
                                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                                      {application.short_note}
                                    </p>
                                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                                      {statusLabel(application.status)} | Submitted {formatDate(application.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setSelectedApplication(application)} className={secondaryButton}>
                                      View
                                    </button>
                                    <button type="button" onClick={() => updateApplicationStatus(application, "reviewing")} className={secondaryButton}>
                                      Mark Reviewing
                                    </button>
                                    <button type="button" onClick={() => updateApplicationStatus(application, "proceed")} className={primaryButton}>
                                      Proceed
                                    </button>
                                    <button type="button" onClick={() => updateApplicationStatus(application, "rejected")} className={dangerButton}>
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
      {selectedApplication ? (
        <ApplicantModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdate={(status) => updateApplicationStatus(selectedApplication, status)}
        />
      ) : null}
    </section>
  );
}

function ApplicantModal({
  application,
  onClose,
  onUpdate,
}: {
  application: Application;
  onClose: () => void;
  onUpdate: (status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Applicant Interest
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              {application.full_name || "Applicant"}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {application.job_title} | {statusLabel(application.status)}
            </p>
          </div>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ApplicantDetail label="Email" value={application.candidate_email} />
          <ApplicantDetail label="Phone" value={application.phone_number} />
          <ApplicantDetail label="Location" value={application.location} />
          <ApplicantDetail label="Submitted" value={formatDate(application.created_at)} />
          <ApplicantDetail label="Resume" value={application.resume_file_url} link />
          <ApplicantDetail label="Cover Letter" value={application.cover_letter_file_url} link />
          <div className="sm:col-span-2">
            <ApplicantDetail label="Short note" value={application.short_note} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => onUpdate("reviewing")} className={secondaryButton}>
            Mark Reviewing
          </button>
          <button type="button" onClick={() => onUpdate("proceed")} className={primaryButton}>
            Proceed
          </button>
          <button type="button" onClick={() => onUpdate("rejected")} className={dangerButton}>
            Reject
          </button>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function ApplicantDetail({
  label,
  value,
  link = false,
}: {
  label: string;
  value: string | null;
  link?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {link && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-sm font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] underline-offset-4"
        >
          View attachment
        </a>
      ) : (
        <p className="mt-1 whitespace-pre-line text-sm font-semibold text-[var(--iseya-navy)]">
          {value || "Not provided"}
        </p>
      )}
    </div>
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
  required = false,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
      {label}
      <textarea
        value={value}
        required={required}
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
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
      {label}
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option ? statusLabel(option) : "Select"}
          </option>
        ))}
      </select>
    </label>
  );
}
