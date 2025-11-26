// Validate Supabase Service Role Key format
require('dotenv').config({ path: '.env.local' });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Service Role Key Validation ===\n');

if (!serviceRoleKey) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE' || serviceRoleKey.includes('YOUR_SERVICE_ROLE_KEY')) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY still has placeholder value');
  console.log('   Current value:', serviceRoleKey);
  console.log('\n   Please replace it with your actual service role key from Supabase.');
  console.log('   See GET_SERVICE_ROLE_KEY.md for instructions.');
  process.exit(1);
}

// Check if it looks like a valid Supabase key
// New format: starts with 'sb_' (e.g., sb_secret_...)
// Old format: starts with 'eyJ' (JWT token)
const isValidFormat = serviceRoleKey.startsWith('sb_') || serviceRoleKey.startsWith('eyJ');
if (!isValidFormat) {
  console.log('⚠️  WARNING: Service role key format looks incorrect');
  console.log('   Expected format: starts with "sb_" (new) or "eyJ" (old JWT format)');
  console.log('   Make sure you copied the service_role key from "Secret keys" section,');
  console.log('   NOT the publishable key from the "Publishable key" section.');
}

// Check length (JWT tokens are typically 200+ characters)
if (serviceRoleKey.length < 100) {
  console.log('⚠️  WARNING: Service role key seems too short');
  console.log('   Length:', serviceRoleKey.length, 'characters');
  console.log('   Expected: 200+ characters');
  console.log('   You may have copied an incomplete key.');
}

// Check for common issues
if (serviceRoleKey.includes(' ')) {
  console.log('⚠️  WARNING: Key contains spaces - this will cause issues');
}

if (serviceRoleKey.includes('\n') || serviceRoleKey.includes('\r')) {
  console.log('⚠️  WARNING: Key contains line breaks - this will cause issues');
}

console.log('✅ Key format looks valid');
console.log('   Length:', serviceRoleKey.length, 'characters');
console.log('   Starts with:', serviceRoleKey.substring(0, 20) + '...');
console.log('\n   Now test the connection: node test-db-connection.js');

