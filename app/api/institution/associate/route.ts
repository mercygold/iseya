import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authClient = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!authClient || !serviceRole) {
    return Response.json({ institution: null });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return Response.json({ institution: null }, { status: 401 });
  }

  const { data: profile } = await serviceRole
    .from("profiles")
    .select("institution_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.institution_id) {
    return Response.json({ institution: null });
  }

  const { data: institution, error } = await serviceRole
    .from("institution_profiles")
    .select("id, institution_name, access_status")
    .eq("id", profile.institution_id)
    .maybeSingle();

  if (error) {
    console.error("[institution-association] status lookup failed", {
      code: error.code,
    });
    return Response.json({ institution: null });
  }

  return Response.json({ institution });
}
