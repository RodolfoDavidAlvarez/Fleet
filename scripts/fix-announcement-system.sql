-- ============================================
-- FIX MESSAGE TEMPLATES RLS POLICY
-- ============================================

-- The current policy only allows authenticated users, but we need
-- to allow the API route to access it regardless of auth state
-- since the API route handles auth separately

DROP POLICY IF EXISTS "Allow authenticated users to read message templates" ON message_templates;

CREATE POLICY "Allow anyone to read message templates via API"
  ON message_templates FOR SELECT
  USING (true);


-- ============================================
-- CREATE MESSAGE LOGS TABLE
-- ============================================

-- This table tracks all messages sent (both immediate and scheduled)
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Message details
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'both')),
  subject TEXT,
  message_content TEXT NOT NULL,

  -- Recipient info
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('individual', 'group', 'custom')),
  recipient_identifier TEXT NOT NULL, -- email/phone/group name
  recipient_name TEXT,

  -- Sending info
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Related records
  scheduled_message_id UUID REFERENCES scheduled_messages(id) ON DELETE SET NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,

  -- Metadata
  was_scheduled BOOLEAN DEFAULT false,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at
  ON message_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_logs_recipient
  ON message_logs(recipient_identifier);

CREATE INDEX IF NOT EXISTS idx_message_logs_status
  ON message_logs(status);

CREATE INDEX IF NOT EXISTS idx_message_logs_scheduled_message
  ON message_logs(scheduled_message_id);

-- Enable RLS
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read message logs
CREATE POLICY "Allow authenticated users to read message logs"
  ON message_logs FOR SELECT
  TO authenticated
  USING (true);

-- Allow system to insert message logs
CREATE POLICY "Allow anyone to insert message logs via API"
  ON message_logs FOR INSERT
  WITH CHECK (true);


-- ============================================
-- ADD MISSING COLUMNS TO SCHEDULED_MESSAGES
-- ============================================

-- Add processed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_messages'
    AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE scheduled_messages ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add error_details column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_messages'
    AND column_name = 'error_details'
  ) THEN
    ALTER TABLE scheduled_messages ADD COLUMN error_details TEXT;
  END IF;
END $$;


-- ============================================
-- SUMMARY VIEW FOR ANNOUNCEMENTS DASHBOARD
-- ============================================

CREATE OR REPLACE VIEW announcement_summary AS
SELECT
  'templates' as type,
  COUNT(*) as count
FROM message_templates
UNION ALL
SELECT
  'scheduled_pending' as type,
  COUNT(*) as count
FROM scheduled_messages
WHERE status = 'pending'
UNION ALL
SELECT
  'scheduled_total' as type,
  COUNT(*) as count
FROM scheduled_messages
UNION ALL
SELECT
  'logs_total' as type,
  COUNT(*) as count
FROM message_logs
UNION ALL
SELECT
  'logs_sent' as type,
  COUNT(*) as count
FROM message_logs
WHERE status = 'sent'
UNION ALL
SELECT
  'logs_failed' as type,
  COUNT(*) as count
FROM message_logs
WHERE status = 'failed';
