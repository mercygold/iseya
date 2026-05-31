"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createSupabaseBrowserClient,
  getSupabaseBrowserConfigMessage,
} from "@/lib/supabaseClient";
import { getSupabasePublicEnvDebug } from "@/lib/supabaseConfig";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string;
  isConfigured: boolean;
  signUp: (input: {
    email: string;
    password: string;
    fullName?: string;
    emailRedirectTo?: string;
    accountType?: "candidate" | "recruiter" | "institution";
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const authNotConfiguredMessage = "Authentication is temporarily unavailable. Please try again later.";
const incorrectCredentialsMessage = "Email or password is incorrect.";
const unconfirmedEmailMessage = "Please confirm your email before signing in.";

type AuthErrorDetails = {
  message: string;
  code: string;
  status?: number;
};

function getAuthErrorDetails(error: unknown): AuthErrorDetails {
  if (error instanceof Error) {
    const authError = error as Error & { code?: unknown; status?: unknown };
    return {
      message: error.message,
      code: typeof authError.code === "string" ? authError.code : "",
      status: typeof authError.status === "number" ? authError.status : undefined,
    };
  }

  if (typeof error === "object" && error !== null) {
    const authError = error as { message?: unknown; code?: unknown; status?: unknown };
    return {
      message: typeof authError.message === "string" ? authError.message : "",
      code: typeof authError.code === "string" ? authError.code : "",
      status: typeof authError.status === "number" ? authError.status : undefined,
    };
  }

  return {
    message: typeof error === "string" ? error : "",
    code: "",
  };
}

function logMissingAuthConfig(label: string) {
  if (process.env.NODE_ENV !== "production") {
    const debug = getSupabasePublicEnvDebug();

    if (debug.reason === "configured") {
      return;
    }

    console.warn(`[auth] ${label}`, debug);
  }
}

function mapLoginError(error: unknown) {
  const details = getAuthErrorDetails(error);
  const normalized = `${details.code} ${details.message}`.toLowerCase();

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed") ||
    normalized.includes("not confirmed")
  ) {
    return unconfirmedEmailMessage;
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_credentials") ||
    normalized.includes("invalid_grant")
  ) {
    return incorrectCredentialsMessage;
  }

  return details.message || "Login failed. Please try again.";
}

function mapSignupError(error: unknown) {
  const details = getAuthErrorDetails(error);
  const normalized = `${details.code} ${details.message}`.toLowerCase();

  if (
    normalized.includes("invalid") ||
    normalized.includes("credentials") ||
    normalized.includes("password") ||
    normalized.includes("email")
  ) {
    return incorrectCredentialsMessage;
  }

  return details.message || "Signup failed. Please try again.";
}

function mapAuthError(error: unknown, fallback: string) {
  const details = getAuthErrorDetails(error);
  return details.message || fallback;
}

function isConfirmedAuthUser(authUser: User | null) {
  return Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
}

function isTransientSessionError(error: unknown) {
  const details = getAuthErrorDetails(error);
  const normalized = `${details.code} ${details.message}`.toLowerCase();

  return (
    normalized.includes("jwt issued at future") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [error, setError] = useState(() => getSupabaseBrowserConfigMessage());

  useEffect(() => {
    if (!supabase) {
      logMissingAuthConfig("Supabase browser config unavailable");
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const activeSupabase = supabase;
    let mounted = true;

    async function restoreSession(hasRetried = false) {
      let retryScheduled = false;

      try {
        const { data, error: sessionError } = await activeSupabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError) {
          if (!hasRetried && isTransientSessionError(sessionError)) {
            retryScheduled = true;
            window.setTimeout(() => {
              void restoreSession(true);
            }, 1500);
            return;
          }

          setError(mapAuthError(sessionError, "Unable to restore your session."));
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (sessionError) {
        if (!mounted) {
          return;
        }

        if (!hasRetried && isTransientSessionError(sessionError)) {
          retryScheduled = true;
          window.setTimeout(() => {
            void restoreSession(true);
          }, 1500);
          return;
        }

        setError(mapAuthError(sessionError, "Unable to restore your session."));
      } finally {
        if (mounted && !retryScheduled) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const ensureUserProfile = useCallback(
    async (profileUser: User) => {
      if (!supabase) {
        return;
      }

      const profilePayload: {
        id: string;
        email: string | null;
        full_name: string | null;
        account_type?: "recruiter" | "institution";
      } = {
        id: profileUser.id,
        email: profileUser.email ?? null,
        full_name:
          typeof profileUser.user_metadata?.full_name === "string"
            ? profileUser.user_metadata.full_name
            : null,
      };

      if (profileUser.user_metadata?.account_type === "recruiter") {
        profilePayload.account_type = "recruiter";
      } else if (profileUser.user_metadata?.account_type === "institution") {
        profilePayload.account_type = "institution";
      }

      await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });

    },
    [supabase],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    void ensureUserProfile(user);
  }, [ensureUserProfile, user]);

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ email, password, fullName, emailRedirectTo, accountType }) => {
      setError("");

      if (!supabase) {
        const message = authNotConfiguredMessage;
        logMissingAuthConfig("signup blocked because Supabase client is unavailable");
        setError(message);
        throw new Error(message);
      }

      setLoading(true);

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName ?? "",
              account_type: accountType ?? "candidate",
            },
            emailRedirectTo,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        setSession(data.session);
        setUser(data.user);

        if (data.user && data.session) {
          await ensureUserProfile(data.user);
        }

        return { needsEmailConfirmation: !data.session };
      } catch (signUpError) {
        const message = mapSignupError(signUpError);
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [ensureUserProfile, supabase],
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      setError("");

      if (!supabase) {
        const message = authNotConfiguredMessage;
        logMissingAuthConfig("login blocked because Supabase client is unavailable");
        setError(message);
        throw new Error(message);
      }

      setLoading(true);

      try {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw loginError;
        }

        if (data.user && !data.session && !isConfirmedAuthUser(data.user)) {
          throw new Error(unconfirmedEmailMessage);
        }

        setSession(data.session);
        setUser(data.user);
        await ensureUserProfile(data.user);
      } catch (loginError) {
        const message = mapLoginError(loginError);
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [ensureUserProfile, supabase],
  );

  const logout = useCallback(async () => {
    setError("");

    if (!supabase) {
      const message = authNotConfiguredMessage;
      logMissingAuthConfig("logout blocked because Supabase client is unavailable");
      setError(message);
      throw new Error(message);
    }

    setLoading(true);

    try {
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      setSession(null);
      setUser(null);
    } catch (logoutError) {
      const message = mapAuthError(logoutError, "Logout failed. Please try again.");
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const resetPassword = useCallback<AuthContextValue["resetPassword"]>(
    async (email, redirectTo) => {
      setError("");

      if (!supabase) {
        const message = authNotConfiguredMessage;
        logMissingAuthConfig("password reset blocked because Supabase client is unavailable");
        setError(message);
        throw new Error(message);
      }

      setLoading(true);

      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });

        if (resetError) {
          throw resetError;
        }
      } catch (resetError) {
        const message = mapAuthError(resetError, "Password reset failed. Please try again.");
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  const updatePassword = useCallback<AuthContextValue["updatePassword"]>(
    async (password) => {
      setError("");

      if (!supabase) {
        const message = authNotConfiguredMessage;
        logMissingAuthConfig("password update blocked because Supabase client is unavailable");
        setError(message);
        throw new Error(message);
      }

      setLoading(true);

      try {
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
          throw updateError;
        }
      } catch (updateError) {
        const message = mapAuthError(updateError, "Password update failed. Please request a new reset link.");
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      error,
      isConfigured: Boolean(supabase),
      signUp,
      login,
      logout,
      resetPassword,
      updatePassword,
      clearError: () => setError(""),
    }),
    [error, loading, login, logout, resetPassword, session, signUp, supabase, updatePassword, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
