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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">Student / Learner Access</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)]">Access through my institution</h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Connect an approved institution email to your private ISEYA workspace. Your career materials remain private.
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
      </section>
    </main>
  );
}
