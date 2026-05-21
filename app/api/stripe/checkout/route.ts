import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";

type CheckoutPlan = "plus" | "pro_monthly" | "pro_annual";

const checkoutPlans: Record<
  CheckoutPlan,
  { mode: "payment" | "subscription"; priceEnv: string; label: string }
> = {
  plus: {
    mode: "payment",
    priceEnv: "STRIPE_PLUS_PRICE_ID",
    label: "Plus",
  },
  pro_monthly: {
    mode: "subscription",
    priceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID",
    label: "Pro Monthly",
  },
  pro_annual: {
    mode: "subscription",
    priceEnv: "STRIPE_PRO_ANNUAL_PRICE_ID",
    label: "Pro Annual",
  },
};

function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "plus" || value === "pro_monthly" || value === "pro_annual";
}

function appBaseUrl() {
  const configuredUrl = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_APP_URL);

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json({ error: "Authentication is unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Login is required before checkout." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { plan?: unknown };

  if (!isCheckoutPlan(body.plan)) {
    return Response.json({ error: "Invalid plan." }, { status: 400 });
  }

  const stripeSecretKey = cleanSupabaseEnvValue(process.env.STRIPE_SECRET_KEY);
  const plan = checkoutPlans[body.plan];
  const priceId = cleanSupabaseEnvValue(process.env[plan.priceEnv]);

  if (!stripeSecretKey) {
    return Response.json({ error: "Stripe secret key is missing." }, { status: 503 });
  }

  if (!priceId) {
    return Response.json(
      { error: `Stripe price ID is missing for ${plan.label}.` },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const appUrl = appBaseUrl();
  const metadata = {
    user_id: user.id,
    user_email: user.email ?? "",
    plan: body.plan,
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
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
      ...(plan.mode === "subscription"
        ? {
            subscription_data: {
              metadata,
            },
          }
        : {
            payment_intent_data: {
              metadata,
            },
          }),
    });

    if (!session.url) {
      return Response.json({ error: "Stripe checkout creation failed." }, { status: 502 });
    }

    return Response.json({ url: session.url });
  } catch {
    return Response.json({ error: "Stripe checkout creation failed." }, { status: 502 });
  }
}
