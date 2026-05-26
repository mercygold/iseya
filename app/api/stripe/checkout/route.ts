import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";
import {
  defaultCurrency,
  getRegionalPricing,
  isSupportedCurrency,
  type PaidSubscriptionPlanId as CheckoutPlan,
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
    plan?: unknown;
    currency?: unknown;
  };

  if (!isCheckoutPlan(body.plan)) {
    logCheckoutDiagnostic("Invalid checkout plan requested.");
    return checkoutError(400);
  }

  const stripeSecretKey = cleanSupabaseEnvValue(process.env.STRIPE_SECRET_KEY);
  const currency = isSupportedCurrency(body.currency) ? body.currency : defaultCurrency;
  const plan = getRegionalPricing(currency).plans[body.plan];
  const mode = checkoutModes[body.plan];
  const priceId = cleanSupabaseEnvValue(process.env[plan.stripePriceEnv]);

  if (!stripeSecretKey) {
    logCheckoutDiagnostic("Missing Stripe secret key.");
    return checkoutError();
  }

  if (!priceId) {
    logCheckoutDiagnostic("Missing Stripe price ID.", {
      plan: body.plan,
      currency,
      priceEnv: plan.stripePriceEnv,
    });
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
    plan: body.plan,
    currency,
  };

  try {
    if (body.plan === "plus") {
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
        plan: body.plan,
        currency,
      });
      return checkoutError(502);
    }

    return Response.json({ url: session.url });
  } catch (error) {
    logCheckoutDiagnostic("Stripe checkout creation failed.", {
      plan: body.plan,
      currency,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return checkoutError(502);
  }
}
