import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { data: job, error: jobError } = await supabase
    .from("job_posts")
    .select("id, recruiter_id, status, job_title, company_name")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (jobError || !job) {
    return Response.json({ error: "This job is not available." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, account_type")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("job_applications").insert({
    job_id: job.id,
    candidate_id: user.id,
    recruiter_id: job.recruiter_id,
    status: "submitted",
    candidate_snapshot: {
      email: profile?.email ?? user.email ?? "",
      fullName: profile?.full_name ?? "",
      source: "ISEYA career profile",
    },
  });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "You already expressed interest in this role." }, { status: 409 });
    }

    console.error("[jobs] application failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to submit interest right now." }, { status: 500 });
  }

  const serviceRole = createSupabaseServiceRoleClient();
  if (serviceRole) {
    const { count } = await serviceRole
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id);

    await serviceRole
      .from("job_posts")
      .update({ applicants_count: count ?? 1 })
      .eq("id", job.id);
  }

  return Response.json({ ok: true });
}
