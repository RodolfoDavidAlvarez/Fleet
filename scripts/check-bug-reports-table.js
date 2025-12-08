// Script to check and create bug_reports table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTable() {
  console.log('Checking if bug_reports table exists...');

  // Try to query the table
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Table does not exist or error querying:', error.message);
    console.log('\nCreating bug_reports table...');

    // Run the complete setup SQL
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
-- Create bug_reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  application_source TEXT NOT NULL DEFAULT 'fleet-management'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_application_source ON bug_reports(application_source);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
      `
    });

    if (sqlError) {
      console.error('Error creating table:', sqlError);
    } else {
      console.log('Table created successfully!');
    }
  } else {
    console.log('Table already exists!');
    console.log('Sample data:', data);
  }
}

checkAndCreateTable().catch(console.error);
