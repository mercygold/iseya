import { redirect } from "next/navigation";

export default function InstitutionSignupPage() {
  redirect("/signup?type=institution_admin&redirectedFrom=/institutions/onboarding");
}

