import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!supabase || !serviceRole) {
    redirect("/login?redirectedFrom=/admin/recruiters");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin/recruiters");
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

export default async function AdminRecruitersPage() {
  const serviceRole = await requireAdmin();
  const { data: recruiters } = await serviceRole
    .from("recruiter_profiles")
    .select("user_id, company_name, recruiter_name, work_email, company_website, linkedin_company_url, phone_number, address_line_1, address_line_2, city, state_region, postal_code, country, company_location, industry, company_size, hiring_focus, verification_status, verification_notes, created_at")
    .in("verification_status", ["pending_review", "rejected"])
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] px-5 py-10 text-[var(--iseya-text)] sm:px-8">
      <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
          Admin Moderation
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--iseya-navy)]">
          Recruiter Reviews
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Placeholder review queue for company profile approval. Use the private Manage dashboard for status updates until the full moderation workflow is expanded.
        </p>
        <Link href="/manage" className="mt-4 inline-flex rounded-md border border-[var(--iseya-navy)] px-3 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]">
          Open Manage Dashboard
        </Link>
        <div className="mt-6 space-y-3">
          {(recruiters ?? []).length > 0 ? (
            recruiters?.map((recruiter) => (
              <article key={recruiter.user_id} className="rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-[var(--iseya-navy)]">
                  {recruiter.company_name || "Company pending"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {recruiter.recruiter_name || "Recruiter"} · {recruiter.work_email}
                </p>
                <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-600 sm:grid-cols-2">
                  <p>Website: {recruiter.company_website || "Not provided"}</p>
                  <p>LinkedIn: {recruiter.linkedin_company_url || "Not provided"}</p>
                  <p>Phone: {recruiter.phone_number || "Not provided"}</p>
                  <p>Address line 1: {recruiter.address_line_1 || "Not provided"}</p>
                  <p>Address line 2: {recruiter.address_line_2 || "Not provided"}</p>
                  <p>City: {recruiter.city || "Not provided"}</p>
                  <p>State/Region: {recruiter.state_region || "Not provided"}</p>
                  <p>Postal code: {recruiter.postal_code || "Not provided"}</p>
                  <p>Country: {recruiter.country || "Not provided"}</p>
                  <p>Industry: {recruiter.industry || "Not provided"}</p>
                  <p>Company size: {recruiter.company_size || "Not provided"}</p>
                  <p className="sm:col-span-2">Hiring focus: {recruiter.hiring_focus || "Not provided"}</p>
                  <p className="sm:col-span-2">Notes: {recruiter.verification_notes || "No notes"}</p>
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--iseya-gold)]">
                  {recruiter.verification_status.replace(/_/g, " ")}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No pending recruiter reviews.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
