import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/recruiters/dashboard",
  "Recruiter Dashboard | ISEYA",
  "Private recruiter dashboard.",
);

export default function RecruiterDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
