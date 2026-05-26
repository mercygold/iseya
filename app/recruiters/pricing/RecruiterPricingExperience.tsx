"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RecruiterShell from "../RecruiterShell";
import { supportedCurrencies, type SupportedCurrency } from "@/lib/pricing/regions";
import {
  formatRecruiterPrice,
  recruiterPlanEntitlements,
  type RecruiterPaidPlanId,
} from "@/lib/pricing/recruiter";
import { trackAnalyticsEvent } from "@/lib/analytics";

const storageKey = "iseya.recruiter.checkout.currency";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2";

const paidPlans: Array<{
  id: RecruiterPaidPlanId;
  name: string;
  description: string;
  features: string[];
  badge?: string;
}> = [
  {
    id: "recruiter_quarterly",
    name: "Recruiter Quarterly",
    description: "For active hiring cycles and verified recruiter eligibility.",
    badge: "Flexible Hiring",
    features: [
      "15 active published jobs",
      "90-day listing visibility",
      "Verified recruiter eligibility",
      "Priority moderation",
      "Unlimited drafts and full dashboard access",
    ],
  },
  {
    id: "recruiter_annual",
    name: "Recruiter Annual",
    description: "For sustained hiring volume and longer opportunity visibility.",
    badge: "Best Value",
    features: [
      "50 active published jobs",
      "365-day listing visibility",
      "Verified recruiter eligibility",
      "Priority support",
      "Unlimited drafts and full dashboard access",
    ],
  },
];

export default function RecruiterPricingExperience({ checkoutResult }: { checkoutResult?: string }) {
  const router = useRouter();
  const [upgradePlan, setUpgradePlan] = useState<RecruiterPaidPlanId | "">("");
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(storageKey);
      if (stored && supportedCurrencies.includes(stored as SupportedCurrency)) {
        setCurrency(stored as SupportedCurrency);
      }
      if (checkoutResult === "success") {
        setStatus("Recruiter subscription activated. Your updated listing capacity will appear in your dashboard.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [checkoutResult]);

  useEffect(() => {
    if (!upgradePlan) return;

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !processing) setUpgradePlan("");
    }

    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [processing, upgradePlan]);

  function openCheckout(plan: RecruiterPaidPlanId) {
    trackAnalyticsEvent("pricing_cta_clicked", {
      plan_id: plan,
      source: "recruiter_pricing",
    });
    setStatus("");
    setUpgradePlan(plan);
  }

  async function beginCheckout() {
    if (!upgradePlan) return;
    setProcessing(true);
    setStatus("");
    window.localStorage.setItem(storageKey, currency);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "recruiter", plan: upgradePlan, currency }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        notice?: string;
      };

      if (response.status === 401) {
        router.push("/login?redirectedFrom=/recruiters/pricing");
        return;
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout is temporarily unavailable. Please try again shortly.");
      }
      if (data.notice) {
        setStatus(data.notice);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      window.location.assign(data.url);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Checkout is temporarily unavailable. Please try again shortly.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <RecruiterShell>
      <section className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Recruiter Plans
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--iseya-navy)]">
            Active job capacity for verified hiring workflows.
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Every recruiter retains the complete dashboard and applicant workflow. Plans increase
            active published listing capacity and listing visibility duration.
          </p>
        </div>

        {status ? (
          <p role="status" aria-live="polite" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
            {status}
          </p>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Included
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">Recruiter Starter</h2>
            <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">Free</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li>2 active published jobs</li>
              <li>30-day visibility per published job</li>
              <li>Unlimited drafts</li>
              <li>Applicant management</li>
              <li>Full recruiter dashboard access</li>
            </ul>
            <Link href="/recruiters/dashboard" className={`${secondaryButton} mt-7 w-full`}>
              Continue on Starter
            </Link>
          </article>

          {paidPlans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                {plan.badge}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">{plan.name}</h2>
              <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">
                {formatRecruiterPrice(plan.id, "USD")}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <button type="button" className={`${primaryButton} mt-7 w-full`} onClick={() => openCheckout(plan.id)}>
                Select {plan.name}
              </button>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-500">
          Public plan display is shown in USD. Controlled regional pricing is available during checkout.
        </p>
      </section>

      {upgradePlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8">
          <section role="dialog" aria-modal="true" aria-labelledby="recruiter-checkout-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Secure Checkout
                </p>
                <h2 id="recruiter-checkout-title" className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">
                  {paidPlans.find((plan) => plan.id === upgradePlan)?.name}
                </h2>
              </div>
              <button type="button" onClick={() => setUpgradePlan("")} aria-label="Close recruiter checkout options" className={secondaryButton}>
                Close
              </button>
            </div>
            <label className="mt-6 block text-sm font-semibold text-[var(--iseya-navy)]">
              Billing currency
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as SupportedCurrency)}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
              >
                {supportedCurrencies.map((supportedCurrency) => (
                  <option key={supportedCurrency} value={supportedCurrency}>
                    {supportedCurrency}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Selected total</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
                {formatRecruiterPrice(upgradePlan, currency)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {recruiterPlanEntitlements[upgradePlan].activeJobLimit} active listings |{" "}
                {recruiterPlanEntitlements[upgradePlan].visibilityDays}-day visibility
              </p>
            </div>
            <button type="button" onClick={beginCheckout} disabled={processing} className={`${primaryButton} mt-6 w-full`}>
              {processing ? "Opening Checkout..." : "Continue to Checkout"}
            </button>
          </section>
        </div>
      ) : null}
    </RecruiterShell>
  );
}
