"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { enableInstitutionAccess } from "@/lib/featureFlags";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  isProPlan,
  normalizeSubscriptionPlan,
  planDownloadLimit,
  planOptimizationLimit,
  subscriptionLabel,
  type SubscriptionPlanId,
} from "@/lib/subscription";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  resume_download_credits: number | null;
  optimization_credits: number | null;
};

type UsageCounters = {
  downloadsUsed: number;
  optimizationCreditsUsed: number;
  savedVersionsCount: number;
};

const buttonBase =
  "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButton =
  `${buttonBase} border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] text-white hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]`;
const secondaryButton =
  `${buttonBase} border border-[var(--iseya-border)] bg-white text-[var(--iseya-navy)] hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6]`;

function formatStatus(status: string | null | undefined, plan: SubscriptionPlanId) {
  if (plan === "free") {
    return "Free";
  }

  const normalized = (status || "active").replace(/_/g, " ");
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function upgradeCta(plan: SubscriptionPlanId) {
  if (plan === "plus") {
    return "Upgrade to Pro";
  }

  if (plan === "pro_monthly") {
    return "Switch to Annual";
  }

  if (plan === "pro_annual") {
    return "You are on the best value plan";
  }

  return "Upgrade to Plus or Pro";
}

function progressPercent(used: number, limit: number) {
  if (!Number.isFinite(limit)) {
    return 100;
  }

  if (limit <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}

function UsageBar({
  label,
  used,
  available,
  remaining,
}: {
  label: string;
  used: number;
  available: number;
  remaining?: number;
}) {
  const unlimited = !Number.isFinite(available);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--iseya-navy)]">{label}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {unlimited
              ? `${used} used / Unlimited`
              : `${used} used / ${available} available`}
          </p>
        </div>
        {typeof remaining === "number" && !unlimited ? (
          <span className="rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-bold text-[var(--iseya-navy)]">
            {remaining} left
          </span>
        ) : null}
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-[var(--iseya-gold)] transition-all"
          style={{ width: `${progressPercent(used, available)}%` }}
        />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usage, setUsage] = useState<UsageCounters>({
    downloadsUsed: 0,
    optimizationCreditsUsed: 0,
    savedVersionsCount: 0,
  });
  const [organizationName, setOrganizationName] = useState("");
  const [status, setStatus] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login?redirectedFrom=/account");
      return;
    }

    let cancelled = false;

    async function loadAccount() {
      if (!supabase || !user) {
        setStatus("Account data is temporarily unavailable.");
        setPageLoading(false);
        return;
      }

      setPageLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, created_at, subscription_plan, subscription_status, resume_download_credits, optimization_credits",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error || !data) {
        console.error("Unable to load account profile.", error?.message ?? "profile_not_found");
        setStatus("Unable to load account details right now.");
        setPageLoading(false);
        return;
      }

      setProfile(data);

      if (enableInstitutionAccess) {
        const response = await fetch("/api/institution/verify");
        const organizationData = (await response.json().catch(() => ({}))) as {
          organization?: { name?: string } | null;
        };
        setOrganizationName(organizationData.organization?.name ?? "Institution Access");
      } else {
        setOrganizationName("");
      }

      const { data: usageData, error: usageError } = await supabase
        .from("profiles")
        .select("downloads_used, optimization_credits_used, saved_versions_count")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled && !usageError && usageData) {
        setUsage({
          downloadsUsed: Number(usageData.downloads_used) || 0,
          optimizationCreditsUsed: Number(usageData.optimization_credits_used) || 0,
          savedVersionsCount: Number(usageData.saved_versions_count) || 0,
        });
      }

      if (usageError) {
        console.error("Unable to load account usage.", usageError.message);
      }

      if (!cancelled) {
        setPageLoading(false);
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [loading, router, supabase, user]);

  const plan = normalizeSubscriptionPlan(profile?.subscription_plan);
  const planLabel = subscriptionLabel(plan);
  const statusLabel = formatStatus(profile?.subscription_status, plan);
  const exportLimit = planDownloadLimit(plan);
  const optimizationLimit = planOptimizationLimit(plan);
  const exportsRemaining = isProPlan(plan)
    ? Infinity
    : profile?.resume_download_credits ?? (plan === "plus" ? 3 : 1);
  const optimizationRemaining = isProPlan(plan)
    ? Infinity
    : profile?.optimization_credits ?? (plan === "plus" ? 15 : 0);
  const exportsUsed = Number.isFinite(exportLimit)
    ? Math.max(0, exportLimit - (Number(exportsRemaining) || 0))
    : usage.downloadsUsed;
  const optimizationUsed = Number.isFinite(optimizationLimit)
    ? Math.max(0, optimizationLimit - (Number(optimizationRemaining) || 0))
    : usage.optimizationCreditsUsed;
  const savedVersionLimit = isProPlan(plan) ? Infinity : plan === "plus" ? 5 : 0;
  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);

  async function signOut() {
    await logout();
    router.push("/login");
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
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/workspace">
              Workspace
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/pricing">
              Pricing
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-[82rem]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
                Account
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-5xl">
                My Account
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage your ISEYA plan, usage, billing status, and account controls.
              </p>
            </div>
            <Link href="/workspace" className={secondaryButton}>
              Back to Workspace
            </Link>
          </div>

          {status ? (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
              {status}
            </p>
          ) : null}

          {pageLoading ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold text-[var(--iseya-navy)]">
                Loading account details...
              </p>
            </div>
          ) : profile ? (
            <div className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                      Profile
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
                      {profile.full_name || user?.user_metadata?.full_name || "ISEYA User"}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      {profile.email || user?.email || "Email unavailable"}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--iseya-gold)]/50 bg-[#FFF8E6] px-3 py-1 text-xs font-bold text-[var(--iseya-navy)]">
                    {planLabel}
                  </span>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoItem label="Current plan" value={planLabel} />
                  <InfoItem label="Subscription status" value={statusLabel} />
                  {enableInstitutionAccess && organizationName ? (
                    <InfoItem label="Institution access" value={organizationName} />
                  ) : null}
                  <InfoItem
                    label="Document exports remaining"
                    value={Number.isFinite(exportsRemaining) ? String(exportsRemaining) : "Unlimited"}
                  />
                  <InfoItem
                    label="Optimization credits remaining"
                    value={Number.isFinite(optimizationRemaining) ? String(optimizationRemaining) : "Unlimited"}
                  />
                  <InfoItem label="Saved versions" value={String(usage.savedVersionsCount)} />
                  <InfoItem label="Account created" value={formatDate(profile.created_at)} />
                </dl>
              </section>

              <section className="rounded-2xl border border-[var(--iseya-gold)]/50 bg-[#FFF8E6] p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Billing
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
                  Current Plan
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoItem label="Plan type" value={planLabel} />
                  <InfoItem label="Status" value={statusLabel} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus("Billing management is coming soon.")}
                    className={primaryButton}
                  >
                    Manage Billing
                  </button>
                  {plan === "pro_annual" ? (
                    <span className="inline-flex min-h-10 items-center rounded-md border border-[var(--iseya-gold)] bg-white px-4 py-2 text-sm font-bold text-[var(--iseya-navy)]">
                      {upgradeCta(plan)}
                    </span>
                  ) : (
                    <Link href="/pricing" className={secondaryButton}>
                      {upgradeCta(plan)}
                    </Link>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Usage
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
                  Workspace Allowances
                </h2>
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <UsageBar
                    label="Document exports"
                    used={exportsUsed}
                    available={exportLimit}
                    remaining={Number.isFinite(exportsRemaining) ? Number(exportsRemaining) : undefined}
                  />
                  <UsageBar
                    label="Optimization credits"
                    used={optimizationUsed}
                    available={optimizationLimit}
                    remaining={Number.isFinite(optimizationRemaining) ? Number(optimizationRemaining) : undefined}
                  />
                  <UsageBar
                    label="Saved versions"
                    used={usage.savedVersionsCount}
                    available={savedVersionLimit}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
                  Security
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--iseya-navy)]">
                  Account Security
                </h2>
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <InfoItem
                    label="Email verification"
                    value={emailVerified ? "Verified" : "Not verified"}
                  />
                  <Link href="/reset-password" className={secondaryButton}>
                    Password Reset
                  </Link>
                  <button type="button" onClick={signOut} className={primaryButton}>
                    Sign Out
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold text-[var(--iseya-navy)]">
        {value}
      </dd>
    </div>
  );
}
