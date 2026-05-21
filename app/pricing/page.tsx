"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pricingPlans, type SubscriptionPlanId } from "@/lib/subscription";

export default function PricingPage() {
  const router = useRouter();
  const [checkoutPlan, setCheckoutPlan] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState("");

  async function startCheckout(planId: SubscriptionPlanId) {
    if (planId === "free") {
      return;
    }

    setCheckoutPlan(planId);
    setCheckoutStatus("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      if (response.status === 401) {
        router.push("/login?redirectedFrom=/pricing");
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
              Resume Builder
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/about">
              About
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
              Choose the level of career workspace access that fits your job
              search. Free users can draft and edit; paid plans unlock more
              document exports, optimization, saved versions, and application materials.
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
                  disabled={plan.id === "free" || Boolean(checkoutPlan)}
                  onClick={() => startCheckout(plan.id)}
                  className={`mt-8 min-h-11 w-full rounded-md border px-4 py-2 text-sm font-bold transition hover:shadow-md disabled:cursor-not-allowed disabled:hover:shadow-none ${
                    plan.id === "free"
                      ? "border-slate-200 bg-slate-100 text-slate-500"
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
            Secure checkout powered by Stripe.
          </p>
        </div>
      </section>
    </main>
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
    return "Current Plan";
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
