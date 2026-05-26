import RecruiterPricingExperience from "./RecruiterPricingExperience";

export default async function RecruiterPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const params = await searchParams;
  const checkout = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;

  return <RecruiterPricingExperience checkoutResult={checkout} />;
}
