export type PaidSubscriptionPlanId = "plus" | "pro_monthly" | "pro_annual";
export type SupportedCurrency = "USD" | "NGN" | "GBP" | "CAD";

export type RegionalPlanPrice = {
  amount: number;
  interval: "one-time" | "month" | "year";
  stripePriceEnv: string;
};

export type RegionalPricing = {
  currency: SupportedCurrency;
  regionLabel: string;
  locale: string;
  symbol: string;
  plans: Record<PaidSubscriptionPlanId, RegionalPlanPrice>;
};

export const defaultCurrency: SupportedCurrency = "USD";

export const regionalPricing: Record<SupportedCurrency, RegionalPricing> = {
  USD: {
    currency: "USD",
    regionLabel: "United States",
    locale: "en-US",
    symbol: "$",
    plans: {
      plus: { amount: 1.99, interval: "one-time", stripePriceEnv: "STRIPE_PLUS_PRICE_ID" },
      pro_monthly: {
        amount: 7.99,
        interval: "month",
        stripePriceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID",
      },
      pro_annual: {
        amount: 69,
        interval: "year",
        stripePriceEnv: "STRIPE_PRO_ANNUAL_PRICE_ID",
      },
    },
  },
  NGN: {
    currency: "NGN",
    regionLabel: "Nigeria",
    locale: "en-NG",
    symbol: "₦",
    plans: {
      plus: { amount: 1000, interval: "one-time", stripePriceEnv: "STRIPE_PLUS_PRICE_ID_NGN" },
      pro_monthly: {
        amount: 3500,
        interval: "month",
        stripePriceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID_NGN",
      },
      pro_annual: {
        amount: 35000,
        interval: "year",
        stripePriceEnv: "STRIPE_PRO_ANNUAL_PRICE_ID_NGN",
      },
    },
  },
  GBP: {
    currency: "GBP",
    regionLabel: "United Kingdom",
    locale: "en-GB",
    symbol: "£",
    plans: {
      plus: { amount: 1.99, interval: "one-time", stripePriceEnv: "STRIPE_PLUS_PRICE_ID_GBP" },
      pro_monthly: {
        amount: 6.99,
        interval: "month",
        stripePriceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID_GBP",
      },
      pro_annual: {
        amount: 59,
        interval: "year",
        stripePriceEnv: "STRIPE_PRO_ANNUAL_PRICE_ID_GBP",
      },
    },
  },
  CAD: {
    currency: "CAD",
    regionLabel: "Canada",
    locale: "en-CA",
    symbol: "CA$",
    plans: {
      plus: { amount: 2.99, interval: "one-time", stripePriceEnv: "STRIPE_PLUS_PRICE_ID_CAD" },
      pro_monthly: {
        amount: 9.99,
        interval: "month",
        stripePriceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID_CAD",
      },
      pro_annual: {
        amount: 79,
        interval: "year",
        stripePriceEnv: "STRIPE_PRO_ANNUAL_PRICE_ID_CAD",
      },
    },
  },
};

export const supportedCurrencies = Object.keys(regionalPricing) as SupportedCurrency[];

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === "string" && supportedCurrencies.includes(value as SupportedCurrency);
}

export function getRegionalPricing(currency?: string | null) {
  return isSupportedCurrency(currency) ? regionalPricing[currency] : regionalPricing[defaultCurrency];
}

export function detectUserCurrency(locale?: string | null): SupportedCurrency {
  const localeRegion = (locale ?? "").replace("_", "-").split("-")[1]?.toUpperCase() ?? "";

  if (localeRegion === "NG") return "NGN";
  if (localeRegion === "GB" || localeRegion === "UK") return "GBP";
  if (localeRegion === "CA") return "CAD";

  return defaultCurrency;
}

export function formatCurrencyDisplay(
  price: RegionalPlanPrice,
  currency: SupportedCurrency = defaultCurrency,
) {
  const pricing = getRegionalPricing(currency);
  const formattedAmount = new Intl.NumberFormat(pricing.locale, {
    minimumFractionDigits: Number.isInteger(price.amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price.amount);
  const suffix =
    price.interval === "month" ? "/month" : price.interval === "year" ? "/year" : "";

  return `${pricing.symbol}${formattedAmount}${suffix}`;
}

