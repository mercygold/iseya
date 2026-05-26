import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/dashboard",
  "Dashboard | ISEYA",
  "Private workspace dashboard.",
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
