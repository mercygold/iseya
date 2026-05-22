"use client";

import { useEffect, useMemo, useState } from "react";
import { enableInstitutionAccess } from "@/lib/featureFlags";
import { subscriptionLabel, normalizeSubscriptionPlan } from "@/lib/subscription";

type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  resume_download_credits: number | null;
  optimization_credits: number | null;
  created_at: string | null;
};

type Organization = {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  seats_allowed: number;
  seats_used: number;
};

type ManagePayload = {
  users: ManagedUser[];
  stats: {
    totalUsers: number;
    starterUsers: number;
    plusUsers: number;
    proMonthlyUsers: number;
    proAnnualUsers: number;
    recentSignups: ManagedUser[];
    recentPaidUsers: ManagedUser[];
  };
  organizations: Organization[];
};

const inputClass =
  "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25";
const primaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-3 py-2 text-xs font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] disabled:cursor-not-allowed disabled:opacity-60";

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function planLabel(plan: string | null) {
  return subscriptionLabel(normalizeSubscriptionPlan(plan));
}

function statusLabel(status: string | null) {
  return (status || "free")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-[var(--iseya-navy)]">{value}</p>
    </div>
  );
}

export default function ManageDashboard() {
  const [payload, setPayload] = useState<ManagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [draft, setDraft] = useState({
    subscriptionPlan: "free",
    subscriptionStatus: "free",
    resumeDownloadCredits: 0,
    optimizationCredits: 0,
  });

  async function loadManageData() {
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/manage/users", { cache: "no-store" });
      const data = (await response.json()) as ManagePayload & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to load admin data.");
      }

      setPayload(data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadManageData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const users = payload?.users ?? [];

    if (!needle) {
      return users;
    }

    return users.filter((user) =>
      [
        user.email,
        user.full_name,
        user.subscription_plan,
        user.subscription_status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [payload?.users, query]);

  function startEdit(user: ManagedUser) {
    setEditingUserId(user.id);
    setDraft({
      subscriptionPlan: normalizeSubscriptionPlan(user.subscription_plan),
      subscriptionStatus: user.subscription_status || "free",
      resumeDownloadCredits: user.resume_download_credits ?? 0,
      optimizationCredits: user.optimization_credits ?? 0,
    });
  }

  async function saveUser(user: ManagedUser) {
    const confirmed = window.confirm(
      `Update plan and credits for ${user.email ?? "this user"}?`,
    );

    if (!confirmed) {
      return;
    }

    setStatus("");

    try {
      const response = await fetch("/api/manage/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ...draft,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to update user.");
      }

      setStatus("User plan updated.");
      setEditingUserId("");
      await loadManageData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update user.");
    }
  }

  if (loading) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--iseya-navy)]">Loading admin data...</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--iseya-navy)]">
          {status || "Unable to load admin data."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      {status ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-[var(--iseya-navy)]">
          {status}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={payload.stats.totalUsers} />
        <StatCard label="Starter" value={payload.stats.starterUsers} />
        <StatCard label="Plus" value={payload.stats.plusUsers} />
        <StatCard label="Pro Monthly" value={payload.stats.proMonthlyUsers} />
        <StatCard label="Pro Annual" value={payload.stats.proAnnualUsers} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityCard title="Recent Signups" users={payload.stats.recentSignups} />
        <ActivityCard title="Recent Paid Users" users={payload.stats.recentPaidUsers} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
              User Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
              Users and Plans
            </h2>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email, plan, or status"
            className={`${inputClass} w-full lg:w-80`}
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-3">Email</th>
                <th className="border-b border-slate-200 px-3 py-3">Plan</th>
                <th className="border-b border-slate-200 px-3 py-3">Status</th>
                <th className="border-b border-slate-200 px-3 py-3">Exports</th>
                <th className="border-b border-slate-200 px-3 py-3">Credits</th>
                <th className="border-b border-slate-200 px-3 py-3">Created</th>
                <th className="border-b border-slate-200 px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const editing = editingUserId === user.id;

                return (
                  <tr key={user.id} className="align-top">
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-[var(--iseya-navy)]">
                      {user.email || "No email"}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <select
                          value={draft.subscriptionPlan}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              subscriptionPlan: event.target.value,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="free">Starter</option>
                          <option value="plus">Plus</option>
                          <option value="pro_monthly">Pro Monthly</option>
                          <option value="pro_annual">Pro Annual</option>
                        </select>
                      ) : (
                        planLabel(user.subscription_plan)
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <select
                          value={draft.subscriptionStatus}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              subscriptionStatus: event.target.value,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="free">Free</option>
                          <option value="active">Active</option>
                          <option value="canceled">Canceled</option>
                          <option value="past_due">Past Due</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        statusLabel(user.subscription_status)
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={draft.resumeDownloadCredits}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              resumeDownloadCredits: Number(event.target.value),
                            }))
                          }
                          className={`${inputClass} w-24`}
                        />
                      ) : (
                        user.resume_download_credits ?? 0
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={draft.optimizationCredits}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              optimizationCredits: Number(event.target.value),
                            }))
                          }
                          className={`${inputClass} w-24`}
                        />
                      ) : (
                        user.optimization_credits ?? 0
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {editing ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveUser(user)} className={primaryButton}>
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingUserId("")} className={secondaryButton}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startEdit(user)} className={secondaryButton}>
                          Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {enableInstitutionAccess ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
            Institution Preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--iseya-navy)]">
            Organizations
          </h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {payload.organizations.length > 0 ? (
              payload.organizations.map((organization) => (
                <div key={organization.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-[var(--iseya-navy)]">{organization.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {organization.type} · {organization.plan} · {organization.status}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Seats {organization.seats_used} / {organization.seats_allowed}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No organizations available.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActivityCard({ title, users }: { title: string; users: ManagedUser[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--iseya-gold)]">
        {title}
      </p>
      <div className="mt-4 space-y-3">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--iseya-navy)]">
                  {user.email || "No email"}
                </p>
                <p className="text-xs text-slate-500">{formatDate(user.created_at)}</p>
              </div>
              <span className="rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-bold text-[var(--iseya-navy)]">
                {planLabel(user.subscription_plan)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No users to show yet.</p>
        )}
      </div>
    </section>
  );
}
