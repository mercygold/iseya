import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/recruiter",
  "Recruiter Workspace | ISEYA",
  "Private recruiter workspace.",
);

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return children;
}
