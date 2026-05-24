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

export async function GET() {
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, related_job_id, related_application_id, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[notifications] list failed", {
      code: error.code,
      message: error.message,
      userId,
    });
    return Response.json({ error: "Unable to load notifications right now." }, { status: 500 });
  }

  return Response.json({
    notifications: data ?? [],
    unreadCount: (data ?? []).filter((notification) => !notification.read).length,
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
      message: error?.message,
      userId,
    });
    return Response.json({ error: "Unable to update notification right now." }, { status: 500 });
  }

  return Response.json({ notification: data });
}

