export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseConfigResult =
  | { ok: true; config: SupabasePublicConfig }
  | { ok: false; message: string };

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function isLikelySupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".supabase.co") || url.hostname === "localhost")
    );
  } catch {
    return false;
  }
}

function isLikelyJwt(value: string) {
  const parts = value.split(".");
  return parts.length === 3 && parts.every(Boolean) && value.startsWith("eyJ");
}

export function getSupabasePublicConfigFromEnv(env: {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}): SupabaseConfigResult {
  const url = cleanEnvValue(env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return {
      ok: false,
      message:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the app.",
    };
  }

  if (!isLikelySupabaseUrl(url)) {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_SUPABASE_URL is malformed. Use the project URL from Supabase Settings > API.",
    };
  }

  if (/\s/.test(anonKey) || !isLikelyJwt(anonKey)) {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_SUPABASE_ANON_KEY is malformed. Use the anon public API key from Supabase Settings > API.",
    };
  }

  return {
    ok: true,
    config: { url, anonKey },
  };
}

export function getSupabasePublicConfigStatus() {
  return getSupabasePublicConfigFromEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function cleanSupabaseEnvValue(value: string | undefined) {
  return cleanEnvValue(value);
}

export function isLikelySupabaseJwt(value: string) {
  return isLikelyJwt(value);
}
