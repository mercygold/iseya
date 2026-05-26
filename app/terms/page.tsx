import type { Metadata } from "next";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";
import { InfoPageShell, InfoSection } from "../info-page-shell";

export const metadata: Metadata = publicPageMetadata(
  "/terms",
  "Terms of Use | ISEYA",
  "Read the terms governing ISEYA career document tools, platform use, accuracy responsibilities, and career workflow support.",
);

export default function TermsPage() {
  return (
    <InfoPageShell title="Terms of Use" eyebrow="Effective: May 26, 2026">
      <InfoSection title="Agreement and platform operator">
        <p>
          These Terms of Use (&quot;Terms&quot;) govern access to ISEYA, a
          career infrastructure platform operated by Jormp LLC
          (&quot;ISEYA,&quot; &quot;we,&quot; or &quot;us&quot;). By accessing
          or using ISEYA, you agree to these Terms and the posted{" "}
          <Link href="/privacy" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">Privacy Policy</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Accounts and authorized access">
        <p>
          You must provide accurate account information, maintain the
          confidentiality of your credentials, and use only accounts and
          organization access you are authorized to control. You are
          responsible for activity occurring through your account unless
          prohibited by applicable law.
        </p>
      </InfoSection>

      <InfoSection title="Candidate responsibilities">
        <p>
          Candidates may use ISEYA to prepare resumes, cover letters,
          professional positioning materials, and applications. You must review
          all submitted or generated material and ensure that employment,
          education, achievements, credentials, dates, and identity information
          are truthful and authorized for use.
        </p>
      </InfoSection>

      <InfoSection title="Recruiter obligations">
        <p>
          Recruiters and employers must submit accurate company and opportunity
          information, possess authority to recruit for posted roles, respect
          applicant privacy, and use application information only for legitimate
          hiring workflows. Verification, moderation, and publication status may
          be reviewed or changed by ISEYA.
        </p>
      </InfoSection>

      <InfoSection title="Institution obligations">
        <p>
          Institution administrators must accurately represent their
          organization, use approved domain and access processes only for
          eligible students or participants, and respect the privacy boundary
          of aggregate institution insight. Access packages, seat limits, and
          access periods may be subject to separate agreement or approval.
        </p>
      </InfoSection>

      <InfoSection title="Prohibited conduct">
        <p>
          You may not impersonate others; submit fraudulent, misleading, or
          unlawful information; post fake roles; spam or harass users; bypass
          authorization controls; interfere with platform security; upload
          malicious content; or use ISEYA to discriminate unlawfully or violate
          another person&apos;s rights.
        </p>
      </InfoSection>

      <InfoSection title="Scraping and automated access">
        <p>
          You may not scrape, crawl, harvest, copy, or use automated means to
          access non-public platform data, candidate materials, applicant data,
          or account features without our written authorization. Public search
          engine indexing permitted by our robots and sitemap configuration is
          not authorization for commercial extraction or misuse.
        </p>
      </InfoSection>

      <InfoSection title="Subscriptions, payments, and cancellation">
        <p>
          Certain features or access levels may require a one-time payment or
          recurring subscription. Prices, billing intervals, regional pricing,
          and included access are presented in the applicable checkout or
          approved agreement. Payment processing may be handled by Stripe.
          Recurring access remains subject to applicable cancellation controls,
          billing terms, and any non-refundable charges already incurred, except
          where law requires otherwise.
        </p>
      </InfoSection>

      <InfoSection title="User content and platform intellectual property">
        <p>
          You retain rights you hold in your submitted content and grant ISEYA
          a limited license to process it as needed to provide requested
          services, support authorized workflows, and operate the platform.
          ISEYA branding, software, interface elements, platform content, and
          related intellectual property owned by Jormp LLC may not be copied,
          reverse engineered, sold, or exploited except as permitted by law or
          written authorization.
        </p>
      </InfoSection>

      <InfoSection title="Moderation, suspension, and termination">
        <p>
          We may review, restrict, reject, unpublish, suspend, or terminate
          content or accounts where reasonably necessary to enforce these Terms,
          maintain trust and security, protect users, comply with law, prevent
          abuse, or operate the platform. You may stop using ISEYA at any time,
          subject to outstanding payment or contractual obligations.
        </p>
      </InfoSection>

      <InfoSection title="Assistance tools and no outcome guarantee">
        <p>
          ISEYA provides software tools and may provide AI-assisted
          recommendations for career material preparation and workflow support.
          ISEYA does not guarantee accuracy of generated suggestions, candidate
          suitability, recruiter decisions, interviews, employment offers,
          institutional outcomes, or any particular career result.
        </p>
      </InfoSection>

      <InfoSection title="Disclaimer and limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, ISEYA is provided
          on an &quot;as is&quot; and &quot;as available&quot; basis without
          warranties of uninterrupted operation or particular outcomes. To the
          maximum extent permitted by law, Jormp LLC and its affiliates will not
          be liable for indirect, incidental, special, consequential, exemplary,
          or punitive damages, or lost opportunities, profits, or data arising
          from use of the platform.
        </p>
      </InfoSection>

      <InfoSection title="Governing law and dispute resolution">
        <p>
          These Terms are governed by the laws of the State of California,
          without regard to conflict-of-law principles. Before initiating a
          formal dispute, you agree to contact us and attempt to resolve the
          matter informally. Except for matters eligible for small claims court
          or requests for injunctive relief, and to the extent permitted by law,
          disputes arising from these Terms will be resolved by binding
          individual arbitration in California rather than a jury trial or
          class action.
        </p>
      </InfoSection>

      <InfoSection title="Updates and contact">
        <p>
          We may update these Terms to reflect changes to services, operations,
          or legal requirements. Continued use after updated Terms are posted
          constitutes acceptance to the extent permitted by applicable law. For
          questions about these Terms,{" "}
          <Link href="/contact" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">contact ISEYA</Link>.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
