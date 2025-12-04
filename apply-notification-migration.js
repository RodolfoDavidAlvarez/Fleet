#!/usr/bin/env node
// Apply notification settings migration to Supabase database
// This script executes SQL via a direct database connection

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Notification Settings Migration');
console.log('===================================\n');

// Read the migration file
const migrationSQL = fs.readFileSync('supabase/migrations/20251203000000_notification_settings.sql', 'utf8');

console.log('📋 Migration will create:');
console.log('   ✓ notification_assignments table');
console.log('   ✓ notification_message_templates table');
console.log('   ✓ Indexes and triggers');
console.log('');

// Read connection string from .env.local
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (err) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from URL');
  process.exit(1);
}

console.log(`📦 Project: ${projectRef}`);
console.log('');
console.log('⚠️  This migration cannot be applied via REST API.');
console.log('   Supabase requires SQL Editor or CLI for DDL operations.');
console.log('');
console.log('📋 COPY THIS SQL and paste it into the SQL Editor:');
console.log('   👉 https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
console.log('');
console.log('─'.repeat(80));
console.log(migrationSQL);
console.log('─'.repeat(80));
console.log('');
console.log('✅ After pasting, click "Run" in the SQL Editor');
console.log('');

// Also write to a temp file for easy copying
fs.writeFileSync('/tmp/notification_migration.sql', migrationSQL);
console.log('💾 SQL also saved to: /tmp/notification_migration.sql');
console.log('');

