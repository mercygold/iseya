import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/recruiters/onboarding",
  "Recruiter Onboarding | ISEYA",
  "Private recruiter onboarding.",
);

export default function RecruiterOnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
