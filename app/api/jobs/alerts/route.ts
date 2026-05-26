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

  if (!validEmail(email)) {
    return Response.json({ error: "Enter a valid email address for job alerts." }, { status: 400 });
  }

  const serviceRole = createSupabaseServiceRoleClient();

  if (!serviceRole) {
    return Response.json(
      { error: "Unable to subscribe to job alerts right now. Please try again." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const alertPayload = {
    candidate_id: user?.id ?? null,
    email,
    keyword: keywordQuery,
    title_preference: titleQuery,
    location_preference: locationQuery,
    job_type_preference: employmentType,
    workplace_type_preference: workplaceType,
    status: "active",
  };

  // TODO: Send matching-job email notifications once transactional email delivery is configured.
  const { error } = await serviceRole.from("job_alert_subscriptions").insert(alertPayload);

  if (error) {
    console.error("[jobs] alert subscription failed", {
      code: error.code,
    });
    return Response.json(
      { error: "Unable to subscribe to job alerts right now. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
