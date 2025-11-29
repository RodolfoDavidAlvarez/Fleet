import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "./supabase/server";
import { createClient as createBrowserClient } from "./supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs";

// Client for client-side operations (uses anon key) - Legacy support
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (for API routes/Admin Ops - Service Role)
// Uses service role key if available, otherwise falls back to anon key
// This function creates a client with the SERVICE ROLE key for admin tasks
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
    console.error("   This is required for server-side database operations.");
    console.error("   Get it from: Supabase Dashboard > Settings > API > service_role key");
    console.error("   Add it to your .env.local file as: SUPABASE_SERVICE_ROLE_KEY=your_key_here");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Server-side Supabase access is blocked for safety. Check server logs for details.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Exports for the new Auth System (SSR)
export { createAuthClient, createBrowserClient };