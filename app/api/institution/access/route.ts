import { emailDomain } from "@/lib/institutionAccess";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const serviceRole = createSupabaseServiceRoleClient();
  if (!serviceRole) {
    return Response.json({ institutions: [] });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await serviceRole
    .from("institution_profiles")
    .select("id, institution_name, institution_type, city, state_region, country")
    .eq("access_status", "active")
    .eq("auto_domain_access", true)
    .or(`access_start_date.is.null,access_start_date.lte.${today}`)
    .or(`access_end_date.is.null,access_end_date.gte.${today}`)
    .order("institution_name", { ascending: true });

  if (error) {
    console.error("[institution-access] active institution listing failed", {
      code: error.code,
      message: error.message,
    });
    return Response.json({ institutions: [] });
  }

  return Response.json({ institutions: data ?? [] });
}

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();
  if (!authClient || !serviceRole) {
    return Response.json({ error: "Institution access is temporarily unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Sign in using the institution email you want to verify for access." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const institutionId = text(body.institutionId);
  const studentEmail = text(body.studentEmail).toLowerCase();
  const domain = emailDomain(studentEmail);

  if (!institutionId || !studentEmail || !domain) {
    return Response.json({ error: "Select an institution and enter your institution email." }, { status: 400 });
  }

  const { data: selectedInstitution, error: institutionLookupError } = await serviceRole
    .from("institution_profiles")
    .select("user_id, admin_email")
    .eq("id", institutionId)
    .maybeSingle();

  if (institutionLookupError) {
    console.error("[institution-access] selected institution lookup failed", {
      code: institutionLookupError.code,
      message: institutionLookupError.message,
      userId: user.id,
      institutionId,
    });
    return Response.json({ error: "Institution access could not be applied right now." }, { status: 500 });
  }

  if (
    selectedInstitution &&
    (selectedInstitution.user_id === user.id ||
      selectedInstitution.admin_email.toLowerCase() === (user.email ?? "").toLowerCase())
  ) {
    return Response.json(
      {
        error:
          "This email is registered as an institution administrator. Please sign in with a student or participant account under the approved institution domain.",
      },
      { status: 403 },
    );
  }

  if ((user.email ?? "").toLowerCase() !== studentEmail) {
    return Response.json(
      { error: "Sign in using the institution email you want to verify for access." },
      { status: 400 },
    );
  }

  const { data: result, error } = await serviceRole.rpc("claim_institution_domain_seat", {
    p_institution_id: institutionId,
    p_user_id: user.id,
    p_student_email: studentEmail,
  });

  if (error) {
    console.error("[institution-access] seat claim failed", {
      code: error.code,
      message: error.message,
      userId: user.id,
      institutionId,
    });
    return Response.json({ error: "Institution access could not be applied right now." }, { status: 500 });
  }

  const claim = (result ?? {}) as {
    ok?: boolean;
    reason?: string;
    institutionName?: string;
  };

  if (claim.ok) {
    return Response.json({
      linked: true,
      institutionName: claim.institutionName ?? "your institution",
    });
  }

  if (claim.reason === "seat_limit_reached") {
    return Response.json(
      {
        error:
          "Institution access limit reached. You can continue with a standard account or contact your institution.",
      },
      { status: 409 },
    );
  }

  if (claim.reason === "already_linked") {
    return Response.json(
      { error: "Your account is already connected to an institution." },
      { status: 409 },
    );
  }

  if (claim.reason === "candidate_account_required") {
    return Response.json(
      { error: "Institution student access is available through a candidate account." },
      { status: 403 },
    );
  }

  if (claim.reason === "institution_admin_account") {
    return Response.json(
      {
        error:
          "This email is registered as an institution administrator. Please sign in with a student or participant account under the approved institution domain.",
      },
      { status: 403 },
    );
  }

  return Response.json(
    { error: "Your institution email domain does not match the selected active institution." },
    { status: 403 },
  );
}
