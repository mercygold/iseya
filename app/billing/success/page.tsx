import Link from "next/link";
import Stripe from "stripe";
import { InfoPageShell } from "../../info-page-shell";
import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import { planDownloadLimit, planOptimizationLimit } from "@/lib/subscription";

type PaidPlan = "plus" | "pro_monthly" | "pro_annual";

type BillingSuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

const planLabels: Record<PaidPlan, string> = {
  plus: "Plus",
  pro_monthly: "Pro Monthly",
  pro_annual: "Pro Annual",
};

function planFromMetadata(value: string | null | undefined): PaidPlan | null {
  if (value === "plus" || value === "pro_monthly" || value === "pro_annual") {
    return value;
  }

  return null;
}

function stringId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function checkoutSessionMarker(sessionId: string) {
  return `checkout_session:${sessionId}`;
}

function appendProcessedMarker(current: string[] | null | undefined, marker: string) {
  return Array.from(new Set([...(current ?? []), marker]));
}

function entitlementUpdate(plan: PaidPlan) {
  return {
    resume_download_credits: planDownloadLimit(plan),
    optimization_credits: planOptimizationLimit(plan),
    document_exports_used: 0,
    optimization_credits_used: 0,
  };
}

function logBillingSuccess(message: string, details?: Record<string, string | boolean | null>) {
  void message;
  void details;
}

function logBillingSuccessError(
  message: string,
  details?: Record<string, string | boolean | null>,
) {
  const safeDetails = details
    ? {
        plan: details.plan,
        code: details.code,
        userIdExists: details.userIdExists,
        customerExists: details.customerExists,
        emailExists: details.emailExists,
      }
    : {};
  console.error("[billing-success]", message, safeDetails);
}

async function findProfileForSession({
  userId,
  customerId,
  email,
}: {
  userId?: string | null;
  customerId?: string | null;
  email?: string | null;
}) {
  const supabase = createSupabaseServiceRoleClient();

  if (!supabase) {
    logBillingSuccessError("Supabase service-role client is unavailable.");
    return { supabase: null, profile: null };
  }

  if (userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, subscription_plan, resume_download_credits, optimization_credits, processed_stripe_event_ids",
      )
      .eq("id", userId)
      .maybeSingle();

    logBillingSuccess("Profile lookup result.", {
      lookup: "id",
      profileFound: Boolean(data),
      error: Boolean(error),
    });

    if (data) {
      return { supabase, profile: data };
    }
  }

  if (customerId) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, subscription_plan, resume_download_credits, optimization_credits, processed_stripe_event_ids",
      )
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    logBillingSuccess("Profile lookup result.", {
      lookup: "stripe_customer_id",
      profileFound: Boolean(data),
      error: Boolean(error),
    });

    if (data) {
      return { supabase, profile: data };
    }
  }

  if (email) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, subscription_plan, resume_download_credits, optimization_credits, processed_stripe_event_ids",
      )
      .eq("email", email)
      .maybeSingle();

    logBillingSuccess("Profile lookup result.", {
      lookup: "email",
      profileFound: Boolean(data),
      error: Boolean(error),
    });

    if (data) {
      return { supabase, profile: data };
    }
  }

  return { supabase, profile: null };
}

async function reconcileCheckoutSession(sessionId: string) {
  const stripeSecretKey = cleanSupabaseEnvValue(process.env.STRIPE_SECRET_KEY);

  if (!stripeSecretKey) {
    logBillingSuccessError("Stripe secret key is unavailable.");
    return null;
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const plan = planFromMetadata(session.metadata?.plan);
    const userId = session.metadata?.user_id || session.client_reference_id;
    const customerId = stringId(session.customer);
    const subscriptionId = stringId(session.subscription);
    const customerEmail =
      session.metadata?.user_email ||
      session.customer_details?.email ||
      session.customer_email ||
      null;

    logBillingSuccess("Checkout session reconciliation started.", {
      plan: plan ?? null,
      userIdExists: Boolean(userId),
      customerExists: Boolean(customerId),
      subscriptionExists: Boolean(subscriptionId),
    });

    if (!plan || !session.payment_status || session.payment_status === "unpaid") {
      return plan;
    }

    const { supabase, profile } = await findProfileForSession({
      userId,
      customerId,
      email: customerEmail,
    });

    if (!supabase || !profile) {
      logBillingSuccessError("Checkout session reconciliation skipped; profile unavailable.", {
        plan,
        userIdExists: Boolean(userId),
        customerExists: Boolean(customerId),
      });
      return plan;
    }

    const marker = checkoutSessionMarker(session.id);
    const processed = profile.processed_stripe_event_ids ?? [];

    if (processed.includes(marker)) {
      logBillingSuccess("Checkout session reconciliation already applied.", {
        plan,
        markerExists: true,
      });
      return plan;
    }

    const commonUpdate = {
      subscription_plan: plan,
      subscription_status: "active",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      processed_stripe_event_ids: appendProcessedMarker(processed, marker),
    };
    const { error } = await supabase
      .from("profiles")
      .update({
        ...commonUpdate,
        ...entitlementUpdate(plan),
      })
      .eq("id", profile.id);

    logBillingSuccess("Checkout session reconciliation update result.", {
      plan,
      success: !error,
      entitlementsApplied: true,
    });

    if (error) {
      logBillingSuccessError("Checkout session reconciliation update failed.", {
        plan,
        code: error.code,
      });
    }

    return plan;
  } catch {
    logBillingSuccessError("Checkout session reconciliation failed.");
    return null;
  }
}

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawSessionId = resolvedSearchParams.session_id;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const reconciledPlan = sessionId ? await reconcileCheckoutSession(sessionId) : null;

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
                  {reconciledPlan ? planLabels[reconciledPlan] : "Your selected ISEYA plan"}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--iseya-gold)]">
                  Status
                </p>
                <p className="mt-2 font-semibold text-[var(--iseya-navy)]">
                  Active
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
        href="/workspace?billing=success"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
      >
        Return to Workspace
      </Link>
    </InfoPageShell>
  );
}
