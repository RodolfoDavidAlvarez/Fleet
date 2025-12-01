// Test database connection
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Database Connection Test ===\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
console.log('Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'NOT SET (REQUIRED FOR SERVER OPERATIONS)\n');

async function testConnection() {
  try {
    // Test 1: Anon client (client-side)
    console.log('Test 1: Testing anon client connection...');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonData, error: anonError } = await anonClient.from('users').select('id').limit(1);
    
    if (anonError) {
      console.log('❌ Anon client error:', anonError.message);
    } else {
      console.log('✅ Anon client connected successfully');
    }

    // Test 2: Service role client (server-side)
    if (!serviceRoleKey) {
      console.log('\n❌ SERVICE_ROLE_KEY is missing! This is required for server-side operations.');
      console.log('   All API routes will fail without this key.');
      console.log('   Get it from: Supabase Dashboard > Settings > API > service_role key');
      return;
    }

    console.log('\nTest 2: Testing service role client connection...');
    const serverClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test basic query
    const { data: users, error: usersError } = await serverClient.from('users').select('id, email, role').limit(5);
    if (usersError) {
      console.log('❌ Service role client error:', usersError.message);
      console.log('   Error details:', JSON.stringify(usersError, null, 2));
    } else {
      console.log('✅ Service role client connected successfully');
      console.log(`   Found ${users?.length || 0} users`);
    }

    // Test jobs table
    console.log('\nTest 3: Testing jobs table...');
    const { data: jobs, error: jobsError } = await serverClient.from('jobs').select('id').limit(5);
    if (jobsError) {
      console.log('❌ Jobs table error:', jobsError.message);
      console.log('   This might indicate the table doesn\'t exist or RLS policies are blocking access');
    } else {
      console.log('✅ Jobs table accessible');
      console.log(`   Found ${jobs?.length || 0} jobs`);
    }

    // Test vehicles table
    console.log('\nTest 4: Testing vehicles table...');
    const { data: vehicles, error: vehiclesError } = await serverClient.from('vehicles').select('id').limit(5);
    if (vehiclesError) {
      console.log('❌ Vehicles table error:', vehiclesError.message);
    } else {
      console.log('✅ Vehicles table accessible');
      console.log(`   Found ${vehicles?.length || 0} vehicles`);
    }

    // Test mechanics table
    console.log('\nTest 5: Testing mechanics table...');
    const { data: mechanics, error: mechanicsError } = await serverClient.from('mechanics').select('id').limit(5);
    if (mechanicsError) {
      console.log('❌ Mechanics table error:', mechanicsError.message);
    } else {
      console.log('✅ Mechanics table accessible');
      console.log(`   Found ${mechanics?.length || 0} mechanics`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});







