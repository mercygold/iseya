export type SubscriptionPlanId = "free" | "starter" | "plus" | "pro_monthly" | "pro_annual";

export type SubscriptionFeature =
  | "basicResumeBuilder"
  | "exports"
  | "advancedExports"
  | "premiumTemplates"
  | "priorityProcessing"
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
  included: string[];
  excluded?: string[];
  badge?: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    cadence: "Starter",
    priceLabel: "Free",
    description: "Create and edit a clean resume workspace before upgrading.",
    included: [
      "1 free resume download",
      "Basic resume editing",
      "Neutral starter workspace",
      "Standard resume templates",
      "Manual editing",
      "Save workspace draft",
    ],
    excluded: [
      "LinkedIn optimization copy/export",
      "Cover letter export",
      "Multiple saved resume versions",
      "Priority exports",
      "Unlimited downloads",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    cadence: "One-time",
    priceLabel: "$1.99",
    description: "A lightweight paid pack for a focused application push.",
    included: [
      "5 premium resume downloads",
      "15 optimization credits",
      "LinkedIn profile optimization access",
      "Cover letter exports",
      "Saved resume versions",
      "Can repurchase anytime",
    ],
    excluded: ["Unlimited monthly access", "Annual savings"],
  },
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    cadence: "Monthly",
    priceLabel: "$7.99/month",
    description: "Full monthly access for active job search workflows.",
    badge: "Most Popular",
    included: [
      "Unlimited resume downloads",
      "Advanced optimization",
      "LinkedIn positioning tools",
      "Cover letter generation/export",
      "Premium templates",
      "Saved resume library",
      "Full workspace access",
      "Cancel anytime",
    ],
  },
  {
    id: "pro_annual",
    name: "Pro Annual",
    cadence: "Annual",
    priceLabel: "$69/year",
    description: "Best value for users actively applying across the year.",
    badge: "Best Value",
    included: [
      "Everything in Pro Monthly",
      "Annual discounted pricing",
      "Full workspace access all year",
      "Best value for active job seekers",
      "Priority exports",
      "Saved resume library",
    ],
  },
];

const plusFeatures = new Set<SubscriptionFeature>([
  "basicResumeBuilder",
  "exports",
  "premiumTemplates",
  "advancedExports",
  "savedVersions",
  "aiGenerations",
  "coverLetter",
  "linkedinProfile",
  "applicationKit",
]);

const proFeatures = new Set<SubscriptionFeature>([
  "basicResumeBuilder",
  "exports",
  "advancedExports",
  "premiumTemplates",
  "priorityProcessing",
  "savedVersions",
  "aiGenerations",
  "coverLetter",
  "linkedinProfile",
  "applicationKit",
]);

const freeFeatures = new Set<SubscriptionFeature>(["basicResumeBuilder"]);

export function normalizeSubscriptionPlan(plan: string | null | undefined): SubscriptionPlanId {
  if (plan === "starter") {
    return "free";
  }

  if (plan === "plus" || plan === "pro_monthly" || plan === "pro_annual") {
    return plan;
  }

  return "free";
}

export function isProPlan(plan: SubscriptionPlanId) {
  return plan === "pro_monthly" || plan === "pro_annual";
}

export function isStarterPlan(plan: SubscriptionPlanId) {
  return plan === "free" || plan === "starter";
}

export function canUseSubscriptionFeature(plan: SubscriptionPlanId, feature: SubscriptionFeature) {
  if (isProPlan(plan)) {
    return proFeatures.has(feature);
  }

  if (plan === "plus") {
    return plusFeatures.has(feature);
  }

  return freeFeatures.has(feature);
}

export function subscriptionLabel(plan: SubscriptionPlanId) {
  return pricingPlans.find((pricingPlan) => pricingPlan.id === plan)?.name ?? "Starter";
}

export function planDownloadLimit(plan: SubscriptionPlanId) {
  if (isProPlan(plan)) {
    return Infinity;
  }

  if (plan === "plus") {
    return 5;
  }

  return 1;
}

export function planOptimizationLimit(plan: SubscriptionPlanId) {
  if (isProPlan(plan)) {
    return Infinity;
  }

  if (plan === "plus") {
    return 15;
  }

  return 0;
}
