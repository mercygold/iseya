import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/account",
  "Account Settings | ISEYA",
  "Private account settings.",
);

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
