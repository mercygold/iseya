"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { enableInstitutionAccess } from "@/lib/featureFlags";
import { subscriptionLabel, normalizeSubscriptionPlan } from "@/lib/subscription";

type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  resume_download_credits: number | null;
  optimization_credits: number | null;
  created_at: string | null;
};

type Organization = {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  seats_allowed: number;
  seats_used: number;
};

type InstitutionModeration = {
  id: string;
  user_id: string;
  institution_name: string;
  institution_type: string;
  admin_name: string;
  admin_email: string;
  website: string;
  country: string;
  state_region: string | null;
  city: string;
  student_email_domain: string;
  access_status: string;
  access_start_date: string | null;
  access_end_date: string | null;
  access_notes: string | null;
  estimated_student_coverage: number | null;
  seat_limit: number | null;
  active_seats: number;
  package_type: string | null;
  annual_contract_value: number | null;
  price_per_student: number | null;
  discount_notes: string | null;
  auto_domain_access: boolean;
  created_at: string;
  updated_at: string;
};

type RecruiterModeration = {
  id: string;
  user_id: string;
  company_name: string;
  recruiter_name: string;
  work_email: string;
  company_website: string | null;
  linkedin_company_url: string | null;
  phone_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country: string | null;
  company_location: string | null;
  industry: string | null;
  industry_other: string | null;
  company_size: string | null;
  hiring_focus: string | null;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  stale_duplicate_count: number;
};

type JobPostModeration = {
  id: string;
  recruiter_id: string;
  job_title: string;
  company_name: string;
  location: string;
  country: string | null;
  workplace_type: string;
  employment_type: string;
  salary_range: string | null;
  application_url: string | null;
  role_summary: string;
  skills: string[];
  application_deadline: string | null;
  status: string;
  opportunity_type: string;
  source_name: string | null;
  source_description: string | null;
  applicants_count: number;
  created_at: string;
};

type CuratedOpportunityDraft = {
  jobTitle: string;
  companyName: string;
  location: string;
  country: string;
  workplaceType: string;
  employmentType: string;
  salaryRange: string;
  externalApplyUrl: string;
  sourceName: string;
  jobDescription: string;
  skillsKeywords: string;
  applicationDeadline: string;
  status: string;
};

type ManagePayload = {
  users: ManagedUser[];
  stats: {
    totalUsers: number;
    starterUsers: number;
    plusUsers: number;
    proMonthlyUsers: number;
    proAnnualUsers: number;
    recentSignups: ManagedUser[];
    recentPaidUsers: ManagedUser[];
  };
  organizations: Organization[];
  institutions: InstitutionModeration[];
  recruiters: RecruiterModeration[];
  jobPosts: JobPostModeration[];
};

const inputClass =
  "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25";
const primaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-3 py-2 text-xs font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] disabled:cursor-not-allowed disabled:opacity-60";
const institutionPackages = [
  "Pilot Access: up to 500 students",
  "Department Access: 501-2,000 students",
  "Campus Access: 2,001-10,000 students",
  "Enterprise Access: 10,000+ students",
];
const emptyCuratedOpportunityDraft: CuratedOpportunityDraft = {
  jobTitle: "",
  companyName: "",
  location: "",
  country: "",
  workplaceType: "remote",
  employmentType: "full-time",
  salaryRange: "",
  externalApplyUrl: "",
  sourceName: "",
  jobDescription: "",
  skillsKeywords: "",
  applicationDeadline: "",
  status: "draft",
};

