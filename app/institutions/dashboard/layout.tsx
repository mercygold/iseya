import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/institutions/dashboard",
  "Institution Dashboard | ISEYA",
  "Private institution dashboard.",
);

export default function InstitutionDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
