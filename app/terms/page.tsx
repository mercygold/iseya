import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { InfoPageShell, InfoSection } from "../info-page-shell";

export const metadata: Metadata = publicPageMetadata(
  "/terms",
  "Terms of Use | ISEYA",
  "Read the terms governing ISEYA career document tools, platform use, accuracy responsibilities, and career workflow support.",
);

export default function TermsPage() {
  return (
    <InfoPageShell title="Terms of Use" eyebrow="Last updated: 2026">
      <InfoSection title="Career document assistance">
        <p>
          ISEYA provides tools for career document assistance, including resume,
          cover letter, LinkedIn profile, and application material support. The
          product does not guarantee interviews, job offers, employment, or any
          specific hiring outcome.
        </p>
      </InfoSection>

      <InfoSection title="Accuracy and review">
        <p>
          You are responsible for verifying the accuracy of all generated or
          edited content before applying to a role. You should not add false
          claims, unsupported achievements, inaccurate dates, unearned
          credentials, or experience you cannot confidently explain.
        </p>
      </InfoSection>

      <InfoSection title="Appropriate use">
        <p>
          Use ISEYA to clarify and strengthen truthful career positioning. Do
          not use the product to misrepresent your background, impersonate
          another person, or submit misleading information to an employer,
          recruiter, institution, or platform.
        </p>
      </InfoSection>

      <InfoSection title="No professional guarantee">
        <p>
          ISEYA is a software product and does not replace professional career,
          legal, financial, or employment advice. Decisions about applications,
          interviews, and hiring remain with employers and other third parties.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
