import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs";

// Client for client-side operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (for API routes)
// Uses service role key if available, otherwise falls back to anon key
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
