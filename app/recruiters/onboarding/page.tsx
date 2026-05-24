import { redirect } from "next/navigation";
import RecruiterDashboard from "@/app/recruiter/RecruiterDashboard";
import { chooseCanonicalRecruiterProfile, isCompleteRecruiterProfile } from "@/lib/recruiterProfile";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import RecruiterShell from "../RecruiterShell";

export default async function RecruiterOnboardingPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?redirectedFrom=/recruiters/onboarding");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/recruiters/onboarding");
  }

  const { data: recruiterProfiles } = await supabase
    .from("recruiter_profiles")
    .select("company_name, recruiter_name, work_email, company_website, phone_number, address_line_1, city, state_region, country, hiring_focus, verification_status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (isCompleteRecruiterProfile(chooseCanonicalRecruiterProfile(recruiterProfiles))) {
    redirect("/recruiters/dashboard");
  }

  return (
    <RecruiterShell>
      <RecruiterDashboard />
    </RecruiterShell>
  );
}
