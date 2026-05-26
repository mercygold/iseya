"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function DashboardNavLink({
  href,
  children,
  highlightOnPath = true,
}: {
  href: string;
  children: ReactNode;
  highlightOnPath?: boolean;
}) {
  const pathname = usePathname();
  const path = href.split("#")[0];
  const active = highlightOnPath && pathname === path;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2.5 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--iseya-navy)] ${
        active
          ? "bg-white/10 text-[var(--iseya-gold)]"
          : "text-white/80 hover:bg-white/5 hover:text-[var(--iseya-gold)]"
      }`}
    >
      {children}
    </Link>
  );
}
