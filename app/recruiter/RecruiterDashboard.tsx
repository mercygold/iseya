"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import NotificationPanel from "@/components/NotificationPanel";
import {
  countryOptions,
  countryRegions,
  manualLocationOption,
} from "@/lib/recruiterLocationOptions";
import {
  getRecruiterEntitlements,
  recruiterPlanLabel,
} from "@/lib/pricing/recruiter";

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
  recruiter_plan: string;
  recruiter_plan_status: string;
  recruiter_active_job_limit: number;
  recruiter_visibility_days: number;
  recruiter_verified_eligible: boolean;
  recruiter_currency: string;
  recruiter_subscription_started_at: string | null;
  recruiter_subscription_expires_at: string | null;
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
  published_at: string | null;
  expires_at: string | null;
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
  recruiter_note: string;
  status: string;
  created_at: string;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25";
const primaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-3 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const dangerButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
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

const applicationReviewGroups = [
  {
    label: "Submitted",
    statuses: ["submitted"],
    description: "New candidate interest awaiting review.",
  },
  {
    label: "Reviewing",
    statuses: ["reviewing"],
    description: "Candidates currently being assessed.",
  },
  {
    label: "Proceed / Next Step",
    statuses: ["proceed"],
    description: "Candidates selected to move forward.",
  },
  {
    label: "Rejected / Closed",
    statuses: ["rejected"],
    description: "Applications no longer progressing.",
  },
] as const;

function statusLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function applicationStatusLabel(status: string) {
  return status === "proceed" ? "Next Step" : statusLabel(status);
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const color =
    status === "proceed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "rejected"
        ? "border-slate-200 bg-slate-100 text-slate-700"
        : status === "reviewing"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-[#F4B321]/40 bg-[#FFF8E6] text-[var(--iseya-navy)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${color}`}>
      {applicationStatusLabel(status)}
    </span>
  );
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

function remainingDays(value: string | null) {
  if (!value) return null;
  return Math.max(0, Math.ceil((Date.parse(value) - Date.now()) / (24 * 60 * 60 * 1000)));
}

function noApplicantsMessage(job: JobPost) {
  if (job.status === "draft") {
    return "This draft has no applicants. Submit it for review before it can become visible to candidates.";
  }
  if (job.status === "expired") {
    return "This listing has expired and has no applicant history. Edit and resubmit it to restore visibility.";
  }
  if (job.status === "closed" || job.status === "archived") {
    return "This closed listing has no applicant history.";
  }
  return "No submitted interests for this job yet.";
}

function normalizeVerificationStatus(value: string | null | undefined) {
  const status = (value ?? "").trim().toLowerCase();
  return status === "verified" || status === "rejected" || status === "pending_review"
    ? status
    : "pending_review";
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
  const [listingActionId, setListingActionId] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [expandedApplicantsJobId, setExpandedApplicantsJobId] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("all");

  const stats = useMemo(
    () => ({
      published: jobs.filter((job) => job.status === "published").length,
      draft: jobs.filter((job) => job.status === "draft").length,
      expired: jobs.filter((job) => job.status === "expired").length,
      closed: jobs.filter((job) => job.status === "closed").length,
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
  const reviewingApplicantCount = applications.filter(
    (application) => application.status === "reviewing",
  ).length;
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
  const verificationStatus = normalizeVerificationStatus(profile?.verification_status);
  const subscriptionPlan =
    profile?.recruiter_plan === "recruiter_quarterly" ||
    profile?.recruiter_plan === "recruiter_annual"
      ? profile.recruiter_plan
      : "starter";
  const planEntitlements = getRecruiterEntitlements(
    profile?.recruiter_plan,
    profile?.recruiter_plan_status,
  );
  const activeJobUsagePercent = Math.min(
    100,
    Math.round((stats.published / planEntitlements.activeJobLimit) * 100),
  );
  const usageTone =
    activeJobUsagePercent >= 90
      ? {
          meter: "bg-rose-500",
          badge: "border-rose-200 bg-rose-50 text-rose-700",
        }
      : activeJobUsagePercent >= 70
        ? {
            meter: "bg-amber-500",
            badge: "border-amber-200 bg-amber-50 text-amber-800",
          }
        : {
            meter: "bg-[var(--iseya-gold)]",
            badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
          };
  const expiringSoonCount = jobs.filter((job) => {
    const days = job.status === "published" ? remainingDays(job.expires_at) : null;
    return days !== null && days <= 7;
  }).length;
  const listingGroups = [
    {
      label: "Expiring Soon",
      description: "Published listings requiring visibility attention",
      jobs: jobs.filter((job) => {
        const days = job.status === "published" ? remainingDays(job.expires_at) : null;
        return days !== null && days <= 7;
      }),
    },
    {
      label: "Active / Published",
      description: "Listings visible to candidates",
      jobs: jobs.filter((job) => {
        const days = job.status === "published" ? remainingDays(job.expires_at) : null;
        return job.status === "published" && (days === null || days > 7);
      }),
    },
    {
      label: "In Review",
      description: "Listings submitted for moderation",
      jobs: jobs.filter((job) => job.status === "pending_review"),
    },
    {
      label: "Draft",
      description: "Listings saved within your workspace",
      jobs: jobs.filter((job) => job.status === "draft"),
    },
    {
      label: "Closed / Archived",
      description: "Historical listings retained for reference",
      jobs: jobs.filter((job) =>
        ["expired", "closed", "archived", "rejected"].includes(job.status),
      ),
    },
  ].filter((group) => group.jobs.length > 0);
  const subscriptionDaysRemaining =
    subscriptionPlan === "starter"
      ? null
      : remainingDays(profile?.recruiter_subscription_expires_at ?? null);
  const subscriptionStatusLabel =
    subscriptionPlan === "starter" ? "Active" : statusLabel(profile?.recruiter_plan_status || "active");
  const subscriptionStatusTone =
    subscriptionStatusLabel === "Active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";
  const renewalLabel =
    subscriptionPlan === "starter" || !profile?.recruiter_subscription_expires_at
      ? "No renewal required"
      : `Renews ${formatDate(profile.recruiter_subscription_expires_at)}`;
  const canEditJobDraft = profileComplete;
  const canSubmitJobForReview = profileComplete && verificationStatus === "verified";
  const verificationMessage =
    !profile
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
    window.requestAnimationFrame(() => {
      scrollToWorkspaceSection("create-job-post");
    });
  }

  async function updateJobStatus(job: JobPost, nextStatus: string) {
    setListingActionId(job.id);
    setStatus("");

    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Unable to update this listing right now.");
      }

      setStatus("Listing status updated.");
      await loadDashboard({ preserveStatus: true });
    } catch {
      setStatus("Unable to update this listing right now. Please try again.");
    } finally {
      setListingActionId("");
    }
  }

  async function deleteJob(job: JobPost) {
    if (!window.confirm(`Delete ${job.job_title}?`)) {
      return;
    }

    setListingActionId(job.id);
    setStatus("");

    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Unable to delete this listing right now.");
      }

      setStatus("Listing deleted.");
      await loadDashboard({ preserveStatus: true });
    } catch {
      setStatus("Unable to delete this listing right now. Please try again.");
    } finally {
      setListingActionId("");
    }
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

  async function saveApplicationNote(application: Application, recruiterNote: string) {
    setStatus("");

    try {
      const response = await fetch("/api/recruiter/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id, recruiterNote }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save internal note right now.");
      }

      setApplications((current) =>
        current.map((entry) =>
          entry.id === application.id ? { ...entry, recruiter_note: recruiterNote.trim() } : entry,
        ),
      );
      setSelectedApplication((current) =>
        current?.id === application.id
          ? { ...current, recruiter_note: recruiterNote.trim() }
          : current,
      );
      setStatus("Internal recruiter note saved.");
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save internal note right now.");
      return false;
    }
  }

  function scrollToWorkspaceSection(sectionId: string) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <section className="mx-auto max-w-[92rem] px-5 py-8 sm:px-8">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          Recruiter Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-4xl">
          Your protected hiring workspace.
        </h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Manage your company&apos;s listings, review applicants by role, and monitor visibility from one recruiter-owned console.
        </p>
      </div>

      {status ? (
        <p role="status" aria-live="polite" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
          {status}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8 space-y-5" aria-label="Loading recruiter workspace">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 h-9 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[var(--iseya-navy)]">Loading recruiter workspace...</p>
            <div className="mt-4 h-4 max-w-xl animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Subscription Overview
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">
                    {recruiterPlanLabel(subscriptionPlan)}
                  </h2>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${subscriptionStatusTone}`}>
                    {subscriptionStatusLabel}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <SubscriptionDetail label="Renewal Date" value={renewalLabel} />
                  <SubscriptionDetail
                    label="Visibility Duration"
                    value={`${planEntitlements.visibilityDays} days per published job`}
                  />
                </div>
                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--iseya-navy)]">Active Job Usage</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${usageTone.badge}`}>
                      {stats.published} / {planEntitlements.activeJobLimit} used
                    </span>
                  </div>
                  <div
                    className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label="Active job capacity used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={activeJobUsagePercent}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${usageTone.meter}`}
                      style={{ width: `${activeJobUsagePercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {Math.max(0, planEntitlements.activeJobLimit - stats.published)} active listing
                    {planEntitlements.activeJobLimit - stats.published === 1 ? "" : "s"} remaining.
                    Draft jobs are unlimited.
                  </p>
                </div>
              </div>
              <div id="plan-guidance" className="scroll-mt-24 border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 xl:border-l xl:border-t-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Plan Guidance
                </p>
                <div className="mt-4 space-y-3">
                  {subscriptionDaysRemaining !== null && subscriptionDaysRemaining <= 7 ? (
                    <SubscriptionNotice>
                      Your subscription renews in {subscriptionDaysRemaining} day{subscriptionDaysRemaining === 1 ? "" : "s"}.
                    </SubscriptionNotice>
                  ) : null}
                  {activeJobUsagePercent >= 70 ? (
                    <SubscriptionNotice>You are nearing your active job limit.</SubscriptionNotice>
                  ) : null}
                  {expiringSoonCount > 0 ? (
                    <SubscriptionNotice>
                      {expiringSoonCount} job{expiringSoonCount === 1 ? "" : "s"} expire within 7 days.
                    </SubscriptionNotice>
                  ) : null}
                  {activeJobUsagePercent < 70 &&
                  expiringSoonCount === 0 &&
                  (subscriptionDaysRemaining === null || subscriptionDaysRemaining > 7) ? (
                    <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                      Your active listings are within plan capacity and no visibility deadlines require attention.
                    </p>
                  ) : null}
                </div>
                <div className="mt-5">
                  {subscriptionPlan === "starter" ? (
                    <>
                      <p className="mb-3 text-sm leading-6 text-slate-600">
                        Increase active listings and extend visibility with Recruiter Quarterly.
                      </p>
                      <Link href="/recruiters/pricing" className={primaryButton}>
                        Upgrade to Recruiter Quarterly
                      </Link>
                    </>
                  ) : subscriptionPlan === "recruiter_quarterly" ? (
                    <>
                      <p className="mb-3 text-sm leading-6 text-slate-600">
                        Hiring year-round? Annual extends visibility and increases active capacity.
                      </p>
                      <Link href="/recruiters/pricing" className={secondaryButton}>
                        View Recruiter Annual
                      </Link>
                    </>
                  ) : (
                    <Link href="/recruiters/pricing" className={secondaryButton}>
                      View Plan Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Active Listings", stats.published],
              ["Draft Jobs", stats.draft],
              ["Reviewing Applicants", reviewingApplicantCount],
              ["Expiring Listings", expiringSoonCount],
              ["Total Applicants", stats.applicants],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="workspace-shortcuts-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Workspace Shortcuts
            </p>
            <h2 id="workspace-shortcuts-title" className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
              Quick Workspace Actions
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Jump directly to the recruiter task that needs attention.
            </p>
            <nav aria-label="Recruiter workspace sections" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Update Company Profile",
                  copy: "Maintain verification details.",
                  sectionId: "company-profile",
                },
                {
                  label: "Create Job Post",
                  copy: "Prepare a new listing draft.",
                  sectionId: "create-job-post",
                },
                {
                  label: "Review Applicants",
                  copy: "Open the current review queue.",
                  sectionId: "applicant-activity",
                },
                {
                  label: "View My Listings",
                  copy: "Manage owned job posts.",
                  sectionId: "owned-listings",
                },
                {
                  label: "Manage Plan",
                  copy: "Review capacity and visibility.",
                  sectionId: "plan-guidance",
                },
              ].map((shortcut) => (
                <button
                  key={shortcut.sectionId}
                  type="button"
                  onClick={() => scrollToWorkspaceSection(shortcut.sectionId)}
                  aria-label={`${shortcut.label}: ${shortcut.copy}`}
                  className="min-h-24 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
                >
                  <span className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    {shortcut.label}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-slate-600">
                    {shortcut.copy}
                  </span>
                </button>
              ))}
            </nav>
          </section>

          <span id="my-jobs" className="block scroll-mt-24" aria-hidden="true" />
          <section id="owned-listings" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Owned Listings
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
                  Active job listings
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Only jobs created within your recruiter workspace appear here.
                </p>
              </div>
              <a href="#create-job-post" className={primaryButton}>
                Post a Job
              </a>
            </div>
            {applications.length > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Applicant status filters">
                <p className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Applicant Status
                </p>
                {["all", "submitted", "reviewing", "proceed", "rejected"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setApplicationFilter(filter)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 ${
                      applicationFilter === filter
                        ? "border-[var(--iseya-gold)] bg-[#FFF8E6] text-[var(--iseya-navy)]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[var(--iseya-gold)]"
                    }`}
                  >
                    {filter === "all" ? "All Applicants" : applicationStatusLabel(filter)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              {jobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-600">
                  Post your first job to start receiving applicants.
                </div>
              ) : (
                listingGroups.map((group) => (
                  <section key={group.label} aria-label={group.label}>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--iseya-navy)]">
                          {group.label}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                        {group.jobs.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {group.jobs.map((job) => {
                        const jobApplications = applicationsByJobId.get(job.id) ?? [];
                        const visibleApplications =
                          applicationFilter === "all"
                            ? jobApplications
                            : jobApplications.filter(
                                (application) => application.status === applicationFilter,
                              );
                        const visibleReviewGroups = applicationReviewGroups
                          .map((applicationGroup) => ({
                            ...applicationGroup,
                            applications: visibleApplications.filter((application) =>
                              applicationGroup.statuses.some(
                                (status) => status === application.status,
                              ),
                            ),
                          }))
                          .filter((applicationGroup) => applicationGroup.applications.length > 0);
                        const applicantsExpanded = expandedApplicantsJobId === job.id;
                        return (
                          <article key={job.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h4 className="text-lg font-semibold text-[var(--iseya-navy)]">
                                  {job.job_title}
                                </h4>
                                <p className="mt-1 text-sm font-medium text-slate-600">
                                  {job.company_name} | {job.location || "Location flexible"} |{" "}
                                  {statusLabel(job.workplace_type)}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-[var(--iseya-gold)]/40 bg-[#FFF8E6] px-3 py-1 text-xs font-bold text-[var(--iseya-navy)]">
                                    {statusLabel(job.status)}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500">
                                    {jobApplications.length} applicant{jobApplications.length === 1 ? "" : "s"}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500">
                                    Created {formatDate(job.created_at)}
                                  </span>
                                </div>
                                {job.status === "published" && job.expires_at ? (
                                  <p className="mt-2 text-xs font-semibold text-slate-600">
                                    Visibility expires in {remainingDays(job.expires_at)} days ({formatDate(job.expires_at)})
                                  </p>
                                ) : job.status === "expired" ? (
                                  <p className="mt-2 text-xs font-semibold text-amber-700">
                                    Visibility expired. Edit and submit this job for review to republish it.
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedApplicantsJobId(applicantsExpanded ? "" : job.id)}
                                  className={primaryButton}
                                >
                                  {applicantsExpanded ? "Hide Applicants" : "View Applicants"}
                                </button>
                                <button type="button" onClick={() => editJob(job)} className={secondaryButton}>
                                  Edit Job
                                </button>
                                <button type="button" onClick={() => updateJobStatus(job, "closed")} disabled={listingActionId === job.id} className={secondaryButton}>
                                  {listingActionId === job.id ? "Updating..." : "Close Job"}
                                </button>
                                <button type="button" onClick={() => deleteJob(job)} disabled={listingActionId === job.id} className={dangerButton}>
                                  {listingActionId === job.id ? "Updating..." : "Delete Job"}
                                </button>
                              </div>
                            </div>
                            {applicantsExpanded ? (
                              <section className="mt-4 border-t border-slate-200 pt-4" aria-labelledby={`job-review-${job.id}`}>
                                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                                        Job Context
                                      </p>
                                      <h5 id={`job-review-${job.id}`} className="mt-2 text-base font-semibold text-[var(--iseya-navy)]">
                                        {job.job_title}
                                      </h5>
                                      <p className="mt-1 text-xs leading-5 text-slate-600">
                                        {jobApplications.length} applicant{jobApplications.length === 1 ? "" : "s"} attached to this recruiter-owned listing.
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="rounded-full border border-[var(--iseya-gold)]/40 bg-[#FFF8E6] px-3 py-1 text-xs font-bold text-[var(--iseya-navy)]">
                                        {statusLabel(job.status)}
                                      </span>
                                      {job.status === "published" && job.expires_at ? (
                                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                          Expires {formatDate(job.expires_at)}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <a
                                    href="#owned-listings"
                                    className="mt-3 inline-flex text-xs font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
                                  >
                                    Back to My Jobs
                                  </a>
                                </div>
                                {jobApplications.length === 0 ? (
                                  <p className="rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-600">
                                    {noApplicantsMessage(job)}
                                  </p>
                                ) : visibleApplications.length === 0 ? (
                                  <p className="rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-600">
                                    No applicants are in the selected status group for this role.
                                  </p>
                                ) : (
                                  <div className="space-y-5">
                                    {visibleReviewGroups.map((applicationGroup) => (
                                      <section key={applicationGroup.label} aria-label={`${applicationGroup.label} applicants`}>
                                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <h6 className="text-sm font-semibold text-[var(--iseya-navy)]">
                                              {applicationGroup.label}
                                            </h6>
                                            <p className="mt-1 text-xs text-slate-500">{applicationGroup.description}</p>
                                          </div>
                                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                                            {applicationGroup.applications.length}
                                          </span>
                                        </div>
                                        <div className="space-y-3">
                                          {applicationGroup.applications.map((application) => (
                                            <article key={application.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0">
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <ApplicationStatusBadge status={application.status} />
                                                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                      Applied {formatDate(application.created_at)}
                                                    </span>
                                                  </div>
                                                  <h6 className="mt-3 text-base font-semibold text-[var(--iseya-navy)]">
                                                    {application.full_name || "Applicant"}
                                                  </h6>
                                                  <p className="mt-1 text-sm font-medium text-slate-600">
                                                    Applied for {job.job_title}
                                                  </p>
                                                  <p className="mt-1 text-xs leading-5 text-slate-600">
                                                    {application.location || "Location not provided"}
                                                  </p>
                                                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                                      {application.resume_file_url ? "Resume available" : "No resume attached"}
                                                    </span>
                                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                                      {application.cover_letter_file_url ? "Cover letter available" : "No cover letter attached"}
                                                    </span>
                                                    {application.recruiter_note ? (
                                                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                                                        Internal note saved
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                </div>
                                                <div className="flex flex-col gap-3 lg:max-w-[21rem]">
                                                  <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => setSelectedApplication(application)} className={primaryButton}>
                                                      Review
                                                    </button>
                                                    <button type="button" onClick={() => setSelectedApplication(application)} className={secondaryButton}>
                                                      Add Internal Note
                                                    </button>
                                                  </div>
                                                  <div>
                                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                                      Update Status
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                      <button type="button" onClick={() => updateApplicationStatus(application, "reviewing")} className={secondaryButton}>
                                                        Reviewing
                                                      </button>
                                                      <button type="button" onClick={() => updateApplicationStatus(application, "proceed")} className={primaryButton}>
                                                        Next Step
                                                      </button>
                                                      <button type="button" onClick={() => updateApplicationStatus(application, "rejected")} className={dangerButton}>
                                                        Reject
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </article>
                                          ))}
                                        </div>
                                      </section>
                                    ))}
                                  </div>
                                )}
                              </section>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>
          </section>

          <section id="applicant-activity" aria-labelledby="applicant-activity-title" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Applicant Activity
                </p>
                <h2 id="applicant-activity-title" className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
                  Current review queue
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Applicants shown here are attached only to your company&apos;s job listings.
                </p>
              </div>
              <a href="#owned-listings" className={secondaryButton}>
                View listings
              </a>
            </div>
            {applications.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No applicant activity yet. Publish a listing to start receiving candidate interest.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Applicant status summary">
                  {applicationReviewGroups.map((applicationGroup) => (
                    <div key={applicationGroup.label} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <p className="text-xs font-semibold text-slate-600">{applicationGroup.label}</p>
                      <p className="mt-1 text-xl font-semibold text-[var(--iseya-navy)]">
                        {applications.filter((application) =>
                          applicationGroup.statuses.some(
                            (status) => status === application.status,
                          ),
                        ).length}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {applications.slice(0, 3).map((application) => (
                    <article key={application.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <ApplicationStatusBadge status={application.status} />
                      <h3 className="mt-3 text-sm font-semibold text-[var(--iseya-navy)]">
                        {application.full_name || "Applicant"}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{application.job_title}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Submitted {formatDate(application.created_at)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedApplication(application)}
                        className={`${secondaryButton} mt-3 w-full`}
                      >
                        Review Applicant
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <NotificationPanel
            title="Recent recruiter-specific updates"
            subtitle="Only moderation and applicant activity tied to your recruiter workspace appears here."
            scope="recruiter"
            compact
            initialVisibleCount={3}
          />

          <section id="company-profile" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Company Profile
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
                  {profile?.company_name || "Recruiter profile pending"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Verification status: {profile ? statusLabel(verificationStatus) : "Not submitted"}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Verified company profiles help protect candidates from misleading listings. Submitted jobs remain subject to ISEYA moderation before public publication.
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

          <span id="post-job" className="block scroll-mt-24" aria-hidden="true" />
          <section id="create-job-post" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

        </div>
      )}
      {selectedApplication ? (
        <ApplicantModal
          key={selectedApplication.id}
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdate={(status) => updateApplicationStatus(selectedApplication, status)}
          onSaveNote={(note) => saveApplicationNote(selectedApplication, note)}
        />
      ) : null}
    </section>
  );
}

function ApplicantModal({
  application,
  onClose,
  onUpdate,
  onSaveNote,
}: {
  application: Application;
  onClose: () => void;
  onUpdate: (status: string) => void;
  onSaveNote: (note: string) => Promise<boolean>;
}) {
  const [internalNote, setInternalNote] = useState(application.recruiter_note ?? "");
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !noteSaving) onClose();
    }

    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [noteSaving, onClose]);

  async function saveNote() {
    setNoteSaving(true);
    await onSaveNote(internalNote);
    setNoteSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-modal-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Applicant Review
            </p>
            <h2 id="applicant-modal-title" className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              {application.full_name || "Applicant"}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{application.job_title}</p>
            <div className="mt-3">
              <ApplicationStatusBadge status={application.status} />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close applicant review" className={secondaryButton}>
            Close
          </button>
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
          Candidate Materials &amp; Details
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Internal Recruiter Note
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Visible only to recruiter and admin reviewers.
          </p>
          <textarea
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            maxLength={3000}
            placeholder="Add private review notes..."
            className={`${inputClass} min-h-24 resize-y leading-6`}
          />
          <button type="button" onClick={saveNote} disabled={noteSaving} className={`${secondaryButton} mt-3`}>
            {noteSaving ? "Saving..." : "Save Internal Note"}
          </button>
        </section>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
          Update Status
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => onUpdate("reviewing")} className={secondaryButton}>
            Mark Reviewing
          </button>
          <button type="button" onClick={() => onUpdate("proceed")} className={primaryButton}>
            Next Step
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

function SubscriptionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}

function SubscriptionNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-[#FFF8E6] p-4 text-sm leading-6 text-[var(--iseya-navy)]">
      {children}
    </p>
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
          className="mt-1 block rounded-sm text-sm font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
          aria-label={`Open ${label} attachment in a new tab`}
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
