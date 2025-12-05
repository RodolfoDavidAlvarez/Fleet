// Apply notify_on_repair column migration via Supabase API
// This script applies the migration using the service role key

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
  console.error("   Add it to your .env.local file and run:");
  console.error("   node apply-notify-on-repair-migration.js");
  console.error("");
  console.error("   Or use the Supabase SQL Editor instead:");
  console.error("   https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log("🚀 Applying notify_on_repair Migration");
  console.log("======================================\n");

  const migrationFile = path.join(__dirname, "supabase/migrations/20251210000000_add_notify_on_repair_column.sql");

  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, "utf8");

  console.log("📋 Migration SQL:");
  console.log("----------------------------------------");
  console.log(sql);
  console.log("----------------------------------------\n");

  try {
    // Supabase doesn't have a direct SQL execution endpoint via JS client
    // We need to use the REST API or RPC functions
    // For now, we'll provide instructions

    console.log("⚠️  Note: Supabase JS client does not support direct SQL execution.");
    console.log("   Please use one of these methods:\n");

    console.log("📋 Method 1: Supabase SQL Editor (Recommended)");
    console.log("---------------------------------------------");
    console.log("1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new");
    console.log("2. Copy and paste the SQL above");
    console.log('3. Click "Run" (or press Cmd/Ctrl + Enter)\n');

    console.log("📋 Method 2: Supabase CLI");
    console.log("------------------------");
    console.log("   supabase db execute -f supabase/migrations/20251210000000_add_notify_on_repair_column.sql\n");

    console.log("✅ After applying, verify with:");
    console.log("   SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_on_repair';");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

applyMigration().catch(console.error);
