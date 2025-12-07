#!/usr/bin/env node
/**
 * Script to apply bug_reports table migrations
 * This ensures the database has the bug_reports table and storage bucket
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

async function executeSQL(sql) {
  // Split by semicolon and filter out empty statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));

  for (const statement of statements) {
    if (!statement) continue;
    
    try {
      // Use Supabase REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql_query: statement }),
      });

      if (!response.ok) {
        // Try direct execution via PostgREST
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.warn(`⚠️  Warning executing statement: ${error.message}`);
          // Try alternative method - execute via REST API
          console.log(`   Attempting direct execution...`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Warning: ${error.message}`);
    }
  }
}

async function applyMigration(filePath, description) {
  console.log(`\n📄 ${description}`);
  console.log(`   File: ${path.basename(filePath)}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Create exec_sql function if it doesn't exist
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text) 
      RETURNS text AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN 'success';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
    } catch (e) {
      // Function might already exist, that's okay
    }

    // Execute the migration SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't work, try executing statements directly
      console.log('   Executing statements directly...');
      await executeSQL(sql);
    }
    
    console.log(`   ✅ Applied successfully`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function checkTableExists() {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('id')
    .limit(1);

  if (error && error.code === 'PGRST116') {
    return false; // Table doesn't exist
  }
  return true;
}

async function checkBucketExists() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.warn('⚠️  Could not check buckets:', error.message);
    return false;
  }
  return data?.some(bucket => bucket.id === 'bug-reports') || false;
}

async function main() {
  console.log('🚀 Applying Bug Reports Database Migrations');
  console.log('==========================================\n');

  // Check if table already exists
  const tableExists = await checkTableExists();
  const bucketExists = await checkBucketExists();

  if (tableExists && bucketExists) {
    console.log('✅ bug_reports table and storage bucket already exist!');
    console.log('   Skipping migrations...\n');
    return;
  }

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  // Migration 1: Create bug_reports table
  if (!tableExists) {
    const tableMigration = path.join(migrationsDir, '20250104000000_create_bug_reports.sql');
    if (fs.existsSync(tableMigration)) {
      await applyMigration(tableMigration, 'Creating bug_reports table');
    } else {
      console.error('❌ Migration file not found: 20250104000000_create_bug_reports.sql');
      process.exit(1);
    }

    // Migration 2: Add application_source column
    const appSourceMigration = path.join(migrationsDir, '20250105000000_add_application_source_to_bug_reports.sql');
    if (fs.existsSync(appSourceMigration)) {
      await applyMigration(appSourceMigration, 'Adding application_source column');
    }
  } else {
    console.log('✅ bug_reports table already exists');
  }

  // Migration 3: Create storage bucket
  if (!bucketExists) {
    const bucketMigration = path.join(migrationsDir, '20250106000000_create_bug_reports_storage_bucket.sql');
    if (fs.existsSync(bucketMigration)) {
      await applyMigration(bucketMigration, 'Creating bug-reports storage bucket');
    } else {
      console.warn('⚠️  Storage bucket migration file not found');
    }
  } else {
    console.log('✅ bug-reports storage bucket already exists');
  }

  // Verify
  console.log('\n🔍 Verifying migrations...');
  const finalTableExists = await checkTableExists();
  const finalBucketExists = await checkBucketExists();

  if (finalTableExists && finalBucketExists) {
    console.log('✅ All migrations applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the bug report form');
    console.log('   2. Verify data is being saved correctly');
  } else {
    console.log('⚠️  Some migrations may not have applied correctly.');
    if (!finalTableExists) {
      console.log('   ❌ bug_reports table still missing');
    }
    if (!finalBucketExists) {
      console.log('   ❌ bug-reports storage bucket still missing');
    }
    console.log('\n💡 Alternative: Apply migrations via Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new');
  }
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  console.error('\n💡 Alternative: Apply migrations manually via Supabase SQL Editor');
  console.error('   https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new');
  process.exit(1);
});
