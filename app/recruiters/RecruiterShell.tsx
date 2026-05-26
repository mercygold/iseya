import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import DashboardNavLink from "@/components/DashboardNavLink";

export default function RecruiterShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              className="h-auto w-[150px] object-contain sm:w-[220px]"
              priority
            />
          </Link>
          <nav className="iseya-dashboard-nav text-sm font-semibold">
            <DashboardNavLink href="/recruiters/dashboard">
              Recruiter Dashboard
            </DashboardNavLink>
            <DashboardNavLink href="/recruiters/dashboard#post-job" highlightOnPath={false}>
              Post Job
            </DashboardNavLink>
            <DashboardNavLink href="/recruiters/dashboard#my-jobs" highlightOnPath={false}>
              My Jobs
            </DashboardNavLink>
            <DashboardNavLink href="/recruiters/dashboard#my-jobs" highlightOnPath={false}>
              Applicants
            </DashboardNavLink>
            <DashboardNavLink href="/recruiters/dashboard#company-profile" highlightOnPath={false}>
              Company Profile
            </DashboardNavLink>
            <DashboardNavLink href="/recruiters/pricing">
              Plans
            </DashboardNavLink>
            <DashboardNavLink href="/account">
              Settings
            </DashboardNavLink>
          </nav>
        </div>
      </header>

      {children}
    </main>
  );
}
