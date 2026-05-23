"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth/AuthProvider";

type JobPost = {
  id: string;
  recruiter_id: string;
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
  created_at: string;
};

const primaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-3 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]";

function label(value: string) {
  return value.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function JobsBoard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [query, setQuery] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setStatus("");

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (workplace) params.set("workplace", workplace);
      const response = await fetch(`/api/jobs?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { jobs?: JobPost[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to load jobs.");
      }

      setJobs(data.jobs ?? []);
      setSelectedJobId((current) => current || data.jobs?.[0]?.id || "");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [query, workplace]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobs();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  async function applyToJob(job: JobPost) {
    if (!user) {
      window.location.href = `/login?redirectedFrom=${encodeURIComponent("/jobs")}`;
      return;
    }

    if (job.application_url) {
      window.open(job.application_url, "_blank", "noopener,noreferrer");
    }

    setStatus("");

    try {
      const response = await fetch(`/api/jobs/${job.id}/apply`, { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to express interest.");
      }

      setStatus("Interest submitted with your ISEYA career profile.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to express interest.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/brand/iseya-logo2.png"
                alt="ISEYA"
                width={240}
                height={120}
                priority
                className="h-auto w-[150px] object-contain sm:w-[220px]"
              />
            </Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              Talent discovery
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Jobs for career-ready candidates.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/82">
              Browse roles that connect with your career profile, career assets,
              skill alignment, and employability signals.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/">
              For Candidates
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters">
              For Recruiters
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/pricing">
              Pricing
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/login">
              Sign In
            </Link>
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-8 sm:px-8">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, company, skill, or location"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          />
          <select
            value={workplace}
            onChange={(event) => setWorkplace(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          >
            <option value="">All workplace types</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </div>

        {status ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
            {status}
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[var(--iseya-navy)]">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm font-medium text-slate-600">
                No published jobs match this search yet.
              </div>
            ) : (
              jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                    selectedJob?.id === job.id
                      ? "border-[var(--iseya-gold)] bg-[#FFF8E6]"
                      : "border-slate-200 bg-white hover:border-[var(--iseya-gold)]"
                  }`}
                >
                  <h2 className="text-base font-semibold text-[var(--iseya-navy)]">
                    {job.job_title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {job.company_name}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                    {label(job.workplace_type)} | {label(job.employment_type)}
                  </p>
                </button>
              ))
            )}
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {selectedJob ? (
              <article>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                      Role fit opportunity
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)]">
                      {selectedJob.job_title}
                    </h2>
                    <p className="mt-2 text-base font-semibold text-slate-700">
                      {selectedJob.company_name} | {selectedJob.location || "Location flexible"}
                    </p>
                    {selectedJob.salary_range ? (
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {selectedJob.salary_range}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => applyToJob(selectedJob)}
                    className={primaryButton}
                  >
                    Apply or Express Interest
                  </button>
                </div>

                <div className="mt-6 grid gap-5">
                  <JobSection title="Role Summary" body={selectedJob.role_summary} />
                  <JobSection title="Responsibilities" body={selectedJob.responsibilities} />
                  <JobSection title="Requirements" body={selectedJob.requirements} />
                  {selectedJob.skills.length > 0 ? (
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--iseya-navy)]">
                        Skills
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                      ISEYA application MVP
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Express interest using your existing ISEYA career profile and career assets. Resume attachment review will connect to recruiter applicant review in a later phase.
                    </p>
                    <Link href="/workspace" className={`${secondaryButton} mt-3`}>
                      Improve Career Assets
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                Select a job to view role details.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function JobSection({ title, body }: { title: string; body: string }) {
  if (!body.trim()) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--iseya-navy)]">
        {title}
      </h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-650">{body}</p>
    </section>
  );
}
