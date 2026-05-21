import Stripe from "stripe";
import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

type PaidPlan = "plus" | "pro_monthly" | "pro_annual";

type ProfileEntitlements = {
  id: string;
  resume_download_credits: number | null;
  optimization_credits: number | null;
  processed_stripe_event_ids: string[] | null;
};

const subscriptionStatusByInvoiceEvent = {
  "invoice.payment_succeeded": "active",
  "invoice.payment_failed": "past_due",
} as const;

function stripe() {
  const stripeSecretKey = cleanSupabaseEnvValue(process.env.STRIPE_SECRET_KEY);

  return stripeSecretKey ? new Stripe(stripeSecretKey) : null;
}

function logWebhook(message: string, details?: Record<string, string | number | boolean | null>) {
  console.log("[stripe-webhook]", message, details ?? {});
}

function logWebhookError(
  message: string,
  details?: Record<string, string | number | boolean | null>,
) {
  console.error("[stripe-webhook]", message, details ?? {});
}

function priceIdForPlan(plan: PaidPlan) {
  const envByPlan: Record<PaidPlan, string> = {
    plus: "STRIPE_PLUS_PRICE_ID",
    pro_monthly: "STRIPE_PRO_MONTHLY_PRICE_ID",
    pro_annual: "STRIPE_PRO_ANNUAL_PRICE_ID",
  };

  return cleanSupabaseEnvValue(process.env[envByPlan[plan]]);
}

function planFromPriceId(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) {
    return null;
  }

  if (priceId === priceIdForPlan("plus")) {
    return "plus";
  }

  if (priceId === priceIdForPlan("pro_monthly")) {
    return "pro_monthly";
  }

  if (priceId === priceIdForPlan("pro_annual")) {
    return "pro_annual";
  }

  return null;
}

function stringId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function appendEventId(current: string[] | null | undefined, eventId: string) {
  return Array.from(new Set([...(current ?? []), eventId]));
}

async function findProfile({
  userId,
  customerId,
}: {
  userId?: string | null;
  customerId?: string | null;
}) {
  const supabase = createSupabaseServiceRoleClient();

  if (!supabase) {
    logWebhookError("Supabase service-role client is unavailable.");
    return { supabase: null, profile: null };
  }

  if (userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, resume_download_credits, optimization_credits, processed_stripe_event_ids")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      logWebhookError("Profile lookup by user id failed.", {
        userId,
        code: error.code,
        message: error.message,
      });
    }

    if (data) {
      return { supabase, profile: data };
    }
  }

  if (customerId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, resume_download_credits, optimization_credits, processed_stripe_event_ids")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (error) {
      logWebhookError("Profile lookup by Stripe customer id failed.", {
        customerId,
        code: error.code,
        message: error.message,
      });
    }

    if (data) {
      return { supabase, profile: data };
    }
  }

  return { supabase, profile: null };
}

function alreadyProcessed(profile: ProfileEntitlements, eventId: string) {
  return (profile.processed_stripe_event_ids ?? []).includes(eventId);
}

async function ensureProfileForCheckoutSession(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceRoleClient>>,
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.user_id || session.client_reference_id;

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: session.metadata?.user_email || session.customer_email || null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id, resume_download_credits, optimization_credits, processed_stripe_event_ids")
    .single();

  if (error) {
    logWebhookError("Profile upsert for checkout session failed.", {
      userId,
      code: error.code,
      message: error.message,
    });
    return null;
  }

  return data;
}

