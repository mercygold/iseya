import Image from "next/image";
import Link from "next/link";

const trustPrinciples = [
  "Privacy-first",
  "Protected workspaces",
  "Verified recruiter workflows",
  "Institution-safe insights",
];

export default function PublicTrustFooter({
  maxWidth = "max-w-[92rem]",
}: {
  maxWidth?: string;
}) {
  return (
    <footer className="border-t border-[color-mix(in_srgb,var(--iseya-gold)_28%,var(--iseya-navy))] bg-[var(--iseya-navy)] text-white">
      <div className={`mx-auto ${maxWidth} px-5 py-7 sm:px-8`}>
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Link href="/" aria-label="ISEYA homepage" className="inline-flex items-center">
              <Image
                src="/brand/iseya-logo.png"
                alt="ISEYA"
                width={180}
                height={90}
                className="h-auto w-[118px] object-contain"
              />
            </Link>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/76">
              Secure career infrastructure for candidates, recruiters, and institutions.
            </p>
            <p className="mt-2 text-xs font-medium text-white/60">California, USA</p>
          </div>
          <nav
            aria-label="Company and legal links"
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-white/80"
          >
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/insights">
              Insights
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/guides">
              Guides
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/about">
              About
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/terms">
              Terms
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 text-xs text-white/64 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <p>© 2026 Jormp LLC. All rights reserved.</p>
            <p>ISEYA by Jormp LLC</p>
          </div>
          <ul aria-label="Platform trust principles" className="flex flex-wrap gap-x-4 gap-y-2">
            {trustPrinciples.map((principle) => (
              <li key={principle} className="text-white/72">
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
