import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, userId: "" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? "" };
}

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  message: string;
  related_job_id: string | null;
  related_application_id: string | null;
  read: boolean;
  created_at: string;
};

const recruiterProfileNotificationTypes = new Set(["recruiter_verified", "recruiter_rejected"]);
const recruiterJobNotificationTypes = new Set([
  "new_application",
  "application_materials_uploaded",
  "job_published",
  "job_rejected",
]);

function isRecruiterScope(request: Request) {
  return new URL(request.url).searchParams.get("scope") === "recruiter";
}

async function recruiterScopeJobIds(supabase: SupabaseClient, userId: string) {
  const [{ data: profile, error: profileError }, { data: jobs, error: jobError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("account_type, role, app_role")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("job_posts")
        .select("id")
        .eq("recruiter_id", userId)
        .neq("opportunity_type", "curated_opportunity"),
    ]);

  if (profileError || jobError) {
    console.error("[notifications] recruiter scope lookup failed", {
      code: profileError?.code ?? jobError?.code,
    });
    return { allowed: false, jobIds: new Set<string>(), lookupFailed: true };
  }

  const allowed =
    profile?.account_type === "recruiter" ||
    profile?.role === "admin" ||
    profile?.app_role === "admin";

  return {
    allowed,
    jobIds: new Set((jobs ?? []).map((job) => job.id)),
    lookupFailed: false,
  };
}

function recruiterCanViewNotification(notification: NotificationRecord, jobIds: Set<string>) {
  if (recruiterProfileNotificationTypes.has(notification.type)) {
    return notification.related_job_id === null;
  }

  return (
    recruiterJobNotificationTypes.has(notification.type) &&
    Boolean(notification.related_job_id && jobIds.has(notification.related_job_id))
  );
}

export async function GET(request: Request) {
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const recruiterScope = isRecruiterScope(request);
  const recruiterContext = recruiterScope
    ? await recruiterScopeJobIds(supabase, userId)
    : null;

  if (recruiterContext?.lookupFailed) {
    return Response.json({ error: "Unable to load notifications right now." }, { status: 500 });
  }
  if (recruiterContext && !recruiterContext.allowed) {
    return Response.json({ error: "Recruiter account required." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, related_job_id, related_application_id, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(recruiterScope ? 200 : 20);

  if (error) {
    console.error("[notifications] list failed", {
      code: error.code,
    });
    return Response.json({ error: "Unable to load notifications right now." }, { status: 500 });
  }

  const notifications = recruiterContext
    ? ((data ?? []) as NotificationRecord[])
        .filter((notification) =>
          recruiterCanViewNotification(notification, recruiterContext.jobIds),
        )
        .slice(0, 20)
    : (data ?? []);

  return Response.json({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
  });
}

export async function PATCH(request: Request) {
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { notificationId?: unknown };
  const notificationId =
    typeof body.notificationId === "string" ? body.notificationId : "";

  if (!notificationId) {
    return Response.json({ error: "Invalid notification request." }, { status: 400 });
  }

  if (isRecruiterScope(request)) {
    const recruiterContext = await recruiterScopeJobIds(supabase, userId);
    if (recruiterContext.lookupFailed) {
      return Response.json({ error: "Unable to update notification right now." }, { status: 500 });
    }
    if (!recruiterContext.allowed) {
      return Response.json({ error: "Recruiter account required." }, { status: 403 });
    }

    const { data: requestedNotification, error: notificationError } = await supabase
      .from("notifications")
      .select("id, type, title, message, related_job_id, related_application_id, read, created_at")
      .eq("id", notificationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (
      notificationError ||
      !requestedNotification ||
      !recruiterCanViewNotification(
        requestedNotification as NotificationRecord,
        recruiterContext.jobIds,
      )
    ) {
      return Response.json({ error: "Unable to update notification right now." }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id, read")
    .maybeSingle();

  if (error || !data) {
    console.error("[notifications] mark-read failed", {
      code: error?.code,
    });
    return Response.json({ error: "Unable to update notification right now." }, { status: 500 });
  }

  return Response.json({ notification: data });
}
