"use client";

import Image from "next/image";
import Link from "next/link";
import PublicTrustFooter from "@/components/PublicTrustFooter";
import RelatedAuthorityResources from "@/components/RelatedAuthorityResources";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Building2,
  ExternalLink,
  FilePenLine,
  Globe2,
  UserRoundSearch,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthProvider";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getUniqueCountries, normalizeCountry } from "@/lib/jobsMetrics";

type JobPost = {
  id: string;
  recruiter_id: string;
  job_title: string;
  company_name: string;
  location: string;
  country?: string | null;
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
  created_at: string;
  posted_at?: string | null;
  updated_at?: string | null;
  imported_at?: string | null;
  date_added?: string | null;
  opportunity_type?:
    | "curated_opportunity"
    | "recruiter_posted"
    | "verified_recruiter"
    | "direct_employer"
    | null;
  source_name?: string | null;
  source_type?: string | null;
  source_description?: string | null;
  recruiter_verified?: boolean | null;
  employer_verified?: boolean | null;
  sponsorship_status?: string | null;
};

type InterestDraft = {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  shortNote: string;
  resumeFile: File | null;
  coverLetterFile: File | null;
};

type CandidateApplicationStatus = {
  job_id: string;
  status: string;
};

type OpportunityType = "curated" | "recruiter" | "verified_recruiter" | "direct_employer";

type OpportunityProfile = {
  type: OpportunityType;
  label: string;
  description: string;
  badgeClass: string;
  cardAccentClass: string;
  icon: typeof Globe2;
  nativeApply: boolean;
};

const opportunitySourceCards: Array<{
  type: OpportunityType;
  title: string;
  copy: string;
  Icon: typeof Globe2;
  className: string;
  activeClassName: string;
}> = [
  {
    type: "curated",
    title: "Curated Opportunity",
    copy: "External hiring channels selected by ISEYA.",
    Icon: ExternalLink,
    className: "border-slate-200 bg-white text-slate-700",
    activeClassName: "border-slate-500 bg-slate-100 ring-2 ring-slate-300",
  },
  {
    type: "recruiter",
    title: "Recruiter Posted",
    copy: "Native roles submitted through ISEYA.",
    Icon: UserRoundSearch,
    className: "border-blue-100 bg-blue-50/50 text-blue-800",
    activeClassName: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
  },
  {
    type: "verified_recruiter",
    title: "Verified Recruiter",
    copy: "Reviewed recruiting partner trust layer.",
    Icon: BadgeCheck,
    className: "border-blue-200 bg-blue-50 text-blue-900",
    activeClassName: "border-blue-600 bg-blue-100 ring-2 ring-blue-200",
  },
  {
    type: "direct_employer",
    title: "Direct Employer",
    copy: "Company-posted roles with highest trust.",
    Icon: Building2,
    className: "border-amber-200 bg-[#FFF8E6]/70 text-[var(--iseya-navy)]",
    activeClassName: "border-[var(--iseya-gold)] bg-[#FFF8E6] ring-2 ring-amber-200",
  },
];

const primaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-3 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2";
const headerNavigationLink =
  "rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]";
const anonymousApplicationStorageKey = "iseya_anonymous_job_application_statuses";
const savedOpportunityStorageKey = "iseya_saved_opportunity_ids";
function label(value: string) {
  return value.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metadataLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "onsite" || normalized === "on site" || normalized === "on-site") {
    return "ON-SITE";
  }

  return label(value).toUpperCase();
}

function hasSponsorship(job: JobPost) {
  return (
    job.sponsorship_status === "confirmed_sponsorship" ||
    job.sponsorship_status === "sponsorship_possible"
  );
}

function jobMetadata(job: JobPost) {
  return [
    metadataLabel(job.workplace_type),
    metadataLabel(job.employment_type),
    ...(hasSponsorship(job) ? ["SPONSORSHIP"] : []),
  ].join(" | ");
}

