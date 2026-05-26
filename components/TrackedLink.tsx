"use client";

import Link, { type LinkProps } from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import {
  trackAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsParameters,
} from "@/lib/analytics";

type TrackedLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  eventName: AnalyticsEventName;
  eventParameters?: AnalyticsParameters;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export default function TrackedLink({
  children,
  eventName,
  eventParameters,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackAnalyticsEvent(eventName, eventParameters);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
