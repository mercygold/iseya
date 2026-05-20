import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabasePublicConfigStatus,
  type SupabasePublicConfig,
} from "./supabaseConfig";

export type SupabaseBrowserConfig = SupabasePublicConfig;

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig | null {
  const result = getSupabasePublicConfigStatus();

  return result.ok ? result.config : null;
}

export function getSupabaseBrowserConfigMessage() {
  const result = getSupabasePublicConfigStatus();
  return result.ok ? "" : result.message;
}

export function isSupabaseBrowserConfigured() {
  return Boolean(getSupabaseBrowserConfig());
}

export function createSupabaseBrowserClient() {
  const config = getSupabaseBrowserConfig();

  if (!config) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.anonKey);
  }

  return browserClient;
}
