"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  analyticsConsentStorageKey,
  recordAnalyticsConsent,
  type AnalyticsConsentChoice,
} from "@/lib/analytics";

export default function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(!window.localStorage.getItem(analyticsConsentStorageKey));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function saveChoice(choice: AnalyticsConsentChoice) {
    recordAnalyticsConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and privacy preferences"
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgb(0_14_47_/_0.15)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
          Privacy Preferences
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          ISEYA uses essential browser storage for secure account access and saved
          preferences. Optional analytics may support platform improvement when enabled.
          Review our{" "}
          <Link
            href="/privacy"
            className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
        <button
          type="button"
          onClick={() => saveChoice("essential")}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)]"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => saveChoice("accepted")}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)]"
        >
          Accept
        </button>
      </div>
    </aside>
  );
}
