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
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [error, setError] = useState(() => getSupabaseBrowserConfigMessage());

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

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

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ email, password, fullName, emailRedirectTo }) => {
      setError("");

      if (!supabase) {
        const message = getSupabaseBrowserConfigMessage();
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
            },
            emailRedirectTo,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        setSession(data.session);
        setUser(data.user);

        return { needsEmailConfirmation: !data.session };
      } catch (signUpError) {
        const message =
          signUpError instanceof Error ? signUpError.message : "Signup failed. Please try again.";
        setError(message);
        throw signUpError;
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      setError("");

      if (!supabase) {
        const message = getSupabaseBrowserConfigMessage();
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

        setSession(data.session);
        setUser(data.user);
      } catch (loginError) {
        const message =
          loginError instanceof Error ? loginError.message : "Login failed. Please try again.";
        setError(message);
        throw loginError;
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    setError("");

    if (!supabase) {
      const message = getSupabaseBrowserConfigMessage();
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
      const message =
        logoutError instanceof Error ? logoutError.message : "Logout failed. Please try again.";
      setError(message);
      throw logoutError;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const resetPassword = useCallback<AuthContextValue["resetPassword"]>(
    async (email, redirectTo) => {
      setError("");

      if (!supabase) {
        const message = getSupabaseBrowserConfigMessage();
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
        const message =
          resetError instanceof Error ? resetError.message : "Password reset failed. Please try again.";
        setError(message);
        throw resetError;
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
      clearError: () => setError(""),
    }),
    [error, loading, login, logout, resetPassword, session, signUp, supabase, user],
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
