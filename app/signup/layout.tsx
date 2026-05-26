import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/signup",
  "Create Account | ISEYA",
  "ISEYA account creation.",
);

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
