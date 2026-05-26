import StructuredData from "@/components/StructuredData";
import { faqStructuredData } from "@/lib/seo";
import PricingExperience from "./PricingExperience";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const params = await searchParams;
  const checkout = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;

  return (
    <>
      <StructuredData
        data={faqStructuredData([
          {
            question: "Can I start without paying?",
            answer: "Yes. Starter gives candidates a free entry point for building career materials.",
          },
          {
            question: "Why can checkout prices vary by region?",
            answer: "ISEYA uses controlled regional pricing during eligible upgrade flows, not live currency conversion.",
          },
          {
            question: "Are institution partnerships purchased here?",
            answer: "No. Institutions request partnership access and are reviewed separately.",
          },
        ])}
      />
      <PricingExperience requestedPlan={checkout} />
    </>
  );
}
