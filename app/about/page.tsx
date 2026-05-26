import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { InfoPageShell, InfoSection } from "../info-page-shell";

export const metadata: Metadata = publicPageMetadata(
  "/about",
  "About ISEYA | Career Infrastructure by Jormp LLC",
  "Learn how ISEYA supports private career development, professional positioning, opportunity discovery, and career readiness.",
);

export default function AboutPage() {
  return (
    <InfoPageShell title="About ISEYA" eyebrow="About">
      <InfoSection title="Career positioning built for modern applicants">
        <p>
          ISEYA is a career positioning product by Jormp LLC. It helps users
          create tailored resumes, cover letters, LinkedIn profiles, and career
          application materials with a focus on clarity, accuracy, and
          professional presentation.
        </p>
        <p>
          The product is designed for applicants who want to translate their
          real experience into stronger, role-specific career documents without
          adding false or unsupported claims.
        </p>
      </InfoSection>

      <InfoSection title="Company">
        <p>
          ISEYA is operated by Jormp LLC and is based in California, United
          States.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
