"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  detectUserCurrency,
  formatCurrencyDisplay,
  getRegionalPricing,
  isSupportedCurrency,
  supportedCurrencies,
  type PaidSubscriptionPlanId,
  type SupportedCurrency,
} from "@/lib/pricing/regions";
import { pricingPlans, type SubscriptionPlanId } from "@/lib/subscription";

const pricingCurrencyStorageKey = "iseya.checkout.currency";

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingLoading />}>
      <PricingContent />
    </Suspense>
  );
}

function PricingLoading() {
  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-[82rem] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-[var(--iseya-navy)]">Loading pricing...</p>
        </div>
      </section>
    </main>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [checkoutPlan, setCheckoutPlan] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [upgradePlan, setUpgradePlan] = useState<PaidSubscriptionPlanId | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("USD");
  const attemptedCheckoutRef = useRef("");

  const startCheckout = useCallback(async (
    planId: PaidSubscriptionPlanId,
    currency: SupportedCurrency,
  ) => {
    setCheckoutPlan(planId);
    setCheckoutStatus("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, currency }),
      });

      if (response.status === 401) {
        router.push(`/login?redirectedFrom=${encodeURIComponent(`/pricing?checkout=${planId}`)}`);
        return;
      }

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(safeCheckoutMessage(data.error));
      }

      window.location.assign(data.url);
    } catch (error) {
      setCheckoutStatus(safeCheckoutMessage(error instanceof Error ? error.message : ""));
    } finally {
      setCheckoutPlan("");
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedCurrency = window.localStorage.getItem(pricingCurrencyStorageKey);
      const currency = isSupportedCurrency(storedCurrency)
        ? storedCurrency
        : detectUserCurrency(window.navigator.language);

      window.localStorage.setItem(pricingCurrencyStorageKey, currency);
      setSelectedCurrency(currency);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const requestedPlan = searchParams.get("checkout");

    if (
      authLoading ||
      !user ||
      !requestedPlan ||
      attemptedCheckoutRef.current === requestedPlan ||
      !["plus", "pro_monthly", "pro_annual"].includes(requestedPlan)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      attemptedCheckoutRef.current = requestedPlan;
      setUpgradePlan(requestedPlan as PaidSubscriptionPlanId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authLoading, searchParams, user]);

  function choosePlan(planId: SubscriptionPlanId) {
    setCheckoutStatus("");
    if (planId === "free" || planId === "starter") {
      router.push(user ? "/workspace" : "/signup");
      return;
    }

    setUpgradePlan(planId);
  }

  function chooseCurrency(currency: SupportedCurrency) {
    setSelectedCurrency(currency);
    window.localStorage.setItem(pricingCurrencyStorageKey, currency);
  }

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[82rem] flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="inline-flex w-fit items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              className="h-auto w-[150px] object-contain sm:w-[220px]"
              priority
            />
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/">
              For Candidates
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/recruiters">
              For Recruiters
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
            <Link className="transition hover:text-[var(--iseya-gold)]" href={user ? "/account" : "/login"}>
              Login / Sign up
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-[82rem]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              ISEYA Plans
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
              Pricing
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Choose candidate workspace access for building career materials and
              pursuing opportunities. Institution partnerships are reviewed and
              assigned separately through the institution access process.
            </p>
          </div>

          <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map((plan) => (
              <section
                key={plan.id}
                className={`relative flex min-h-[620px] flex-col rounded-2xl border p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  plan.badge
                    ? "border-[var(--iseya-gold)] bg-[#FFF8E6]"
                    : "border-[var(--iseya-border)] bg-white"
                }`}
              >
                {plan.badge ? (
                  <p className="absolute right-5 top-5 rounded-full bg-[var(--iseya-navy)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                    {plan.badge}
                  </p>
                ) : null}

                <div className="min-h-[190px]">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                    {plan.cadence}
                  </p>
                  <h2 className="mt-3 pr-24 text-2xl font-semibold leading-tight text-[var(--iseya-navy)]">
                    {plan.name}
                  </h2>
                  <p className="mt-3 text-3xl font-bold leading-tight text-[var(--iseya-navy)]">
                    {plan.priceLabel}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-6 flex-1 space-y-5 border-t border-slate-200 pt-6">
                  <FeatureList items={plan.included} type="included" planId={plan.id} />
                  {plan.excluded && plan.excluded.length > 0 ? (
                    <FeatureList items={plan.excluded} type="excluded" planId={plan.id} />
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={Boolean(checkoutPlan)}
                  onClick={() => choosePlan(plan.id)}
                  className={`mt-8 min-h-11 w-full rounded-md border px-4 py-2 text-sm font-bold transition hover:shadow-md disabled:cursor-not-allowed disabled:hover:shadow-none ${
                    plan.id === "free"
                      ? "border-[var(--iseya-navy)] bg-white text-[var(--iseya-navy)] hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]"
                      : plan.badge
                      ? "border-[var(--iseya-navy)] bg-[var(--iseya-navy)] text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
                      : "border-[var(--iseya-navy)] bg-white text-[var(--iseya-navy)] hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]"
                  }`}
                >
                  {checkoutPlan === plan.id ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Redirecting to Checkout...
                    </span>
                  ) : (
                    planButtonLabel(plan.id)
                  )}
                </button>
              </section>
            ))}
          </div>

          {checkoutStatus ? (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
              {checkoutStatus}
            </p>
          ) : null}

          <p className="mt-8 max-w-3xl text-sm leading-7 text-slate-600">
            Secure checkout powered by Stripe. Prices may vary by region during checkout.
          </p>
        </div>
      </section>
      {upgradePlan ? (
        <RegionalCheckoutDialog
          planId={upgradePlan}
          currency={selectedCurrency}
          processing={checkoutPlan === upgradePlan}
          status={checkoutStatus}
          onCurrencyChange={chooseCurrency}
          onClose={() => {
            if (!checkoutPlan) {
              setUpgradePlan(null);
              setCheckoutStatus("");
            }
          }}
          onCheckout={() => void startCheckout(upgradePlan, selectedCurrency)}
        />
      ) : null}
      <PricingFooter />
    </main>
  );
}

