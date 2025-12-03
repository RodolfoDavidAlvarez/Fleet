import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "./supabase/server";
import { createClient as createBrowserClient } from "./supabase/client";
import { getServiceRoleKey, getSupabaseEnv } from "./supabase/config";

const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

// Client for client-side operations (uses anon key) - Legacy support
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (for API routes/Admin Ops - Service Role)
// Uses service role key if available, otherwise falls back to anon key
// This function creates a client with the SERVICE ROLE key for admin tasks
export function createServerClient() {
  const serviceRoleKey = getServiceRoleKey();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Exports for the new Auth System (SSR)
export { createAuthClient, createBrowserClient };
