"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
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

export default function NotificationPanel({
  title = "Notifications",
  subtitle = "Important updates from your ISEYA activity.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    let active = true;

    void fetch("/api/notifications", { cache: "no-store" })
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
  }, []);

  async function markRead(notificationId: string) {
    setUpdatingId(notificationId);
    setStatus("");

    try {
      const response = await fetch("/api/notifications", {
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-[var(--iseya-navy)]">
          {status}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-5 space-y-3" aria-label="Loading notifications">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-xl border border-slate-100 p-4">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          No notifications yet. Updates will appear here when application or moderation activity changes.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border p-4 ${
                item.read ? "border-slate-200 bg-white" : "border-[#F4B321]/40 bg-[#FFF8E6]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--iseya-navy)]">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                {!item.read ? (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    disabled={updatingId === item.id}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingId === item.id ? "Updating..." : "Mark as read"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
