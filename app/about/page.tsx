import Link from "next/link";
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
      <InfoSection title="Career infrastructure for today’s talent">
        <p>
          ISEYA is a career infrastructure platform by Jormp LLC. It supports
          candidates preparing private career assets, recruiters publishing and
          reviewing structured opportunities, and institutions seeking aggregate
          career readiness insight.
        </p>
        <p>
          Candidate workflows are designed around professional visibility,
          truthful positioning, job discovery, and role-specific preparation
          without creating public candidate profiles.
        </p>
      </InfoSection>

      <InfoSection title="Readiness and opportunity systems">
        <p>
          ISEYA connects career development with opportunity discovery: candidates
          can tailor career materials, recruiters can manage verified hiring
          workflows, and institution partnerships can support student communities
          through privacy-safe infrastructure.
        </p>
        <p>
          Explore <Link href="/jobs" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">job opportunities</Link>,{" "}
          <Link href="/recruiters" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">recruiter access</Link>, or{" "}
          <Link href="/institutions" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">institution partnerships</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Trust boundaries built into the platform">
        <p>
          ISEYA is designed around protected candidate workspaces, recruiter
          verification workflows, and aggregate institution insight. Private
          resumes and application materials are not presented as public student
          or candidate profiles.
        </p>
        <p>
          Career assistance can support preparation and clearer positioning, but
          candidates remain responsible for truthful final materials and
          applications. ISEYA is built for accountable career progress, not
          automated application spam.
        </p>
      </InfoSection>

      <InfoSection title="Jormp LLC">
        <p>
          ISEYA is operated by Jormp LLC and is based in California, United
          States.
        </p>
        <p>
          See the <Link href="/demo" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">guided product demo</Link> or{" "}
          <Link href="/contact" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">contact ISEYA</Link> for platform inquiries.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
