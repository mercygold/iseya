import Stripe from "stripe";
import { regionalPricing, supportedCurrencies, type PaidSubscriptionPlanId } from "@/lib/pricing/regions";
import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import { planDownloadLimit, planOptimizationLimit } from "@/lib/subscription";

type PaidPlan = PaidSubscriptionPlanId;

type ProfileEntitlements = {
  id: string;
  resume_download_credits: number | null;
  optimization_credits: number | null;
  document_exports_used?: number | null;
  optimization_credits_used?: number | null;
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
  void message;
  void details;
}

function logWebhookError(
  message: string,
  details?: Record<string, string | number | boolean | null>,
) {
  console.error("[stripe-webhook]", message, details ?? {});
}

function priceIdForPlan(plan: PaidPlan) {
  return supportedCurrencies
    .map((currency) =>
      cleanSupabaseEnvValue(process.env[regionalPricing[currency].plans[plan].stripePriceEnv]),
    )
    .filter((priceId): priceId is string => Boolean(priceId));
}

function planFromPriceId(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) {
    return null;
  }

  if (priceIdForPlan("plus").includes(priceId)) {
    return "plus";
  }

  if (priceIdForPlan("pro_monthly").includes(priceId)) {
    return "pro_monthly";
  }

  if (priceIdForPlan("pro_annual").includes(priceId)) {
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

function entitlementUpdate(plan: PaidPlan, resetUsage: boolean) {
  return {
    resume_download_credits: planDownloadLimit(plan),
    optimization_credits: planOptimizationLimit(plan),
    ...(resetUsage
      ? {
          document_exports_used: 0,
          optimization_credits_used: 0,
        }
      : {}),
  };
}

function checkoutSessionMarker(sessionId: string) {
  return `checkout_session:${sessionId}`;
}

async function findProfile({
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
    logWebhookError("Supabase service-role client is unavailable.");
    return { supabase: null, profile: null };
  }

  if (userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, resume_download_credits, optimization_credits, document_exports_used, optimization_credits_used, processed_stripe_event_ids",
      )
      .eq("id", userId)
      .maybeSingle();

    logWebhook("Supabase profile lookup result.", {
      lookup: "user_id",
      lookupValueExists: true,
      profileFound: Boolean(data),
      error: Boolean(error),
    });

    if (error) {
      logWebhookError("Profile lookup by user id failed.", {
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
      .select(
        "id, resume_download_credits, optimization_credits, document_exports_used, optimization_credits_used, processed_stripe_event_ids",
      )
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    logWebhook("Supabase profile lookup result.", {
      lookup: "stripe_customer_id",
      lookupValueExists: true,
      profileFound: Boolean(data),
      error: Boolean(error),
    });

    if (error) {
      logWebhookError("Profile lookup by Stripe customer id failed.", {
        code: error.code,
        message: error.message,
      });
    }

    if (data) {
      return { supabase, profile: data };
    }
  }

  if (email) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, resume_download_credits, optimization_credits, document_exports_used, optimization_credits_used, processed_stripe_event_ids",
      )
      .eq("email", email)
      .maybeSingle();

    logWebhook("Supabase profile lookup result.", {
      lookup: "email",
      lookupValueExists: true,
      profileFound: Boolean(data),
      error: Boolean(error),
    });

    if (error) {
      logWebhookError("Profile lookup by email failed.", {
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

function planFromMetadata(value: string | null | undefined): PaidPlan | null {
  if (value === "plus" || value === "pro_monthly" || value === "pro_annual") {
    return value;
  }

  return null;
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
    .select(
      "id, resume_download_credits, optimization_credits, document_exports_used, optimization_credits_used, processed_stripe_event_ids",
    )
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
  const metadataPlan = session.metadata?.plan ?? null;
  const customerEmail =
    session.metadata?.user_email ||
    session.customer_details?.email ||
    session.customer_email ||
    null;
  const plan = planFromMetadata(metadataPlan);

  logWebhook("checkout.session.completed received.", {
    eventId,
    mode: session.mode,
    metadataPlan,
    metadataUserIdExists: Boolean(userId),
    metadataEmailExists: Boolean(customerEmail),
    customerExists: Boolean(customerId),
    subscriptionExists: Boolean(subscriptionId),
  });

  const { supabase, profile: foundProfile } = await findProfile({
    userId,
    customerId,
    email: customerEmail,
  });

  if (!supabase) {
    logWebhookError("Checkout session update skipped because Supabase is unavailable.", {
      eventId,
      plan: metadataPlan,
    });
    return;
  }

  const profile = foundProfile ?? (await ensureProfileForCheckoutSession(supabase, session));

  logWebhook("Checkout profile resolution result.", {
    eventId,
    metadataUserIdExists: Boolean(userId),
    metadataEmailExists: Boolean(customerEmail),
    profileFound: Boolean(profile),
    usedExistingProfile: Boolean(foundProfile),
  });

  if (!profile) {
    logWebhookError("Checkout session update skipped because no profile was found.", {
      eventId,
      metadataUserIdExists: Boolean(userId),
      metadataEmailExists: Boolean(customerEmail),
      customerExists: Boolean(customerId),
      plan: metadataPlan,
    });
    return;
  }

  const sessionMarker = checkoutSessionMarker(session.id);

  if (alreadyProcessed(profile, eventId) || alreadyProcessed(profile, sessionMarker)) {
    logWebhook("Checkout session event already processed.", {
      eventId,
    });
    return;
  }

  const processedEvents = appendEventId(
    appendEventId(profile.processed_stripe_event_ids, eventId),
    sessionMarker,
  );

  if (session.mode === "payment" && plan === "plus") {
    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_plan: "plus",
        subscription_status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        ...entitlementUpdate("plus", true),
        processed_stripe_event_ids: processedEvents,
      })
      .eq("id", profile.id);

    logWebhook("Supabase profile update result.", {
      eventId,
      plan: "plus",
      profileMatched: true,
      success: !error,
      error: Boolean(error),
    });

    if (error) {
      logWebhookError("Plus profile update failed.", {
        eventId,
        code: error.code,
        message: error.message,
      });
      return;
    }

    logWebhook("Plus profile update succeeded.", {
      eventId,
      documentExports: 3,
      optimizationCredits: 15,
      customerSaved: Boolean(customerId),
    });
    return;
  }

  if (session.mode === "subscription" && (plan === "pro_monthly" || plan === "pro_annual")) {
    const subscriptionPlan = plan;

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_plan: subscriptionPlan,
        subscription_status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        ...entitlementUpdate(subscriptionPlan, true),
        processed_stripe_event_ids: processedEvents,
      })
      .eq("id", profile.id);

    logWebhook("Supabase profile update result.", {
      eventId,
      plan: subscriptionPlan,
      profileMatched: true,
      success: !error,
      error: Boolean(error),
    });

    if (error) {
      logWebhookError("Subscription checkout profile update failed.", {
        eventId,
        code: error.code,
        message: error.message,
      });
      return;
    }

    logWebhook("Subscription checkout profile update succeeded.", {
      eventId,
      plan: subscriptionPlan,
    });
    return;
  }

  logWebhookError("Checkout session completed with unsupported plan or mode.", {
    eventId,
    mode: session.mode,
    metadataPlan,
  });
}

async function updateProfileFromSubscription(
  eventId: string,
  subscription: Stripe.Subscription,
) {
  const customerId = stringId(subscription.customer);
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;
  const metadataPlan = planFromMetadata(subscription.metadata?.plan);
  const plan = metadataPlan ?? planFromPriceId(priceId) ?? "pro_monthly";
  const userId = subscription.metadata?.user_id;
  const userEmail = subscription.metadata?.user_email ?? null;
  const { supabase, profile } = await findProfile({ userId, customerId, email: userEmail });

  if (!supabase || !profile || alreadyProcessed(profile, eventId)) {
    logWebhook("Subscription event skipped.", {
      eventId,
      reason: !supabase ? "missing_supabase" : !profile ? "missing_profile" : "already_processed",
    });
    return;
  }

  const isCanceled = subscription.status === "canceled";
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_plan: isCanceled ? "free" : plan,
      subscription_status: subscription.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      ...(!isCanceled ? entitlementUpdate(plan, false) : {}),
      processed_stripe_event_ids: appendEventId(profile.processed_stripe_event_ids, eventId),
    })
    .eq("id", profile.id);

  if (error) {
    logWebhookError("Subscription profile update failed.", {
      eventId,
      code: error.code,
      message: error.message,
    });
    return;
  }

  logWebhook("Subscription profile update succeeded.", {
    eventId,
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
  const customerEmail = invoice.customer_email || null;
  let plan: PaidPlan | null = null;
  const stripeClient = stripe();

  if (stripeClient && subscriptionId) {
    try {
      const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
      plan =
        planFromMetadata(subscription.metadata?.plan) ??
        planFromPriceId(subscription.items.data[0]?.price.id);
    } catch (error) {
      logWebhookError("Invoice subscription lookup failed.", {
        eventId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const { supabase, profile } = await findProfile({ customerId, email: customerEmail });

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
      ...(status === "active" && plan ? { subscription_plan: plan } : {}),
      subscription_status: status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      ...(status === "active" && plan ? entitlementUpdate(plan, true) : {}),
      processed_stripe_event_ids: appendEventId(profile.processed_stripe_event_ids, eventId),
    })
    .eq("id", profile.id);

  if (error) {
    logWebhookError("Invoice profile update failed.", {
      eventId,
      code: error.code,
      message: error.message,
    });
    return;
  }

  logWebhook("Invoice profile update succeeded.", {
    eventId,
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
      await updateProfileFromSubscription(
        event.id,
        event.data.object as Stripe.Subscription,
      );
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
