import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import PublicTrustFooter from "@/components/PublicTrustFooter";

export const demoPrimaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2";
export const demoSecondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2";
export const demoCard =
  "rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42_/_0.04),0_8px_20px_rgb(15_23_42_/_0.025)] transition-shadow hover:shadow-[0_1px_3px_rgb(15_23_42_/_0.06),0_10px_22px_rgb(15_23_42_/_0.045)] sm:p-5";
export const demoLabel = "text-[11px] font-semibold uppercase text-slate-500";
export const demoStatusPill =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";

export default function DemoShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header shadow-[0_1px_5px_rgb(0_14_47_/_0.18)] text-white">
        <div className="mx-auto flex max-w-[84rem] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <Link href="/" className="inline-flex w-fit items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              className="h-auto w-[132px] object-contain sm:w-[158px]"
              priority
            />
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
            <Link className="rounded-md px-2.5 py-2 text-white/80 transition hover:text-[var(--iseya-gold)]" href="/demo/candidate">
              Candidate Demo
            </Link>
            <Link className="rounded-md px-2.5 py-2 text-white/80 transition hover:text-[var(--iseya-gold)]" href="/demo/recruiter">
              Recruiter Demo
            </Link>
            <Link className="rounded-md px-2.5 py-2 text-white/80 transition hover:text-[var(--iseya-gold)]" href="/demo/institution">
              Institution Demo
            </Link>
            <Link className="rounded-md border border-[var(--iseya-gold)]/70 px-3 py-2 text-[var(--iseya-gold)] transition hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]" href="/demo">
              Demo Home
            </Link>
          </nav>
        </div>
      </header>
      <div className="border-b border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-[84rem] px-5 py-2 sm:px-8">
          <p className="text-xs font-medium text-slate-500">
            Guided demo experience &middot; Sample information
          </p>
        </div>
      </div>
      {children}
      <div className="mt-9">
        <PublicTrustFooter maxWidth="max-w-[84rem]" />
      </div>
    </main>
  );
}
