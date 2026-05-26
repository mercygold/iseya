import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--iseya-soft-bg)] px-5 py-12">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
          404 | ISEYA
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">
          Page not found.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Explore public opportunities, career tools, recruiter access, or
          institution partnerships from the homepage.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-5 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
          >
            Return Home
          </Link>
          <Link
            href="/jobs"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]"
          >
            Browse Opportunities
          </Link>
        </div>
      </section>
    </main>
  );
}