async function updateProfileFromCheckoutSession(
  eventId: string,
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.user_id || session.client_reference_id;
  const customerId = stringId(session.customer);
  const subscriptionId = stringId(session.subscription);
  const plan = session.metadata?.plan === "plus" ? "plus" : planFromPriceId(null);
  const { supabase, profile: foundProfile } = await findProfile({ userId, customerId });

  if (!supabase) {
    logWebhookError("Checkout session update skipped because Supabase is unavailable.", {
      eventId,
      plan: session.metadata?.plan ?? null,
    });
    return;
  }

  const profile = foundProfile ?? (await ensureProfileForCheckoutSession(supabase, session));

  if (!profile) {
    logWebhookError("Checkout session update skipped because no profile was found.", {
      eventId,
      userId: userId ?? null,
      customerId,
      plan: session.metadata?.plan ?? null,
    });
    return;
  }

  if (alreadyProcessed(profile, eventId)) {
    logWebhook("Checkout session event already processed.", {
      eventId,
      profileId: profile.id,
    });
    return;
  }

  const processedEvents = appendEventId(profile.processed_stripe_event_ids, eventId);

  if (session.mode === "payment" && plan === "plus") {
    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_plan: "plus",
        subscription_status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        resume_download_credits: (profile.resume_download_credits ?? 0) + 5,
        optimization_credits: (profile.optimization_credits ?? 0) + 15,
        processed_stripe_event_ids: processedEvents,
      })
      .eq("id", profile.id);

    if (error) {
      logWebhookError("Plus profile update failed.", {
        eventId,
        profileId: profile.id,
        code: error.code,
        message: error.message,
      });
      return;
    }

    logWebhook("Plus profile update succeeded.", {
      eventId,
      profileId: profile.id,
      downloadsAdded: 5,
      optimizationCreditsAdded: 15,
      customerSaved: Boolean(customerId),
    });
    return;
  }

  if (session.mode === "subscription") {
    const subscriptionPlan =
      session.metadata?.plan === "pro_monthly" || session.metadata?.plan === "pro_annual"
        ? session.metadata.plan
        : "pro_monthly";

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_plan: subscriptionPlan,
        subscription_status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        processed_stripe_event_ids: processedEvents,
      })
      .eq("id", profile.id);

    if (error) {
      logWebhookError("Subscription checkout profile update failed.", {
        eventId,
        profileId: profile.id,
        code: error.code,
        message: error.message,
      });
      return;
    }

    logWebhook("Subscription checkout profile update succeeded.", {
      eventId,
      profileId: profile.id,
      plan: subscriptionPlan,
    });
  }
}

async function updateProfileFromSubscription(eventId: string, subscription: Stripe.Subscription) {
  const customerId = stringId(subscription.customer);
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = planFromPriceId(priceId) ?? "pro_monthly";
  const userId = subscription.metadata?.user_id;
  const { supabase, profile } = await findProfile({ userId, customerId });

  if (!supabase || !profile || alreadyProcessed(profile, eventId)) {
    logWebhook("Subscription event skipped.", {
      eventId,
      reason: !supabase ? "missing_supabase" : !profile ? "missing_profile" : "already_processed",
    });
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_plan: subscription.status === "canceled" ? "free" : plan,
      subscription_status: subscription.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      processed_stripe_event_ids: appendEventId(profile.processed_stripe_event_ids, eventId),
    })
    .eq("id", profile.id);

  if (error) {
    logWebhookError("Subscription profile update failed.", {
      eventId,
      profileId: profile.id,
      code: error.code,
      message: error.message,
    });
    return;
  }

  logWebhook("Subscription profile update succeeded.", {
    eventId,
    profileId: profile.id,
    plan,
    status: subscription.status,
  });
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  return stringId(invoiceWithSubscription.subscription);
}

async function updateProfileFromInvoice(
  eventId: string,
  invoice: Stripe.Invoice,
  status: "active" | "past_due",
) {
  const customerId = stringId(invoice.customer);
  const subscriptionId = invoiceSubscriptionId(invoice);
  const { supabase, profile } = await findProfile({ customerId });

  if (!supabase || !profile || alreadyProcessed(profile, eventId)) {
    logWebhook("Invoice event skipped.", {
      eventId,
      reason: !supabase ? "missing_supabase" : !profile ? "missing_profile" : "already_processed",
    });
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status: status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      processed_stripe_event_ids: appendEventId(profile.processed_stripe_event_ids, eventId),
    })
    .eq("id", profile.id);

  if (error) {
    logWebhookError("Invoice profile update failed.", {
      eventId,
      profileId: profile.id,
      code: error.code,
      message: error.message,
    });
    return;
  }

  logWebhook("Invoice profile update succeeded.", {
    eventId,
    profileId: profile.id,
    status,
  });
}

export async function POST(request: Request) {
  const stripeClient = stripe();
  const webhookSecret = cleanSupabaseEnvValue(process.env.STRIPE_WEBHOOK_SECRET);
  const signature = request.headers.get("stripe-signature");

  if (!stripeClient || !webhookSecret) {
    logWebhookError("Webhook is not configured.");
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  if (!signature) {
    logWebhookError("Webhook request missing Stripe signature.");
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    logWebhookError("Webhook signature verification failed.");
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  logWebhook("Event received.", {
    eventId: event.id,
    type: event.type,
  });

  switch (event.type) {
    case "checkout.session.completed":
      await updateProfileFromCheckoutSession(
        event.id,
        event.data.object as Stripe.Checkout.Session,
      );
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await updateProfileFromSubscription(event.id, event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      await updateProfileFromInvoice(
        event.id,
        event.data.object as Stripe.Invoice,
        subscriptionStatusByInvoiceEvent[event.type],
      );
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}
