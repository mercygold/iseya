"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { session, loading, error: authError, updatePassword, clearError } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    clearError();

    if (!session) {
      setError("This reset link has expired. Please request a new one.");
      return;
    }

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await updatePassword(password);
      setStatus("Password updated. Redirecting to your workspace...");
      window.setTimeout(() => {
        router.replace("/workspace");
        router.refresh();
      }, 900);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "This reset link has expired. Please request a new one.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="bg-[var(--iseya-navy)] px-5 py-8 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-4">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={220}
              height={110}
              priority
              className="h-auto w-[150px] object-contain sm:w-[220px]"
            />
            <span className="hidden border-l border-[var(--iseya-gold)] pl-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)] sm:inline">
              Beyond Resume. Positioning.
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            Account Security
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--iseya-navy)]">
            Reset your password
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Create a new password for your ISEYA workspace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--iseya-border)] bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
            New password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
              autoComplete="new-password"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[var(--iseya-navy)]">
            Confirm password
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
              autoComplete="new-password"
            />
          </label>

          {error || authError ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error || authError}
            </p>
          ) : null}

          {status ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-[var(--iseya-navy)]">
              {status}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 min-h-11 w-full rounded-md border border-[var(--iseya-navy)] bg-[var(--iseya-navy)] px-4 py-2 text-sm font-bold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>

          <p className="mt-5 text-center text-sm text-slate-600">
            Need a new link?{" "}
            <Link
              href="/login"
              className="font-bold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] underline-offset-4"
            >
              Request password reset
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
