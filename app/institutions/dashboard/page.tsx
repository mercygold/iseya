import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import InstitutionDashboard, { type InstitutionProfile } from "../InstitutionDashboard";
import InstitutionShell from "../InstitutionShell";

export default async function InstitutionDashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?redirectedFrom=/institutions/dashboard");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/institutions/dashboard");

  const { data } = await supabase
    .from("institution_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) redirect("/institutions/onboarding");

  return (
    <InstitutionShell>
      <InstitutionDashboard initialProfile={data as InstitutionProfile} />
    </InstitutionShell>
  );
}

