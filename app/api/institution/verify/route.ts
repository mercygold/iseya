import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

type VerifyInstitutionRequest = {
  schoolEmail?: unknown;
  accessCode?: unknown;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function isAccessActive(organization: {
  status: string;
  start_date: string | null;
  end_date: string | null;
  seats_allowed: number;
  seats_used: number;
}) {
  const today = new Date();
  const start = organization.start_date ? new Date(`${organization.start_date}T00:00:00Z`) : null;
  const end = organization.end_date ? new Date(`${organization.end_date}T23:59:59Z`) : null;

  return (
    organization.status === "active" &&
    (!start || today >= start) &&
    (!end || today <= end) &&
    (organization.seats_allowed <= 0 || organization.seats_used < organization.seats_allowed)
  );
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!supabase || !serviceRole) {
    return Response.json(
      { error: "Institution access is temporarily unavailable." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Login is required for institution access." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as VerifyInstitutionRequest;
  const schoolEmail = normalizeEmail(body.schoolEmail);
  const accessCode = normalizeCode(body.accessCode);
  const domain = emailDomain(schoolEmail);

  if (!schoolEmail || !domain || !accessCode) {
    return Response.json({ error: "School email and access code are required." }, { status: 400 });
  }

  if ((user.email ?? "").toLowerCase() !== schoolEmail) {
    return Response.json(
      { error: "Use the same school email as your signed-in ISEYA account." },
      { status: 400 },
    );
  }

  const { data: organization, error: organizationError } = await serviceRole
    .from("organizations")
    .select("id, name, email_domain, access_code, plan, seats_allowed, seats_used, status, start_date, end_date")
    .eq("email_domain", domain)
    .eq("access_code", accessCode)
    .maybeSingle();

  if (organizationError) {
    console.error("[institution-access] organization lookup failed", {
      code: organizationError.code,
      message: organizationError.message,
    });
    return Response.json(
      { error: "Institution access could not be verified right now." },
      { status: 500 },
    );
  }

  if (!organization || !isAccessActive(organization)) {
    return Response.json(
      { error: "Institution access could not be verified." },
      { status: 403 },
    );
  }

  const { data: existingProfile } = await serviceRole
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const alreadyLinked = existingProfile?.organization_id === organization.id;

  const { error: profileError } = await serviceRole
    .from("profiles")
    .update({
      organization_id: organization.id,
      organization_access_type: "student",
      organization_verified_at: new Date().toISOString(),
      subscription_plan: organization.plan,
      subscription_status: "active",
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("[institution-access] profile update failed", {
      code: profileError.code,
      message: profileError.message,
    });
    return Response.json(
      { error: "Institution access could not be applied right now." },
      { status: 500 },
    );
  }

  const { error: seatError } = alreadyLinked
    ? { error: null }
    : await serviceRole
        .from("organizations")
        .update({ seats_used: organization.seats_used + 1 })
        .eq("id", organization.id);

  if (seatError) {
    console.error("[institution-access] seat count update failed", {
      code: seatError.code,
      message: seatError.message,
    });
  }

  return Response.json({
    organization: {
      name: organization.name,
      plan: organization.plan,
    },
  });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!supabase || !serviceRole) {
    return Response.json({ organization: null });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ organization: null }, { status: 401 });
  }

  const { data: profile, error: profileError } = await serviceRole
    .from("profiles")
    .select("organization_id, organization_access_type, organization_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return Response.json({ organization: null });
  }

  const { data: organization, error: organizationError } = await serviceRole
    .from("organizations")
    .select("name, type, plan, status")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (organizationError || !organization) {
    return Response.json({ organization: null });
  }

  return Response.json({
    organization: {
      name: organization.name,
      type: organization.type,
      plan: organization.plan,
      status: organization.status,
      accessType: profile.organization_access_type,
      verifiedAt: profile.organization_verified_at,
    },
  });
}
