"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportBoundaryError } from "@/lib/observability";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportBoundaryError("global", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[var(--iseya-soft-bg)] px-5 py-12 antialiased">
        <main className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            ISEYA
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">
            We could not complete this request.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Please retry or return home. Your account and saved data are not changed
            by this display error.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-5 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]"
            >
              Return Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
