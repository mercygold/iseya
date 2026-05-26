import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { InfoPageShell, InfoSection } from "../info-page-shell";

export const metadata: Metadata = publicPageMetadata(
  "/contact",
  "Contact ISEYA | Jormp LLC",
  "Contact ISEYA by Jormp LLC for platform support, institution partnerships, recruiter access, and product inquiries.",
);

export default function ContactPage() {
  return (
    <InfoPageShell title="Contact" eyebrow="Get in touch">
      <InfoSection title="Email">
        <p>
          For product, support, partnership, or billing questions, contact
          Jormp LLC at{" "}
          <a
            href="mailto:hello@jormp.com"
            className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4 transition hover:text-[var(--iseya-gold)]"
          >
            hello@jormp.com
          </a>
          .
        </p>
      </InfoSection>

      <InfoSection title="Location">
        <p>California, USA</p>
      </InfoSection>
    </InfoPageShell>
  );
}
