# Announcement System Setup Instructions

## Issue
The announcement and messaging system needs database tables to be created and RLS policies to be fixed.

## Quick Setup

### Step 1: Open Supabase SQL Editor
Visit: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new

### Step 2: Copy and Execute the Following SQL

```sql
-- ============================================
-- FIX MESSAGE TEMPLATES RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read message templates" ON message_templates;

CREATE POLICY "Allow anyone to read message templates via API"
  ON message_templates FOR SELECT
  USING (true);


-- ============================================
-- CREATE MESSAGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'both')),
  subject TEXT,
  message_content TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('individual', 'group', 'custom')),
  recipient_identifier TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_message_id UUID REFERENCES scheduled_messages(id) ON DELETE SET NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  was_scheduled BOOLEAN DEFAULT false,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient_identifier);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_scheduled_message ON message_logs(scheduled_message_id);

ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read message logs" ON message_logs;
DROP POLICY IF EXISTS "Allow anyone to insert message logs via API" ON message_logs;

CREATE POLICY "Allow authenticated users to read message logs"
  ON message_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anyone to insert message logs via API"
  ON message_logs FOR INSERT
  WITH CHECK (true);


-- ============================================
-- ADD MISSING COLUMNS TO SCHEDULED_MESSAGES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_messages' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE scheduled_messages ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_messages' AND column_name = 'error_details'
  ) THEN
    ALTER TABLE scheduled_messages ADD COLUMN error_details TEXT;
  END IF;
END $$;
```

### Step 3: Verify Setup
Run the following to verify:
```sql
SELECT COUNT(*) as template_count FROM message_templates;
SELECT COUNT(*) as scheduled_count FROM scheduled_messages;
SELECT COUNT(*) as log_count FROM message_logs;
```

### Step 4: Refresh the Application
1. Go back to the Announcements page
2. Refresh the page
3. You should now see:
   - Saved Templates tab with your templates
   - Scheduled Messages tab with your scheduled messages
   - Message Logs tab with a history of all sent messages

## What This Fixes

1. **Message Templates Loading**: Fixes RLS policy so templates can be read by the API
2. **Message Logs Tracking**: Creates table to track all sent messages (email/SMS)
3. **Scheduled Messages Metadata**: Adds columns to track when messages were processed
4. **Complete Audit Trail**: Shows who sent what, when, and whether it succeeded

## Features After Setup

- ✅ View all saved message templates
- ✅ View all scheduled messages (pending, sent, failed)
- ✅ View complete history of all sent messages
- ✅ See delivery status for each message (sent/failed)
- ✅ Track whether messages were immediate or scheduled
- ✅ Filter logs by status, type, recipient

## Database Schema

### message_logs
- Tracks every message sent (immediate or scheduled)
- Stores recipient details, delivery status, errors
- Links to scheduled_message if it was scheduled
- Links to template if a template was used
- Records who sent it and when

### message_templates
- Stores reusable message templates
- Supports email, SMS, or both
- Categorized for easy organization

### scheduled_messages
- Stores messages scheduled for future delivery
- Tracks processing status and results
- Shows sent/failed counts after processing
