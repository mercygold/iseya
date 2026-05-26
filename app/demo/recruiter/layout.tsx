import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata(
  "/demo/recruiter",
  "Recruiter Workflow Demo | ISEYA",
  "Explore a sample recruiter workflow with job postings, applicant review, and hiring activity in ISEYA.",
);

export default function RecruiterDemoLayout({ children }: { children: ReactNode }) {
  return children;
}
