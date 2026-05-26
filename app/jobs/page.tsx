import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import JobsBoard from "./JobsBoard";

export const metadata: Metadata = publicPageMetadata(
  "/jobs",
  "Job Opportunities | ISEYA",
  "Discover curated and recruiter-posted opportunities, then tailor your career assets for roles that match your goals.",
);

export default function JobsPage() {
  return <JobsBoard />;
}
