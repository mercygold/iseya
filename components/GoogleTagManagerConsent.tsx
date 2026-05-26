"use client";

import { useEffect } from "react";
import {
  analyticsConsentChangeEvent,
  getGoogleTagManagerId,
  hasAnalyticsConsent,
} from "@/lib/analytics";

export default function GoogleTagManagerConsent() {
  const tagManagerId = getGoogleTagManagerId();

  useEffect(() => {
    if (!tagManagerId) return;

    function updateConsent() {
      const analyticsGranted = hasAnalyticsConsent() ? "granted" : "denied";

      window.dataLayer = window.dataLayer ?? [];
      if (typeof window.gtag !== "function") {
        window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
      }
      window.gtag("consent", "update", {
        analytics_storage: analyticsGranted,
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }

    const timer = window.setTimeout(updateConsent, 0);
    window.addEventListener(analyticsConsentChangeEvent, updateConsent);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(analyticsConsentChangeEvent, updateConsent);
    };
  }, [tagManagerId]);

  return null;
}
