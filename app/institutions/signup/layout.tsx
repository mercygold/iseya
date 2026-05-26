import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/institutions/signup",
  "Institution Registration | ISEYA",
  "Institution partnership registration.",
);

export default function InstitutionSignupLayout({ children }: { children: ReactNode }) {
  return children;
}
