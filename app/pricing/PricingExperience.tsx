"use client";

import Image from "next/image";
import Link from "next/link";
import PublicTrustFooter from "@/components/PublicTrustFooter";
import RelatedAuthorityResources from "@/components/RelatedAuthorityResources";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { trackAnalyticsEvent } from "@/lib/analytics";

const pricingCurrencyStorageKey = "iseya.checkout.currency";
const headerNavigationLink =
  "rounded-sm transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]";

type CandidateCheckoutErrorCode =
  | "AUTH_CLIENT_UNAVAILABLE"
  | "AUTH_REQUIRED"
  | "UNSUPPORTED_PLAN"
  | "PROFILE_LOOKUP_FAILED"
  | "PROFILE_REQUIRED"
  | "UNSUPPORTED_CURRENCY"
  | "MISSING_STRIPE_SECRET"
  | "INVALID_STRIPE_SECRET"
  | "MISSING_PRICE_ID"
  | "INVALID_PRICE_ID"
  | "APP_URL_MISSING"
  | "STRIPE_SESSION_MISSING_URL"
  | "STRIPE_SESSION_FAILED";

type CandidateCheckoutResponse = {
  url?: string;
  error?: string;
  message?: string;
  notice?: string;
  code?: CandidateCheckoutErrorCode;
  errorCode?: CandidateCheckoutErrorCode;
  missingVariable?: string | null;
  plan?: string | null;
  currency?: string | null;
};

export default function PricingExperience({ requestedPlan }: { requestedPlan?: string }) {
  return <PricingContent requestedPlan={requestedPlan} />;
}

function PricingContent({ requestedPlan }: { requestedPlan?: string }) {
  const router = useRouter();
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
        body: JSON.stringify({ planId, currency }),
      });

      if (response.status === 401) {
        router.push(`/login?redirectedFrom=${encodeURIComponent(`/pricing?checkout=${planId}`)}`);
        return;
      }

      const data = (await response.json().catch(() => null)) as CandidateCheckoutResponse | null;
      const checkoutLog = {
        planId,
        currency,
        status: response.status,
        errorBody: data,
      };

      if (process.env.NODE_ENV !== "production") {
        console.info("[candidate-checkout:response]", checkoutLog);
      }

      if (!response.ok || !data?.url) {
        console.error("[candidate-checkout]", checkoutLog);
        throw new Error(candidateCheckoutMessage(data));
      }

      if (data.notice) {
        setCheckoutStatus(data.notice);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }

      window.location.assign(data.url);
    } catch (error) {
      setCheckoutStatus(error instanceof Error ? error.message : safeCheckoutMessage(""));
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
  }, [authLoading, requestedPlan, user]);

  function choosePlan(planId: SubscriptionPlanId) {
    trackAnalyticsEvent("pricing_cta_clicked", {
      plan_id: planId,
      source: "candidate_pricing",
    });
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
        <div className="mx-auto flex max-w-[82rem] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" aria-label="ISEYA homepage" className="inline-flex w-fit items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              className="h-auto w-[150px] object-contain sm:w-[220px]"
              priority
            />
          </Link>
          <nav aria-label="Public navigation" className="flex flex-wrap gap-4 text-sm font-semibold text-white/80">
            <Link className={headerNavigationLink} href="/">
              For Candidates
            </Link>
            <Link className={headerNavigationLink} href="/recruiters">
              For Recruiters
            </Link>
            <Link aria-current="page" className={`${headerNavigationLink} text-[var(--iseya-gold)]`} href="/pricing">
              Pricing
            </Link>
            <Link className={headerNavigationLink} href="/institutions">
              For Institutions
            </Link>
            <Link className={headerNavigationLink} href="/demo">
              Demo
            </Link>
            <Link className={headerNavigationLink} href={user ? "/account" : "/login"}>
              Login / Sign up
            </Link>
            <Link className={headerNavigationLink} href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <section className="iseya-soft-grid px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-[82rem]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              ISEYA Plans
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--iseya-heading)] sm:text-5xl">
              Plans for serious career movement.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Start free, then upgrade when you need deeper resume tailoring, stronger application materials, and a more organized job search workflow.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Free starter access &middot; Secure checkout &middot; Same features across supported regions
            </p>
          </div>

          <div className="mt-9 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map((plan) => (
              <section
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border p-6 shadow-[0_14px_34px_rgb(0_14_47_/_0.055)] transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgb(0_14_47_/_0.09)] sm:p-7 md:min-h-[620px] ${
                  plan.badge
                    ? "border-[var(--iseya-gold)] bg-[#FFF8E6]"
                    : "border-[var(--iseya-border)] bg-white/95"
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
            <p role="status" aria-live="polite" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
              {checkoutStatus}
            </p>
          ) : null}

          <p className="mt-8 max-w-3xl text-sm leading-7 text-slate-600">
            Secure checkout powered by Stripe. Prices may vary by region during checkout.
          </p>

          <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <article className="iseya-premium-panel rounded-3xl p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                Candidate Access
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
                Plans for active career workflows
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Starter access supports initial career asset building. Paid plans are designed for
                candidates actively tailoring resumes, comparing role alignment, and organizing
                application materials in a private workspace.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Regional pricing is shown during the secure upgrade flow where supported, while
                plan capabilities remain consistent across regions.
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
                <Link href="/workspace" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
                  Explore Career Assets
                </Link>
                <Link href="/demo/candidate" className="text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
                  View Candidate Demo
                </Link>
              </div>
            </article>
            <article className="iseya-premium-panel rounded-3xl p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                Pricing Questions
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
                Frequently asked questions
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                <div>
                  <h3 className="font-semibold text-[var(--iseya-navy)]">Can I start without paying?</h3>
                  <p>Yes. Starter gives candidates a free entry point for building career materials.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--iseya-navy)]">Why can checkout prices vary by region?</h3>
                  <p>ISEYA uses controlled regional pricing during eligible upgrade flows, not live currency conversion.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--iseya-navy)]">Are institution partnerships purchased here?</h3>
                  <p>No. Institutions request partnership access and are reviewed separately.</p>
                </div>
              </div>
            </article>
          </section>
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

  useEffect(() => {
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !processing) onClose();
    }

    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [onClose, processing]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--iseya-navy)]/45 px-5 py-8">
      <section
        aria-labelledby="candidate-checkout-title"
        aria-modal="true"
        role="dialog"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Secure Upgrade
            </p>
            <h2 id="candidate-checkout-title" className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              {plan?.name ?? "ISEYA plan"}
            </h2>
          </div>
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            aria-label="Close checkout options"
            className="rounded-md px-2 py-1 text-lg text-slate-500 transition hover:bg-slate-100 hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:opacity-50"
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
          <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-[var(--iseya-navy)]">
            {status}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onCheckout}
          disabled={processing}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
    <>
      <RelatedAuthorityResources context="pricing" maxWidth="max-w-[82rem]" />
      <PublicTrustFooter maxWidth="max-w-[82rem]" />
    </>
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

