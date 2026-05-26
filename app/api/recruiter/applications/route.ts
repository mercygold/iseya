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
    return { supabase: null, userId: "", recruiter: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? "";
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("account_type, role, app_role")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  return {
    supabase,
    userId,
    recruiter:
      profile?.account_type === "recruiter" ||
      profile?.role === "admin" ||
      profile?.app_role === "admin",
  };
}

async function getOwnedNativeJobIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("job_posts")
    .select("id")
    .eq("recruiter_id", userId)
    .neq("opportunity_type", "curated_opportunity");

  if (error) {
    console.error("[recruiter-applications] owned job lookup failed", {
      code: error.code,
    });
    return { jobIds: [] as string[], error };
  }

  return { jobIds: (data ?? []).map((job) => job.id), error: null };
}

export async function GET() {
  const { supabase, userId, recruiter } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }
  if (!recruiter) {
    return Response.json({ error: "Recruiter account required." }, { status: 403 });
  }

  const { jobIds, error: jobLookupError } = await getOwnedNativeJobIds(supabase, userId);
  if (jobLookupError) {
    return Response.json({ error: "Unable to load applicants right now." }, { status: 500 });
  }
  if (jobIds.length === 0) {
    return Response.json({ applications: [] });
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, job_id, recruiter_id, candidate_user_id, candidate_email, full_name, phone_number, location, short_note, resume_file_url, cover_letter_file_url, status, created_at, updated_at, job_posts!inner(job_title)",
    )
    .eq("recruiter_id", userId)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[recruiter-applications] list failed", {
      code: error.code,
    });
    return Response.json({ error: "Unable to load applicants right now." }, { status: 500 });
  }

  const applicationIds = (data ?? []).map((application) => application.id);
  const { data: recruiterNotes, error: noteError } = applicationIds.length
    ? await supabase
        .from("job_application_recruiter_notes")
        .select("application_id, recruiter_note")
        .eq("recruiter_id", userId)
        .in("application_id", applicationIds)
    : { data: [], error: null };

  if (noteError) {
    console.error("[recruiter-applications] internal notes lookup failed", {
      code: noteError.code,
    });
  }

  const notesByApplication = new Map(
    (recruiterNotes ?? []).map((note) => [note.application_id, note.recruiter_note]),
  );
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
      recruiter_note: notesByApplication.get(application.id) ?? "",
    })),
  );

  return Response.json({ applications });
}

export async function PATCH(request: Request) {
  const { supabase, userId, recruiter } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }
  if (!recruiter) {
    return Response.json({ error: "Recruiter account required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    applicationId?: unknown;
    status?: unknown;
    recruiterNote?: unknown;
  };
  const applicationId = typeof body.applicationId === "string" ? body.applicationId : "";
  const status = typeof body.status === "string" ? body.status : "";
  const includesNote = typeof body.recruiterNote === "string";
  const recruiterNote = includesNote ? String(body.recruiterNote).trim().slice(0, 3000) : "";

  if (!applicationId || (!validApplicationStatuses.has(status) && !includesNote)) {
    return Response.json({ error: "Invalid applicant status update." }, { status: 400 });
  }

  const { jobIds, error: jobLookupError } = await getOwnedNativeJobIds(supabase, userId);
  if (jobLookupError) {
    return Response.json({ error: "Unable to update applicant status right now." }, { status: 500 });
  }
  if (jobIds.length === 0) {
    return Response.json({ error: "Unable to update applicant status right now." }, { status: 404 });
  }

  const { data: currentApplication } = await supabase
    .from("job_applications")
    .select("id, status")
    .eq("id", applicationId)
    .eq("recruiter_id", userId)
    .in("job_id", jobIds)
    .maybeSingle();

  if (!currentApplication) {
    return Response.json({ error: "Unable to update applicant status right now." }, { status: 404 });
  }

  if (includesNote) {
    const { error: noteSaveError } = await supabase
      .from("job_application_recruiter_notes")
      .upsert(
        { application_id: applicationId, recruiter_id: userId, recruiter_note: recruiterNote },
        { onConflict: "application_id" },
      );

    if (noteSaveError) {
      console.error("[recruiter-applications] internal note save failed", {
        code: noteSaveError.code,
      });
      return Response.json({ error: "Unable to save internal note right now." }, { status: 500 });
    }
  }

  if (!validApplicationStatuses.has(status)) {
    return Response.json({
      application: {
        id: applicationId,
        status: currentApplication.status,
        recruiter_note: recruiterNote,
      },
    });
  }

  const { data, error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("recruiter_id", userId)
    .in("job_id", jobIds)
    .select("id, status, job_id, candidate_user_id, candidate_email, job_posts!inner(job_title)")
    .single();

  if (error) {
    console.error("[recruiter-applications] status update failed", {
      code: error.code,
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
