import Link from "next/link";
import { InfoPageShell } from "../../info-page-shell";

export default function BillingSuccessPage() {
  return (
    <InfoPageShell title="Checkout Complete" eyebrow="Billing">
      <p>
        Payment received. Your workspace is being updated.
      </p>
      <p>
        If your plan does not update immediately, refresh your workspace in a
        moment.
      </p>
      <Link
        href="/workspace"
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
      >
        Return to Workspace
      </Link>
    </InfoPageShell>
  );
}
