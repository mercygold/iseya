import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { faqStructuredData, publicPageMetadata } from "@/lib/seo";
import JobsBoard from "./JobsBoard";

export const metadata: Metadata = publicPageMetadata(
  "/jobs",
  "Job Opportunities | ISEYA",
  "Discover curated and recruiter-posted opportunities, then tailor your career assets for roles that match your goals.",
);

export default function JobsPage() {
  return (
    <>
      <StructuredData
        data={faqStructuredData([
          {
            question: "What is a curated opportunity?",
            answer: "It is an external role sourced for discovery and reviewed before publication on ISEYA.",
          },
          {
            question: "When is Easy Apply available?",
            answer: "Native ISEYA opportunities may accept interest directly; external roles link to the hiring source.",
          },
          {
            question: "Can I prepare before applying?",
            answer: "Yes. Tailor Resume connects a listing to your private career workspace.",
          },
        ])}
      />
      <JobsBoard />
    </>
  );
}
