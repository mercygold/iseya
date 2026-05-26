import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import PublicTrustFooter from "@/components/PublicTrustFooter";

export function InfoPageShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label="ISEYA homepage" className="inline-flex w-fit items-center gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={220}
              height={110}
              className="h-auto w-[150px] object-contain sm:w-[210px]"
              priority
            />
          </Link>
          <nav aria-label="Public navigation" className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/">
              For Candidates
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters">
              For Recruiters
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/about">
              About
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/pricing">
              Pricing
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/institutions">
              For Institutions
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/demo">
              Demo
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <article className="rounded-2xl border border-[var(--iseya-border)] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-4xl">
            {title}
          </h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-slate-700">
            {children}
          </div>
        </article>
      </section>

      <PublicTrustFooter maxWidth="max-w-6xl" />
    </main>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--iseya-navy)]">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
