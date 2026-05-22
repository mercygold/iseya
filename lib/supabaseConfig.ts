export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

const productionAppUrl = "https://iseya.jormp.com";
const allowedLocalOrigins = new Set(["http://localhost:3000", "http://localhost:3001"]);

export type SupabaseConfigResult =
  | { ok: true; config: SupabasePublicConfig }
  | { ok: false; message: string; devMessage: string };

const genericPublicConfigMessage = "Authentication is temporarily unavailable. Please try again later.";

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
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function isLikelyPublishableKey(value: string) {
  return value.startsWith("sb_publishable_");
}

function isLikelySecretKey(value: string) {
  return value.startsWith("sb_secret_");
}

function publicConfigError(): SupabaseConfigResult {
  return {
    ok: false,
    message: genericPublicConfigMessage,
    devMessage: genericPublicConfigMessage,
  };
}

export function getSupabasePublicConfigStatus(): SupabaseConfigResult {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url) {
    return publicConfigError();
  }

  if (!anonKey) {
    return publicConfigError();
  }

  if (!isLikelySupabaseUrl(url)) {
    return publicConfigError();
  }

  if (/\s/.test(anonKey) || !isLikelyPublishableKey(anonKey)) {
    return publicConfigError();
  }

  return {
    ok: true,
    config: { url, anonKey },
  };
}

export function getSupabasePublicEnvDebug() {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    hasSupabaseUrl: Boolean(url),
    hasSupabaseAnonKey: Boolean(anonKey),
    supabaseUrlShapeOk: Boolean(url && isLikelySupabaseUrl(url)),
    supabaseAnonKeyShapeOk: Boolean(anonKey && !/\s/.test(anonKey) && isLikelyPublishableKey(anonKey)),
  };
}

export function getSupabasePublicConfigFromEnv() {
  return getSupabasePublicEnvDebug();
}

export function getAppBaseUrl() {
  if (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    allowedLocalOrigins.has(window.location.origin)
  ) {
    return window.location.origin;
  }

  const configuredUrl = cleanEnvValue(process.env.NEXT_PUBLIC_APP_URL);

  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);
      return url.origin;
    } catch {
      return productionAppUrl;
    }
  }

  if (typeof window !== "undefined" && allowedLocalOrigins.has(window.location.origin)) {
    return window.location.origin;
  }

  return productionAppUrl;
}

export function getAuthRedirectUrl(nextPath = "/workspace") {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${getAppBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function cleanSupabaseEnvValue(value: string | undefined) {
  return cleanEnvValue(value);
}

export function isLikelySupabaseServiceRoleKey(value: string) {
  return isLikelySecretKey(value);
}
