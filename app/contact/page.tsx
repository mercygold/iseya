import { InfoPageShell, InfoSection } from "../info-page-shell";

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
