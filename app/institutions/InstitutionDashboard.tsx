"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  countryOptions,
  countryRegions,
  manualLocationOption,
} from "@/lib/recruiterLocationOptions";
import { normalizeStudentEmailDomain, statusLabel } from "@/lib/institutionAccess";

export type InstitutionProfile = {
  id: string;
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
  auto_domain_access: boolean;
};

type InstitutionAnalytics = {
  studentsOnboarded: number;
  activeLearners: number;
  seatLimit: number | null;
  activeSeats: number;
  remainingSeats: number | null;
  seatUsagePercentage: number | null;
  applicationsSubmitted: number;
  materialsImproved: number;
  recruiterEngagements: number;
  careerReadiness: {
    resumeCreatedOrImported: number;
    careerMaterialsCompleted: number;
    applicationsSubmitted: number;
    activeJobEngagement: number;
    linkedinPositioningCompleted: number;
    averageReadinessScore: number | null;
  };
  applicationActivity: {
    submitted: number;
    reviewing: number;
    proceed: number;
    rejected: number;
    closed: number;
  };
  recruiterEngagement: {
    publishedJobsAppliedTo: number;
    recruiterResponses: number;
    proceedRate: number | null;
  };
};

const institutionTypes = ["University", "College", "Bootcamp", "Career Program", "Workforce Development", "Other"];
const inputClass = "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25";
const primaryButton = "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]";

function dateRange(profile: InstitutionProfile) {
  if (!profile.access_start_date && !profile.access_end_date) return "To be assigned after review";
  return `${profile.access_start_date ?? "Open"} - ${profile.access_end_date ?? "Open"}`;
}

function accessStatusMessage(status: string) {
  if (status === "active") return "Your institution access is active.";
  if (status === "pending_review") return "Your partnership request is under review.";
  if (status === "rejected") return "Your partnership request needs updates before access can be approved.";
  return "Your institution access period has expired.";
}

