import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata(
  "/recruiters/pricing",
  "Recruiter Plans | ISEYA",
  "Compare ISEYA recruiter plans for active job capacity, listing visibility, and structured applicant management.",
);

export default function RecruiterPricingLayout({ children }: { children: ReactNode }) {
  return children;
}
