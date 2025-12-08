import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQLFile() {
  console.log('🔧 Applying announcement system fixes...\n');

  const sqlPath = join(__dirname, 'fix-announcement-system.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('📋 SQL Script to Execute:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));

  console.log('\n⚠️  Execute this SQL in Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new\n');

  console.log('✅ After running the SQL, the announcement system will:');
  console.log('   1. Allow templates to be read by the API');
  console.log('   2. Track all sent messages in message_logs table');
  console.log('   3. Show proper labels for scheduled vs immediate messages');
  console.log('   4. Display comprehensive message history\n');
}

applySQLFile();
