import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export default function RecruiterShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/recruiters/dashboard" className="inline-flex items-center">
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
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters/dashboard">
              Recruiter Dashboard
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters/jobs/new">
              Post Job
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters/jobs">
              My Jobs
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/jobs">
              Public Jobs
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/account">
              Settings
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </main>
  );
}
