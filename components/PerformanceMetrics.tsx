"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackPerformanceMetric } from "@/lib/analytics";

export default function PerformanceMetrics() {
  useReportWebVitals((metric) => {
    trackPerformanceMetric({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  });

  return null;
}
