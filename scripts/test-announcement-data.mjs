import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing announcement data retrieval...\n');

// Test with service role (should work)
console.log('1️⃣ Testing with SERVICE ROLE key (bypasses RLS):');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const { data: templatesAdmin, error: templatesAdminError } = await supabaseAdmin
  .from('message_templates')
  .select('*');

if (templatesAdminError) {
  console.log('❌ Error fetching templates:', templatesAdminError.message);
} else {
  console.log(`✅ Found ${templatesAdmin?.length || 0} templates`);
  if (templatesAdmin && templatesAdmin.length > 0) {
    console.log('   Sample:', templatesAdmin[0]);
  }
}

const { data: messagesAdmin, error: messagesAdminError } = await supabaseAdmin
  .from('scheduled_messages')
  .select('*');

if (messagesAdminError) {
  console.log('❌ Error fetching scheduled messages:', messagesAdminError.message);
} else {
  console.log(`✅ Found ${messagesAdmin?.length || 0} scheduled messages`);
  if (messagesAdmin && messagesAdmin.length > 0) {
    console.log('   Sample:', messagesAdmin[0]);
  }
}

// Test with anon key (simulates frontend)
console.log('\n2️⃣ Testing with ANON key (requires RLS policies):');
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

const { data: templatesAnon, error: templatesAnonError } = await supabaseAnon
  .from('message_templates')
  .select('*');

if (templatesAnonError) {
  console.log('❌ Error fetching templates with anon key:', templatesAnonError.message);
  console.log('   This means RLS is blocking unauthenticated access (expected behavior)');
} else {
  console.log(`✅ Found ${templatesAnon?.length || 0} templates with anon key`);
}

const { data: messagesAnon, error: messagesAnonError } = await supabaseAnon
  .from('scheduled_messages')
  .select('*');

if (messagesAnonError) {
  console.log('❌ Error fetching scheduled messages with anon key:', messagesAnonError.message);
  console.log('   This means RLS is blocking unauthenticated access (expected behavior)');
} else {
  console.log(`✅ Found ${messagesAnon?.length || 0} scheduled messages with anon key`);
}

console.log('\n📋 Summary:');
console.log('The issue is likely that the frontend needs to be authenticated to access the data.');
console.log('The API routes should use the server-side Supabase client which has auth context.');