function packageValue(option: string) {
  return option.split(":")[0];
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function planLabel(plan: string | null) {
  return subscriptionLabel(normalizeSubscriptionPlan(plan));
}

function statusLabel(status: string | null) {
  return (status || "free")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}

export default function ManageDashboard() {
  const [payload, setPayload] = useState<ManagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterModeration | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionModeration | null>(null);
  const [curatedDraft, setCuratedDraft] = useState<CuratedOpportunityDraft>(
    emptyCuratedOpportunityDraft,
  );
  const [curatedSaving, setCuratedSaving] = useState(false);
  const [curatedImporting, setCuratedImporting] = useState(false);
  const [editingCuratedId, setEditingCuratedId] = useState("");
  const [curatedQuery, setCuratedQuery] = useState("");
  const [draft, setDraft] = useState({
    subscriptionPlan: "free",
    subscriptionStatus: "free",
    resumeDownloadCredits: 0,
    optimizationCredits: 0,
  });

  async function loadManageData(options?: { preserveStatus?: boolean }) {
    setLoading(true);
    if (!options?.preserveStatus) {
      setStatus("");
    }

    try {
      const response = await fetch("/api/manage/users", { cache: "no-store" });
      const data = (await response.json()) as ManagePayload & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to load admin data.");
      }

      setPayload(data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadManageData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const users = payload?.users ?? [];

    if (!needle) {
      return users;
    }

    return users.filter((user) =>
      [
        user.email,
        user.full_name,
        user.subscription_plan,
        user.subscription_status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [payload?.users, query]);
  const curatedOpportunities = (payload?.jobPosts ?? []).filter(
    (job) => job.opportunity_type === "curated_opportunity",
  );
  const filteredCuratedOpportunities = curatedOpportunities.filter((job) => {
    const needle = curatedQuery.trim().toLowerCase();
    if (!needle) return true;

    return [
      job.job_title,
      job.company_name,
      job.source_name,
      job.status,
      job.country,
      job.employment_type,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
  const nativeJobPosts = (payload?.jobPosts ?? []).filter(
    (job) => job.opportunity_type !== "curated_opportunity",
  );

  function startEdit(user: ManagedUser) {
    setEditingUserId(user.id);
    setDraft({
      subscriptionPlan: normalizeSubscriptionPlan(user.subscription_plan),
      subscriptionStatus: user.subscription_status || "free",
      resumeDownloadCredits: user.resume_download_credits ?? 0,
      optimizationCredits: user.optimization_credits ?? 0,
    });
  }

  async function saveUser(user: ManagedUser) {
    const confirmed = window.confirm(
      `Update plan and credits for ${user.email ?? "this user"}?`,
    );

    if (!confirmed) {
      return;
    }

    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ...draft,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to update user.");
      }

      setStatus("User plan updated.");
      setEditingUserId("");
      await loadManageData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update user.");
    }
  }

  async function updateRecruiterStatus(recruiter: RecruiterModeration, verificationStatus: string) {
    const confirmed = window.confirm(
      `Set ${recruiter.company_name || recruiter.work_email} to ${statusLabel(verificationStatus)}?`,
    );

    if (!confirmed) return;

    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterUserId: recruiter.user_id, verificationStatus }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to update recruiter review status.");
      }

      setStatus("Recruiter review status updated.");
      await loadManageData({ preserveStatus: true });
      setSelectedRecruiter((current) =>
        current?.user_id === recruiter.user_id
          ? { ...current, verification_status: verificationStatus }
          : current,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update recruiter review status.");
    }
  }

  async function updateInstitutionStatus(
    institution: InstitutionModeration,
    accessStatus: string,
    settings: {
      seatLimit: string;
      packageType: string;
      annualContractValue: string;
      pricePerStudent: string;
      discountNotes: string;
      accessStartDate: string;
      accessEndDate: string;
      autoDomainAccess: boolean;
    },
  ) {
    const confirmed = window.confirm(
      `Set ${institution.institution_name} to ${statusLabel(accessStatus)}?`,
    );
    if (!confirmed) return;
    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionProfileId: institution.id,
          verificationStatus: accessStatus,
          institutionSeatLimit: settings.seatLimit,
          institutionPackageType: settings.packageType,
          institutionAnnualContractValue: settings.annualContractValue,
          institutionPricePerStudent: settings.pricePerStudent,
          institutionDiscountNotes: settings.discountNotes,
          institutionAccessStartDate: settings.accessStartDate,
          institutionAccessEndDate: settings.accessEndDate,
          institutionAutoDomainAccess: settings.autoDomainAccess,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to update institution access status.");
      setStatus("Institution access status updated.");
      setSelectedInstitution((current) =>
        current?.id === institution.id
          ? {
              ...current,
              access_status: accessStatus,
              seat_limit: settings.seatLimit ? Number(settings.seatLimit) : null,
              package_type: settings.packageType || null,
              annual_contract_value: settings.annualContractValue ? Number(settings.annualContractValue) : null,
              price_per_student: settings.pricePerStudent ? Number(settings.pricePerStudent) : null,
              discount_notes: settings.discountNotes || null,
              access_start_date: settings.accessStartDate || null,
              access_end_date: settings.accessEndDate || null,
              auto_domain_access: settings.autoDomainAccess,
            }
          : current,
      );
      await loadManageData({ preserveStatus: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update institution access status.");
    }
  }

  async function removeStaleRecruiterDuplicates(recruiter: RecruiterModeration) {
    const confirmed = window.confirm(
      `Remove ${recruiter.stale_duplicate_count} duplicate recruiter profile record(s) for ${recruiter.company_name || recruiter.work_email}? The active verified profile will be preserved.`,
    );

    if (!confirmed) return;

    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterProfileId: recruiter.id, deletionMode: "stale_duplicates" }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to remove duplicate recruiter profiles.");
      }

      setStatus("Duplicate recruiter profiles removed. The active profile was preserved.");
      await loadManageData({ preserveStatus: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to remove duplicate recruiter profiles.");
    }
  }

  async function deleteRecruiterProfile(recruiter: RecruiterModeration) {
    const confirmed = window.confirm(
      `This will remove the recruiter’s company profile and reset their posting access. Delete profile for ${recruiter.company_name || recruiter.work_email}?`,
    );

    if (!confirmed) return;

    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterProfileId: recruiter.id, deletionMode: "profile_reset" }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete recruiter profile.");
      }

      setStatus("Recruiter profile deleted.");
      setSelectedRecruiter((current) => (current?.id === recruiter.id ? null : current));
      await loadManageData({ preserveStatus: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete recruiter profile.");
    }
  }

  async function updateJobStatus(job: JobPostModeration, jobStatus: string) {
    const confirmed = window.confirm(`Set ${job.job_title} to ${statusLabel(jobStatus)}?`);

    if (!confirmed) return;

    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobPostId: job.id, jobStatus }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to update job post status.");
      }

      setStatus("Job post status updated.");
      if (editingCuratedId === job.id) {
        setCuratedDraft((current) => ({ ...current, status: jobStatus }));
      }
      await loadManageData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update job post status.");
    }
  }

  async function saveCuratedOpportunity(statusOverride?: "draft" | "published" | "closed") {
    const nextStatus = statusOverride ?? curatedDraft.status;
    setStatus("");
    setCuratedSaving(true);

    try {
      const response = await fetch("/api/manage/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...curatedDraft,
          status: nextStatus,
          curatedJobPostId: editingCuratedId || undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save curated opportunity right now.");
      }

      setStatus(
        editingCuratedId
          ? "Curated opportunity updated."
          : nextStatus === "published"
          ? "Curated opportunity published."
          : "Curated opportunity saved.",
      );
      setCuratedDraft(emptyCuratedOpportunityDraft);
      setEditingCuratedId("");
      await loadManageData({ preserveStatus: true });
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to save curated opportunity right now.",
      );
    } finally {
      setCuratedSaving(false);
    }
  }

  function createCuratedOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveCuratedOpportunity();
  }

  async function importStarterCuratedOpportunities() {
    if (!window.confirm("Import starter curated opportunities as drafts? Existing matching records will be skipped.")) {
      return;
    }

    setStatus("");
    setCuratedImporting(true);

    try {
      const response = await fetch("/api/manage/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_starter_curated_opportunities" }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        imported?: number;
        skipped?: number;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to import starter opportunities right now.");
      }

      setStatus(
        `${data.imported ?? 0} starter curated opportunities imported as drafts. ${data.skipped ?? 0} duplicates skipped.`,
      );
      await loadManageData({ preserveStatus: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to import starter opportunities right now.");
    } finally {
      setCuratedImporting(false);
    }
  }

  function editCuratedOpportunity(job: JobPostModeration) {
    setEditingCuratedId(job.id);
    setCuratedDraft({
      jobTitle: job.job_title,
      companyName: job.company_name,
      location: job.location,
      country: job.country ?? "",
      workplaceType: job.workplace_type,
      employmentType: job.employment_type,
      salaryRange: job.salary_range ?? "",
      externalApplyUrl: job.application_url ?? "",
      sourceName: job.source_name ?? "",
      jobDescription: job.role_summary,
      skillsKeywords: job.skills.join(", "),
      applicationDeadline: job.application_deadline ?? "",
      status: job.status,
    });
  }

  function startNewCuratedOpportunity() {
    setEditingCuratedId("");
    setCuratedDraft(emptyCuratedOpportunityDraft);
  }

  async function deleteCuratedOpportunity(job: JobPostModeration) {
    if (!window.confirm(`Delete curated opportunity "${job.job_title}"?`)) {
      return;
    }

    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curatedJobPostId: job.id }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete curated opportunity.");
      }

      setStatus("Curated opportunity deleted.");
      if (editingCuratedId === job.id) {
        setEditingCuratedId("");
        setCuratedDraft(emptyCuratedOpportunityDraft);
      }
      await loadManageData({ preserveStatus: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete curated opportunity.");
    }
  }

  if (loading) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--iseya-navy)]">Loading admin data...</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--iseya-navy)]">
          {status || "Unable to load admin data."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      {status ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
          {status}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={payload.stats.totalUsers} />
        <StatCard label="Starter" value={payload.stats.starterUsers} />
        <StatCard label="Plus" value={payload.stats.plusUsers} />
        <StatCard label="Pro Monthly" value={payload.stats.proMonthlyUsers} />
        <StatCard label="Pro Annual" value={payload.stats.proAnnualUsers} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityCard title="Recent Signups" users={payload.stats.recentSignups} />
        <ActivityCard title="Recent Paid Users" users={payload.stats.recentPaidUsers} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              User Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              Users and Plans
            </h2>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email, plan, or status"
            className={`${inputClass} w-full lg:w-80`}
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-3">Email</th>
                <th className="border-b border-slate-200 px-3 py-3">Plan</th>
                <th className="border-b border-slate-200 px-3 py-3">Status</th>
                <th className="border-b border-slate-200 px-3 py-3">Exports</th>
                <th className="border-b border-slate-200 px-3 py-3">Credits</th>
                <th className="border-b border-slate-200 px-3 py-3">Created</th>
                <th className="border-b border-slate-200 px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const editing = editingUserId === user.id;

                return (
                  <tr key={user.id} className="align-top">
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-[var(--iseya-navy)]">
                      {user.email || "No email"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <select
                          value={draft.subscriptionPlan}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              subscriptionPlan: event.target.value,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="free">Starter</option>
                          <option value="plus">Plus</option>
                          <option value="pro_monthly">Pro Monthly</option>
                          <option value="pro_annual">Pro Annual</option>
                        </select>
                      ) : (
                        planLabel(user.subscription_plan)
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <select
                          value={draft.subscriptionStatus}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              subscriptionStatus: event.target.value,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="free">Free</option>
                          <option value="active">Active</option>
                          <option value="canceled">Canceled</option>
                          <option value="past_due">Past Due</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        statusLabel(user.subscription_status)
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={draft.resumeDownloadCredits}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              resumeDownloadCredits: Number(event.target.value),
                            }))
                          }
                          className={`${inputClass} w-24`}
                        />
                      ) : (
                        user.resume_download_credits ?? 0
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={draft.optimizationCredits}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              optimizationCredits: Number(event.target.value),
                            }))
                          }
                          className={`${inputClass} w-24`}
                        />
                      ) : (
                        user.optimization_credits ?? 0
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveUser(user)} className={primaryButton}>
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingUserId("")} className={secondaryButton}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startEdit(user)} className={secondaryButton}>
                          Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ModerationCard title="Recruiter Moderation" subtitle="Review recruiter accounts before broader access.">
          {(payload.recruiters ?? []).length > 0 ? (
            <div className="space-y-3">
              {payload.recruiters.map((recruiter) => (
                <div key={recruiter.user_id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedRecruiter(recruiter)}
                        className="truncate text-left text-sm font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] underline-offset-4"
                      >
                        {recruiter.company_name || "Company pending"}
                      </button>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {recruiter.recruiter_name || "Recruiter"} · {recruiter.work_email}
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                        {statusLabel(recruiter.verification_status)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button type="button" onClick={() => setSelectedRecruiter(recruiter)} className={secondaryButton}>
                        View
                      </button>
                      {recruiter.stale_duplicate_count > 0 ? (
                        <button type="button" onClick={() => removeStaleRecruiterDuplicates(recruiter)} className={secondaryButton}>
                          Remove Duplicates
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recruiter accounts to review yet.</p>
          )}
        </ModerationCard>

        <ModerationCard title="Job Post Moderation" subtitle="Publish, review, or close recruiter job listings.">
          {nativeJobPosts.length > 0 ? (
            <div className="space-y-3">
              {nativeJobPosts.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--iseya-navy)]">
                        {job.job_title}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {job.company_name} · {job.applicants_count} applicants
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                        {statusLabel(job.status)}
                      </p>
                    </div>
                    <select
                      value={job.status}
                      onChange={(event) => updateJobStatus(job, event.target.value)}
                      className={inputClass}
                    >
                      <option value="draft">Draft</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="published">Published</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No job posts to review yet.</p>
          )}
        </ModerationCard>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Admin Moderation
          </p>
          <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">
                Curated Opportunity Posting
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Review external roles sourced by ISEYA before publishing them to candidates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.1em]">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-700">Curated Opportunity</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">Recruiter Posted</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-800">Verified Recruiter</span>
              <span className="rounded-full border border-amber-200 bg-[#FFF8E6] px-2.5 py-1 text-[var(--iseya-navy)]">Direct Employer</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/55 lg:border-r lg:border-b-0">
            <div className="sticky top-0 z-10 space-y-3 border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Moderation Queue
                </p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {filteredCuratedOpportunities.length}
                </span>
              </div>
              <input
                value={curatedQuery}
                onChange={(event) => setCuratedQuery(event.target.value)}
                placeholder="Search title, company, source..."
                className={`${inputClass} w-full`}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={startNewCuratedOpportunity} className={secondaryButton}>
                  New Opportunity
                </button>
                <button
                  type="button"
                  disabled={curatedImporting}
                  onClick={importStarterCuratedOpportunities}
                  className={primaryButton}
                >
                  {curatedImporting ? "Importing..." : "Import Starter"}
                </button>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Imports validated starter records as drafts and skips matching URLs.
              </p>
            </div>

            <div className="space-y-2.5 p-3 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
              {filteredCuratedOpportunities.length > 0 ? filteredCuratedOpportunities.map((job) => {
                const active = editingCuratedId === job.id;

                return (
                  <article
                    key={job.id}
                    className={`rounded-xl border p-3 transition ${
                      active
                        ? "border-[var(--iseya-gold)] bg-[#FFF8E6]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <button type="button" onClick={() => editCuratedOpportunity(job)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--iseya-navy)]">{job.job_title}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{job.company_name} · {job.source_name || "Source pending"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                          job.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : job.status === "closed"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {statusLabel(job.status)}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-xs font-medium text-slate-500">
                        {job.country || "Country pending"} · {statusLabel(job.employment_type)}
                      </p>
                    </button>
                    <div className="mt-3 flex gap-1.5">
                      <button type="button" onClick={() => editCuratedOpportunity(job)} className={`${secondaryButton} min-h-8 flex-1 px-2 py-1`}>
                        Edit
                      </button>
                      <button type="button" onClick={() => updateJobStatus(job, "published")} className={`${primaryButton} min-h-8 flex-1 px-2 py-1`}>
                        Publish
                      </button>
                      <button type="button" onClick={() => deleteCuratedOpportunity(job)} className={`${secondaryButton} min-h-8 px-2 py-1 text-rose-700`}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              }) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  No curated opportunities match this search.
                </p>
              )}
            </div>
          </aside>

          <div className="p-4 sm:p-5 lg:p-6">
            <form onSubmit={createCuratedOpportunity} className="mx-auto max-w-[900px] space-y-4">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Opportunity Editor
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-[var(--iseya-navy)]">
                    {editingCuratedId ? curatedDraft.jobTitle || "Selected Opportunity" : "New Curated Opportunity"}
                  </h3>
                </div>
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  Curated Opportunity
                </span>
              </div>

              <EditorGroup title="Basic Info">
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditorField label="Job Title">
                    <input required value={curatedDraft.jobTitle} onChange={(event) => setCuratedDraft((current) => ({ ...current, jobTitle: event.target.value }))} className={`${inputClass} w-full`} />
                  </EditorField>
                  <EditorField label="Company">
                    <input required value={curatedDraft.companyName} onChange={(event) => setCuratedDraft((current) => ({ ...current, companyName: event.target.value }))} className={`${inputClass} w-full`} />
                  </EditorField>
                  <EditorField label="Location">
                    <input required value={curatedDraft.location} onChange={(event) => setCuratedDraft((current) => ({ ...current, location: event.target.value }))} className={`${inputClass} w-full`} />
                  </EditorField>
                  <EditorField label="Country">
                    <input value={curatedDraft.country} onChange={(event) => setCuratedDraft((current) => ({ ...current, country: event.target.value }))} className={`${inputClass} w-full`} />
                  </EditorField>
                  <EditorField label="Workplace Type">
                    <select required value={curatedDraft.workplaceType} onChange={(event) => setCuratedDraft((current) => ({ ...current, workplaceType: event.target.value }))} className={`${inputClass} w-full`}>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                      <option value="not_specified">Not specified</option>
                    </select>
                  </EditorField>
                  <EditorField label="Employment Type">
                    <select required value={curatedDraft.employmentType} onChange={(event) => setCuratedDraft((current) => ({ ...current, employmentType: event.target.value }))} className={`${inputClass} w-full`}>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="temporary">Temporary</option>
                      <option value="not_specified">Not specified</option>
                    </select>
                  </EditorField>
                  <EditorField label="Salary Range optional">
                    <input value={curatedDraft.salaryRange} onChange={(event) => setCuratedDraft((current) => ({ ...current, salaryRange: event.target.value }))} placeholder="USD 80,000 - 120,000 yearly" className={`${inputClass} w-full`} />
                  </EditorField>
                  <EditorField label="Application Deadline optional">
                    <input type="date" value={curatedDraft.applicationDeadline} onChange={(event) => setCuratedDraft((current) => ({ ...current, applicationDeadline: event.target.value }))} className={`${inputClass} w-full`} />
                  </EditorField>
                </div>
              </EditorGroup>

              <EditorGroup title="Source & Classification">
                <div className="grid gap-3 sm:grid-cols-[minmax(180px,0.45fr)_minmax(0,1fr)]">
                  <EditorField label="Source">
                    <select value={curatedDraft.sourceName} onChange={(event) => setCuratedDraft((current) => ({ ...current, sourceName: event.target.value }))} className={`${inputClass} w-full`}>
                      <option value="">Select source</option>
                      <option value="Company Careers">Company Careers</option>
                      <option value="Greenhouse">Greenhouse</option>
                      <option value="Lever">Lever</option>
                      <option value="Ashby">Ashby</option>
                      <option value="YC Jobs">YC Jobs</option>
                      <option value="Recruiter Post">Recruiter Post</option>
                      <option value="Indeed discovery">Indeed discovery</option>
                      <option value="LinkedIn discovery">LinkedIn discovery</option>
                      <option value="Needs verification">Needs verification</option>
                      <option value="Other">Other</option>
                    </select>
                  </EditorField>
                  <EditorField label="External Apply URL">
                    <input required type="url" value={curatedDraft.externalApplyUrl} onChange={(event) => setCuratedDraft((current) => ({ ...current, externalApplyUrl: event.target.value }))} placeholder="https://company.example/careers/role" className={`${inputClass} w-full`} />
                  </EditorField>
                </div>
                {curatedDraft.externalApplyUrl ? (
                  <a href={curatedDraft.externalApplyUrl} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm font-medium text-blue-700 underline underline-offset-2">
                    Preview external apply destination
                  </a>
                ) : null}
              </EditorGroup>

              <EditorGroup title="Job Description">
                <textarea required value={curatedDraft.jobDescription} onChange={(event) => setCuratedDraft((current) => ({ ...current, jobDescription: event.target.value }))} className={`${inputClass} min-h-36 w-full resize-y`} />
              </EditorGroup>

              <EditorGroup title="Keywords">
                <input value={curatedDraft.skillsKeywords} onChange={(event) => setCuratedDraft((current) => ({ ...current, skillsKeywords: event.target.value }))} placeholder="Product analytics, SQL, stakeholder management" className={`${inputClass} w-full`} />
              </EditorGroup>

              <EditorGroup title="Publishing Controls">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Current Status</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] ${
                    curatedDraft.status === "published"
                      ? "bg-emerald-50 text-emerald-700"
                      : curatedDraft.status === "closed"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-50 text-amber-700"
                  }`}>
                    {statusLabel(curatedDraft.status)}
                  </span>
                  <p className="text-sm text-slate-500">Published opportunities become visible on the public jobs page.</p>
                </div>
              </EditorGroup>

              <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                <button type="button" disabled={curatedSaving} onClick={() => void saveCuratedOpportunity("draft")} className={secondaryButton}>
                  {curatedSaving ? "Saving..." : "Save Draft"}
                </button>
                <button type="button" disabled={curatedSaving} onClick={() => void saveCuratedOpportunity("published")} className={primaryButton}>
                  Publish
                </button>
                <button type="button" disabled={curatedSaving} onClick={() => void saveCuratedOpportunity("closed")} className={secondaryButton}>
                  Close
                </button>
                {editingCuratedId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const activeJob = curatedOpportunities.find((job) => job.id === editingCuratedId);
                      if (activeJob) void deleteCuratedOpportunity(activeJob);
                    }}
                    className={`${secondaryButton} text-rose-700`}
                  >
                    Delete
                  </button>
                ) : null}
                <button type="button" onClick={startNewCuratedOpportunity} className={`${secondaryButton} ml-auto`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <ModerationCard
        title="Institution Moderation"
        subtitle="Review institution access requests without exposing individual student materials."
      >
        {(payload.institutions ?? []).length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {payload.institutions.map((institution) => (
              <article key={institution.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                      {institution.institution_name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {institution.institution_type} | {institution.admin_email}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                      {statusLabel(institution.access_status)}
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelectedInstitution(institution)} className={secondaryButton}>
                    View
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No institution access requests yet.</p>
        )}
      </ModerationCard>

      {enableInstitutionAccess ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Institution Preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
            Organizations
          </h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {payload.organizations.length > 0 ? (
              payload.organizations.map((organization) => (
                <div key={organization.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-[var(--iseya-navy)]">{organization.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {organization.type} · {organization.plan} · {organization.status}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Seats {organization.seats_used} / {organization.seats_allowed}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No organizations available.</p>
            )}
          </div>
        </section>
      ) : null}

      {selectedRecruiter ? (
        <RecruiterModal
          recruiter={selectedRecruiter}
          onClose={() => setSelectedRecruiter(null)}
          onUpdate={(nextStatus) => updateRecruiterStatus(selectedRecruiter, nextStatus)}
          onRemoveDuplicates={() => removeStaleRecruiterDuplicates(selectedRecruiter)}
          onDelete={() => deleteRecruiterProfile(selectedRecruiter)}
        />
      ) : null}
      {selectedInstitution ? (
        <InstitutionModal
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
          onUpdate={(nextStatus, settings) => updateInstitutionStatus(selectedInstitution, nextStatus, settings)}
        />
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--iseya-navy)]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function RecruiterModal({
  recruiter,
  onClose,
  onUpdate,
  onRemoveDuplicates,
  onDelete,
}: {
  recruiter: RecruiterModeration;
  onClose: () => void;
  onUpdate: (status: string) => void;
  onRemoveDuplicates: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
      <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Recruiter Verification
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              {recruiter.company_name || "Company pending"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {statusLabel(recruiter.verification_status)}
            </p>
          </div>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail label="Company name" value={recruiter.company_name} />
          <Detail label="Recruiter name" value={recruiter.recruiter_name} />
          <Detail label="Work email" value={recruiter.work_email} />
          <Detail label="Company website" value={recruiter.company_website} />
          <Detail label="LinkedIn company URL" value={recruiter.linkedin_company_url} />
          <Detail label="Phone number" value={recruiter.phone_number} />
          <Detail label="Address line 1" value={recruiter.address_line_1} />
          <Detail label="Address line 2" value={recruiter.address_line_2} />
          <Detail label="City" value={recruiter.city} />
          <Detail label="State/Region" value={recruiter.state_region} />
          <Detail label="Postal code" value={recruiter.postal_code} />
          <Detail label="Country" value={recruiter.country} />
          <Detail label="Industry" value={recruiter.industry === "Other" ? recruiter.industry_other : recruiter.industry} />
          <Detail label="Company size" value={recruiter.company_size} />
          <div className="sm:col-span-2">
            <Detail label="Hiring focus" value={recruiter.hiring_focus} />
          </div>
          <div className="sm:col-span-2">
            <Detail label="Verification notes" value={recruiter.verification_notes} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => onUpdate("verified")} className={primaryButton}>
            Verify
          </button>
          <button type="button" onClick={() => onUpdate("rejected")} className={secondaryButton}>
            Reject
          </button>
          <button type="button" onClick={() => onUpdate("pending_review")} className={secondaryButton}>
            Set Pending Review
          </button>
          {recruiter.stale_duplicate_count > 0 ? (
            <button type="button" onClick={onRemoveDuplicates} className={secondaryButton}>
              Remove Duplicates
            </button>
          ) : null}
          <button type="button" onClick={onDelete} className={secondaryButton}>
            Delete Profile
          </button>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function InstitutionModal({
  institution,
  onClose,
  onUpdate,
}: {
  institution: InstitutionModeration;
  onClose: () => void;
  onUpdate: (
    status: string,
    settings: {
      seatLimit: string;
      packageType: string;
      annualContractValue: string;
      pricePerStudent: string;
      discountNotes: string;
      accessStartDate: string;
      accessEndDate: string;
      autoDomainAccess: boolean;
    },
  ) => void;
}) {
  const [seatLimit, setSeatLimit] = useState(institution.seat_limit === null ? "" : String(institution.seat_limit));
  const [packageType, setPackageType] = useState(institution.package_type ?? "");
  const [annualContractValue, setAnnualContractValue] = useState(institution.annual_contract_value === null ? "" : String(institution.annual_contract_value));
  const [pricePerStudent, setPricePerStudent] = useState(institution.price_per_student === null ? "" : String(institution.price_per_student));
  const [discountNotes, setDiscountNotes] = useState(institution.discount_notes ?? "");
  const [accessStartDate, setAccessStartDate] = useState(institution.access_start_date ?? "");
  const [accessEndDate, setAccessEndDate] = useState(institution.access_end_date ?? "");
  const [autoDomainAccess, setAutoDomainAccess] = useState(institution.auto_domain_access);
  const settings = { seatLimit, packageType, annualContractValue, pricePerStudent, discountNotes, accessStartDate, accessEndDate, autoDomainAccess };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Institution Review
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              {institution.institution_name}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {statusLabel(institution.access_status)}
            </p>
          </div>
          <button type="button" onClick={onClose} className={secondaryButton}>Close</button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail label="Institution type" value={institution.institution_type} />
          <Detail label="Administrator" value={institution.admin_name} />
          <Detail label="Admin email" value={institution.admin_email} />
          <Detail label="Website" value={institution.website} />
          <Detail label="Student domain" value={`@${institution.student_email_domain}`} />
          <Detail label="City" value={institution.city} />
          <Detail label="State/Region" value={institution.state_region} />
          <Detail label="Country" value={institution.country} />
          <Detail label="Estimated coverage" value={institution.estimated_student_coverage === null ? null : String(institution.estimated_student_coverage)} />
          <Detail label="Active seats" value={String(institution.active_seats)} />
          <Detail label="Institution Access Package" value={institution.package_type} />
          <Detail label="Access start date" value={institution.access_start_date} />
          <Detail label="Access end date" value={institution.access_end_date} />
          <div className="sm:col-span-2">
            <Detail label="Access notes" value={institution.access_notes} />
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">Access Terms</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--iseya-navy)]">
              Seat limit {packageType ? "" : "optional"}
              <input className={`${inputClass} mt-2 w-full`} min="0" type="number" value={seatLimit} onChange={(event) => setSeatLimit(event.target.value)} placeholder="Unlimited / pilot" />
            </label>
            <label className="text-sm font-semibold text-[var(--iseya-navy)]">
              Institution Access Package
              <select className={`${inputClass} mt-2 w-full`} value={packageType} onChange={(event) => setPackageType(event.target.value)}>
                <option value="">Select after review</option>
                {institutionPackages.map((option) => <option key={option} value={packageValue(option)}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-[var(--iseya-navy)]">
              Access start date optional
              <input className={`${inputClass} mt-2 w-full`} type="date" value={accessStartDate} onChange={(event) => setAccessStartDate(event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-[var(--iseya-navy)]">
              Access end date optional
              <input className={`${inputClass} mt-2 w-full`} type="date" value={accessEndDate} onChange={(event) => setAccessEndDate(event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-[var(--iseya-navy)]">
              Annual contract value optional
              <input className={`${inputClass} mt-2 w-full`} min="0" step="0.01" type="number" value={annualContractValue} onChange={(event) => setAnnualContractValue(event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-[var(--iseya-navy)]">
              Price per student optional
              <input className={`${inputClass} mt-2 w-full`} min="0" step="0.01" type="number" value={pricePerStudent} onChange={(event) => setPricePerStudent(event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-[var(--iseya-navy)] sm:col-span-2">
              Discount notes optional
              <textarea className={`${inputClass} mt-2 min-h-20 w-full resize-y`} value={discountNotes} onChange={(event) => setDiscountNotes(event.target.value)} />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--iseya-navy)]">
            <input type="checkbox" checked={autoDomainAccess} onChange={(event) => setAutoDomainAccess(event.target.checked)} />
            Allow approved-domain student access
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => onUpdate("active", settings)} className={primaryButton}>Approve</button>
          <button type="button" onClick={() => onUpdate("rejected", settings)} className={secondaryButton}>Reject</button>
          <button type="button" onClick={() => onUpdate("expired", settings)} className={secondaryButton}>Mark Expired</button>
          <button type="button" onClick={() => onUpdate("pending_review", settings)} className={secondaryButton}>Pending Review</button>
          <button type="button" onClick={onClose} className={secondaryButton}>Close</button>
        </div>
      </section>
    </div>
  );
}

function EditorGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-navy)]">
        {title}
      </h4>
      {children}
    </section>
  );
}

function EditorField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function ModerationCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
        Admin Moderation
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ActivityCard({ title, users }: { title: string; users: ManagedUser[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
        {title}
      </p>
      <div className="mt-4 space-y-3">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--iseya-navy)]">
                  {user.email || "No email"}
                </p>
                <p className="text-xs text-slate-500">{formatDate(user.created_at)}</p>
              </div>
              <span className="rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-bold text-[var(--iseya-navy)]">
                {planLabel(user.subscription_plan)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No users to show yet.</p>
        )}
      </div>
    </section>
  );
}
