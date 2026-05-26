import type { Metadata } from "next";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";
import { InfoPageShell, InfoSection } from "../info-page-shell";

export const metadata: Metadata = publicPageMetadata(
  "/privacy",
  "Privacy Policy | ISEYA",
  "Review how ISEYA processes career assets, account information, uploaded files, and generated career documents.",
);

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy" eyebrow="Effective: May 26, 2026">
      <InfoSection title="Scope and operator">
        <p>
          This Privacy Policy describes how ISEYA, operated by Jormp LLC
          (&quot;ISEYA,&quot; &quot;we,&quot; or &quot;us&quot;), processes
          information in connection with its career infrastructure platform,
          public website, candidate workspaces, recruiter workflows, and
          institution access experiences.
        </p>
      </InfoSection>

      <InfoSection title="Accounts and profile information">
        <p>
          When you create or use an account, we may process identity and contact
          information such as your name, email address, authentication account
          identifier, profile fields, account role, and preferences. Recruiter
          accounts may provide company and verification-related profile details.
          Institution administrators may provide organization, domain, access,
          and partnership information.
        </p>
      </InfoSection>

      <InfoSection title="Candidate materials and applications">
        <p>
          Candidates may provide resume content, target roles, job
          descriptions, source materials, cover letters, professional profile
          drafts, application details, uploaded documents, saved versions, and
          opportunity preferences. These materials are processed to provide the
          requested private workspace, tailoring, export, or application
          functions.
        </p>
      </InfoSection>

      <InfoSection title="Recruiter and institution data boundaries">
        <p>
          Recruiter workflows may process company profiles, job postings,
          applicant submissions, status decisions, and internal recruiter notes
          for authorized hiring activity. Institution experiences are designed
          to present aggregate readiness and participation insight; institution
          administrators are not intended to receive private student resumes,
          cover letters, uploaded files, or individual application notes through
          institution reporting features.
        </p>
      </InfoSection>

      <InfoSection title="Uploads, storage, and document handling">
        <p>
          Uploaded files and generated documents may be stored so you can edit,
          submit, export, or reuse them within authorized workflows. Do not
          upload sensitive information that is unnecessary for career
          preparation or application activity. Access to stored documents is
          intended to be limited to authorized platform workflows and permitted
          recipients.
        </p>
      </InfoSection>

      <InfoSection title="Authentication and account protection">
        <p>
          ISEYA uses configured authentication infrastructure to manage account
          sessions and access controls. Data transmitted through the production
          website is protected in transit where HTTPS is used. You are
          responsible for safeguarding your login credentials, maintaining
          access to your email account, and notifying us if you believe your
          account has been compromised.
        </p>
      </InfoSection>

      <InfoSection title="Payments and third-party services">
        <p>
          Payment transactions may be processed by Stripe or another identified
          payment processor. ISEYA does not need to store complete payment card
          numbers to provide subscription access. We may also rely on service
          providers for authentication, hosting, document storage, platform
          delivery, and other operational functions, subject to their applicable
          terms and privacy practices.
        </p>
      </InfoSection>

      <InfoSection title="Cookies, local storage, and analytics">
        <p>
          Essential cookies or browser storage may support sign-in sessions,
          security, saved preferences, and basic platform operation. The privacy
          preference banner stores your selection locally in your browser.
          Optional analytics, if configured and permitted, may be used to
          understand platform use and improve experience quality. We do not use
          the consent preference itself to create a public profile.
        </p>
      </InfoSection>

      <InfoSection title="AI-assisted recommendations">
        <p>
          ISEYA may use automated or AI-assisted systems to analyze role
          descriptions and career materials and to suggest improvements. These
          suggestions are assistance tools, not factual verification,
          employment advice, or guarantees of hiring outcomes. You must review
          all output for accuracy before using it.
        </p>
      </InfoSection>

      <InfoSection title="Communications and preferences">
        <p>
          We may send transactional messages relating to account access,
          security, billing, applications, moderation, or requested services.
          Product or opportunity notifications are governed by available
          preference controls and applicable law. You may request help with
          communication preferences through our contact channel.
        </p>
      </InfoSection>

      <InfoSection title="Safety, abuse prevention, and legal compliance">
        <p>
          We may process account, usage, and submitted information to prevent
          fraud, spam, impersonation, misuse, unauthorized access, or harmful
          activity; investigate policy violations; enforce platform terms; and
          comply with lawful requests or protect the rights and safety of users,
          Jormp LLC, and third parties.
        </p>
      </InfoSection>

      <InfoSection title="Data retention and deletion requests">
        <p>
          We may retain information while an account or workflow is active and
          as reasonably necessary for platform operations, recordkeeping,
          dispute resolution, abuse prevention, payment records, and legal
          obligations. To request account or data deletion, contact us using
          the details below. Certain information may be retained where required
          or permitted for legitimate operational or legal purposes.
        </p>
      </InfoSection>

      <InfoSection title="Your content and intellectual property">
        <p>
          You retain responsibility for and any rights you hold in content you
          submit. You grant ISEYA the limited permission required to host,
          process, display, transform, and transmit that content to provide the
          services you request and maintain platform safety. Do not provide
          content you lack authority to use.
        </p>
      </InfoSection>

      <InfoSection title="Policy limitations and updates">
        <p>
          Security and privacy controls reduce risk but cannot guarantee that
          every transmission or storage environment is free from risk. This
          policy does not expand liability beyond the applicable Terms of Use
          or applicable law. We may update this policy as the platform evolves;
          the effective date above identifies the current posted version.
        </p>
      </InfoSection>

      <InfoSection title="Contact and related terms">
        <p>
          For privacy questions, deletion requests, or platform data handling
          concerns,{" "}
          <Link href="/contact" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">
            contact ISEYA
          </Link>
          . Review the <Link href="/terms" className="font-semibold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] decoration-2 underline-offset-4">Terms of Use</Link> for platform rules and liability terms.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
