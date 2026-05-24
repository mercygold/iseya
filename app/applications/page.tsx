import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";
import NotificationPanel from "@/components/NotificationPanel";

export const dynamic = "force-dynamic";

type ApplicationStatus = "submitted" | "reviewing" | "proceed" | "rejected" | "closed";

type CandidateApplication = {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
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
  status: ApplicationStatus;
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
  proceed: "Proceed",
  rejected: "Rejected",
  closed: "Closed",
};

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "border-[#F4B321]/40 bg-[#FFF8E6] text-[var(--iseya-navy)]",
  reviewing: "border-amber-200 bg-amber-50 text-amber-800",
  proceed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-slate-200 bg-slate-100 text-slate-700",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
};

const primaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]";

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
    .select("id, job_id, status, created_at")
    .or(`candidate_user_id.eq.${user.id},candidate_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[candidate-applications] list failed", {
      code: error.code,
      message: error.message,
      userId: user.id,
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
      message: jobError.message,
      userId: user.id,
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
          status: normalizedStatus(application.status, job.status),
        } satisfies ApplicationCard;
      })
      .filter((application): application is ApplicationCard => Boolean(application)),
  };
}

export default async function ApplicationsPage() {
  const result = await loadApplications();
  const groupedApplications = Object.fromEntries(
    statusOrder.map((status) => [
      status,
      result.applications.filter((application) => application.status === status),
    ]),
  ) as Record<ApplicationStatus, ApplicationCard[]>;

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/workspace" className="inline-flex items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              priority
              className="h-auto w-[150px] object-contain sm:w-[220px]"
            />
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/workspace">
              Dashboard
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/workspace#resume-builder">
              Career Assets
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/jobs">
              Jobs
            </Link>
            <Link className="text-[var(--iseya-gold)]" href="/applications">
              My Applications
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/account">
              Settings
            </Link>
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
          <Link href="/jobs" className={primaryButton}>
            Browse Jobs
          </Link>
        </div>

        <div className="mt-10">
          <NotificationPanel
            title="Application notifications"
            subtitle="Updates on submitted interests and recruiter decisions appear here."
          />
        </div>

        {result.error ? (
          <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
            Unable to load your applications right now. Please try again shortly.
          </p>
        ) : result.applications.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--iseya-navy)]">
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
          <div className="mt-10 space-y-7">
            {statusOrder.map((status) => {
              const applications = groupedApplications[status];
              if (applications.length === 0) return null;
              return (
                <section key={status} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-semibold text-[var(--iseya-navy)]">
                      {statusNames[status]}
                    </h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[status]}`}>
                      {applications.length}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {applications.map((application) => (
                      <article key={application.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--iseya-navy)]">
                              {application.jobTitle}
                            </h3>
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
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Submitted {formatDate(application.submittedAt)}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
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
        )}
      </section>
    </main>
  );
}
