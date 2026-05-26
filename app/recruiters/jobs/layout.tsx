import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "/recruiters/jobs",
  "Recruiter Jobs | ISEYA",
  "Private recruiter job management.",
);

export default function RecruiterJobsLayout({ children }: { children: ReactNode }) {
  return children;
}
