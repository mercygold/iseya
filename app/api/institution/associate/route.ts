import { emailDomain } from "@/lib/institutionAccess";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const authClient = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!authClient || !serviceRole) {
    return Response.json({ associated: false });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  const domain = emailDomain(user?.email);

  if (!user || !domain) {
    return Response.json({ associated: false });
  }

  const { data: profile } = await serviceRole
    .from("profiles")
    .select("account_type, institution_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_type !== "candidate" || profile.institution_id) {
    return Response.json({ associated: Boolean(profile?.institution_id) });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: institution, error } = await serviceRole
    .from("institution_profiles")
    .select("id, institution_name")
    .eq("access_status", "active")
    .eq("student_email_domain", domain)
    .or(`access_start_date.is.null,access_start_date.lte.${today}`)
    .or(`access_end_date.is.null,access_end_date.gte.${today}`)
    .maybeSingle();

  if (error) {
    console.error("[institution-association] lookup failed", {
      code: error.code,
      message: error.message,
      userId: user.id,
    });
    return Response.json({ associated: false });
  }

  if (!institution) {
    return Response.json({ associated: false });
  }

  const { error: updateError } = await serviceRole
    .from("profiles")
    .update({
      institution_id: institution.id,
      organization_access_type: "student_domain",
      organization_verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[institution-association] update failed", {
      code: updateError.code,
      message: updateError.message,
      userId: user.id,
    });
    return Response.json({ associated: false });
  }

  return Response.json({ associated: true, institutionName: institution.institution_name });
}

