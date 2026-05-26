import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata(
  "/pricing",
  "Pricing | ISEYA Career Infrastructure",
  "View ISEYA candidate plans for career assets, resume tailoring, and opportunity readiness tools.",
);

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
