import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const demoPrimaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]";
export const demoSecondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]";
export const demoCard = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

export default function DemoShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="inline-flex w-fit items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              className="h-auto w-[150px] object-contain sm:w-[220px]"
              priority
            />
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <Link className="rounded-md px-3 py-2 text-white/80 transition hover:text-[var(--iseya-gold)]" href="/demo/candidate">
              Candidate Demo
            </Link>
            <Link className="rounded-md px-3 py-2 text-white/80 transition hover:text-[var(--iseya-gold)]" href="/demo/recruiter">
              Recruiter Demo
            </Link>
            <Link className="rounded-md px-3 py-2 text-white/80 transition hover:text-[var(--iseya-gold)]" href="/demo/institution">
              Institution Demo
            </Link>
            <Link className="rounded-md border border-[var(--iseya-gold)] px-3 py-2 text-[var(--iseya-gold)] transition hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]" href="/demo">
              Demo Home
            </Link>
          </nav>
        </div>
      </header>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[92rem] px-5 py-3 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Guided demo experience - sample information only
          </p>
        </div>
      </div>
      {children}
      <footer className="mt-12 border-t border-[color-mix(in_srgb,var(--iseya-gold)_28%,var(--iseya-navy))] bg-[var(--iseya-navy)] text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-4 px-5 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-white/85">ISEYA by Jormp LLC. Private career infrastructure.</p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/">
              Home
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/jobs">
              Jobs
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/contact">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
