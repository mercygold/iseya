import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/reset-password",
  "Reset Password | ISEYA",
  "ISEYA account recovery.",
);

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
