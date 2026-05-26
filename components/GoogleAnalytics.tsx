"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  analyticsConsentChangeEvent,
  getAnalyticsMeasurementId,
  hasAnalyticsConsent,
  trackPageView,
} from "@/lib/analytics";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const measurementId = getAnalyticsMeasurementId();
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const lastTrackedPath = useRef("");
  const configured = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnabled(hasAnalyticsConsent()), 0);
    const handleConsentChange = () => setEnabled(hasAnalyticsConsent());

    window.addEventListener(analyticsConsentChangeEvent, handleConsentChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(analyticsConsentChangeEvent, handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !ready || pathname === lastTrackedPath.current) return;

    trackPageView(pathname);
    lastTrackedPath.current = pathname;
  }, [enabled, pathname, ready]);

  useEffect(() => {
    if (!measurementId || !enabled || configured.current) return;

    window.dataLayer = window.dataLayer ?? [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      send_page_view: false,
    });
    configured.current = true;

    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, [enabled, measurementId]);

  if (!measurementId || !enabled) return null;

  return (
    <Script
      id="iseya-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
    />
  );
}
