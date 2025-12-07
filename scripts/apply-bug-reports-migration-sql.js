#!/usr/bin/env node
/**
 * Alternative script to apply bug_reports migrations using direct SQL execution
 * This uses the Supabase REST API to execute SQL directly
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration.');
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLDirect(sql) {
  // Use the Supabase Management API or direct PostgreSQL connection
  // Since we have service role key, we can use the REST API
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => {
      const trimmed = stmt.trim();
      return trimmed && 
             !trimmed.startsWith('--') && 
             !trimmed.startsWith('/*') &&
             trimmed.length > 0;
    });

  console.log(`   Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    try {
      // Try using Supabase's query method (if available)
      // Note: This requires the SQL to be executed via a function or direct connection
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // If RPC doesn't exist, we need to create it first or use alternative method
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          console.log(`   ⚠️  Note: Some statements may need to be run manually via SQL Editor`);
          console.log(`   📋 Copy this SQL to Supabase SQL Editor:`);
          console.log(`   ${statement.substring(0, 100)}...`);
        } else {
          console.warn(`   ⚠️  Warning on statement ${i + 1}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
      }
    } catch (error) {
      console.warn(`   ⚠️  Error on statement ${i + 1}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Bug Reports Migration - SQL Editor Method');
  console.log('============================================\n');
  console.log('This script will prepare the SQL for you to run in Supabase SQL Editor.\n');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  const migrations = [
    {
      file: '20250104000000_create_bug_reports.sql',
      description: 'Create bug_reports table',
    },
    {
      file: '20250105000000_add_application_source_to_bug_reports.sql',
      description: 'Add application_source column',
    },
    {
      file: '20250106000000_create_bug_reports_storage_bucket.sql',
      description: 'Create storage bucket',
    },
  ];

  console.log('📋 Migration SQL Files:\n');
  
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration.file);
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 ${migration.description}`);
      console.log(`   File: ${migration.file}`);
      console.log(`${'='.repeat(60)}`);
      console.log(sql);
      console.log(`\n`);
    } else {
      console.log(`⚠️  File not found: ${migration.file}`);
    }
  }

  console.log('\n📝 Instructions:');
  console.log('1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new');
  console.log('2. Copy and paste each SQL block above (one at a time)');
  console.log('3. Click "Run" (or press Cmd/Ctrl + Enter)');
  console.log('4. Wait for success message before moving to next migration');
  console.log('\n✅ After running all migrations, the bug_reports feature will work!');
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
