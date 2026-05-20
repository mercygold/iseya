type SupabaseServerConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseServerConfigured() {
  return Boolean(getSupabaseServerConfig());
}

export function supabaseServerRestUrl(path: string) {
  const config = getSupabaseServerConfig();

  if (!config) {
    return null;
  }

  return `${config.url.replace(/\/$/, "")}/rest/v1/${path.replace(/^\//, "")}`;
}

export function supabaseServerHeaders(accessToken?: string) {
  const config = getSupabaseServerConfig();

  if (!config) {
    return null;
  }

  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${accessToken || config.anonKey}`,
    "Content-Type": "application/json",
  };
}
