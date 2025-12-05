#!/usr/bin/env node
// Automatically apply notify_on_repair column migration to Supabase database
// This script uses PostgreSQL connection to execute SQL directly

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_DB_PASSWORD) {
  console.error("❌ SUPABASE_DB_PASSWORD is not set in environment variables.");
  console.error("   Add it to your .env.local file:");
  console.error("   SUPABASE_DB_PASSWORD=your_database_password");
  console.error("");
  console.error("   To get your database password:");
  console.error("   1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/settings/database");
  console.error("   2. Find 'Database password' section");
  console.error("   3. Copy the password (or reset it if needed)");
  console.error("");
  console.error("   Or use the Supabase SQL Editor instead:");
  console.error("   https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new");
  process.exit(1);
}

const migrationFile = path.join(__dirname, "supabase/migrations/20251210000000_add_notify_on_repair_column.sql");

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(migrationFile, "utf8");

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error("❌ Could not extract project ref from URL");
  process.exit(1);
}

async function applyMigration() {
  console.log("🚀 Automatically Applying notify_on_repair Migration");
  console.log("===================================================\n");
  console.log(`📦 Project: ${projectRef}`);
  console.log(`📋 Migration: ${migrationFile}\n`);

  // Construct connection string
  // Try direct connection first (port 5432)
  // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  const connectionString = `postgresql://postgres:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("📡 Connecting to database...");
    await client.connect();
    console.log("✅ Connected successfully\n");

    // Check if column already exists
    console.log("🔍 Checking if column already exists...");
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'notify_on_repair'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ Column 'notify_on_repair' already exists!");
      console.log("   Migration not needed.\n");
      await client.end();
      return;
    }

    console.log("ℹ️  Column does not exist. Applying migration...\n");

    // Execute the migration
    console.log("📋 Executing migration SQL...");
    await client.query(sql);
    console.log("✅ Migration applied successfully!\n");

    // Verify the migration
    console.log("🔍 Verifying migration...");
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'notify_on_repair'
    `);

    if (verifyResult.rows.length > 0) {
      const column = verifyResult.rows[0];
      console.log("✅ Verification successful!");
      console.log(`   Column: ${column.column_name}`);
      console.log(`   Type: ${column.data_type}`);
      console.log(`   Default: ${column.column_default || "NULL"}\n`);

      // Check how many users have it set to true
      const countResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE notify_on_repair = true
      `);
      console.log(`📊 Users with notify_on_repair=true: ${countResult.rows[0].count}\n`);
    } else {
      console.log("⚠️  Could not verify column creation. Please check manually.\n");
    }

    await client.end();
    console.log("✅ Migration completed successfully!\n");
  } catch (error) {
    console.error("❌ Error applying migration:", error.message);

    if (error.message.includes("password authentication failed")) {
      console.error("\n💡 The database password is incorrect.");
      console.error("   Please check SUPABASE_DB_PASSWORD in your .env.local file.\n");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Could not connect to database.");
      console.error("   Please check your network connection and Supabase project status.\n");
    } else {
      console.error("\n💡 If automatic migration fails, apply manually:");
      console.error("   1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new");
      console.error("   2. Copy and paste the SQL from the migration file\n");
    }

    await client.end().catch(() => {});
    process.exit(1);
  }
}

applyMigration().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
