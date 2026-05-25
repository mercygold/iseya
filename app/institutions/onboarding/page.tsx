import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import InstitutionDashboard from "../InstitutionDashboard";
import InstitutionShell from "../InstitutionShell";

export default async function InstitutionOnboardingPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?redirectedFrom=/institutions/onboarding");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/institutions/onboarding");

  const { data } = await supabase
    .from("institution_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) redirect("/institutions/dashboard");

  return <InstitutionShell><InstitutionDashboard initialProfile={null} onboarding /></InstitutionShell>;
}
