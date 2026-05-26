export const analyticsConsentStorageKey = "iseya.privacy-consent.v1";
export const analyticsConsentChangeEvent = "iseya:privacy-consent-change";

export type AnalyticsConsentChoice = "essential" | "accepted";

export type AnalyticsEventName =
  | "candidate_workspace_started"
  | "demo_opened"
  | "homepage_cta_clicked"
  | "institution_cta_clicked"
  | "institution_demo_opened"
  | "job_apply_clicked"
  | "login_initiated"
  | "pricing_cta_clicked"
  | "recruiter_cta_clicked"
  | "recruiter_demo_opened"
  | "request_access_clicked"
  | "resume_builder_cta_clicked"
  | "signup_initiated";

export type AnalyticsParameters = Record<
  string,
  boolean | number | string | undefined
>;

const permittedEventParameterKeys = new Set([
  "application_mode",
  "audience",
  "cta",
  "destination",
  "opportunity_type",
  "plan_id",
  "source",
]);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getAnalyticsMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
}

export function getGoogleTagManagerId() {
  const tagManagerId = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";

  return /^GTM-[A-Za-z0-9]+$/.test(tagManagerId) ? tagManagerId : "";
}

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(analyticsConsentStorageKey);
    const value = stored
      ? (JSON.parse(stored) as { choice?: AnalyticsConsentChoice })
      : null;

    return value?.choice === "accepted";
  } catch {
    return false;
  }
}

export function recordAnalyticsConsent(choice: AnalyticsConsentChoice) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    analyticsConsentStorageKey,
    JSON.stringify({ choice, recordedAt: new Date().toISOString() }),
  );
  window.dispatchEvent(
    new CustomEvent(analyticsConsentChangeEvent, { detail: { choice } }),
  );
}

function canTrack() {
  return (
    typeof window !== "undefined" &&
    Boolean(getAnalyticsMeasurementId()) &&
    hasAnalyticsConsent() &&
    typeof window.gtag === "function"
  );
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  parameters: AnalyticsParameters = {},
) {
  if (!canTrack()) return;

  const safeParameters = Object.fromEntries(
    Object.entries(parameters)
      .filter(([key]) => permittedEventParameterKeys.has(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) : value,
      ]),
  );

  window.gtag?.("event", eventName, {
    ...safeParameters,
    transport_type: "beacon",
  });
}

export function trackPageView(pathname: string) {
  if (!canTrack()) return;

  window.gtag?.("event", "page_view", {
    page_location: `${window.location.origin}${pathname}`,
    page_path: pathname,
    page_title: document.title,
    transport_type: "beacon",
  });
}

export function trackPerformanceMetric(metric: {
  id: string;
  name: string;
  value: number;
  rating?: string;
}) {
  if (!canTrack()) return;

  window.gtag?.("event", "web_vital", {
    event_category: "Web Vitals",
    event_label: metric.id,
    metric_name: metric.name,
    metric_rating: metric.rating,
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    non_interaction: true,
    transport_type: "beacon",
  });
}
