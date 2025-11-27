// Run the trigger fix migration using Supabase client
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxcixjiafdohbpwijfmd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🚀 Running Trigger Fix Migration');
  console.log('================================\n');

  const migrationFile = path.join(__dirname, 'supabase/migrations/20250101120000_fix_trigger.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('📄 Executing migration...\n');

  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Supabase JS client doesn't support direct SQL execution
    // We need to use the REST API or Management API
    // For now, let's try using the REST API with a custom RPC call
    
    // Actually, the best way is to use psql or the SQL Editor
    // But let's provide a helpful error message
    
    console.log('⚠️  The Supabase JS client cannot execute arbitrary SQL directly.');
    console.log('   However, you can run this migration via:\n');
    console.log('   1. Supabase SQL Editor (Easiest):');
    console.log(`      👉 https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new\n`);
    console.log('   2. Using psql command line:\n');
    console.log('      psql "postgresql://postgres:[PASSWORD]@db.kxcixjiafdohbpwijfmd.supabase.co:5432/postgres" -f supabase/migrations/20250101120000_fix_trigger.sql\n');
    console.log('   3. Or copy/paste this SQL into the SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    
    // Try to use the Management API if available
    // This requires the project API key which is different from service role key
    console.log('\n💡 For automated execution, you would need:');
    console.log('   - Database password (from Supabase Dashboard > Settings > Database)');
    console.log('   - Or use Supabase CLI: supabase db push\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration().catch(console.error);

