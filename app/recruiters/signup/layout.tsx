import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/recruiters/signup",
  "Recruiter Registration | ISEYA",
  "Recruiter account registration.",
);

export default function RecruiterSignupLayout({ children }: { children: ReactNode }) {
  return children;
}