function dateValue(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function jobSortDate(job: JobPost) {
  return (
    dateValue(job.created_at) ??
    dateValue(job.posted_at) ??
    dateValue(job.updated_at) ??
    dateValue(job.imported_at) ??
    dateValue(job.date_added) ??
    dateValue(job.application_deadline)
  );
}

function newestJobsFirst(jobsToSort: readonly JobPost[]) {
  return jobsToSort
    .map((job, index) => ({ job, index, sortDate: jobSortDate(job) }))
    .sort((first, second) => {
      if (first.sortDate !== null && second.sortDate !== null) {
        return second.sortDate - first.sortDate;
      }

      if (first.sortDate !== null) return -1;
      if (second.sortDate !== null) return 1;

      return second.index - first.index;
    })
    .map(({ job }) => job);
}

function normalizedMatch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function locationParts(job: JobPost) {
  const location = job.location || "";
  const commaParts = location.split(",").map((part) => part.trim()).filter(Boolean);
  const slashParts = location.split("/").map((part) => part.trim()).filter(Boolean);

  if (commaParts.length >= 2) {
    return {
      city: commaParts[0],
      region: commaParts[1],
    };
  }

  if (slashParts.length >= 2) {
    const nonCountryPart = slashParts.find(
      (part) => normalizedMatch(part) !== normalizedMatch(job.country ?? ""),
    );

    return {
      city: nonCountryPart ?? slashParts[0],
      region: "",
    };
  }

  return {
    city: location,
    region: "",
  };
}

function formatSalary(job: JobPost) {
  if (job.salary_currency && (job.salary_min !== null || job.salary_max !== null)) {
    const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
    const min = job.salary_min !== null ? formatter.format(job.salary_min) : "";
    const max = job.salary_max !== null ? formatter.format(job.salary_max) : "";
    const range = min && max ? `${min} – ${max}` : min || max;

    return `${job.salary_currency} ${range}${job.salary_period ? ` ${job.salary_period}` : ""}`;
  }

  return job.salary_range || "Salary not disclosed";
}

function opportunityProfile(job: JobPost): OpportunityProfile {
  const source = `${job.opportunity_type ?? ""} ${job.source_type ?? ""}`.toLowerCase();

  if (
    job.opportunity_type === "curated_opportunity" ||
    (job.application_url &&
    /\b(curated|external|imported|greenhouse|lever|ashby|yc)\b/.test(source)
    )
  ) {
    return {
      type: "curated",
      label: "Curated Opportunity",
      description: job.source_description || "Sourced from active external hiring channels",
      badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
      cardAccentClass: "border-l-slate-400",
      icon: ExternalLink,
      nativeApply: false,
    };
  }

  if (
    job.opportunity_type === "direct_employer" ||
    job.employer_verified ||
    /\b(direct employer|employer|company)\b/.test(source)
  ) {
    return {
      type: "direct_employer",
      label: "Direct Employer",
      description: job.source_description || "Posted directly by an employer through ISEYA",
      badgeClass: "border-amber-200 bg-[#FFF8E6] text-[var(--iseya-navy)]",
      cardAccentClass: "border-l-[var(--iseya-gold)]",
      icon: Building2,
      nativeApply: !job.application_url,
    };
  }

  if (
    job.opportunity_type === "verified_recruiter" ||
    job.recruiter_verified ||
    /\bverified\b/.test(source)
  ) {
    return {
      type: "verified_recruiter",
      label: "Verified Recruiter",
      description: job.source_description || "Posted by a verified recruiting partner",
      badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
      cardAccentClass: "border-l-blue-500",
      icon: BadgeCheck,
      nativeApply: !job.application_url,
    };
  }

  return {
    type: "recruiter",
    label: "Recruiter Posted",
    description: job.source_description || "Posted directly through an ISEYA recruiter workspace",
    badgeClass: "border-blue-100 bg-blue-50/70 text-blue-700",
    cardAccentClass: "border-l-[#235c9d]",
    icon: UserRoundSearch,
    nativeApply: !job.application_url,
  };
}

function tailorResumeHref(job: JobPost) {
  const description = [
    job.role_summary,
    job.responsibilities ? `Responsibilities\n${job.responsibilities}` : "",
    job.requirements ? `Requirements\n${job.requirements}` : "",
    job.skills.length > 0 ? `Skills\n${job.skills.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 5000);
  const params = new URLSearchParams({
    opportunityRole: job.job_title,
    opportunityDescription: description,
  });

  return `/workspace?${params.toString()}#resume-builder`;
}

export default function JobsBoard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applicationsByJobId, setApplicationsByJobId] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [titleQuery, setTitleQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [alertEmail, setAlertEmail] = useState(user?.email ?? "");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [interestJob, setInterestJob] = useState<JobPost | null>(null);
  const [interestDraft, setInterestDraft] = useState<InterestDraft>({
    fullName: "",
    email: user?.email ?? "",
    phoneNumber: "",
    location: "",
    shortNote: "",
    resumeFile: null,
    coverLetterFile: null,
  });
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const [interestStatus, setInterestStatus] = useState("");
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<OpportunityType | "">("");
  const firstVisibleJobRef = useRef<HTMLButtonElement | null>(null);

  const regionOptions = useMemo(
    () =>
      uniqueSorted(
        jobs
          .filter((job) => !countryFilter || normalizeCountry(job.country) === normalizeCountry(countryFilter))
          .map((job) => locationParts(job).region)
          .filter(Boolean),
      ),
    [countryFilter, jobs],
  );
  const countryFilterOptions = useMemo(() => getUniqueCountries(jobs), [jobs]);
  const cityOptions = useMemo(
    () =>
      uniqueSorted(
        jobs
          .filter((job) => !countryFilter || normalizeCountry(job.country) === normalizeCountry(countryFilter))
          .filter((job) => !regionFilter || normalizedMatch(locationParts(job).region) === normalizedMatch(regionFilter))
          .map((job) => locationParts(job).city)
          .filter(Boolean),
      ),
    [countryFilter, jobs, regionFilter],
  );
  const visibleJobs = useMemo(() => {
    const sourceFilteredJobs = sourceFilter
      ? jobs.filter((job) => opportunityProfile(job).type === sourceFilter)
      : jobs;

    return sourceFilteredJobs.filter((job) => {
      const parts = locationParts(job);

      if (countryFilter && normalizeCountry(job.country) !== normalizeCountry(countryFilter)) return false;
      if (regionFilter && normalizedMatch(parts.region) !== normalizedMatch(regionFilter)) return false;
      if (cityFilter && normalizedMatch(parts.city) !== normalizedMatch(cityFilter)) return false;

      return true;
    });
  }, [cityFilter, countryFilter, jobs, regionFilter, sourceFilter]);
  const selectedJob = useMemo(
    () => visibleJobs.find((job) => job.id === selectedJobId) ?? visibleJobs[0] ?? null,
    [visibleJobs, selectedJobId],
  );
  const selectedApplicationStatus = selectedJob
    ? selectedJob.status === "closed" && applicationsByJobId[selectedJob.id]
      ? "closed"
      : applicationsByJobId[selectedJob.id] ?? ""
    : "";
  const selectedOpportunity = selectedJob ? opportunityProfile(selectedJob) : null;
  const SelectedOpportunityIcon = selectedOpportunity?.icon;

  useEffect(() => {
    console.log("VISIBLE FIRST JOB", visibleJobs[0]?.job_title, visibleJobs[0]?.company_name);
  }, [visibleJobs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedJobs = window.localStorage.getItem(savedOpportunityStorageKey);
        const parsed = storedJobs ? (JSON.parse(storedJobs) as unknown) : [];

        if (Array.isArray(parsed)) {
          setSavedJobIds(parsed.filter((id): id is string => typeof id === "string"));
        }
      } catch {
        window.localStorage.removeItem(savedOpportunityStorageKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setStatus("");

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (titleQuery.trim()) params.set("title", titleQuery.trim());
      if (employmentType) params.set("employmentType", employmentType);
      if (workplace) params.set("workplace", workplace);
      const response = await fetch(`/api/jobs?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        jobs?: JobPost[];
        applications?: CandidateApplicationStatus[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to load jobs.");
      }

      const sortedJobs = newestJobsFirst(data.jobs ?? []);
      setJobs(sortedJobs);
      const requestedJobId = new URLSearchParams(window.location.search).get("job") ?? "";
      setSelectedJobId(() =>
        sortedJobs.some((job) => job.id === requestedJobId)
          ? requestedJobId
          : sortedJobs[0]?.id || "",
      );
      const nextStatuses = Object.fromEntries(
        (data.applications ?? []).map((application) => [
          application.job_id,
          application.status,
        ]),
      );
      let anonymousStatuses: Record<string, string> = {};
      if (!user) {
        try {
          const storedStatuses = window.sessionStorage.getItem(anonymousApplicationStorageKey);
          anonymousStatuses = storedStatuses
            ? (JSON.parse(storedStatuses) as Record<string, string>)
            : {};
        } catch {
          window.sessionStorage.removeItem(anonymousApplicationStorageKey);
        }
      }
      setApplicationsByJobId(user ? nextStatuses : { ...anonymousStatuses, ...nextStatuses });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [employmentType, query, titleQuery, user, workplace]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobs();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  function filterBySource(source: OpportunityType | "") {
    const locationFilteredJobs = jobs.filter((job) => {
      const parts = locationParts(job);

      if (countryFilter && normalizeCountry(job.country) !== normalizeCountry(countryFilter)) return false;
      if (regionFilter && normalizedMatch(parts.region) !== normalizedMatch(regionFilter)) return false;
      if (cityFilter && normalizedMatch(parts.city) !== normalizedMatch(cityFilter)) return false;

      return true;
    });
    const matchingJobs = source
      ? locationFilteredJobs.filter((job) => opportunityProfile(job).type === source)
      : locationFilteredJobs;
    setSourceFilter(source);
    setSelectedJobId(matchingJobs[0]?.id ?? "");

    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      firstVisibleJobRef.current?.focus();
      firstVisibleJobRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    });
  }

  function beginApplication(job: JobPost) {
    trackAnalyticsEvent("job_apply_clicked", {
      application_mode: job.application_url ? "external" : "native",
      opportunity_type: job.opportunity_type ?? "recruiter_posted",
    });
    if (job.application_url) {
      window.open(job.application_url, "_blank", "noopener,noreferrer");
      return;
    }

    setInterestJob(job);
    setInterestSubmitted(false);
    setInterestStatus("");
    setInterestDraft({
      fullName:
        typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
      email: user?.email ?? "",
      phoneNumber: "",
      location: "",
      shortNote: "",
      resumeFile: null,
      coverLetterFile: null,
    });
  }

  async function submitInterest() {
    if (!interestJob) {
      return;
    }

    setInterestSubmitting(true);
    setInterestStatus("");

    try {
      const formData = new FormData();
      formData.set("fullName", interestDraft.fullName);
      formData.set("email", interestDraft.email);
      formData.set("phoneNumber", interestDraft.phoneNumber);
      formData.set("location", interestDraft.location);
      formData.set("shortNote", interestDraft.shortNote);
      if (interestDraft.resumeFile) formData.set("resumeFile", interestDraft.resumeFile);
      if (interestDraft.coverLetterFile) {
        formData.set("coverLetterFile", interestDraft.coverLetterFile);
      }

      const response = await fetch(`/api/jobs/${interestJob.id}/apply`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as {
        application?: CandidateApplicationStatus;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit interest right now. Please check the form and try again.",
        );
      }

      setInterestSubmitted(true);
      setInterestStatus("Interest submitted successfully.");
      setStatus("Interest submitted successfully.");
      setApplicationsByJobId((current) => ({
        ...current,
        [interestJob.id]: data.application?.status ?? "submitted",
      }));
      if (!user) {
        let parsed: Record<string, string> = {};
        try {
          const storedStatuses = window.sessionStorage.getItem(anonymousApplicationStorageKey);
          parsed = storedStatuses
            ? (JSON.parse(storedStatuses) as Record<string, string>)
            : {};
        } catch {
          window.sessionStorage.removeItem(anonymousApplicationStorageKey);
        }
        window.sessionStorage.setItem(
          anonymousApplicationStorageKey,
          JSON.stringify({ ...parsed, [interestJob.id]: "submitted" }),
        );
      }
    } catch (error) {
      setInterestStatus(
        error instanceof Error
          ? error.message
          : "Unable to submit interest right now. Please check the form and try again.",
      );
    } finally {
      setInterestSubmitting(false);
    }
  }

  async function subscribeToAlerts() {
    setAlertLoading(true);
    setAlertSubscribed(false);
    setStatus("");

    try {
      const response = await fetch("/api/jobs/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: alertEmail,
          keywordQuery: query,
          titleQuery,
          locationQuery: [cityFilter, regionFilter, countryFilter].filter(Boolean).join(", "),
          employmentType,
          workplaceType: workplace,
          remoteOnly: workplace === "remote",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save job alert.");
      }

      setAlertSubscribed(true);
      setStatus("You’re subscribed to job alerts.");
    } catch (error) {
      setStatus(
        error instanceof Error && /valid email/i.test(error.message)
          ? error.message
          : "Unable to subscribe to job alerts right now. Please try again.",
      );
    } finally {
      setAlertLoading(false);
    }
  }

  function toggleSavedJob(jobId: string) {
    setSavedJobIds((current) => {
      const next = current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId];
      window.localStorage.setItem(savedOpportunityStorageKey, JSON.stringify(next));
      return next;
    });
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
              Job discovery
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Browse roles that fit your next move.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/82">
              Discover trusted opportunities, understand each source, and move from
              role discovery into tailored career materials with clarity.
            </p>
          </div>
          <nav aria-label="Public navigation" className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            {user ? (
              <>
                <Link className={headerNavigationLink} href="/workspace">
                  Dashboard
                </Link>
                <Link className={headerNavigationLink} href="/workspace#resume-builder">
                  Career Assets
                </Link>
                <Link aria-current="page" className={`${headerNavigationLink} text-[var(--iseya-gold)]`} href="/jobs">
                  Jobs
                </Link>
                <Link className={headerNavigationLink} href="/applications">
                  My Applications
                </Link>
                <Link className={headerNavigationLink} href="/account">
                  Settings
                </Link>
              </>
            ) : (
              <Link className={headerNavigationLink} href="/">
                For Candidates
              </Link>
            )}
            <Link className={headerNavigationLink} href="/recruiters">
              For Recruiters
            </Link>
            <Link className={headerNavigationLink} href="/institutions">
              For Institutions
            </Link>
            <Link className={headerNavigationLink} href="/demo">
              Demo
            </Link>
            {!user ? (
              <>
                <Link className={headerNavigationLink} href="/pricing">
                  Pricing
                </Link>
                <Link className={headerNavigationLink} href="/login">
                  Sign In
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[92rem] px-5 py-4 sm:px-8">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm font-semibold text-slate-700 lg:justify-start lg:text-left">
            <span className="text-[var(--iseya-navy)]">Built for:</span>
            <span className="text-slate-600">
              Students • Graduates • Career Transitioners • International Professionals
            </span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-9 sm:px-8 sm:py-11">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Source-Checked Opportunities
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--iseya-heading)] sm:text-4xl">
            Explore roles with clearer source context.
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {sourceFilter
                ? `Filtering by ${opportunitySourceCards.find((card) => card.type === sourceFilter)?.title}.`
                : "Showing all opportunity sources."}
            </p>
            <button
              type="button"
              onClick={() => filterBySource("")}
              aria-pressed={!sourceFilter}
              className={`${secondaryButton} min-h-9 px-3 py-1.5 text-xs ${
                !sourceFilter ? "border-[var(--iseya-gold)] bg-[#FFF8E6]" : ""
              }`}
            >
              All Opportunities
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {opportunitySourceCards.map(({ type, title, copy, Icon, className, activeClassName }) => (
              <button
                type="button"
                key={title}
                onClick={() => filterBySource(type)}
                aria-pressed={sourceFilter === type}
                className={`rounded-xl border p-3.5 text-left transition hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 ${
                  sourceFilter === type ? activeClassName : className
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <p className="text-xs font-bold uppercase tracking-[0.12em]">{title}</p>
                </div>
                <p className="mt-2 text-xs leading-5 opacity-80">{copy}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="iseya-premium-panel grid gap-4 rounded-3xl p-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_180px_180px_180px_180px_180px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Keyword, company, or skill"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          />
          <input
            value={titleQuery}
            onChange={(event) => setTitleQuery(event.target.value)}
            placeholder="Job title"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          />
          <select
            value={countryFilter}
            onChange={(event) => {
              setCountryFilter(event.target.value);
              setRegionFilter("");
              setCityFilter("");
            }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          >
            <option value="">All countries</option>
            {countryFilterOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(event) => {
              setRegionFilter(event.target.value);
              setCityFilter("");
            }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          >
            <option value="">All states/provinces</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          >
            <option value="">All cities/locations</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
          >
            <option value="">All job types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
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

        <div className="mt-4 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgb(0_14_47_/_0.045)] lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Job alerts
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Save your preferences for future matching job alerts using the current title,
              location, type, and remote filters. No social profile is created.
            </p>
            <input
              type="email"
              value={alertEmail}
              onChange={(event) => setAlertEmail(event.target.value)}
              placeholder="Email for job alerts"
              className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25 lg:max-w-md"
            />
          </div>
          <button
            type="button"
            onClick={subscribeToAlerts}
            disabled={alertLoading}
            className={secondaryButton}
          >
            {alertLoading
              ? "Subscribing..."
              : alertSubscribed
                ? "Subscribed"
                : "Subscribe to Job Alerts"}
          </button>
        </div>

        {status ? (
          <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
            {status}
          </p>
        ) : null}

        <div className="mt-7 grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="space-y-3">
            {loading ? (
              <div className="space-y-3" aria-label="Loading job opportunities">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : visibleJobs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm font-medium text-slate-600">
                {sourceFilter
                  ? "No published opportunities match this source and your current filters. Choose another source or reset to all opportunities."
                  : "New opportunities are being added. Adjust your filters or subscribe for alerts."}
              </div>
            ) : (
              visibleJobs.map((job, index) => {
                const source = opportunityProfile(job);
                const SourceIcon = source.icon;
                const applicationStatus =
                  job.status === "closed" && applicationsByJobId[job.id]
                    ? "closed"
                    : applicationsByJobId[job.id];
                return (
                <article
                  key={job.id}
                  className={`w-full rounded-3xl border border-l-4 p-4 text-left shadow-[0_10px_26px_rgb(0_14_47_/_0.045)] transition hover:-translate-y-0.5 ${source.cardAccentClass} ${
                    selectedJob?.id === job.id
                      ? "border-[var(--iseya-gold)] bg-[#FFF8E6]"
                      : "border-slate-200 bg-white hover:border-[var(--iseya-gold)] hover:shadow-[0_18px_40px_rgb(0_14_47_/_0.07)]"
                  }`}
                >
                  <button
                    ref={index === 0 ? firstVisibleJobRef : undefined}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className="w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
                  >
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${source.badgeClass}`}>
                      <SourceIcon className="h-3 w-3" aria-hidden="true" />
                      {source.label}
                    </span>
                    <h2 className="mt-3 text-[1.05rem] font-semibold leading-6 text-[var(--iseya-navy)]">
                      {job.job_title}
                    </h2>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                      {job.company_name} | {job.location || "Location flexible"}
                    </p>
                  </button>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                    {jobMetadata(job)}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    {formatSalary(job)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{source.description}</p>
                  {applicationStatus ? (
                    <ApplicationStatusBadge status={applicationStatus} />
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Link
                      href={tailorResumeHref(job)}
                      aria-label={`Tailor resume for ${job.job_title} at ${job.company_name}`}
                      onClick={() =>
                        trackAnalyticsEvent("resume_builder_cta_clicked", {
                          source: "job_card",
                          opportunity_type: job.opportunity_type ?? "recruiter_posted",
                        })
                      }
                      className={`${secondaryButton} min-h-8 px-2.5 py-1 text-xs`}
                    >
                      <FilePenLine className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Tailor Resume
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleSavedJob(job.id)}
                      className={`${secondaryButton} min-h-8 px-2.5 py-1 text-xs`}
                      aria-pressed={savedJobIds.includes(job.id)}
                    >
                      <Bookmark className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      {savedJobIds.includes(job.id) ? "Saved" : "Save Job"}
                    </button>
                    {!applicationStatus ? (
                      <button
                        type="button"
                        onClick={() => beginApplication(job)}
                        aria-label={`${job.application_url ? "Apply externally for" : "Apply through ISEYA for"} ${job.job_title} at ${job.company_name}`}
                        className={`${primaryButton} min-h-8 px-2.5 py-1 text-xs`}
                      >
                        {job.application_url ? "Apply External" : "Easy Apply"}
                      </button>
                    ) : null}
                  </div>
                </article>
                );
              })
            )}
          </aside>

          <section className="iseya-premium-card rounded-3xl p-5 sm:p-6">
            {selectedJob ? (
              <article>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    {selectedOpportunity && SelectedOpportunityIcon ? (
                      <p className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${selectedOpportunity.badgeClass}`}>
                        <SelectedOpportunityIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {selectedOpportunity.label}
                      </p>
                    ) : null}
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--iseya-heading)]">
                      {selectedJob.job_title}
                    </h2>
                    <p className="mt-2 text-base font-semibold text-slate-700">
                      {selectedJob.company_name} | {selectedJob.location || "Location flexible"}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {formatSalary(selectedJob)}
                    </p>
                    {selectedOpportunity ? (
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {selectedOpportunity.description}
                      </p>
                    ) : null}
                    {hasSponsorship(selectedJob) ? (
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Sponsorship may be available for qualified candidates.
                      </p>
                    ) : null}
                    {selectedJob.application_deadline ? (
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Apply by {new Date(selectedJob.application_deadline).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:min-w-64">
                    <Link
                      href={tailorResumeHref(selectedJob)}
                      aria-label={`Tailor resume for ${selectedJob.job_title} at ${selectedJob.company_name}`}
                      onClick={() =>
                        trackAnalyticsEvent("resume_builder_cta_clicked", {
                          source: "job_detail",
                          opportunity_type: selectedJob.opportunity_type ?? "recruiter_posted",
                        })
                      }
                      className={secondaryButton}
                    >
                      <FilePenLine className="mr-2 h-4 w-4" aria-hidden="true" />
                      Tailor Resume
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleSavedJob(selectedJob.id)}
                      className={secondaryButton}
                      aria-pressed={savedJobIds.includes(selectedJob.id)}
                    >
                      <Bookmark className="mr-2 h-4 w-4" aria-hidden="true" />
                      {savedJobIds.includes(selectedJob.id) ? "Saved" : "Save Job"}
                    </button>
                    {selectedApplicationStatus ? (
                      <ApplicationStatusBadge status={selectedApplicationStatus} prominent />
                    ) : (
                      <button
                        type="button"
                        onClick={() => beginApplication(selectedJob)}
                        aria-label={`${selectedJob.application_url ? "Apply externally for" : "Apply through ISEYA for"} ${selectedJob.job_title} at ${selectedJob.company_name}`}
                        className={primaryButton}
                      >
                        {selectedJob.application_url ? (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                            Apply External
                          </>
                        ) : (
                          "Easy Apply"
                        )}
                      </button>
                    )}
                  </div>
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
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                      ISEYA application beta
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedJob.application_url
                        ? "This opportunity accepts applications through an external hiring page."
                        : "Apply without creating a public candidate profile. If you are signed in, ISEYA can connect this application to your private workspace."}
                    </p>
                    <Link
                      href={tailorResumeHref(selectedJob)}
                      aria-label={`Tailor resume for ${selectedJob.job_title} at ${selectedJob.company_name}`}
                      onClick={() =>
                        trackAnalyticsEvent("resume_builder_cta_clicked", {
                          source: "job_application_panel",
                          opportunity_type: selectedJob.opportunity_type ?? "recruiter_posted",
                        })
                      }
                      className={`${secondaryButton} mt-3`}
                    >
                      Tailor Resume for this Role
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

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="iseya-premium-panel rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Source transparency
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
              Opportunity discovery with clear context
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              ISEYA distinguishes curated external opportunities, recruiter-posted roles,
              verified recruiter listings, and direct employer jobs so candidates understand
              where a position came from before applying.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              From a published listing, candidates can tailor career assets for the role,
              preserve a private application workflow, or continue to an external employer
              application page when appropriate.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
              <Link href="/workspace" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
                Tailor Career Assets
              </Link>
              <Link href="/pricing" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
                View Candidate Plans
              </Link>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Job Discovery FAQ
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--iseya-navy)]">
              Applying through ISEYA
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <div>
                <h3 className="font-semibold text-[var(--iseya-navy)]">What is a curated opportunity?</h3>
                <p>It is an external role sourced for discovery and reviewed before publication on ISEYA.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--iseya-navy)]">When is Easy Apply available?</h3>
                <p>Native ISEYA opportunities may accept interest directly; external roles link to the hiring source.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--iseya-navy)]">Can I prepare before applying?</h3>
                <p>Yes. Tailor Resume connects a listing to your private career workspace.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
      <RelatedAuthorityResources context="jobs" />
      <PublicTrustFooter />
      {interestJob ? (
        <InterestModal
          job={interestJob}
          draft={interestDraft}
          submitting={interestSubmitting}
          submitted={interestSubmitted}
          status={interestStatus}
          onChange={setInterestDraft}
          onClose={() => setInterestJob(null)}
          onSubmit={submitInterest}
        />
      ) : null}
    </main>
  );
}

function InterestModal({
  job,
  draft,
  submitting,
  submitted,
  status,
  onChange,
  onClose,
  onSubmit,
}: {
  job: JobPost;
  draft: InterestDraft;
  submitting: boolean;
  submitted: boolean;
  status: string;
  onChange: (draft: InterestDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [onClose, submitting]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="interest-modal-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Express Interest
            </p>
            <h2 id="interest-modal-title" className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              Submit Interest
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {job.job_title} | {job.company_name}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close application form" className={secondaryButton}>
            Close
          </button>
        </div>

        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Express interest without creating a public candidate profile. If you are signed in,
          ISEYA can connect this interest to your private workspace.
        </p>
        {status ? (
          <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
            {status}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ApplicationField label="Full name" value={draft.fullName} onChange={(value) => onChange({ ...draft, fullName: value })} required />
          <ApplicationField label="Email" type="email" value={draft.email} onChange={(value) => onChange({ ...draft, email: value })} required />
          <ApplicationField label="Phone number" value={draft.phoneNumber} onChange={(value) => onChange({ ...draft, phoneNumber: value })} required />
          <ApplicationField label="Location" value={draft.location} onChange={(value) => onChange({ ...draft, location: value })} required />
          <label className="block text-sm font-semibold text-[var(--iseya-navy)] sm:col-span-2">
            Short note <span className="text-red-600">*</span>
            <textarea
              required
              value={draft.shortNote}
              onChange={(event) => onChange({ ...draft, shortNote: event.target.value })}
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
              placeholder="Briefly describe your interest and relevant experience."
            />
          </label>
          <ApplicationFileField
            label="Resume optional"
            file={draft.resumeFile}
            onChange={(file) => onChange({ ...draft, resumeFile: file })}
          />
          <ApplicationFileField
            label="Cover letter optional"
            file={draft.coverLetterFile}
            onChange={(file) => onChange({ ...draft, coverLetterFile: file })}
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Optional attachments: PDF, DOC, or DOCX, up to 5MB per file.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || submitted}
            className={primaryButton}
          >
            {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit Interest"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ApplicationField({
  label,
  type = "text",
  value,
  required = false,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
      {label} {required ? <span className="text-red-600">*</span> : null}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
      />
    </label>
  );
}

function ApplicationFileField({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
      {label}
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
      />
      {file ? <span className="mt-1 block text-xs font-medium text-slate-500">{file.name}</span> : null}
    </label>
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

function ApplicationStatusBadge({
  status,
  prominent = false,
}: {
  status: string;
  prominent?: boolean;
}) {
  const tone =
    status === "proceed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "rejected" || status === "closed"
        ? "border-slate-200 bg-slate-100 text-slate-700"
        : status === "reviewing"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-[var(--iseya-gold)]/35 bg-[#FFF8E6] text-[var(--iseya-navy)]";

  return (
    <span
      className={`${prominent ? "inline-flex min-h-10 items-center px-4" : "mt-2 inline-flex px-2.5 py-1"} rounded-full border text-xs font-bold uppercase tracking-[0.1em] ${tone}`}
    >
      {label(status)}
    </span>
  );
}
