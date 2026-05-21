import Link from "next/link";
import { InfoPageShell } from "../../info-page-shell";

export default function BillingSuccessPage() {
  return (
    <InfoPageShell title="Payment Confirmed" eyebrow="Billing">
      <div className="rounded-2xl border border-[var(--iseya-gold)]/40 bg-[#FFF8E6] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--iseya-gold)] text-2xl font-black text-[var(--iseya-navy)]">
            ✓
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--iseya-navy)]">
              Payment Confirmed
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Payment received. Your workspace is being updated.
            </p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-white/70 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                  Active Plan
                </p>
                <p className="mt-2 font-semibold text-[var(--iseya-navy)]">
                  Your selected ISEYA plan
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                  Status
                </p>
                <p className="mt-2 font-semibold text-[var(--iseya-navy)]">
                  Updating in your workspace
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              If your plan does not update immediately, keep the workspace open
              for a moment. Billing updates refresh automatically after Stripe
              confirms the payment.
            </p>
          </div>
        </div>
      </div>
      <Link
        href="/workspace"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
      >
        Return to Workspace
      </Link>
    </InfoPageShell>
  );
}
