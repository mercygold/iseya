export type SupabaseBrowserConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseBrowserConfigured() {
  return Boolean(getSupabaseBrowserConfig());
}

export function supabaseRestUrl(path: string) {
  const config = getSupabaseBrowserConfig();

  if (!config) {
    return null;
  }

  return `${config.url.replace(/\/$/, "")}/rest/v1/${path.replace(/^\//, "")}`;
}

export function supabaseAnonHeaders(accessToken?: string) {
  const config = getSupabaseBrowserConfig();

  if (!config) {
    return null;
  }

  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${accessToken || config.anonKey}`,
    "Content-Type": "application/json",
  };
}
