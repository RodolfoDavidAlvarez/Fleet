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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const messageTemplatesSQL = `
-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  message_en TEXT NOT NULL,
  message_es TEXT,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'both')),
  category TEXT NOT NULL DEFAULT 'announcement',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read message templates" ON message_templates;
DROP POLICY IF EXISTS "Allow admins to insert message templates" ON message_templates;
DROP POLICY IF EXISTS "Allow admins to update message templates" ON message_templates;
DROP POLICY IF EXISTS "Allow admins to delete message templates" ON message_templates;

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read message templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for admins to insert
CREATE POLICY "Allow admins to insert message templates"
  ON message_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.approval_status = 'approved'
    )
  );

-- Create policy for admins to update
CREATE POLICY "Allow admins to update message templates"
  ON message_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.approval_status = 'approved'
    )
  );

-- Create policy for admins to delete
CREATE POLICY "Allow admins to delete message templates"
  ON message_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.approval_status = 'approved'
    )
  );
`;

const scheduledMessagesSQL = `
-- Create scheduled_messages table
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'both')),
  subject TEXT,
  message_en TEXT NOT NULL,
  message_es TEXT,
  recipient_groups TEXT[] DEFAULT '{}',
  individual_recipients JSONB DEFAULT '[]',
  custom_recipients TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for scheduled_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_at
  ON scheduled_messages(scheduled_at);

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status
  ON scheduled_messages(status);

-- Enable RLS
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read scheduled messages" ON scheduled_messages;
DROP POLICY IF EXISTS "Allow admins to insert scheduled messages" ON scheduled_messages;
DROP POLICY IF EXISTS "Allow admins to update scheduled messages" ON scheduled_messages;

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read scheduled messages"
  ON scheduled_messages FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for admins to insert
CREATE POLICY "Allow admins to insert scheduled messages"
  ON scheduled_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.approval_status = 'approved'
    )
  );

-- Create policy for admins to update
CREATE POLICY "Allow admins to update scheduled messages"
  ON scheduled_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.approval_status = 'approved'
    )
  );
`;

async function checkAndCreateTables() {
  console.log('🔍 Checking announcement and messaging tables...\n');

  try {
    // Check if message_templates table exists
    console.log('Checking message_templates table...');
    const { data: templates, error: templatesError } = await supabase
      .from('message_templates')
      .select('*')
      .limit(1);

    if (templatesError && templatesError.code === '42P01') {
      console.log('❌ message_templates table does not exist\n');
      console.log('📋 SQL to create message_templates table:');
      console.log('─'.repeat(80));
      console.log(messageTemplatesSQL);
      console.log('─'.repeat(80));
      console.log('\n⚠️  Please run this SQL in your Supabase SQL Editor\n');
    } else if (templatesError) {
      console.error('❌ Error checking message_templates:', templatesError.message);
    } else {
      console.log('✅ message_templates table exists');
      console.log(`   Found ${templates?.length || 0} template(s)`);
    }

    // Check if scheduled_messages table exists
    console.log('\nChecking scheduled_messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .limit(1);

    if (messagesError && messagesError.code === '42P01') {
      console.log('❌ scheduled_messages table does not exist\n');
      console.log('📋 SQL to create scheduled_messages table:');
      console.log('─'.repeat(80));
      console.log(scheduledMessagesSQL);
      console.log('─'.repeat(80));
      console.log('\n⚠️  Please run this SQL in your Supabase SQL Editor\n');
    } else if (messagesError) {
      console.error('❌ Error checking scheduled_messages:', messagesError.message);
    } else {
      console.log('✅ scheduled_messages table exists');
      console.log(`   Found ${messages?.length || 0} scheduled message(s)`);
    }

    // Show current counts
    if (!templatesError && !messagesError) {
      console.log('\n📊 Current data:');
      const { count: templateCount } = await supabase
        .from('message_templates')
        .select('*', { count: 'exact', head: true });
      console.log(`   Templates: ${templateCount || 0}`);

      const { count: scheduledCount } = await supabase
        .from('scheduled_messages')
        .select('*', { count: 'exact', head: true });
      console.log(`   Scheduled Messages: ${scheduledCount || 0}`);
    }

    console.log('\n✅ Check complete!');
    console.log('\nTo create missing tables:');
    console.log('1. Go to https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new');
    console.log('2. Copy and paste the SQL shown above');
    console.log('3. Click "Run" to execute\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndCreateTables();
