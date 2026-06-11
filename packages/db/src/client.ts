import { createClient } from "@supabase/supabase-js";
import type { Database } from "@haunt/types";

/**
 * Browser / client-side client. Uses the ANON key only — RLS is the security
 * boundary (data-model skill §4). NEVER pass the service role key here.
 */
export function createBrowserClient(url: string, anonKey: string) {
  return createClient<Database>(url, anonKey);
}

/**
 * Trusted server / scripts only (seed, edge functions). Uses the SERVICE ROLE
 * key, which BYPASSES RLS. Never expose this client or its key to any client.
 */
export function createServiceClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
