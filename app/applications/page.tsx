import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";
import NotificationPanel from "@/components/NotificationPanel";
import DashboardNavLink from "@/components/DashboardNavLink";

export const dynamic = "force-dynamic";

type ApplicationStatus = "submitted" | "reviewing" | "proceed" | "rejected" | "closed";

type CandidateApplication = {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  short_note: string;
  resume_file_url: string | null;
  cover_letter_file_url: string | null;
};

type ApplicationJob = {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  workplace_type: string;
  status: string;
};

type ApplicationCard = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  workplaceType: string;
  submittedAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  shortNote: string;
  resumeUploaded: boolean;
  coverLetterUploaded: boolean;
};

const statusOrder: ApplicationStatus[] = [
  "submitted",
  "reviewing",
  "proceed",
  "rejected",
  "closed",
];

const statusNames: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  proceed: "Next Step",
  rejected: "Rejected",
  closed: "Closed",
};

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "border-slate-200 bg-slate-50 text-[var(--iseya-navy)]",
  reviewing: "border-amber-200 bg-amber-50 text-amber-800",
  proceed: "border-blue-200 bg-blue-50 text-blue-800",
  rejected: "border-rose-100 bg-rose-50 text-rose-700",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
};

const primaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2";

const displayGroups = [
  {
    id: "reviewing",
    title: "Reviewing",
    description: "Recruiters are actively reviewing these applications.",
    statuses: ["reviewing"] as ApplicationStatus[],
  },
  {
    id: "submitted",
    title: "Submitted",
    description: "Interest submitted and available for recruiter review.",
    statuses: ["submitted"] as ApplicationStatus[],
  },
  {
    id: "next-step",
    title: "Next Step",
    description: "The recruiter has chosen to proceed with your application.",
    statuses: ["proceed"] as ApplicationStatus[],
  },
  {
    id: "closed",
    title: "Closed / Archived",
    description: "Completed application outcomes retained for your records.",
    statuses: ["rejected", "closed"] as ApplicationStatus[],
  },
];

function label(value: string) {
  return value.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(value: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)));
}

function appliedAge(value: string) {
  const days = daysSince(value);
  if (days === 0) return "Applied today";
  if (days === 1) return "Applied 1 day ago";
  return `Applied ${days} days ago`;
}

function normalizedStatus(applicationStatus: string, jobStatus: string | undefined): ApplicationStatus {
  if (jobStatus === "closed") return "closed";
  return statusOrder.includes(applicationStatus as ApplicationStatus)
    ? (applicationStatus as ApplicationStatus)
    : "submitted";
}

