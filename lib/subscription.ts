export type SubscriptionPlanId = "free" | "pro_monthly" | "pro_annual";

export type SubscriptionFeature =
  | "basicResumeBuilder"
  | "exports"
  | "savedVersions"
  | "aiGenerations"
  | "coverLetter"
  | "linkedinProfile"
  | "applicationKit";

export type PricingPlan = {
  id: SubscriptionPlanId;
  name: string;
  cadence: string;
  priceLabel: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    cadence: "Starter",
    priceLabel: "$0",
    description: "Basic resume building for drafting and editing your core profile.",
    features: ["Basic resume builder", "Neutral starter workspace", "Manual editing"],
  },
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    cadence: "Monthly",
    priceLabel: "Coming soon",
    description: "Full career workspace access with exports, AI credits, and saved versions.",
    highlighted: true,
    features: [
      "PDF and DOCX exports",
      "Saved resume versions",
      "AI tailoring credits",
      "Cover letters",
      "LinkedIn profile kit",
      "Application kit",
    ],
  },
  {
    id: "pro_annual",
    name: "Pro Annual",
    cadence: "Annual",
    priceLabel: "Coming soon",
    description: "Annual Pro access prepared for future Stripe subscription activation.",
    features: [
      "Everything in Pro Monthly",
      "Annual billing foundation",
      "Future priority usage limits",
    ],
  },
];

const proFeatures = new Set<SubscriptionFeature>([
  "basicResumeBuilder",
  "exports",
  "savedVersions",
  "aiGenerations",
  "coverLetter",
  "linkedinProfile",
  "applicationKit",
]);

const freeFeatures = new Set<SubscriptionFeature>(["basicResumeBuilder"]);

export function normalizeSubscriptionPlan(plan: string | null | undefined): SubscriptionPlanId {
  if (plan === "pro_monthly" || plan === "pro_annual") {
    return plan;
  }

  return "free";
}

export function isProPlan(plan: SubscriptionPlanId) {
  return plan === "pro_monthly" || plan === "pro_annual";
}

export function canUseSubscriptionFeature(plan: SubscriptionPlanId, feature: SubscriptionFeature) {
  return isProPlan(plan) ? proFeatures.has(feature) : freeFeatures.has(feature);
}

export function subscriptionLabel(plan: SubscriptionPlanId) {
  return pricingPlans.find((pricingPlan) => pricingPlan.id === plan)?.name ?? "Free";
}
