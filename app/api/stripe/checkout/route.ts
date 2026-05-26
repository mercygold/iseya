import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";
import {
  defaultCurrency,
  getRegionalPricing,
  isSupportedCurrency,
  type PaidSubscriptionPlanId as CheckoutPlan,
  type SupportedCurrency,
} from "@/lib/pricing/regions";

const checkoutModes: Record<CheckoutPlan, "payment" | "subscription"> = {
  plus: "payment",
  pro_monthly: "subscription",
  pro_annual: "subscription",
};

function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "plus" || value === "pro_monthly" || value === "pro_annual";
}

const checkoutUnavailableMessage =
  "Checkout is temporarily unavailable. Please try again shortly.";
const plusCheckoutImagePath = "/stripe/iseya-plus-checkout.png";

function checkoutError(status = 503) {
  return Response.json({ error: checkoutUnavailableMessage }, { status });
}

function logCheckoutDiagnostic(message: string, details?: Record<string, string>) {
  console.error("[stripe-checkout]", message, details ?? {});
}

function configuredPriceId(plan: CheckoutPlan, currency: SupportedCurrency) {
  const configuredPrice = getRegionalPricing(currency).plans[plan];
  const envNames = [configuredPrice.stripePriceEnv, ...configuredPrice.legacyStripePriceEnvs];

  for (const envName of envNames) {
    const priceId = cleanSupabaseEnvValue(process.env[envName]);
    if (priceId) {
      return { priceId, envName, primaryEnvName: configuredPrice.stripePriceEnv };
    }
  }

  return { priceId: null, envName: "", primaryEnvName: configuredPrice.stripePriceEnv };
}

function appBaseUrl(request: Request) {
  const configuredUrl = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_APP_URL);

  if (configuredUrl) {
    try {
      const parsedUrl = new URL(configuredUrl);

      if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
        logCheckoutDiagnostic("Configured production app URL must use HTTPS.");
        return null;
      }

      return parsedUrl.origin;
    } catch {
      logCheckoutDiagnostic("Configured app URL is invalid.");
      return null;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      return new URL(request.url).origin;
    } catch {
      logCheckoutDiagnostic("Could not infer local app URL from request.");
      return null;
    }
  }

  logCheckoutDiagnostic("App URL is not configured.");
  return null;
}

function checkoutImageUrl(appUrl: string) {
  return new URL(plusCheckoutImagePath, appUrl).toString();
}

async function syncPlusCheckoutImage(stripe: Stripe, priceId: string, appUrl: string) {
  if (!appUrl.startsWith("https://")) {
    return;
  }

  const imageUrl = checkoutImageUrl(appUrl);

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product;

    if (typeof product === "string" || product.deleted) {
      logCheckoutDiagnostic("Could not resolve Plus Stripe product for image update.");
      return;
    }

    if (product.images?.[0] === imageUrl) {
      return;
    }

    await stripe.products.update(product.id, { images: [imageUrl] });
  } catch (error) {
    logCheckoutDiagnostic("Plus checkout image update failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    logCheckoutDiagnostic("Supabase auth client is unavailable.");
    return checkoutError();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Login is required before checkout." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    planId?: unknown;
    plan?: unknown;
    currency?: unknown;
  };
  const requestedPlan = body.planId ?? body.plan;

  if (!isCheckoutPlan(requestedPlan)) {
    logCheckoutDiagnostic("Invalid checkout plan requested.");
    return checkoutError(400);
  }

  const stripeSecretKey = cleanSupabaseEnvValue(process.env.STRIPE_SECRET_KEY);
  const requestedCurrency = isSupportedCurrency(body.currency) ? body.currency : defaultCurrency;
  let checkoutCurrency = requestedCurrency;
  let configuredPrice = configuredPriceId(requestedPlan, requestedCurrency);
  let notice: string | undefined;
  const mode = checkoutModes[requestedPlan];

  if (!stripeSecretKey) {
    logCheckoutDiagnostic("Missing Stripe secret key.");
    return checkoutError();
  }

  if (!configuredPrice.priceId) {
    logCheckoutDiagnostic("Missing Stripe price ID.", {
      plan: requestedPlan,
      currency: requestedCurrency,
      priceEnv: configuredPrice.primaryEnvName,
    });

    if (requestedCurrency !== defaultCurrency) {
      const usdPrice = configuredPriceId(requestedPlan, defaultCurrency);
      if (usdPrice.priceId) {
        checkoutCurrency = defaultCurrency;
        configuredPrice = usdPrice;
        notice = "Local checkout is not active yet. Continuing in USD.";
      } else {
        logCheckoutDiagnostic("USD fallback price ID is also missing.", {
          plan: requestedPlan,
          currency: defaultCurrency,
          priceEnv: usdPrice.primaryEnvName,
        });
        return checkoutError();
      }
    } else {
      return checkoutError();
    }
  }

  const priceId = configuredPrice.priceId;
  if (!priceId) {
    return checkoutError();
  }

  const stripe = new Stripe(stripeSecretKey);
  const appUrl = appBaseUrl(request);

  if (!appUrl) {
    return checkoutError();
  }

  const metadata = {
    user_id: user.id,
    user_email: user.email ?? "",
    plan: requestedPlan,
    currency: checkoutCurrency,
    requested_currency: requestedCurrency,
  };

  try {
    if (requestedPlan === "plus") {
      await syncPlusCheckoutImage(stripe, priceId, appUrl);
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata,
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata,
            },
          }
        : {
            customer_creation: "always" as const,
            payment_intent_data: {
              metadata,
            },
          }),
    });

    if (!session.url) {
      logCheckoutDiagnostic("Stripe checkout session did not return a URL.", {
        plan: requestedPlan,
        currency: checkoutCurrency,
      });
      return checkoutError(502);
    }

    return Response.json({
      url: session.url,
      currency: checkoutCurrency,
      requestedCurrency,
      notice,
    });
  } catch (error) {
    logCheckoutDiagnostic("Stripe checkout creation failed.", {
      plan: requestedPlan,
      currency: checkoutCurrency,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return checkoutError(502);
  }
}
