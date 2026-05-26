import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/applications",
  "My Applications | ISEYA",
  "Private candidate application tracking.",
);

export default function ApplicationsLayout({ children }: { children: ReactNode }) {
  return children;
}
