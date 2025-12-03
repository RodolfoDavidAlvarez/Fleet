#!/usr/bin/env node
/**
 * Script to add notify_on_repair column to users table
 * Run with: node scripts/add-notify-on-repair-column.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration.');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addNotifyOnRepairColumn() {
  console.log('🚀 Adding notify_on_repair column to users table...\n');

  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '..', 'supabase', 'add_notify_on_repair_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration using RPC (if available) or direct query
    // Since Supabase doesn't support direct SQL execution via API, we'll use a workaround
    // We'll check if column exists first, then add it if needed
    
    // Check if column exists
    const { data: columns, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(0);

    if (checkError && checkError.message.includes('notify_on_repair')) {
      console.log('✅ Column does not exist, needs to be added');
    }

    // Since Supabase API doesn't support DDL operations directly,
    // we need to use the SQL Editor or CLI
    console.log('⚠️  Supabase API does not support direct SQL execution.');
    console.log('   Please run this migration using one of these methods:\n');
    console.log('   Method 1: Supabase SQL Editor (Recommended)');
    console.log('   -------------------------------------------');
    console.log('   1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new');
    console.log('   2. Copy and paste the SQL below:');
    console.log('   3. Click "Run" (or press Cmd/Ctrl + Enter)\n');
    console.log('   SQL to run:');
    console.log('   ' + '='.repeat(60));
    console.log(migrationSQL);
    console.log('   ' + '='.repeat(60));
    console.log('\n   Method 2: Supabase CLI');
    console.log('   ----------------------');
    console.log('   supabase db execute -f supabase/add_notify_on_repair_column.sql\n');

    // Verify if column exists after migration
    console.log('   After running the migration, verify with:');
    console.log('   SELECT column_name FROM information_schema.columns');
    console.log('   WHERE table_name = \'users\' AND column_name = \'notify_on_repair\';\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addNotifyOnRepairColumn();

