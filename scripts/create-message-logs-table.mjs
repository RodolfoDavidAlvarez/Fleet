import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxcixjiafdohbpwijfmd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEzNzc1MCwiZXhwIjoyMDc5NzEzNzUwfQ.CkLJXohBKk4kdZWNslbw-SwxOi8MVXQDLM4FarU_0zw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMessageLogsTable() {
  console.log('Creating message_logs table via Supabase SQL...');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // This won't work directly - we need to use the SQL Editor in dashboard
    })
  });

  console.log('Note: Direct SQL execution requires the Supabase Dashboard SQL Editor.');
  console.log('Please run the following SQL in your Supabase Dashboard:\n');

  const sql = `
-- Create message_logs table
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'both')),
  subject VARCHAR(500),
  message_content TEXT NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('individual', 'group', 'custom')),
  recipient_identifier VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  was_scheduled BOOLEAN DEFAULT FALSE,
  scheduled_message_id UUID REFERENCES public.scheduled_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON public.message_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON public.message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON public.message_logs(recipient_identifier);

-- Enable RLS
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (service role bypasses RLS anyway)
CREATE POLICY "Enable all operations for message_logs" ON public.message_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.message_logs TO authenticated;
GRANT ALL ON public.message_logs TO service_role;
`;

  console.log(sql);

  // Let's try inserting the table using a migration approach
  // We'll create the table by inserting a test record that will fail but give us info
  console.log('\n--- Attempting to create table via edge function workaround ---');
}

async function main() {
  await createMessageLogsTable();
}

main();
