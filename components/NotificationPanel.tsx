"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  type?: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

type NotificationResponse = {
  notifications?: NotificationItem[];
  unreadCount?: number;
  error?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function notificationCategory(item: NotificationItem) {
  if (item.type === "job_alert_match") return "Opportunity Alert";
  if (item.type?.includes("application") || /application|interest/i.test(item.title)) {
    return "Application Update";
  }
  if (item.type?.includes("recruiter") || /recruiter/i.test(item.title)) {
    return "Recruiter Update";
  }
  return "Update";
}

export default function NotificationPanel({
  title = "Notifications",
  subtitle = "Important updates from your ISEYA activity.",
  scope,
  compact = false,
  initialVisibleCount = 3,
}: {
  title?: string;
  subtitle?: string;
  scope?: "recruiter";
  compact?: boolean;
  initialVisibleCount?: number;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;

    const endpoint = scope ? `/api/notifications?scope=${scope}` : "/api/notifications";

    void fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as NotificationResponse;
        if (!response.ok) throw new Error(data.error || "Unable to load notifications right now.");
        if (!active) return;
        setItems(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {
        if (active) setStatus("Unable to load notifications right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scope]);

  async function markRead(notificationId: string) {
    setUpdatingId(notificationId);
    setStatus("");

    try {
      const endpoint = scope ? `/api/notifications?scope=${scope}` : "/api/notifications";
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) {
        throw new Error("Unable to update notification right now.");
      }

      setItems((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      setStatus("Unable to update notification right now.");
    } finally {
      setUpdatingId("");
    }
  }

  const visibleItems =
    compact && !expanded ? items.slice(0, initialVisibleCount) : items;
  const emptyMessage =
    scope === "recruiter"
      ? "No recruiter updates yet. Moderation and applicant activity for your listings will appear here."
      : "No updates yet. Application progress and relevant opportunity alerts will appear here.";

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? "p-4 sm:p-5" : "p-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Updates
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--iseya-navy)]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        {unreadCount > 0 ? (
          <span className="rounded-full border border-[#F4B321]/45 bg-[#FFF8E6] px-3 py-1 text-xs font-bold text-[var(--iseya-navy)]">
            {unreadCount} unread
          </span>
        ) : null}
      </div>

      {status ? (
        <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-[var(--iseya-navy)]">
          {status}
        </p>
      ) : null}

      {loading ? (
        <div
          className={`${compact ? "mt-4" : "mt-5"} space-y-3`}
          role="status"
          aria-live="polite"
          aria-label="Loading updates"
        >
          {[1, 2].map((item) => (
            <div key={item} className={`rounded-xl border border-slate-100 ${compact ? "p-3" : "p-4"}`}>
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className={`${compact ? "mt-4 p-3" : "mt-5 p-4"} rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm leading-6 text-slate-500`}>
          {emptyMessage}
        </p>
      ) : (
        <div className={`${compact ? "mt-4" : "mt-5"} space-y-2.5`}>
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border ${compact ? "p-3.5" : "p-4"} ${
                item.read ? "border-slate-200 bg-white" : "border-[#F4B321]/40 bg-[#FFF8E6]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {compact ? (
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {notificationCategory(item)}
                    </p>
                  ) : null}
                  <p className="text-sm font-semibold text-[var(--iseya-navy)]">{item.title}</p>
                  <p className={`mt-1 text-sm text-slate-600 ${compact ? "leading-5" : "leading-6"}`}>{item.message}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                {!item.read ? (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    disabled={updatingId === item.id}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingId === item.id ? "Updating..." : "Mark as read"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {compact && items.length > initialVisibleCount ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              aria-expanded={expanded}
              className="mt-2 inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--iseya-gold)] focus-visible:ring-offset-2"
            >
              {expanded ? "Show fewer updates" : "View all updates"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
