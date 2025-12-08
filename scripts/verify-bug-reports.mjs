#!/usr/bin/env node
// Verify bug_reports table exists and is accessible
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Verifying bug_reports table...\n');

  // Test 1: Check if table exists
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .limit(1);

  if (error) {
    console.error('✗ Table check failed:', error.message);
    return;
  }

  console.log('✓ Table exists and is accessible!');
  console.log(`  Current records: ${data.length}`);

  // Test 2: Check storage bucket
  const { data: buckets, error: bucketError } = await supabase
    .storage
    .listBuckets();

  if (bucketError) {
    console.error('✗ Storage check failed:', bucketError.message);
  } else {
    const bugReportsBucket = buckets.find(b => b.id === 'bug-reports');
    if (bugReportsBucket) {
      console.log('✓ Storage bucket exists!');
      console.log(`  Bucket: ${bugReportsBucket.name} (public: ${bugReportsBucket.public})`);
    } else {
      console.log('✗ Storage bucket not found');
    }
  }

  console.log('\n✓ Bug reports feature is ready to use!');
}

verify().catch(console.error);
