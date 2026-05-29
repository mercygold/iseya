import Image from "next/image";
import Link from "next/link";

const footerColumns = [
  {
    title: "Platform",
    links: [
      ["Career Workspace", "/workspace"],
      ["Jobs", "/jobs"],
      ["Career Guidance", "/workspace"],
    ],
  },
  {
    title: "For You",
    links: [
      ["Build Resume", "/workspace"],
      ["Browse Jobs", "/jobs"],
      ["Career Assets", "/workspace"],
      ["Dashboard", "/workspace"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Insights", "/insights"],
      ["Career Guides", "/guides"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
] as const;

export default function PublicTrustFooter({
  maxWidth = "max-w-[92rem]",
}: {
  maxWidth?: string;
}) {
  return (
    <footer className="border-t border-[color-mix(in_srgb,var(--iseya-gold)_28%,var(--iseya-navy))] bg-[var(--iseya-navy)] text-white">
      <div className={`mx-auto ${maxWidth} px-5 py-6 sm:px-8 sm:py-8`}>
        <div className="grid gap-7 lg:grid-cols-[1fr_2.05fr] lg:gap-14">
          <div>
            <Link
              href="/"
              aria-label="ISEYA homepage"
              className="inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]"
            >
              <Image
                src="/brand/iseya-logo.png"
                alt="ISEYA"
                width={180}
                height={90}
                className="h-auto w-[118px] object-contain"
              />
            </Link>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              Beyond Resume. Positioning.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/66">
              Career infrastructure for modern talent.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/90">{column.title}</p>
                <div className="mt-3 grid gap-2.5">
                  {column.links.map(([label, href]) => (
                    <Link
                      key={label}
                      className="rounded-sm text-sm text-white/72 transition hover:text-[var(--iseya-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)]"
                      href={href}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-7 border-t border-white/10 pt-5 text-xs text-white/64">
          <p>© 2026 Jormp LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
