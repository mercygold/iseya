"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectedFrom = searchParams.get("redirectedFrom") || "/workspace";
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!supabase) {
      setError("Accounts are not configured yet. Add Supabase environment variables to enable sign in.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw loginError;
        }

        router.replace(redirectedFrom);
        router.refresh();
        return;
      }

      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/workspace`,
        },
      });

      if (signupError) {
        throw signupError;
      }

      setStatus("Check your email to confirm your account, then return to ISEYA.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setStatus("");

    if (!email.trim()) {
      setError("Enter your email first, then request a reset link.");
      return;
    }

    if (!supabase) {
      setError("Accounts are not configured yet. Add Supabase environment variables to enable password reset.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/workspace`,
      });

      if (resetError) {
        throw resetError;
      }

      setStatus("Password reset email sent.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
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
            href="/"
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--iseya-gold)] hover:bg-[var(--iseya-gold)] hover:text-[var(--iseya-navy)]"
          >
            Resume Builder
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
            ISEYA Account
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--iseya-navy)]">
            {isLogin ? "Welcome back" : "Create your workspace"}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Save resumes, restore tailored versions, and keep your career application materials synced across sessions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--iseya-border)] bg-white p-6 shadow-sm"
        >
          {!isLogin ? (
            <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
              Full name
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label className="mt-4 block text-sm font-semibold text-[var(--iseya-navy)]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
              autoComplete="email"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[var(--iseya-navy)]">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
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
            {loading ? "Working..." : isLogin ? "Login" : "Sign up"}
          </button>

          {isLogin ? (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="mt-3 w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-[var(--iseya-navy)] transition hover:border-[var(--iseya-gold)] hover:bg-[#FFF8E6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Forgot password
            </button>
          ) : null}

          <p className="mt-5 text-center text-sm text-slate-600">
            {isLogin ? "Need an account?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="font-bold text-[var(--iseya-navy)] underline decoration-[var(--iseya-gold)] underline-offset-4"
            >
              {isLogin ? "Sign up" : "Login"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
