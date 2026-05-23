import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const serviceRole = createSupabaseServiceRoleClient();

  if (!serviceRole) {
    return Response.json({ error: "Interest submissions are being prepared. Please try again shortly." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const providedEmail = text(body.email).toLowerCase();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const { data: job, error: jobError } = await serviceRole
    .from("job_posts")
    .select("id, recruiter_id, status, job_title, company_name")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (jobError || !job) {
    return Response.json({ error: "This job is not available." }, { status: 404 });
  }

  const { data: profile } = user
    ? await serviceRole
        .from("profiles")
        .select("id, email, full_name, account_type")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const candidateEmail = (profile?.email ?? user?.email ?? providedEmail).toLowerCase();

  if (!user && !validEmail(candidateEmail)) {
    return Response.json(
      { error: "Enter your email to express interest in this role." },
      { status: 400 },
    );
  }

  const { error } = await serviceRole.from("job_applications").insert({
    job_id: job.id,
    candidate_id: user?.id ?? null,
    candidate_email: candidateEmail || null,
    recruiter_id: job.recruiter_id,
    status: "submitted",
    candidate_snapshot: {
      email: candidateEmail,
      fullName: profile?.full_name ?? "",
      source: user ? "ISEYA career materials" : "Email interest",
    },
  });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "You already expressed interest in this role." }, { status: 409 });
    }

    console.error("[jobs] application failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to submit interest right now." }, { status: 500 });
  }

  const { count } = await serviceRole
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", job.id);

  await serviceRole
    .from("job_posts")
    .update({ applicants_count: count ?? 1 })
    .eq("id", job.id);

  return Response.json({ ok: true });
}
