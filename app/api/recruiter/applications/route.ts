import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validApplicationStatuses = new Set(["submitted", "reviewing", "proceed", "rejected"]);

async function getUserContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { supabase: null, userId: "" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? "" };
}

export async function GET() {
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, job_id, recruiter_id, candidate_user_id, candidate_email, full_name, phone_number, location, short_note, resume_file_url, cover_letter_file_url, status, created_at, updated_at, job_posts!inner(job_title)",
    )
    .eq("recruiter_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[recruiter-applications] list failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
    });
    return Response.json({ error: "Unable to load applicants right now." }, { status: 500 });
  }

  const applications = (data ?? []).map((application) => ({
    ...application,
    job_title: application.job_posts[0]?.job_title ?? "",
  }));

  return Response.json({ applications });
}

export async function PATCH(request: Request) {
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    applicationId?: unknown;
    status?: unknown;
  };
  const applicationId = typeof body.applicationId === "string" ? body.applicationId : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!applicationId || !validApplicationStatuses.has(status)) {
    return Response.json({ error: "Invalid applicant status update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("recruiter_id", userId)
    .select("id, status")
    .single();

  if (error) {
    console.error("[recruiter-applications] status update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      applicationId,
    });
    return Response.json({ error: "Unable to update applicant status right now." }, { status: 500 });
  }

  return Response.json({ application: data });
}
