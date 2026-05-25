import Image from "next/image";
import Link from "next/link";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-gold)] bg-[var(--iseya-gold)] px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-white hover:bg-white";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 bg-transparent px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]";

export default function InstitutionsPage() {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-8 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Link href="/" className="inline-flex items-center">
              <Image src="/brand/iseya-logo2.png" alt="ISEYA" width={260} height={130} priority className="h-auto w-[170px] object-contain sm:w-[240px]" />
            </Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              Institution Access
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Career readiness infrastructure for institutions.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/82">
              Equip students and program participants with structured career tools and access to verified opportunities through ISEYA.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/institutions/signup" className={primaryButton}>
                Request Institution Partnership
              </Link>
              <Link href="/institutions/access" className={secondaryButton}>
                Access through my institution
              </Link>
            </div>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-white/80 lg:justify-end">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/">For Candidates</Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters">For Recruiters</Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/jobs">Jobs</Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/pricing">Pricing</Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/login">Sign In</Link>
          </nav>
        </div>
      </section>
      <section className="mx-auto grid max-w-[92rem] gap-5 px-5 pt-10 sm:px-8 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Institution Admin</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">Partnership access for programs</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Universities, colleges, bootcamps, workforce programs, and career centers can request managed student and participant access.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Packages are assigned after review. Contracting and payment are handled directly with ISEYA; public checkout is not used for institution access.
          </p>
          <Link href="/institutions/signup" className={`${primaryButton} mt-5`}>
            Request Institution Partnership
          </Link>
          <Link href="/login?redirectedFrom=/institutions/dashboard" className="ml-4 mt-5 inline-flex min-h-11 items-center text-sm font-bold text-[var(--iseya-navy)] transition hover:text-[var(--iseya-gold)]">
            Institution Admin Sign In
          </Link>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">Student / Participant</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">Access covered by your institution</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Students, graduates, and program participants can connect an eligible institution email to their private ISEYA workspace.
          </p>
          <Link href="/institutions/access" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]">
            Access through my institution
          </Link>
        </article>
      </section>
      <section className="mx-auto grid max-w-[92rem] gap-5 px-5 py-10 sm:px-8 lg:grid-cols-3">
        {[
          ["Domain-based access", "Prepare student access through approved institution email domains without public candidate profiles."],
          ["Career readiness", "Support structured resumes, applications, and career materials through private student workspaces."],
          ["Verified opportunity access", "Connect students and participants to published roles while protecting private career materials."],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">ISEYA</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--iseya-navy)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
