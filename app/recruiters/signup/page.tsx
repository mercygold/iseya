import { redirect } from "next/navigation";

export default function RecruiterSignupPage() {
  redirect("/signup?type=recruiter&redirectedFrom=/recruiters/onboarding");
}
