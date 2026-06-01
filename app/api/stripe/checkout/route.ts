import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";
import {
  defaultCurrency,
  getRegionalPricing,
  isSupportedCurrency,
  type PaidSubscriptionPlanId as CandidateCheckoutPlan,
  type SupportedCurrency,
} from "@/lib/pricing/regions";
import {
  getRecruiterRegionalPrice,
  isRecruiterPaidPlan,
  type RecruiterPaidPlanId,
} from "@/lib/pricing/recruiter";

type BillingScope = "candidate" | "recruiter";
type CheckoutPlan = CandidateCheckoutPlan | RecruiterPaidPlanId;
type CheckoutErrorCode =
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

const checkoutModes: Record<CheckoutPlan, "payment" | "subscription"> = {
  plus: "payment",
  pro_monthly: "subscription",
  pro_annual: "subscription",
  recruiter_quarterly: "subscription",
  recruiter_annual: "subscription",
};

function isCandidateCheckoutPlan(value: unknown): value is CandidateCheckoutPlan {
  return value === "plus" || value === "pro_monthly" || value === "pro_annual";
}

const checkoutUnavailableMessage =
  "Checkout is temporarily unavailable. Please try again shortly.";
const plusCheckoutImagePath = "/stripe/iseya-plus-checkout.png";

export const runtime = "nodejs";

function checkoutError(
  status = 503,
  message = checkoutUnavailableMessage,
  code: CheckoutErrorCode = "STRIPE_SESSION_FAILED",
  context: {
    missingVariable?: string | null;
    plan?: string | null;
    currency?: string | null;
  } = {},
) {
  return Response.json(
    {
      error: message,
      message,
      errorCode: code,
      code,
      missingVariable: context.missingVariable ?? null,
      plan: context.plan ?? null,
      currency: context.currency ?? null,
    },
    { status },
  );
}

function logCheckoutDiagnostic(
  message: string,
  details?: Record<string, string | number | boolean | null | undefined>,
) {
  console.error("[stripe-checkout]", message, details ?? {});
}

function safeStripeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return {};
  }

  const stripeError = error as {
    type?: unknown;
    code?: unknown;
    param?: unknown;
    statusCode?: unknown;
    message?: unknown;
  };

  const message =
    typeof stripeError.message === "string"
      ? stripeError.message.replace(/price_[A-Za-z0-9_]+/g, "price_[redacted]")
      : undefined;

  return {
    type: typeof stripeError.type === "string" ? stripeError.type : undefined,
    code: typeof stripeError.code === "string" ? stripeError.code : undefined,
    param: typeof stripeError.param === "string" ? stripeError.param : undefined,
    statusCode: typeof stripeError.statusCode === "number" ? stripeError.statusCode : undefined,
    message,
  };
}

function stripeKeyMode(stripeSecretKey: string) {
  if (stripeSecretKey.startsWith("sk_live_")) return "live";
  if (stripeSecretKey.startsWith("sk_test_")) return "test";
  return "unknown";
}

function isLikelyStripeSecretKey(value: string) {
  return value.startsWith("sk_live_") || value.startsWith("sk_test_");
}

function isLikelyStripePriceId(value: string) {
  return value.startsWith("price_");
}

function safeValuePrefix(value: string) {
  if (!value) return "";
  if (value.startsWith("sk_live_")) return "sk_live_...";
  if (value.startsWith("sk_test_")) return "sk_test_...";
  if (value.startsWith("pk_live_")) return "pk_live_...";
  if (value.startsWith("pk_test_")) return "pk_test_...";
  if (value.startsWith("price_")) return "price_...";
  if (value.startsWith("whsec_")) return "whsec_...";
  return `${value.slice(0, 4)}...`;
}

function logCheckoutRuntimeConfig({
  plan,
  currency,
  priceEnv,
  priceId,
  stripeSecretKey,
}: {
  plan: CheckoutPlan;
  currency: SupportedCurrency;
  priceEnv: string;
  priceId: string | null;
  stripeSecretKey: string;
}) {
  const publishableKey = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  logCheckoutDiagnostic("Checkout runtime config.", {
    plan,
    currency,
    stripeSecretKeyExists: Boolean(stripeSecretKey),
    stripeSecretKeyPrefix: safeValuePrefix(stripeSecretKey),
    publishableKeyExists: Boolean(publishableKey),
    publishableKeyPrefix: safeValuePrefix(publishableKey),
    selectedPriceEnvName: priceEnv,
    selectedPriceIdExists: Boolean(priceId),
    selectedPriceIdPrefix: safeValuePrefix(priceId ?? ""),
  });
}

