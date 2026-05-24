import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";
import { sendCandidateApplicationStatusEmail } from "@/lib/notificationEmails";
import { createNotification } from "@/lib/notifications";

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

  const serviceRole = createSupabaseServiceRoleClient();
  async function signedAttachmentUrl(path: string | null) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (!serviceRole) return null;

    const { data: signedData, error: signedError } = await serviceRole.storage
      .from("job-application-files")
      .createSignedUrl(path, 60 * 60);

    if (signedError) {
      console.error("[recruiter-applications] attachment link failed", {
        code: signedError.name,
        message: signedError.message,
        userId,
      });
      return null;
    }

    return signedData.signedUrl;
  }

  const applications = await Promise.all(
    (data ?? []).map(async (application) => ({
      ...application,
      resume_file_url: await signedAttachmentUrl(application.resume_file_url),
      cover_letter_file_url: await signedAttachmentUrl(application.cover_letter_file_url),
      job_title: application.job_posts[0]?.job_title ?? "",
    })),
  );

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

  const { data: currentApplication } = await supabase
    .from("job_applications")
    .select("status")
    .eq("id", applicationId)
    .eq("recruiter_id", userId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("recruiter_id", userId)
    .select("id, status, job_id, candidate_user_id, candidate_email, job_posts!inner(job_title)")
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

  const serviceRole = createSupabaseServiceRoleClient();
  const jobTitle = data.job_posts[0]?.job_title ?? "this role";
  const messages: Record<string, string> = {
    reviewing: `Your application for ${jobTitle} is now under review.`,
    proceed: `Your application for ${jobTitle} has moved forward.`,
    rejected: `Your application for ${jobTitle} was not selected.`,
  };

  if (serviceRole && messages[status] && currentApplication?.status !== status) {
    await createNotification(serviceRole, {
      userId: data.candidate_user_id,
      email: data.candidate_email,
      type: `application_${status}`,
      title: status === "reviewing" ? "Application under review" : status === "proceed" ? "Application update" : "Application decision",
      message: messages[status],
      relatedJobId: data.job_id,
      relatedApplicationId: data.id,
    });
    await sendCandidateApplicationStatusEmail({
      email: data.candidate_email,
      jobTitle,
      status,
    });
  }

  return Response.json({ application: { id: data.id, status: data.status } });
}
