import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!supabase || !serviceRole) {
    redirect("/login?redirectedFrom=/admin/jobs");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin/jobs");
  }

  const { data: profile } = await serviceRole
    .from("profiles")
    .select("role, app_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.app_role !== "admin") {
    redirect("/workspace");
  }

  return serviceRole;
}

export default async function AdminJobsPage() {
  const serviceRole = await requireAdmin();
  const { data: jobs } = await serviceRole
    .from("job_posts")
    .select("id, recruiter_id, job_title, company_name, status, applicants_count, created_at")
    .in("status", ["pending_review", "rejected"])
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] px-5 py-10 text-[var(--iseya-text)] sm:px-8">
      <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
          Admin Moderation
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)]">
          Job Post Reviews
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Placeholder review queue for pending job posts. Admins can publish, reject, or close jobs from the private Manage dashboard while this review surface is expanded.
        </p>
        <Link href="/manage" className="mt-4 inline-flex rounded-md border border-[var(--iseya-navy)] px-3 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]">
          Open Manage Dashboard
        </Link>
        <div className="mt-6 space-y-3">
          {(jobs ?? []).length > 0 ? (
            jobs?.map((job) => (
              <article key={job.id} className="rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-[var(--iseya-navy)]">{job.job_title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {job.company_name} · {job.applicants_count} applicants
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                  {job.status.replace(/_/g, " ")}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No pending job reviews.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
