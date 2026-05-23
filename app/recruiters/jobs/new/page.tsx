import { redirect } from "next/navigation";

export default function NewRecruiterJobPage() {
  redirect("/recruiters/dashboard#post-job");
}
