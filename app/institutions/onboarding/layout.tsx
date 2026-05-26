import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/institutions/onboarding",
  "Institution Onboarding | ISEYA",
  "Private institution onboarding.",
);

export default function InstitutionOnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
