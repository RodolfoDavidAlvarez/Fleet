#!/usr/bin/env node
// Script to create bug_reports table using Supabase client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTable() {
  console.log('Checking if bug_reports table exists...\n');

  // First check if table exists
  const { data: existingData, error: checkError } = await supabase
    .from('bug_reports')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✓ Table already exists!');
    return;
  }

  console.log('Table does not exist. Creating...\n');

  // Read the migration SQL
  const sql = readFileSync(
    join(__dirname, '..', 'supabase', 'migrations', '000_bug_reports_complete_setup.sql'),
    'utf8'
  );

  // Split SQL into individual statements (simple split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: statement })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`Warning: ${error.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`Warning: ${err.message}`);
    }
  }

  console.log('\n✓ Migration complete!');
  console.log('\nVerifying table exists...');

  const { data, error } = await supabase
    .from('bug_reports')
    .select('id')
    .limit(1);

  if (error) {
    console.error('✗ Table still does not exist:', error.message);
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new');
    console.log('\nSQL to run:');
    console.log(sql.substring(0, 500) + '...\n');
  } else {
    console.log('✓ Table verified successfully!');
  }
}

createTable().catch(console.error);
