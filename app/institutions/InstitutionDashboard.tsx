"use client";

import type { FormEvent } from "react";
import { useState } from "react";
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
    return (
      <section className="mx-auto max-w-[92rem] space-y-6 px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Institution Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)] sm:text-4xl">{profile.institution_name}</h1>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Manage student access, track career readiness, and connect learners to verified opportunities.
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Students onboarded", String(profile.active_seats)],
            ["Resumes improved", "0"],
            ["Applications submitted", "0"],
            ["Recruiter engagements", "0"],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
            </article>
          ))}
        </section>
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Profile Summary</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">{profile.institution_type}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Summary label="Administrator" value={profile.admin_name} />
              <Summary label="Admin email" value={profile.admin_email} />
              <Summary label="Student domain" value={`@${profile.student_email_domain}`} />
              <Summary label="Location" value={[profile.city, profile.state_region, profile.country].filter(Boolean).join(", ")} />
              <Summary label="Access status" value={statusLabel(profile.access_status)} />
              <Summary label="Institution Access Package" value={profile.package_type ?? "To be assigned after review."} />
              <Summary label="Seat limit" value={profile.seat_limit === null ? "To be assigned after review." : String(profile.seat_limit)} />
              <Summary label="Active seats" value={String(profile.active_seats)} />
              <Summary label="Access period" value={dateRange(profile)} />
            </div>
          </article>
          <article id="insights" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Insights</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">Career readiness</h2>
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              Career readiness insights coming soon.
            </p>
            <p id="students" className="mt-4 text-sm leading-7 text-slate-600">
              Student privacy is protected. Individual career materials are not visible to institution administrators.
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
function Field({ label, value, onChange, type = "text", placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-[var(--iseya-navy)]">{label}<input className={inputClass} type={type} value={value} placeholder={placeholder} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Select({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-sm font-semibold text-[var(--iseya-navy)]">{label}<select className={inputClass} value={value} required={required} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-sm font-semibold text-[var(--iseya-navy)]">{label}<textarea className={`${inputClass} min-h-24 resize-y`} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