export default function InstitutionDashboard({
  initialProfile,
  onboarding = false,
}: {
  initialProfile: InstitutionProfile | null;
  onboarding?: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(onboarding);
  const [draft, setDraft] = useState({
    institutionName: initialProfile?.institution_name ?? "",
    institutionType: initialProfile?.institution_type ?? "University",
    adminName: initialProfile?.admin_name ?? "",
    adminEmail: initialProfile?.admin_email ?? "",
    website: initialProfile?.website ?? "",
    country: initialProfile?.country ?? "",
    stateRegion: initialProfile?.state_region ?? "",
    city: initialProfile?.city ?? "",
    studentEmailDomain: initialProfile?.student_email_domain ?? "",
    estimatedStudentCoverage: initialProfile?.estimated_student_coverage
      ? String(initialProfile.estimated_student_coverage)
      : "",
    accessNotes: initialProfile?.access_notes ?? "",
  });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<InstitutionAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(Boolean(initialProfile && !onboarding));
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    if (!profile || onboarding || editing) return;

    let current = true;

    fetch("/api/institution/analytics", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          analytics?: InstitutionAnalytics;
          error?: string;
        };
        if (!response.ok || !data.analytics) {
          throw new Error(data.error || "Institution insights are temporarily unavailable.");
        }
        if (current) {
          setAnalytics(data.analytics);
          setAnalyticsError("");
        }
      })
      .catch(() => {
        if (current) setAnalyticsError("Aggregate insights are temporarily unavailable.");
      })
      .finally(() => {
        if (current) setAnalyticsLoading(false);
      });

    return () => {
      current = false;
    };
  }, [profile, onboarding, editing]);

  const selectedCountryOption = countryOptions.includes(draft.country)
    ? draft.country
    : draft.country
      ? manualLocationOption
      : "";
  const stateOptions =
    selectedCountryOption && selectedCountryOption !== manualLocationOption
      ? countryRegions[selectedCountryOption] ?? [manualLocationOption]
      : [manualLocationOption];
  const selectedStateOption = stateOptions.includes(draft.stateRegion)
    ? draft.stateRegion
    : draft.stateRegion
      ? manualLocationOption
      : "";
  const needsManualCountry = selectedCountryOption === manualLocationOption;
  const needsManualState =
    selectedCountryOption === manualLocationOption || selectedStateOption === manualLocationOption;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/institution/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          studentEmailDomain: normalizeStudentEmailDomain(draft.studentEmailDomain),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        institutionProfile?: InstitutionProfile;
        reviewRequired?: boolean;
        error?: string;
      };
      if (!response.ok || !data.institutionProfile) {
        throw new Error(data.error || "Unable to save institution profile right now.");
      }
      setProfile(data.institutionProfile);
      setStatus(
        data.reviewRequired
          ? "Your institution profile changes were saved and sent for review."
          : onboarding
            ? "Partnership request submitted successfully."
            : "Institution profile saved successfully.",
      );
      setEditing(false);
      if (onboarding) {
        router.replace("/institutions/dashboard");
        router.refresh();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save institution profile right now.");
    } finally {
      setSaving(false);
    }
  }

  if (!onboarding && profile && !editing) {
    const displayMetric = (value: number | string | null | undefined) => {
      if (analyticsLoading) return "-";
      return value === null || value === undefined ? "Not available" : String(value);
    };
    const seatLimit = analytics?.seatLimit ?? profile.seat_limit;
    const activeSeats = analytics?.activeSeats ?? profile.active_seats;
    const usagePercentage = analytics?.seatUsagePercentage ?? null;

    return (
      <section className="mx-auto max-w-[92rem] space-y-6 px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Institution Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{profile.institution_name}</h1>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Manage student access, track career readiness, and connect participants to verified opportunities.
            </p>
          </div>
          <button type="button" onClick={() => setEditing(true)} className={secondaryButton}>
            Edit Institution Profile
          </button>
        </div>
        {status ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">{status}</p> : null}
        <p className="rounded-xl border border-[var(--iseya-gold)]/30 bg-[#FFF8E6] p-4 text-sm font-semibold text-[var(--iseya-navy)]">
          {accessStatusMessage(profile.access_status)}
        </p>
        {analyticsError ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            {analyticsError}
          </p>
        ) : null}
        <section aria-label="Institution analytics overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Students Onboarded", displayMetric(analytics?.studentsOnboarded ?? profile.active_seats)],
            [
              "Seats Used %",
              seatLimit === null
                ? analyticsLoading
                  ? "-"
                  : "Unlimited"
                : displayMetric(usagePercentage === null ? null : `${usagePercentage}%`),
            ],
            ["Active Students", displayMetric(analytics?.activeLearners)],
            ["Applications Submitted", displayMetric(analytics?.applicationsSubmitted)],
            ["Resume/Career Materials Improved", displayMetric(analytics?.materialsImproved)],
            ["Recruiter Engagements", displayMetric(analytics?.recruiterEngagements)],
          ].map(([label, value]) => (
            <article key={label} className="min-h-32 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">{label}</p>
              {analyticsLoading ? (
                <div className="mt-4 h-9 w-24 animate-pulse rounded-md bg-slate-100" />
              ) : (
                <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
              )}
            </article>
          ))}
        </section>
        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Access Overview</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">{profile.institution_type}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Summary label="Administrator" value={profile.admin_name} />
              <Summary label="Admin email" value={profile.admin_email} />
              <Summary label="Student domain" value={`@${profile.student_email_domain}`} />
              <Summary label="Location" value={[profile.city, profile.state_region, profile.country].filter(Boolean).join(", ")} />
              <Summary label="Access status" value={statusLabel(profile.access_status)} />
              <Summary label="Institution Access Package" value={profile.package_type ?? "To be assigned after review."} />
              <Summary label="Seat limit" value={seatLimit === null ? "Pilot / unlimited access mode" : String(seatLimit)} />
              <Summary label="Active seats" value={String(activeSeats)} />
              <Summary label="Access period" value={dateRange(profile)} />
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Seat Utilization</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
              {seatLimit === null ? "Pilot / unlimited access mode" : `${activeSeats} of ${seatLimit} seats used`}
            </h2>
            {seatLimit === null ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                Student access is currently managed without a fixed seat ceiling.
              </p>
            ) : (
              <>
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--iseya-gold)] transition-all"
                    style={{ width: `${Math.min(100, usagePercentage ?? 0)}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Summary label="Remaining seats" value={displayMetric(analytics?.remainingSeats)} />
                  <Summary label="Usage" value={displayMetric(usagePercentage === null ? null : `${usagePercentage}%`)} />
                </div>
              </>
            )}
            <p className="mt-5 text-sm leading-7 text-slate-600">
              Student privacy is protected. Institution insights are shown in aggregate only.
            </p>
          </article>
        </section>
        <section id="insights" className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Career Readiness</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Aggregate student actions</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ReadinessRow label="Resume created/imported" value={displayMetric(analytics?.careerReadiness.resumeCreatedOrImported)} />
              <ReadinessRow label="Career materials completed" value={displayMetric(analytics?.careerReadiness.careerMaterialsCompleted)} />
              <ReadinessRow label="Applications submitted" value={displayMetric(analytics?.careerReadiness.applicationsSubmitted)} />
              <ReadinessRow label="Active job engagement" value={displayMetric(analytics?.careerReadiness.activeJobEngagement)} />
              <ReadinessRow label="LinkedIn/career positioning completed" value={displayMetric(analytics?.careerReadiness.linkedinPositioningCompleted)} />
              <ReadinessRow
                label="Average readiness score"
                value={displayMetric(analytics?.careerReadiness.averageReadinessScore)}
              />
            </div>
            <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              Readiness scoring will improve as students complete more career actions.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Application Activity</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Aggregate outcomes</h2>
            <div className="mt-5 space-y-3">
              {[
                ["Submitted", analytics?.applicationActivity.submitted],
                ["Reviewing", analytics?.applicationActivity.reviewing],
                ["Proceed", analytics?.applicationActivity.proceed],
                ["Rejected", analytics?.applicationActivity.rejected],
                ["Closed", analytics?.applicationActivity.closed],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0">
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="text-lg font-semibold text-[var(--iseya-navy)]">{displayMetric(value as number | undefined)}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Recruiter Engagement</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Opportunity interaction</h2>
            {analytics && analytics.applicationsSubmitted > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Summary label="Published jobs applied to" value={String(analytics.recruiterEngagement.publishedJobsAppliedTo)} />
                <Summary label="Status updates" value={String(analytics.recruiterEngagement.recruiterResponses)} />
                <Summary
                  label="Proceed rate"
                  value={
                    analytics.recruiterEngagement.proceedRate === null
                      ? "Not available"
                      : `${analytics.recruiterEngagement.proceedRate}%`
                  }
                />
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                Recruiter engagement insights will appear as linked students engage with published opportunities.
              </p>
            )}
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Insights Coming Soon</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Readiness trends</h2>
            <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              Trend comparisons and cohort-level progress reporting will be introduced as aggregate student activity grows.
            </p>
            <p id="students" className="mt-4 text-sm leading-7 text-slate-600">
              Student privacy is protected. Institution insights are shown in aggregate only.
            </p>
          </article>
        </section>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
        {onboarding ? "Institution Onboarding" : "Institution Profile"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)]">
        {onboarding ? "Request Institution Partnership" : "Edit Institution Profile"}
      </h1>
      <p className="mt-3 text-base leading-8 text-slate-600">
        Sensitive changes to institution identity or student email domain require a new ISEYA review before access resumes.
      </p>
      <p className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
        Partnership requests are reviewed by ISEYA before student access is activated. Access packages, seats, and access dates are assigned during review.
      </p>
      {status ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">{status}</p> : null}
      <form onSubmit={saveProfile} className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Institution name" value={draft.institutionName} onChange={(value) => setDraft((current) => ({ ...current, institutionName: value }))} required />
          <Select label="Institution type" value={draft.institutionType} options={institutionTypes} onChange={(value) => setDraft((current) => ({ ...current, institutionType: value }))} required />
          <Field label="Administrator name" value={draft.adminName} onChange={(value) => setDraft((current) => ({ ...current, adminName: value }))} required />
          <Field label="Administrator email" type="email" value={draft.adminEmail} onChange={(value) => setDraft((current) => ({ ...current, adminEmail: value }))} required />
          <Field label="Website" value={draft.website} onChange={(value) => setDraft((current) => ({ ...current, website: value }))} required />
          <Field label="Student email domain" value={draft.studentEmailDomain} onChange={(value) => setDraft((current) => ({ ...current, studentEmailDomain: value }))} placeholder="school.edu" required />
          <Field label="Estimated student coverage" type="number" value={draft.estimatedStudentCoverage} onChange={(value) => setDraft((current) => ({ ...current, estimatedStudentCoverage: value }))} placeholder="500" required />
          <label className="text-sm font-semibold text-[var(--iseya-navy)]">
            Country
            <select
              className={inputClass}
              value={selectedCountryOption}
              required
              onChange={(event) => {
                setDraft((current) => ({ ...current, country: event.target.value, stateRegion: "" }));
              }}
            >
              {countryOptions.map((option) => <option key={option} value={option}>{option || "Select"}</option>)}
            </select>
          </label>
          {needsManualCountry ? (
            <Field label="Enter country/region manually" value={draft.country === manualLocationOption ? "" : draft.country} onChange={(value) => setDraft((current) => ({ ...current, country: value, stateRegion: "" }))} required />
          ) : null}
          {needsManualState ? (
            <Field label="Enter state/region manually optional" value={draft.stateRegion === manualLocationOption ? "" : draft.stateRegion} onChange={(value) => setDraft((current) => ({ ...current, stateRegion: value }))} />
          ) : (
            <Select label="State/Region optional" value={selectedStateOption} options={stateOptions} onChange={(value) => setDraft((current) => ({ ...current, stateRegion: value }))} />
          )}
          <Field label="City" value={draft.city} onChange={(value) => setDraft((current) => ({ ...current, city: value }))} required />
          <div className="sm:col-span-2">
            <TextArea label="Access notes optional" value={draft.accessNotes} onChange={(value) => setDraft((current) => ({ ...current, accessNotes: value }))} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button disabled={saving} type="submit" className={primaryButton}>
            {saving ? "Saving..." : onboarding ? "Submit Partnership Request" : "Save Institution Profile"}
          </button>
          {!onboarding ? (
            <button type="button" onClick={() => setEditing(false)} className={secondaryButton}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-[var(--iseya-navy)]">{value || "Not provided"}</p></div>;
}
function ReadinessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}
function Field({ label, value, onChange, type = "text", placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-[var(--iseya-navy)]">{label}<input className={inputClass} type={type} value={value} placeholder={placeholder} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Select({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-sm font-semibold text-[var(--iseya-navy)]">{label}<select className={inputClass} value={value} required={required} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-sm font-semibold text-[var(--iseya-navy)]">{label}<textarea className={`${inputClass} min-h-24 resize-y`} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
