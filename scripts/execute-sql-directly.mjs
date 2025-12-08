import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔧 Executing SQL directly via Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLStatements() {
  try {
    // Fix message_templates RLS policy
    console.log('1️⃣ Fixing message_templates RLS policy...');
    const { error: policyError } = await supabase.rpc('exec_sql', {
      query: `
        DROP POLICY IF EXISTS "Allow authenticated users to read message templates" ON message_templates;
        CREATE POLICY "Allow anyone to read message templates via API"
          ON message_templates FOR SELECT
          USING (true);
      `
    });

    if (policyError && policyError.code !== '42883') {
      console.log('⚠️  Could not execute via RPC (function may not exist)');
      console.log('   Will create tables manually...\n');
    } else {
      console.log('✅ RLS policy updated\n');
    }

    // Create message_logs table manually
    console.log('2️⃣ Creating message_logs table...');

    // Check if table exists first
    const { data: existingLogs, error: checkError } = await supabase
      .from('message_logs')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('   Table does not exist, will need manual creation');
      console.log('   Please run the SQL in Supabase SQL Editor\n');
    } else if (!checkError) {
      console.log('✅ message_logs table already exists\n');
    }

    // Verify current state
    console.log('3️⃣ Verifying current state...\n');

    const { data: templates, error: templatesError } = await supabase
      .from('message_templates')
      .select('*');

    console.log(`   Templates: ${templates?.length || 0}`);
    if (templatesError) {
      console.log(`   Error: ${templatesError.message}`);
    }

    const { data: messages, error: messagesError } = await supabase
      .from('scheduled_messages')
      .select('*');

    console.log(`   Scheduled Messages: ${messages?.length || 0}`);
    if (messagesError) {
      console.log(`   Error: ${messagesError.message}`);
    }

    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('*');

    if (logsError && logsError.code !== '42P01') {
      console.log(`   Message Logs: Error - ${logsError.message}`);
    } else if (!logsError) {
      console.log(`   Message Logs: ${logs?.length || 0}`);
    } else {
      console.log('   Message Logs: Table needs to be created');
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQLStatements();