function planLabel(planId?: string) {
  if (planId === "plus") return "Plus";
  if (planId === "pro_monthly") return "Pro Monthly";
  if (planId === "pro_annual") return "Pro Annual";
  return "this plan";
}

function candidateCheckoutMessage(errorBody: CandidateCheckoutResponse | null) {
  if (!errorBody || Object.keys(errorBody).length === 0) {
    return "Checkout config missing. Check server logs.";
  }

  const code = errorBody.errorCode ?? errorBody.code;

  switch (code) {
    case "AUTH_CLIENT_UNAVAILABLE":
      return "Checkout cannot verify your session right now. Please refresh and try again.";
    case "AUTH_REQUIRED":
      return "Please sign in before upgrading.";
    case "UNSUPPORTED_PLAN":
      return "This checkout plan is not supported.";
    case "UNSUPPORTED_CURRENCY":
      return "This checkout currency is not supported yet.";
    case "MISSING_STRIPE_SECRET":
    case "INVALID_STRIPE_SECRET":
      return errorBody.missingVariable
        ? `Checkout config missing: ${errorBody.missingVariable}.`
        : "Stripe checkout is not configured yet.";
    case "MISSING_PRICE_ID":
      return errorBody.missingVariable
        ? `Checkout config missing: ${errorBody.missingVariable}.`
        : `Checkout is not configured for ${planLabel(errorBody.plan ?? undefined)} in ${errorBody.currency ?? "the selected currency"} yet.`;
    case "INVALID_PRICE_ID":
      return errorBody.missingVariable
        ? `Checkout config invalid: ${errorBody.missingVariable}.`
        : "Checkout price is not configured correctly for the selected plan.";
    case "APP_URL_MISSING":
      return errorBody.missingVariable
        ? `Checkout config missing: ${errorBody.missingVariable}.`
        : "Checkout needs a valid app URL before it can start.";
    case "STRIPE_SESSION_MISSING_URL":
    case "STRIPE_SESSION_FAILED":
      return errorBody.message || "Checkout could not start. Please try again.";
    default:
      return errorBody.message || safeCheckoutMessage(errorBody.error);
  }
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
