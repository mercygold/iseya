import type { SupportedCurrency } from "./regions";

export type RecruiterPlanId = "starter" | "recruiter_quarterly" | "recruiter_annual";
export type RecruiterPaidPlanId = Exclude<RecruiterPlanId, "starter">;

export type RecruiterPlanEntitlements = {
  activeJobLimit: number;
  visibilityDays: number;
  verifiedEligible: boolean;
};

export type RecruiterRegionalPrice = {
  amount: number;
  interval: "quarter" | "year";
  stripePriceEnv: string;
  legacyStripePriceEnvs: readonly string[];
};

export type RecruiterPricingRegion = {
  currency: SupportedCurrency;
  locale: string;
  symbol: string;
  plans: Record<RecruiterPaidPlanId, RecruiterRegionalPrice>;
};

export const recruiterPlanEntitlements: Record<RecruiterPlanId, RecruiterPlanEntitlements> = {
  starter: {
    activeJobLimit: 2,
    visibilityDays: 30,
    verifiedEligible: false,
  },
  recruiter_quarterly: {
    activeJobLimit: 15,
    visibilityDays: 90,
    verifiedEligible: true,
  },
  recruiter_annual: {
    activeJobLimit: 50,
    visibilityDays: 365,
    verifiedEligible: true,
  },
};

export const recruiterRegionalPricing: Record<SupportedCurrency, RecruiterPricingRegion> = {
  USD: {
    currency: "USD",
    locale: "en-US",
    symbol: "$",
    plans: {
      recruiter_quarterly: {
        amount: 49,
        interval: "quarter",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_QUARTERLY_USD",
        legacyStripePriceEnvs: [],
      },
      recruiter_annual: {
        amount: 149,
        interval: "year",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_ANNUAL_USD",
        legacyStripePriceEnvs: [],
      },
    },
  },
  NGN: {
    currency: "NGN",
    locale: "en-NG",
    symbol: "NGN ",
    plans: {
      recruiter_quarterly: {
        amount: 30000,
        interval: "quarter",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_QUARTERLY_NGN",
        legacyStripePriceEnvs: [],
      },
      recruiter_annual: {
        amount: 95000,
        interval: "year",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_ANNUAL_NGN",
        legacyStripePriceEnvs: [],
      },
    },
  },
  GBP: {
    currency: "GBP",
    locale: "en-GB",
    symbol: "GBP ",
    plans: {
      recruiter_quarterly: {
        amount: 39,
        interval: "quarter",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_QUARTERLY_GBP",
        legacyStripePriceEnvs: [],
      },
      recruiter_annual: {
        amount: 119,
        interval: "year",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_ANNUAL_GBP",
        legacyStripePriceEnvs: [],
      },
    },
  },
  CAD: {
    currency: "CAD",
    locale: "en-CA",
    symbol: "CA$",
    plans: {
      recruiter_quarterly: {
        amount: 69,
        interval: "quarter",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_QUARTERLY_CAD",
        legacyStripePriceEnvs: [],
      },
      recruiter_annual: {
        amount: 199,
        interval: "year",
        stripePriceEnv: "STRIPE_PRICE_RECRUITER_ANNUAL_CAD",
        legacyStripePriceEnvs: [],
      },
    },
  },
};

export function isRecruiterPaidPlan(value: unknown): value is RecruiterPaidPlanId {
  return value === "recruiter_quarterly" || value === "recruiter_annual";
}

export function normalizeRecruiterPlan(
  value: string | null | undefined,
  status?: string | null,
): RecruiterPlanId {
  if (
    (value === "recruiter_quarterly" || value === "recruiter_annual") &&
    status === "active"
  ) {
    return value;
  }

  return "starter";
}

export function getRecruiterEntitlements(
  plan: string | null | undefined,
  status?: string | null,
) {
  return recruiterPlanEntitlements[normalizeRecruiterPlan(plan, status)];
}

export function getRecruiterRegionalPrice(plan: RecruiterPaidPlanId, currency: SupportedCurrency) {
  return recruiterRegionalPricing[currency].plans[plan];
}

export function recruiterPlanLabel(plan: RecruiterPlanId) {
  if (plan === "recruiter_quarterly") return "Recruiter Quarterly";
  if (plan === "recruiter_annual") return "Recruiter Annual";
  return "Recruiter Starter";
}

export function formatRecruiterPrice(plan: RecruiterPaidPlanId, currency: SupportedCurrency) {
  const region = recruiterRegionalPricing[currency];
  const price = region.plans[plan];
  const amount = new Intl.NumberFormat(region.locale, {
    minimumFractionDigits: price.amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price.amount);

  return `${region.symbol}${amount} / ${price.interval}`;
}

export function recruiterExpiryFromPublication(publishedAt: Date, visibilityDays: number) {
  const expiry = new Date(publishedAt);
  expiry.setUTCDate(expiry.getUTCDate() + visibilityDays);
  return expiry.toISOString();
}
