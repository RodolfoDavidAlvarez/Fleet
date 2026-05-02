#!/usr/bin/env node
/**
 * Expand the CHECK constraint on vehicles.status to allow the 11 statuses
 * the form already presents to users. Without this, the form's default
 * status ("operational") fails at the DB layer, which has been silently
 * blocking ALL add-vehicle attempts via the admin form.
 *
 * SAFETY:
 *   - Only modifies the CHECK constraint, no data is changed
 *   - 'active' (the only status currently in use) remains valid
 *   - Idempotent: running twice is a no-op
 *   - Dry-run by default
 *
 * Usage:
 *   node scripts/expand-vehicles-status-constraint.js
 *   node scripts/expand-vehicles-status-constraint.js --apply
 */

const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");

const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const SB = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"([^\"]+)\"/)[1];
const SR = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"([^\"]+)\"/)[1];
// Need direct Postgres for DDL — use the project's pooler if available
const PG = env.match(/SUPABASE_DB_URL=\"([^\"]+)\"/)?.[1] || env.match(/DATABASE_URL=\"([^\"]+)\"/)?.[1];

const SQL = `
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check CHECK (status IN (
  'operational','active','in_service','broken_down','for_sale','idle',
  'upcoming','retired','maintenance','reserved','out_of_service'
));
`.trim();

(async () => {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN ===\n");
  console.log("Will run:\n" + SQL + "\n");

  if (!APPLY) {
    console.log("DRY RUN — no writes. Re-run with --apply.");
    return;
  }

  if (!PG) {
    console.error("FATAL: Need SUPABASE_DB_URL or DATABASE_URL in .env.local for DDL.");
    console.error("Falling back: please run the SQL above manually in Supabase SQL editor:");
    console.error("https://supabase.com/dashboard/project/" + SB.split("//")[1].split(".")[0] + "/sql/new");
    process.exit(1);
  }

  // Use pg driver if available
  const { Client } = require("pg");
  const client = new Client({ connectionString: PG, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(SQL);
  await client.end();
  console.log("Done. Constraint updated.");
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