function logRecruiterPriceResolution({
  plan,
  currency,
  configuredPrice,
  stripeSecretKey,
}: {
  plan: CheckoutPlan;
  currency: SupportedCurrency;
  configuredPrice: ReturnType<typeof recruiterConfiguredPriceId>;
  stripeSecretKey: string;
}) {
  logCheckoutDiagnostic("Recruiter checkout price resolution.", {
    plan,
    currency,
    resolvedEnvKey: configuredPrice.envName || configuredPrice.primaryEnvName,
    priceIdExists: Boolean(configuredPrice.priceId),
    stripeMode: stripeKeyMode(stripeSecretKey),
  });
}

function candidateConfiguredPriceId(plan: CandidateCheckoutPlan, currency: SupportedCurrency) {
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

function recruiterConfiguredPriceId(plan: RecruiterPaidPlanId, currency: SupportedCurrency) {
  const configuredPrice = getRecruiterRegionalPrice(plan, currency);
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
  const configuredUrl =
    cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_APP_URL) ||
    cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SITE_URL) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

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
  } catch {
    logCheckoutDiagnostic("Plus checkout image update failed.");
  }
}

async function handleCheckoutPost(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    planId?: unknown;
    plan?: unknown;
    planType?: unknown;
    currency?: unknown;
  };
  const requestedPlan = body.planId ?? body.plan;
  const billingScope: BillingScope = body.planType === "recruiter" ? "recruiter" : "candidate";

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    logCheckoutDiagnostic("Supabase auth client is unavailable.");
    return checkoutError(
      503,
      checkoutUnavailableMessage,
      "AUTH_CLIENT_UNAVAILABLE",
      { plan: requestedPlan ? String(requestedPlan) : null, currency: typeof body.currency === "string" ? body.currency : null },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return checkoutError(
      401,
      billingScope === "recruiter"
        ? "Please sign in before upgrading."
        : "Login is required before checkout.",
      "AUTH_REQUIRED",
      { plan: requestedPlan ? String(requestedPlan) : null, currency: typeof body.currency === "string" ? body.currency : null },
    );
  }

  if (
    (billingScope === "candidate" && !isCandidateCheckoutPlan(requestedPlan)) ||
    (billingScope === "recruiter" && !isRecruiterPaidPlan(requestedPlan))
  ) {
    logCheckoutDiagnostic("Invalid checkout plan requested.", {
      scope: billingScope,
      plan: String(requestedPlan),
    });
    return checkoutError(
      400,
      billingScope === "recruiter"
        ? "Unsupported recruiter checkout plan."
        : checkoutUnavailableMessage,
      "UNSUPPORTED_PLAN",
      { plan: requestedPlan ? String(requestedPlan) : null, currency: typeof body.currency === "string" ? body.currency : null },
    );
  }
  const checkoutPlan = requestedPlan as CheckoutPlan;

  if (billingScope === "recruiter") {
    const { data: recruiterProfile, error: recruiterError } = await supabase
      .from("recruiter_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (recruiterError) {
      logCheckoutDiagnostic("Recruiter profile lookup failed before checkout.", {
        code: recruiterError.code,
        message: recruiterError.message,
      });
      return checkoutError(
        403,
        "We could not verify your recruiter profile. Please try again.",
        "PROFILE_LOOKUP_FAILED",
        { plan: checkoutPlan, currency: typeof body.currency === "string" ? body.currency : null },
      );
    }

    if (!recruiterProfile) {
      logCheckoutDiagnostic("Recruiter checkout blocked because recruiter profile is missing.");
      return checkoutError(
        403,
        "Create your recruiter profile before upgrading.",
        "PROFILE_REQUIRED",
        { plan: checkoutPlan, currency: typeof body.currency === "string" ? body.currency : null },
      );
    }
  }

  const stripeSecretKey = cleanSupabaseEnvValue(process.env.STRIPE_SECRET_KEY);
  if (body.currency !== undefined && !isSupportedCurrency(body.currency)) {
    logCheckoutDiagnostic("Unsupported checkout currency requested.", {
      scope: billingScope,
      plan: checkoutPlan,
      currency: String(body.currency),
    });
    return checkoutError(
      400,
      billingScope === "recruiter"
        ? "Unsupported recruiter checkout currency."
        : checkoutUnavailableMessage,
      "UNSUPPORTED_CURRENCY",
      { plan: checkoutPlan, currency: String(body.currency) },
    );
  }

  const requestedCurrency = isSupportedCurrency(body.currency) ? body.currency : defaultCurrency;
  let checkoutCurrency = requestedCurrency;
  let configuredPrice =
    billingScope === "recruiter"
      ? recruiterConfiguredPriceId(checkoutPlan as RecruiterPaidPlanId, requestedCurrency)
      : candidateConfiguredPriceId(checkoutPlan as CandidateCheckoutPlan, requestedCurrency);
  let notice: string | undefined;
  const mode = checkoutModes[checkoutPlan];

  logCheckoutRuntimeConfig({
    plan: checkoutPlan,
    currency: requestedCurrency,
    priceEnv: configuredPrice.envName || configuredPrice.primaryEnvName,
    priceId: configuredPrice.priceId,
    stripeSecretKey,
  });

  if (!stripeSecretKey) {
    logCheckoutDiagnostic("Missing Stripe secret key.");
    return checkoutError(
      503,
      billingScope === "recruiter"
        ? "Recruiter checkout is not configured yet."
        : "Stripe checkout is not configured yet.",
      "MISSING_STRIPE_SECRET",
      { missingVariable: "STRIPE_SECRET_KEY", plan: checkoutPlan, currency: requestedCurrency },
    );
  }

  if (!isLikelyStripeSecretKey(stripeSecretKey)) {
    logCheckoutDiagnostic("Invalid Stripe secret key shape.", {
      scope: billingScope,
      stripeMode: stripeKeyMode(stripeSecretKey),
    });
    return checkoutError(
      503,
      billingScope === "recruiter"
        ? "Recruiter checkout is not configured yet."
        : "Stripe checkout is not configured yet.",
      "INVALID_STRIPE_SECRET",
      { missingVariable: "STRIPE_SECRET_KEY", plan: checkoutPlan, currency: requestedCurrency },
    );
  }

  if (billingScope === "recruiter") {
    logRecruiterPriceResolution({
      plan: checkoutPlan,
      currency: requestedCurrency,
      configuredPrice: configuredPrice as ReturnType<typeof recruiterConfiguredPriceId>,
      stripeSecretKey,
    });
  }

  if (!configuredPrice.priceId) {
    logCheckoutDiagnostic("Missing Stripe price ID.", {
      scope: billingScope,
      plan: checkoutPlan,
      currency: requestedCurrency,
      priceEnv: configuredPrice.primaryEnvName,
    });

    if (requestedCurrency !== defaultCurrency) {
      const usdPrice =
        billingScope === "recruiter"
          ? recruiterConfiguredPriceId(checkoutPlan as RecruiterPaidPlanId, defaultCurrency)
          : candidateConfiguredPriceId(checkoutPlan as CandidateCheckoutPlan, defaultCurrency);
      if (usdPrice.priceId) {
        checkoutCurrency = defaultCurrency;
        configuredPrice = usdPrice;
        notice = "Local checkout is not active yet. Continuing in USD.";
        logCheckoutRuntimeConfig({
          plan: checkoutPlan,
          currency: defaultCurrency,
          priceEnv: usdPrice.envName || usdPrice.primaryEnvName,
          priceId: usdPrice.priceId,
          stripeSecretKey,
        });
        if (billingScope === "recruiter") {
          logRecruiterPriceResolution({
            plan: checkoutPlan,
            currency: defaultCurrency,
            configuredPrice: usdPrice,
            stripeSecretKey,
          });
        }
      } else {
        logCheckoutDiagnostic("USD fallback price ID is also missing.", {
          scope: billingScope,
          plan: checkoutPlan,
          currency: defaultCurrency,
          priceEnv: usdPrice.primaryEnvName,
        });
        return checkoutError(
          503,
          billingScope === "recruiter"
            ? "Recruiter checkout is not configured for this plan yet."
            : `Checkout is not configured for ${checkoutPlan} in ${requestedCurrency} yet.`,
          "MISSING_PRICE_ID",
          {
            missingVariable: usdPrice.primaryEnvName,
            plan: checkoutPlan,
            currency: requestedCurrency,
          },
        );
      }
    } else {
      return checkoutError(
        503,
        billingScope === "recruiter"
          ? "Recruiter checkout is not configured for this plan yet."
          : `Checkout is not configured for ${checkoutPlan} in ${requestedCurrency} yet.`,
        "MISSING_PRICE_ID",
        {
          missingVariable: configuredPrice.primaryEnvName,
          plan: checkoutPlan,
          currency: requestedCurrency,
        },
      );
    }
  }

  const priceId = configuredPrice.priceId;
  if (!priceId) {
    return checkoutError(
      503,
      billingScope === "recruiter"
        ? "Recruiter checkout is not configured for this plan yet."
        : `Checkout is not configured for ${checkoutPlan} in ${requestedCurrency} yet.`,
      "MISSING_PRICE_ID",
      {
        missingVariable: configuredPrice.primaryEnvName,
        plan: checkoutPlan,
        currency: requestedCurrency,
      },
    );
  }

  if (!isLikelyStripePriceId(priceId)) {
    logCheckoutDiagnostic("Invalid Stripe price ID shape.", {
      scope: billingScope,
      plan: checkoutPlan,
      currency: checkoutCurrency,
      priceEnv: configuredPrice.envName || configuredPrice.primaryEnvName,
      stripeMode: stripeKeyMode(stripeSecretKey),
    });
    return checkoutError(
      503,
      billingScope === "recruiter"
        ? "Recruiter checkout is not configured for this plan yet."
        : `Checkout price is not configured correctly for ${checkoutPlan} in ${checkoutCurrency}.`,
      "INVALID_PRICE_ID",
      {
        missingVariable: configuredPrice.envName || configuredPrice.primaryEnvName,
        plan: checkoutPlan,
        currency: checkoutCurrency,
      },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const appUrl = appBaseUrl(request);

  if (!appUrl) {
    return checkoutError(
      503,
      billingScope === "recruiter"
        ? "Recruiter checkout needs a valid production app URL."
        : "Checkout needs a valid app URL.",
      "APP_URL_MISSING",
      { missingVariable: "NEXT_PUBLIC_APP_URL", plan: checkoutPlan, currency: checkoutCurrency },
    );
  }

  const metadata = {
    user_id: user.id,
    user_email: user.email ?? "",
    plan: checkoutPlan,
    plan_type: billingScope,
    currency: checkoutCurrency,
    requested_currency: requestedCurrency,
  };

  try {
    if (billingScope === "candidate" && checkoutPlan === "plus") {
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
      success_url:
        billingScope === "recruiter"
          ? `${appUrl}/recruiters/pricing?checkout=success`
          : `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: billingScope === "recruiter" ? `${appUrl}/recruiters/pricing` : `${appUrl}/pricing`,
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
        scope: billingScope,
        plan: checkoutPlan,
        currency: checkoutCurrency,
      });
      return checkoutError(
        502,
        billingScope === "recruiter"
          ? "Checkout could not start. Please try again."
          : "Checkout could not start. Please try again.",
        "STRIPE_SESSION_MISSING_URL",
        { plan: checkoutPlan, currency: checkoutCurrency },
      );
    }

    return Response.json({
      url: session.url,
      currency: checkoutCurrency,
      requestedCurrency,
      notice,
    });
  } catch (error) {
    const stripeErrorDetails = safeStripeErrorDetails(error);
    const safeStripeMessage =
      typeof stripeErrorDetails.message === "string" && stripeErrorDetails.message.trim()
        ? `Stripe checkout failed: ${stripeErrorDetails.message}`
        : "Checkout could not start. Please try again.";

    logCheckoutDiagnostic("Stripe checkout creation failed.", {
      scope: billingScope,
      plan: checkoutPlan,
      currency: checkoutCurrency,
      priceEnv: configuredPrice.envName || configuredPrice.primaryEnvName,
      stripeMode: stripeKeyMode(stripeSecretKey),
      ...stripeErrorDetails,
    });
    return checkoutError(
      502,
      safeStripeMessage,
      "STRIPE_SESSION_FAILED",
      { plan: checkoutPlan, currency: checkoutCurrency },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await handleCheckoutPost(request);
  } catch (error) {
    logCheckoutDiagnostic("Checkout route failed before response.", {
      ...safeStripeErrorDetails(error),
    });
    return checkoutError(500, "Checkout could not start. Please try again.", "STRIPE_SESSION_FAILED");
  }
}
