import PricingExperience from "./PricingExperience";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const params = await searchParams;
  const checkout = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;

  return <PricingExperience requestedPlan={checkout} />;
}
