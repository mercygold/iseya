import { cleanSupabaseEnvValue } from "@/lib/supabaseConfig";
import { supportedCurrencies } from "@/lib/pricing/regions";
import {
  recruiterRegionalPricing,
  type RecruiterPaidPlanId,
} from "@/lib/pricing/recruiter";

export const runtime = "nodejs";

const supportedRecruiterPlans: RecruiterPaidPlanId[] = [
  "recruiter_quarterly",
  "recruiter_annual",
];

function stripeMode() {
  const stripeSecretKey = cleanSupabaseEnvValue(process.env.STRIPE_SECRET_KEY);
  if (stripeSecretKey.startsWith("sk_live_")) return "live";
  if (stripeSecretKey.startsWith("sk_test_")) return "test";
  return "unknown";
}

function safeEnvSummary(envName: string) {
  const value = cleanSupabaseEnvValue(process.env[envName]);

  return {
    envName,
    exists: Boolean(value),
    preview: value ? value.slice(0, 8) : null,
    startsWithPrice: value ? value.startsWith("price_") : false,
  };
}

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const expectedEnvVars = supportedCurrencies.flatMap((currency) =>
    supportedRecruiterPlans.map((plan) => {
      const envName = recruiterRegionalPricing[currency].plans[plan].stripePriceEnv;
      return {
        plan,
        currency,
        ...safeEnvSummary(envName),
      };
    }),
  );

  return Response.json({
    expectedEnvVars,
    stripeMode: stripeMode(),
    supportedRecruiterPlans,
    supportedCurrencies,
  });
}
