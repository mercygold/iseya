import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { InfoPageShell, InfoSection } from "../info-page-shell";

export const metadata: Metadata = publicPageMetadata(
  "/privacy",
  "Privacy Policy | ISEYA",
  "Review how ISEYA processes career assets, account information, uploaded files, and generated career documents.",
);

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy" eyebrow="Last updated: 2026">
      <InfoSection title="Information you provide">
        <p>
          ISEYA may process information you enter into the product, including
          resume content, profile details, job descriptions, target roles,
          uploaded source materials, generated resumes, cover letters, LinkedIn
          profile drafts, application materials, saved versions, and account
          data if accounts are enabled.
        </p>
      </InfoSection>

      <InfoSection title="Uploaded files and generated documents">
        <p>
          Uploaded files may be used as source material to help extract relevant
          career history and improve tailored outputs. Generated resumes, saved
          versions, and related career documents may be stored in your workspace
          so you can edit, export, and reuse them.
        </p>
      </InfoSection>

      <InfoSection title="AI processing">
        <p>
          ISEYA may use AI systems to analyze job descriptions, compare them to
          your resume or profile information, and generate career document
          suggestions. You should not upload sensitive information that you do
          not want processed, reviewed, or used to generate career materials.
        </p>
      </InfoSection>

      <InfoSection title="Your responsibility">
        <p>
          You are responsible for reviewing generated content before using it.
          Remove anything you do not want included and verify that each claim is
          accurate before submitting career materials to an employer or recruiter.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
