"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  countryOptions,
  countryRegions,
  manualLocationOption,
} from "@/lib/recruiterLocationOptions";
import { getAuthRedirectUrl } from "@/lib/supabaseConfig";

type AuthMode = "login" | "signup";
type SignupPath = "individual" | "recruiter" | "institution_admin";

type AuthFormProps = {
  mode: AuthMode;
};

const industryOptions = ["", "Technology", "Software / SaaS", "Artificial Intelligence", "Cybersecurity", "Fintech", "Healthcare", "Education", "Consulting", "Marketing / Advertising", "Media / Entertainment", "E-commerce", "Retail", "Finance / Banking", "Real Estate", "Construction", "Manufacturing", "Logistics / Transportation", "Energy", "Agriculture", "Hospitality", "Legal", "Government / Public Sector", "Nonprofit", "Staffing / Recruiting", "Other"];

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login,
    signUp,
    resetPassword,
    loading,
    error: authError,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupPath, setSignupPath] = useState<SignupPath>("individual");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [linkedinCompanyUrl, setLinkedinCompanyUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryOther, setIndustryOther] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [hiringFocus, setHiringFocus] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const redirectedFrom = searchParams.get("redirectedFrom") || "/workspace";
  const requestedType = searchParams.get("type");
  const isLogin = mode === "login";
  const useRecruiterSignup = !isLogin && signupPath === "recruiter";
  const useInstitutionAdminSignup = !isLogin && signupPath === "institution_admin";
  const selectedCountryOption = countryOptions.includes(country)
    ? country
    : country
      ? manualLocationOption
      : "";
  const countryStateOptions =
    selectedCountryOption && selectedCountryOption !== manualLocationOption
      ? countryRegions[selectedCountryOption] ?? [manualLocationOption]
      : [manualLocationOption];
  const selectedStateOption = countryStateOptions.includes(stateRegion)
    ? stateRegion
    : stateRegion
      ? manualLocationOption
      : "";
  const needsManualCountry = selectedCountryOption === manualLocationOption;
  const needsManualState =
    selectedCountryOption === manualLocationOption || selectedStateOption === manualLocationOption;
  const needsOtherIndustry = industry === "Other";

  useEffect(() => {
    if (!isLogin && requestedType === "recruiter") {
      const timer = window.setTimeout(() => setSignupPath("recruiter"), 0);
      return () => window.clearTimeout(timer);
    }
    if (!isLogin && requestedType === "institution_admin") {
      const timer = window.setTimeout(() => setSignupPath("institution_admin"), 0);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isLogin, requestedType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    clearError();

    try {
      if (isLogin) {
        await login(email, password);
        router.replace(redirectedFrom);
        router.refresh();
        return;
      }

      const { needsEmailConfirmation } = await signUp({
        email,
        password,
        fullName,
        accountType: useRecruiterSignup
          ? "recruiter"
          : useInstitutionAdminSignup
            ? "institution"
            : "candidate",
        emailRedirectTo: getAuthRedirectUrl(redirectedFrom),
      });

      if (needsEmailConfirmation) {
        setStatus("Check your email to confirm your account, then return to ISEYA.");
        return;
      }

      if (useRecruiterSignup) {
        const response = await fetch("/api/recruiter/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            recruiterName: fullName,
            workEmail: email,
            companyWebsite,
            linkedinCompanyUrl,
            phoneNumber,
            addressLine1,
            addressLine2,
            city,
            stateRegion,
            postalCode,
            country,
            companyLocation: [city, stateRegion, country].filter(Boolean).join(", "),
            industry,
            industryOther,
            companySize,
            hiringFocus,
          }),
        });
        const data = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Recruiter profile could not be saved.");
        }
      }

      if (useInstitutionAdminSignup) {
        router.replace("/institutions/onboarding");
        router.refresh();
        return;
      }

      router.replace(redirectedFrom);
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed. Please try again.");
    }
  }

  async function handleForgotPassword() {
    setError("");
    setStatus("");
    clearError();

    if (!email.trim()) {
      setError("Enter your email first, then request a reset link.");
      return;
    }

    try {
      await resetPassword(email, getAuthRedirectUrl("/reset-password"));
      setStatus("Password reset email sent.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Password reset failed. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <section className="bg-[var(--iseya-navy)] px-5 py-8 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-white/80 sm:justify-end">
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/">
              Resume Builder
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/pricing">
              Pricing
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/institutions">
              For Institutions
            </Link>
            <Link className="transition hover:text-[var(--iseya-gold)]" href="/contact">
              Contact
            </Link>
          </nav>
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
            <>
              <div className="mb-5 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2">
                  {[
                    ["individual", "Individual"],
                    ["recruiter", "Recruiter"],
                    ...(requestedType === "institution_admin"
                      ? [["institution_admin", "Institution Administrator"]]
                      : []),
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSignupPath(id as SignupPath)}
                      className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                        signupPath === id
                          ? "bg-[var(--iseya-navy)] text-white"
                          : "bg-white text-[var(--iseya-navy)] hover:bg-[#FFF8E6]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                {useRecruiterSignup ? "Recruiter name" : "Full name"}
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                  autoComplete="name"
                />
              </label>
              {useRecruiterSignup ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Company name
                    <input
                      required
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Company website
                    <input
                      required
                      value={companyWebsite}
                      onChange={(event) => setCompanyWebsite(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                      placeholder="https://company.com"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    LinkedIn company URL optional
                    <input
                      value={linkedinCompanyUrl}
                      onChange={(event) => setLinkedinCompanyUrl(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                      placeholder="https://www.linkedin.com/company/..."
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Phone number
                    <input
                      required
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Address line 1
                    <input
                      required
                      value={addressLine1}
                      onChange={(event) => setAddressLine1(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Address line 2 optional
                    <input
                      value={addressLine2}
                      onChange={(event) => setAddressLine2(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    City
                    <input
                      required
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Postal code optional
                    <input
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Country
                    <select
                      required
                      value={selectedCountryOption}
                      onChange={(event) => {
                        setCountry(event.target.value);
                        setStateRegion("");
                      }}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    >
                      {countryOptions.map((option) => (
                        <option key={option} value={option}>{option || "Select"}</option>
                      ))}
                    </select>
                  </label>
                  {needsManualCountry ? (
                    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                      Enter country/region manually
                      <input
                        required
                        value={country === manualLocationOption ? "" : country}
                        onChange={(event) => {
                          setCountry(event.target.value);
                          setStateRegion("");
                        }}
                        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                      />
                    </label>
                  ) : null}
                  {needsManualState ? (
                    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                      Enter state/region manually
                      <input
                        required
                        value={stateRegion === manualLocationOption ? "" : stateRegion}
                        onChange={(event) => setStateRegion(event.target.value)}
                        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                      />
                    </label>
                  ) : (
                    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                      State/Region
                      <select
                        required
                        value={selectedStateOption}
                        onChange={(event) => setStateRegion(event.target.value)}
                        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                      >
                        {["", ...countryStateOptions].map((option) => (
                          <option key={option} value={option}>{option || "Select"}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Industry
                    <select
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    >
                      {industryOptions.map((option) => (
                        <option key={option} value={option}>{option || "Select"}</option>
                      ))}
                    </select>
                  </label>
                  {needsOtherIndustry ? (
                    <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                      Specify industry optional
                      <input
                        value={industryOther}
                        onChange={(event) => setIndustryOther(event.target.value)}
                        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                      />
                    </label>
                  ) : null}
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)]">
                    Company size optional
                    <select
                      value={companySize}
                      onChange={(event) => setCompanySize(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                    >
                      <option value="">Select</option>
                      <option value="1–10">1–10</option>
                      <option value="11–50">11–50</option>
                      <option value="51–200">51–200</option>
                      <option value="201–500">201–500</option>
                      <option value="501–1000">501–1000</option>
                      <option value="1000+">1000+</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[var(--iseya-navy)] sm:col-span-2">
                    Hiring focus
                    <textarea
                      required
                      value={hiringFocus}
                      onChange={(event) => setHiringFocus(event.target.value)}
                      className="mt-2 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--iseya-gold)] focus:ring-2 focus:ring-[var(--iseya-gold)]/25"
                      placeholder="Roles, departments, seniority, locations, or skills you hire for."
                    />
                  </label>
                </div>
              ) : null}
            </>
          ) : null}

          <label className="mt-4 block text-sm font-semibold text-[var(--iseya-navy)]">
            {useRecruiterSignup
                ? "Work email"
                : "Email"}
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

          {error || authError ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              <p>{error || authError}</p>
            </div>
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
            {loading
              ? "Working..."
              : isLogin
                ? "Login"
                : useRecruiterSignup
                  ? "Create recruiter account"
                  : "Sign up"}
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
              href={`${isLogin ? "/signup" : "/login"}?redirectedFrom=${encodeURIComponent(redirectedFrom)}`}
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
