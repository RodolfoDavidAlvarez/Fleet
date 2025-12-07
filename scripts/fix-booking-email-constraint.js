const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🔧 Running migration: Allow NULL customer_email in bookings table...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251206235000_allow_null_booking_email.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📝 Migration SQL:');
  console.log(sql);
  console.log('\n🔄 Executing...\n');

  // We need to use the Supabase management API or execute directly
  // Since exec_sql RPC might not exist, we'll use fetch to call the SQL directly
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      query: 'ALTER TABLE bookings ALTER COLUMN customer_email DROP NOT NULL;'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('⚠️  RPC method not available. Response:', errorText);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor (https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new):');
    console.log('\nALTER TABLE bookings ALTER COLUMN customer_email DROP NOT NULL;\n');
    console.log('After running it, the booking flow will work correctly.');
    return false;
  }

  console.log('✅ Migration completed successfully!');
  console.log('✅ customer_email column in bookings table now allows NULL values');
  console.log('✅ Booking flow should now work for repair requests without email addresses');
  return true;
}

runMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor (https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new):');
    console.log('\nALTER TABLE bookings ALTER COLUMN customer_email DROP NOT NULL;\n');
    process.exit(1);
  });
