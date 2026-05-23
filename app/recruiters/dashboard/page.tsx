import { redirect } from "next/navigation";
import RecruiterDashboard from "@/app/recruiter/RecruiterDashboard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import RecruiterShell from "../RecruiterShell";

function isComplete(profile: {
  company_name: string | null;
  recruiter_name: string | null;
  work_email: string | null;
} | null) {
  return Boolean(profile?.company_name && profile.recruiter_name && profile.work_email);
}

export default async function RecruitersDashboardPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?redirectedFrom=/recruiters/dashboard");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/recruiters/dashboard");
  }

  const { data: recruiterProfile } = await supabase
    .from("recruiter_profiles")
    .select("company_name, recruiter_name, work_email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isComplete(recruiterProfile)) {
    redirect("/recruiters/onboarding");
  }

  return (
    <RecruiterShell>
      <RecruiterDashboard />
    </RecruiterShell>
  );
}
