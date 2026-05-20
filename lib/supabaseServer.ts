import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cleanSupabaseEnvValue,
  getSupabasePublicConfigStatus,
  isLikelySupabaseServiceRoleKey,
  type SupabasePublicConfig,
} from "./supabaseConfig";

type SupabaseServerConfig = SupabasePublicConfig;

export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const result = getSupabasePublicConfigStatus();

  return result.ok ? result.config : null;
}

export function getSupabaseServerConfigMessage() {
  const result = getSupabasePublicConfigStatus();
  return result.ok ? "" : result.message;
}

export function isSupabaseServerConfigured() {
  return Boolean(getSupabaseServerConfig());
}

export async function createSupabaseServerClient() {
  const config = getSupabaseServerConfig();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies. Route handlers and Proxy
          // handle session refresh writes.
        }
      },
    },
  });
}

export function createSupabaseServiceRoleClient(): SupabaseClient | null {
  const publicConfig = getSupabasePublicConfigStatus();
  const serviceRoleKey = cleanSupabaseEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (
    !publicConfig.ok ||
    !serviceRoleKey ||
    /\s/.test(serviceRoleKey) ||
    !isLikelySupabaseServiceRoleKey(serviceRoleKey)
  ) {
    return null;
  }

  return createClient(publicConfig.config.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
