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

const submitErrorMessage =
  "Unable to submit interest right now. Please check the form and try again.";

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const serviceRole = createSupabaseServiceRoleClient();

  if (!serviceRole) {
    return Response.json({ error: submitErrorMessage }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const fullName = text(body.fullName);
  const providedEmail = text(body.email).toLowerCase();
  const phoneNumber = text(body.phoneNumber);
  const location = text(body.location);
  const shortNote = text(body.shortNote);
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

  const candidateEmail = (providedEmail || profile?.email || user?.email || "").toLowerCase();

  if (!fullName || !validEmail(candidateEmail) || !phoneNumber || !location || !shortNote) {
    return Response.json(
      { error: "Complete all required interest fields before submitting." },
      { status: 400 },
    );
  }

  const applicationPayload = {
    job_id: job.id,
    candidate_id: user?.id ?? null,
    candidate_user_id: user?.id ?? null,
    candidate_email: candidateEmail || null,
    recruiter_id: job.recruiter_id,
    full_name: fullName,
    phone_number: phoneNumber,
    location,
    short_note: shortNote,
    resume_file_url: null,
    cover_letter_file_url: null,
    status: "submitted",
    candidate_snapshot: {
      email: candidateEmail,
      fullName,
      phoneNumber,
      location,
      shortNote,
      source: user ? "ISEYA career materials" : "Email interest",
    },
  };

  const { error } = await serviceRole.from("job_applications").insert(applicationPayload);

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "You already expressed interest in this role." }, { status: 409 });
    }

    console.error("[jobs] application failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      jobId: id,
      candidateUserIdExists: Boolean(user?.id),
    });
    return Response.json({ error: submitErrorMessage }, { status: 500 });
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
