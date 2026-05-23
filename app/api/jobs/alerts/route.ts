import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = text(body.email).toLowerCase();
  const keywordQuery = text(body.keywordQuery);
  const titleQuery = text(body.titleQuery);
  const locationQuery = text(body.locationQuery);
  const employmentType = text(body.employmentType);
  const workplaceType = text(body.workplaceType);
  const remoteOnly = Boolean(body.remoteOnly);

  if (!validEmail(email)) {
    return Response.json({ error: "Enter a valid email address for job alerts." }, { status: 400 });
  }

  const serviceRole = createSupabaseServiceRoleClient();

  if (!serviceRole) {
    return Response.json({ error: "Job alerts are temporarily unavailable." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const { error } = await serviceRole.from("job_alert_subscriptions").insert({
    candidate_id: user?.id ?? null,
    email,
    keyword_query: keywordQuery,
    title_query: titleQuery,
    location_query: locationQuery,
    employment_type: employmentType,
    workplace_type: workplaceType,
    remote_only: remoteOnly,
    status: "active",
  });

  if (error) {
    console.error("[jobs] alert subscription failed", {
      code: error.code,
      message: error.message,
    });
    return Response.json({ error: "Unable to save job alert right now." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
