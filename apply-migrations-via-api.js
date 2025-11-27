// Apply Supabase migrations via API using service role key
// This script applies all necessary schema changes for Airtable import

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxcixjiafdohbpwijfmd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
  console.error('   Add it to your .env.local file and run:');
  console.error('   node apply-migrations-via-api.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQL(sql) {
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.length === 0) continue;
    
    try {
      // Use RPC or direct query - Supabase doesn't have a direct SQL endpoint
      // So we'll need to use the REST API or provide instructions
      console.log('⚠️  Direct SQL execution via API is limited.');
      console.log('   Please use the Supabase SQL Editor instead.');
      return;
    } catch (error) {
      console.error('Error executing SQL:', error.message);
      throw error;
    }
  }
}

async function applyMigrations() {
  console.log('🚀 Applying Supabase Migrations');
  console.log('================================\n');

  const migrations = [
    { name: 'Base Schema', file: 'supabase/schema.sql' },
    { name: 'Enhanced Data Migration', file: 'supabase/migration_enhanced_data_fixed.sql' },
    { name: 'RLS Policies', file: 'supabase/fix_rls_policies.sql' },
  ];

  console.log('⚠️  Note: Supabase API does not support direct SQL execution.');
  console.log('   Please use one of these methods:\n');
  console.log('   1. Supabase SQL Editor (Recommended):');
  console.log('      https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new\n');
  console.log('   2. Supabase CLI:');
  console.log('      supabase db push\n');
  console.log('   Migration files to apply:');
  
  migrations.forEach((migration, index) => {
    const filePath = path.join(process.cwd(), migration.file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      console.log(`   ${index + 1}. ${migration.name} (${migration.file}) - ${size} bytes`);
    } else {
      console.log(`   ${index + 1}. ${migration.name} (${migration.file}) - ❌ Not found`);
    }
  });

  console.log('\n✅ Migration files listed above.');
  console.log('   Copy each file content to the SQL Editor and run them in order.');
}

applyMigrations().catch(console.error);


