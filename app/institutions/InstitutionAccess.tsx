"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type ActiveInstitution = {
  id: string;
  institution_name: string;
  institution_type: string;
  city: string;
  state_region: string | null;
  country: string;
};

type TestInstitution = {
  id: string;
  institution_name: string;
  access_status: string;
};

type TestResult = {
  eligible: boolean;
  reason: string;
  institutionName: string;
  institutionDomain: string;
  enteredDomain: string;
  domainMatches: boolean;
  institutionActive: boolean;
  accessStatus: string;
  seatLimit: number | null;
  activeSeats: number;
  seatAvailable: boolean;
  administratorEmail: boolean;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-5 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60";

export default function InstitutionAccess() {
  const [institutions, setInstitutions] = useState<ActiveInstitution[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [linked, setLinked] = useState(false);
  const [showLocalTestMode, setShowLocalTestMode] = useState(false);
  const [testInstitutions, setTestInstitutions] = useState<TestInstitution[]>([]);
  const [testInstitutionId, setTestInstitutionId] = useState("");
  const [testLearnerEmail, setTestLearnerEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/institution/access", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { institutions?: ActiveInstitution[] }) => {
        if (active) setInstitutions(data.institutions ?? []);
      })
      .catch(() => {
        if (active) setInstitutions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const locallyVisible =
      window.location.hostname === "localhost" || process.env.NODE_ENV === "development";

    if (!locallyVisible) return;

    void fetch("/api/institution/access/test", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Local test mode is unavailable.");
        return response.json();
      })
      .then((data: { institutions?: TestInstitution[] }) => {
        setShowLocalTestMode(true);
        setTestInstitutions(data.institutions ?? []);
      })
      .catch(() => {
        setShowLocalTestMode(false);
        setTestInstitutions([]);
      });
  }, []);

  async function submitAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch("/api/institution/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId, studentEmail }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        linked?: boolean;
        institutionName?: string;
        error?: string;
      };
      if (!response.ok || !data.linked) {
        throw new Error(data.error || "Institution access could not be applied right now.");
      }
      setLinked(true);
      setStatus(`Access provided through ${data.institutionName}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Institution access could not be applied right now.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runDryTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTestLoading(true);
    setTestStatus("");
    setTestResult(null);
    try {
      const response = await fetch("/api/institution/access/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId: testInstitutionId, learnerEmail: testLearnerEmail }),
      });
      const data = (await response.json().catch(() => ({}))) as TestResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to run the local institution access test.");
      }
      setTestResult(data);
    } catch (error) {
      setTestStatus(error instanceof Error ? error.message : "Unable to run the local institution access test.");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-7 sm:px-8">
          <Link href="/institutions">
            <Image src="/brand/iseya-logo2.png" alt="ISEYA" width={240} height={120} className="h-auto w-[155px] object-contain sm:w-[220px]" priority />
          </Link>
          <Link href="/login?redirectedFrom=/institutions/access" className="text-sm font-semibold text-white/85 transition hover:text-[var(--iseya-gold)]">
            Sign In
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Student / Participant Access</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)]">Access through my institution</h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Connect an approved institution email to your private ISEYA workspace. Your career materials remain private.
        </p>
        <p className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
          Use your student or program email. Institution administrator emails are used for management access and cannot claim student seats.
        </p>
        <form onSubmit={submitAccess} className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold text-[var(--iseya-navy)]">
            Institution
            <select className={inputClass} value={institutionId} required onChange={(event) => setInstitutionId(event.target.value)} disabled={loading || linked}>
              <option value="">{loading ? "Loading approved institutions..." : "Select your institution"}</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.institution_name} - {[institution.city, institution.state_region, institution.country].filter(Boolean).join(", ")}
                </option>
              ))}
            </select>
          </label>
          {institutions.length === 0 && !loading ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your institution is not listed yet. You can{" "}
              <Link href="/contact" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)]">
                request access
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)]">
                continue with a standard account
              </Link>
              .
            </p>
          ) : null}
          <label className="mt-5 block text-sm font-semibold text-[var(--iseya-navy)]">
            Institution email
            <input className={inputClass} value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} type="email" required disabled={linked} placeholder="student@university.edu" />
          </label>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            Sign in with this institution email before requesting access. Invite codes are not used.
          </p>
          {status ? (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">{status}</p>
          ) : null}
          <button disabled={submitting || linked || loading || institutions.length === 0} type="submit" className={`${primaryButton} mt-6`}>
            {linked ? "Access Connected" : submitting ? "Connecting..." : "Connect Institution Access"}
          </button>
        </form>
        {showLocalTestMode ? (
          <form onSubmit={runDryTest} className="mt-7 rounded-2xl border border-dashed border-[var(--iseya-gold)] bg-[#FFF8E6] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Local Test Mode</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Development dry run only. This check never claims a student seat or changes an account.
            </p>
            <label className="mt-4 block text-sm font-semibold text-[var(--iseya-navy)]">
              Institution to test
              <select className={inputClass} value={testInstitutionId} onChange={(event) => setTestInstitutionId(event.target.value)} required>
                <option value="">Select an institution</option>
                {testInstitutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.institution_name} - {institution.access_status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold text-[var(--iseya-navy)]">
              Test student email
              <input className={inputClass} value={testLearnerEmail} onChange={(event) => setTestLearnerEmail(event.target.value)} type="email" required placeholder="student@school.edu" />
            </label>
            <button type="submit" disabled={testLoading || testInstitutions.length === 0} className={`${primaryButton} mt-5`}>
              {testLoading ? "Checking..." : "Run Dry Test"}
            </button>
            {testStatus ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-white p-3 text-sm font-semibold text-red-700">{testStatus}</p>
            ) : null}
            {testResult ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-[var(--iseya-navy)]">{testResult.reason}</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <TestDetail label="Institution domain" value={testResult.institutionDomain} />
                  <TestDetail label="Entered email domain" value={testResult.enteredDomain} />
                  <TestDetail label="Domain match" value={testResult.domainMatches ? "Yes" : "No"} />
                  <TestDetail label="Institution active" value={testResult.institutionActive ? "Yes" : "No"} />
                  <TestDetail label="Seat limit" value={testResult.seatLimit === null ? "Unlimited / pilot" : String(testResult.seatLimit)} />
                  <TestDetail label="Active seats" value={String(testResult.activeSeats)} />
                  <TestDetail label="Seat available" value={testResult.seatAvailable ? "Yes" : "No"} />
                  <TestDetail label="Dry-run access result" value={testResult.eligible ? "Eligible" : "Blocked"} />
                </dl>
              </div>
            ) : null}
          </form>
        ) : null}
      </section>
    </main>
  );
}

function TestDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-[var(--iseya-navy)]">{value}</dd>
    </div>
  );
}
