import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import PublicTrustFooter from "@/components/PublicTrustFooter";

export function AuthorityPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label="ISEYA homepage" className="inline-flex w-fit items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={220}
              height={110}
              priority
              className="h-auto w-[150px] object-contain sm:w-[190px]"
            />
          </Link>
          <nav aria-label="Public navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-white/82">
            <Link className="rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]" href="/insights">
              Insights
            </Link>
            <Link className="rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]" href="/guides">
              Guides
            </Link>
            <Link className="rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]" href="/jobs">
              Jobs
            </Link>
            <Link className="rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]" href="/recruiters">
              Recruiters
            </Link>
            <Link className="rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]" href="/institutions">
              Institutions
            </Link>
            <Link className="rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]" href="/demo">
              Demo
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <PublicTrustFooter maxWidth="max-w-6xl" />
    </main>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm font-medium text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link className="rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[var(--iseya-navy)]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AuthorityCta({
  title,
  copy,
  links,
}: {
  title: string;
  copy: string;
  links: Array<{ label: string; href: string; primary?: boolean }>;
}) {
  return (
    <aside className="rounded-xl border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-[var(--iseya-navy)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{copy}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.primary
                ? "inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--iseya-navy)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
                : "inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
