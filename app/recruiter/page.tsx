import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import RecruiterDashboard from "./RecruiterDashboard";

async function getRecruiterAccess() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?redirectedFrom=/recruiter");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/recruiter");
  }

  return user.id;
}

export default async function RecruiterDashboardPage() {
  await getRecruiterAccess();

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/recruiter" className="inline-flex items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              className="h-auto w-[150px] object-contain sm:w-[220px]"
              priority
            />
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiter">
              Recruiter Dashboard
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/jobs">
              Jobs
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/workspace">
              Candidate Workspace
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/account">
              Settings
            </Link>
          </nav>
        </div>
      </header>

      <RecruiterDashboard />
    </main>
  );
}
