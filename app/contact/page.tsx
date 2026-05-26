import type { Metadata } from "next";
import Link from "next/link";
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
          For product support, recruiter access, institution partnerships, or billing questions, contact
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

      <InfoSection title="Partnership and platform inquiries">
        <p>
          Institutions considering career readiness infrastructure can review the{" "}
          <Link href="/institutions" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            institution partnership pathway
          </Link>
          . Recruiters can learn about structured hiring access through the{" "}
          <Link href="/recruiters" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            recruiter platform
          </Link>
          .
        </p>
        <p>
          For a product overview before contacting the team, explore the{" "}
          <Link href="/demo" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            guided ISEYA demo
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
