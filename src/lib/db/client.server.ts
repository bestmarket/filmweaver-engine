/**
 * Database access layer.
 *
 * The app uses its own authentication, so every table is locked with RLS and
 * has no public policies: the only way in is this server-side service client,
 * which is reachable exclusively from `createServerFn` handlers.
 *
 * Ownership is therefore enforced in code — always scope queries by user_id,
 * or go through the guards in src/lib/auth/authorize.ts.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "@/lib/config/env.server";

let cached: SupabaseClient | undefined;

export function getDb(): SupabaseClient {
  if (!cached) {
    cached = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
