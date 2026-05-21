import { InfoPageShell } from "../info-page-shell";
import { pricingPlans } from "@/lib/subscription";

export default function PricingPage() {
  return (
    <InfoPageShell title="Pricing" eyebrow="Subscription Preview">
      <p>
        ISEYA subscription infrastructure is prepared for Stripe billing, but
        live payments are not active yet. No charges are made from this page.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <section
            key={plan.id}
            className={`rounded-xl border p-5 ${
              plan.highlighted
                ? "border-[var(--iseya-gold)] bg-[#FFF8E6]"
                : "border-[var(--iseya-border)] bg-white"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              {plan.cadence}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
              {plan.name}
            </h2>
            <p className="mt-2 text-2xl font-bold text-[var(--iseya-navy)]">
              {plan.priceLabel}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {plan.description}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature, index) => (
                <li key={`${plan.id}-${feature}-${index}`}>{feature}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        Stripe checkout, customer portal, webhook fulfillment, and live pricing
        IDs can be connected after plan pricing is finalized.
      </p>
    </InfoPageShell>
  );
}
