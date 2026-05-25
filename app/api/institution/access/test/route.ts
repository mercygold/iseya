import { emailDomain } from "@/lib/institutionAccess";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function developmentOnly() {
  return process.env.NODE_ENV !== "production";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function accessIsActive(institution: {
  access_status: string;
  auto_domain_access: boolean;
  access_start_date: string | null;
  access_end_date: string | null;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    institution.access_status === "active" &&
    institution.auto_domain_access &&
    (!institution.access_start_date || institution.access_start_date <= today) &&
    (!institution.access_end_date || institution.access_end_date >= today)
  );
}

export async function GET() {
  if (!developmentOnly()) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const serviceRole = createSupabaseServiceRoleClient();
  if (!serviceRole) {
    return Response.json({ institutions: [] });
  }

  const { data, error } = await serviceRole
    .from("institution_profiles")
    .select("id, institution_name, access_status")
    .order("institution_name", { ascending: true });

  if (error) {
    console.error("[institution-access-test] listing failed", {
      code: error.code,
      message: error.message,
    });
    return Response.json({ institutions: [] });
  }

  return Response.json({ institutions: data ?? [] });
}

export async function POST(request: Request) {
  if (!developmentOnly()) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const serviceRole = createSupabaseServiceRoleClient();
  if (!serviceRole) {
    return Response.json({ error: "Local test data is unavailable." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const institutionId = text(body.institutionId);
  const learnerEmail = text(body.learnerEmail).toLowerCase();
  const enteredDomain = emailDomain(learnerEmail);

  if (!institutionId || !learnerEmail || !enteredDomain) {
    return Response.json({ error: "Select an institution and enter a test learner email." }, { status: 400 });
  }

  const { data: institution, error } = await serviceRole
    .from("institution_profiles")
    .select("institution_name, admin_email, student_email_domain, access_status, auto_domain_access, access_start_date, access_end_date, seat_limit, active_seats")
    .eq("id", institutionId)
    .maybeSingle();

  if (error || !institution) {
    console.error("[institution-access-test] profile lookup failed", {
      code: error?.code,
      message: error?.message,
      institutionId,
    });
    return Response.json({ error: "Local test data is unavailable." }, { status: 500 });
  }

  const institutionDomain = institution.student_email_domain.toLowerCase();
  const domainMatches = institutionDomain === enteredDomain;
  const institutionActive = accessIsActive(institution);
  const administratorEmail = institution.admin_email.toLowerCase() === learnerEmail;
  const seatAvailable =
    institution.seat_limit === null || institution.active_seats < institution.seat_limit;
  const eligible = domainMatches && institutionActive && seatAvailable && !administratorEmail;
  let reason = "Learner email is eligible for institution access.";

  if (administratorEmail) {
    reason =
      "This email appears to be an institution administrator email. Use a learner email for real access. Local test mode can still validate domain matching.";
  } else if (!institutionActive) {
    reason = "Institution access is not active for learner claims.";
  } else if (!domainMatches) {
    reason = "Learner email domain does not match the selected institution domain.";
  } else if (!seatAvailable) {
    reason = "Institution access limit reached.";
  }

  return Response.json({
    dryRun: true,
    eligible,
    reason,
    institutionName: institution.institution_name,
    institutionDomain,
    enteredDomain,
    domainMatches,
    institutionActive,
    accessStatus: institution.access_status,
    seatLimit: institution.seat_limit,
    activeSeats: institution.active_seats,
    seatAvailable,
    administratorEmail,
  });
}