async function loadApplications() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return { userId: "", applications: [] as ApplicationCard[], error: true };
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/applications");
  }

  const serviceRole = createSupabaseServiceRoleClient();
  if (!serviceRole) {
    return { userId: user.id, applications: [] as ApplicationCard[], error: true };
  }

  const { data, error } = await serviceRole
    .from("job_applications")
    .select("id, job_id, status, created_at, updated_at, short_note, resume_file_url, cover_letter_file_url")
    .or(`candidate_user_id.eq.${user.id},candidate_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[candidate-applications] list failed", {
      code: error.code,
    });
    return { userId: user.id, applications: [] as ApplicationCard[], error: true };
  }

  const applications = (data ?? []) as CandidateApplication[];
  const jobIds = [...new Set(applications.map((application) => application.job_id))];
  const { data: jobData, error: jobError } = jobIds.length
    ? await serviceRole
        .from("job_posts")
        .select("id, job_title, company_name, location, workplace_type, status")
        .in("id", jobIds)
    : { data: [], error: null };

  if (jobError) {
    console.error("[candidate-applications] job lookup failed", {
      code: jobError.code,
    });
    return { userId: user.id, applications: [] as ApplicationCard[], error: true };
  }

  const jobs = new Map(
    ((jobData ?? []) as ApplicationJob[]).map((job) => [job.id, job]),
  );

  return {
    userId: user.id,
    error: false,
    applications: applications
      .map((application) => {
        const job = jobs.get(application.job_id);
        if (!job) return null;
        return {
          id: application.id,
          jobId: application.job_id,
          jobTitle: job.job_title,
          companyName: job.company_name,
          location: job.location,
          workplaceType: job.workplace_type,
          submittedAt: application.created_at,
          updatedAt: application.updated_at,
          status: normalizedStatus(application.status, job.status),
          shortNote: application.short_note,
          resumeUploaded: Boolean(application.resume_file_url),
          coverLetterUploaded: Boolean(application.cover_letter_file_url),
        } satisfies ApplicationCard;
      })
      .filter((application): application is ApplicationCard => Boolean(application)),
  };
}

export default async function ApplicationsPage() {
  const result = await loadApplications();
  const activeApplications = result.applications.filter(
    (application) => application.status !== "rejected" && application.status !== "closed",
  ).length;
  const nextStepApplications = result.applications.filter(
    (application) => application.status === "proceed",
  ).length;
  const recommendationSeeds = result.applications
    .filter((application, index, applications) =>
      applications.findIndex((item) => item.jobTitle === application.jobTitle) === index,
    )
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
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
          <nav className="iseya-dashboard-nav text-sm font-semibold">
            <DashboardNavLink href="/workspace">
              Dashboard
            </DashboardNavLink>
            <DashboardNavLink href="/workspace#resume-builder" highlightOnPath={false}>
              Career Assets
            </DashboardNavLink>
            <DashboardNavLink href="/jobs">
              Jobs
            </DashboardNavLink>
            <DashboardNavLink href="/applications">
              My Applications
            </DashboardNavLink>
            <DashboardNavLink href="/account">
              Settings
            </DashboardNavLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              Private Workspace
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
              My Applications
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Track opportunities you have expressed interest in and continue improving your career materials.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {result.applications.length > 0 ? (
              <p className="rounded-full border border-[var(--iseya-gold)]/40 bg-[#FFF8E6] px-4 py-2 text-sm font-semibold text-[var(--iseya-navy)]">
                {activeApplications} active application{activeApplications === 1 ? "" : "s"}
              </p>
            ) : null}
            <Link href="/jobs" className={primaryButton}>
              Browse Jobs
            </Link>
          </div>
        </div>

        {result.error ? (
          <p role="status" aria-live="polite" className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
            Unable to load your applications right now. Please try again shortly.
          </p>
        ) : result.applications.length === 0 ? (
          <section aria-labelledby="active-applications" className="mt-9 rounded-2xl border border-dashed border-slate-300 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Active Applications
            </p>
            <h2 id="active-applications" className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
              You have not expressed interest in any roles yet.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Explore published opportunities and submit interest through your private ISEYA workspace.
            </p>
            <Link href="/jobs" className={`${primaryButton} mt-5`}>
              Browse Jobs
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-9" aria-labelledby="active-applications">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                    Your Hiring Journey
                  </p>
                  <h2 id="active-applications" className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
                    Active Applications
                  </h2>
                </div>
                <p className="text-sm text-slate-600">
                  Status changes appear here as recruiters review your interest.
                </p>
              </div>
              <div className="mt-5 space-y-5">
            {displayGroups.map((group) => {
              const applications = result.applications.filter((application) =>
                group.statuses.includes(application.status),
              );
              if (applications.length === 0) return null;
              return (
                <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--iseya-navy)]">
                        {group.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[group.statuses[0]]}`}>
                      {applications.length}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {applications.map((application) => (
                      <article key={application.id} className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-[var(--iseya-navy)] sm:text-lg">
                              {application.jobTitle}
                            </h4>
                            <p className="mt-1 text-sm font-medium text-slate-600">
                              {application.companyName}
                            </p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[application.status]}`}>
                            {statusNames[application.status]}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          {application.location || "Location flexible"} | {label(application.workplaceType)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                          <span>{appliedAge(application.submittedAt)}</span>
                          <span>Last updated {formatDate(application.updatedAt)}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <details className="w-full">
                            <summary className={`${secondaryButton} cursor-pointer list-none`}>
                              View Details
                            </summary>
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <ApplicationDetail label="Job title" value={application.jobTitle} />
                                <ApplicationDetail label="Company" value={application.companyName} />
                                <ApplicationDetail label="Submitted" value={formatDate(application.submittedAt)} />
                                <ApplicationDetail label="Status" value={statusNames[application.status]} />
                                <ApplicationDetail
                                  label="Resume uploaded"
                                  value={application.resumeUploaded ? "Yes" : "No"}
                                />
                                <ApplicationDetail
                                  label="Cover letter uploaded"
                                  value={application.coverLetterUploaded ? "Yes" : "No"}
                                />
                                <div className="sm:col-span-2">
                                  <ApplicationDetail label="Your submitted note" value={application.shortNote || "No note submitted."} />
                                </div>
                              </div>
                            </div>
                          </details>
                          <Link href={`/jobs?job=${application.jobId}`} className={secondaryButton}>
                            View Job
                          </Link>
                          <Link href="/workspace#resume-builder" className={secondaryButton}>
                            Improve Career Materials
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
              </div>
            </section>

            <section aria-labelledby="application-stages" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Progress</p>
                  <h2 id="application-stages" className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
                    Application stages
                  </h2>
                </div>
                <p className="text-sm text-slate-500">Track movement from submission to recruiter next steps.</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Submitted", result.applications.filter((application) => application.status === "submitted").length, "bg-[var(--iseya-navy)]"],
                  ["Reviewing", result.applications.filter((application) => application.status === "reviewing").length, "bg-[var(--iseya-gold)]"],
                  ["Next Step", nextStepApplications, "bg-blue-500"],
                  ["Closed", result.applications.filter((application) => application.status === "closed" || application.status === "rejected").length, "bg-slate-400"],
                ].map(([stage, count, accent]) => (
                  <div key={String(stage)} className="rounded-xl border border-slate-200 p-4">
                    <span className={`block h-1.5 w-12 rounded-full ${accent}`} />
                    <p className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">{count}</p>
                    <p className="mt-1 text-sm font-medium text-slate-600">{stage}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="mt-8" aria-label="Recent updates">
          <NotificationPanel
            title="Recent Updates"
            subtitle="Recruiter decisions and opportunity alerts support your application progress."
            compact
            initialVisibleCount={3}
          />
        </section>

        {!result.error && recommendationSeeds.length > 0 ? (
          <section aria-labelledby="recommended-opportunities" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Continue Discovery
                </p>
                <h2 id="recommended-opportunities" className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
                  Recommended Opportunities
                </h2>
              </div>
              <p className="text-sm text-slate-500">Based on roles already in your application activity.</p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {recommendationSeeds.map((application) => (
                <article key={application.id} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                    Related Role Pathway
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[var(--iseya-navy)]">
                    {application.jobTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Explore similar published opportunities and keep your materials aligned to this role direction.
                  </p>
                  <Link href="/jobs" className={`${secondaryButton} mt-4 w-full sm:w-auto`}>
                    Browse Opportunities
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function ApplicationDetail({ label: detailLabel, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {detailLabel}
      </p>
      <p className="mt-1 whitespace-pre-line font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}