function RegionalCheckoutDialog({
  planId,
  currency,
  processing,
  status,
  onCurrencyChange,
  onClose,
  onCheckout,
}: {
  planId: PaidSubscriptionPlanId;
  currency: SupportedCurrency;
  processing: boolean;
  status: string;
  onCurrencyChange: (currency: SupportedCurrency) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const plan = pricingPlans.find((candidatePlan) => candidatePlan.id === planId);
  const regionalPlan = getRegionalPricing(currency);
  const price = regionalPlan.plans[planId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--iseya-navy)]/45 px-5 py-8">
      <section
        aria-label="Choose checkout currency"
        aria-modal="true"
        role="dialog"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Secure Upgrade
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              {plan?.name ?? "ISEYA plan"}
            </h2>
          </div>
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            aria-label="Close checkout options"
            className="rounded-md px-2 py-1 text-lg text-slate-500 transition hover:bg-slate-100 hover:text-[var(--iseya-navy)] disabled:opacity-50"
          >
            x
          </button>
        </div>

        <label className="mt-6 block text-sm font-semibold text-[var(--iseya-navy)]">
          Checkout currency
          <select
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as SupportedCurrency)}
            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/20"
          >
            {supportedCurrencies.map((option) => (
              <option key={option} value={option}>
                {option} - {getRegionalPricing(option).regionLabel}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 rounded-xl border border-[var(--iseya-gold)]/35 bg-[#FFF8E6] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Selected checkout total
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--iseya-navy)]">
            {formatCurrencyDisplay(price, currency)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access and plan features are identical in every supported region.
          </p>
        </div>

        {status ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-[var(--iseya-navy)]">
            {status}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onCheckout}
          disabled={processing}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? "Redirecting to Checkout..." : "Continue to Secure Checkout"}
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          Regional pricing is applied at checkout using your selected currency.
        </p>
      </section>
    </div>
  );
}

function PricingFooter() {
  return (
    <footer className="border-t border-[color-mix(in_srgb,var(--iseya-gold)_28%,var(--iseya-navy))] bg-[var(--iseya-navy)] text-white">
      <div className="mx-auto flex max-w-[82rem] flex-col gap-3 px-5 py-6 text-center sm:px-8 md:flex-row md:items-center md:justify-between md:text-left">
        <p className="text-sm font-semibold text-white/85">ISEYA by Jormp LLC.</p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-white/80 md:justify-end">
          <Link className="transition hover:text-[var(--iseya-gold)]" href="/terms">
            Terms
          </Link>
          <Link className="transition hover:text-[var(--iseya-gold)]" href="/privacy">
            Privacy
          </Link>
          <Link className="transition hover:text-[var(--iseya-gold)]" href="/contact">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function safeCheckoutMessage(message?: string) {
  const fallback = "Checkout is temporarily unavailable. Please try again shortly.";
  const technicalPatterns = [
    "stripe",
    "secret",
    "price id",
    "webhook",
    "environment",
    "env",
    "api key",
    "configured",
    "configuration",
  ];
  const normalized = message?.trim() ?? "";

  if (!normalized) {
    return fallback;
  }

  if (technicalPatterns.some((pattern) => normalized.toLowerCase().includes(pattern))) {
    return fallback;
  }

  return normalized;
}

function planButtonLabel(planId: string) {
  if (planId === "free") {
    return "Start Free";
  }

  if (planId === "plus") {
    return "Upgrade to Plus";
  }

  if (planId === "pro_monthly") {
    return "Upgrade Monthly";
  }

  if (planId === "pro_annual") {
    return "Upgrade Annual";
  }

  return "Select Plan";
}

function FeatureList({
  items,
  type,
  planId,
}: {
  items: string[];
  type: "included" | "excluded";
  planId: string;
}) {
  const isIncluded = type === "included";

  return (
    <ul className="space-y-3 text-sm leading-6">
      {items.map((feature, index) => (
        <li
          key={`${planId}-${type}-${feature}-${index}`}
          className={`flex items-start gap-3 ${
            isIncluded ? "text-slate-700" : "text-slate-400"
          }`}
        >
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              isIncluded
                ? "bg-[var(--iseya-gold)] text-[var(--iseya-navy)]"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {isIncluded ? "✓" : "×"}
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
