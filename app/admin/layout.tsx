import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/admin",
  "Administration | ISEYA",
  "Private administrative controls.",
);

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
