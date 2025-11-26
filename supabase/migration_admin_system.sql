-- Migration Script: Admin System Features
-- Run this AFTER the main schema.sql if your database already exists
-- This adds the new columns and tables for the admin system

-- Add new columns to users table if they don't exist
DO $$ 
BEGIN
  -- Add approval_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN approval_status TEXT NOT NULL 
    CHECK (approval_status IN ('pending_approval', 'approved')) 
    DEFAULT 'pending_approval';
  END IF;

  -- Add last_seen_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add password_reset_token column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_reset_token'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN password_reset_token TEXT;
  END IF;

  -- Add password_reset_token_expiry column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_reset_token_expiry'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN password_reset_token_expiry TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for password reset token lookup
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Update existing users to approved status (optional - remove if you want them pending)
-- UPDATE users SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'booking', 'repair_request')),
  recipient_ids UUID[] DEFAULT '{}',
  recipient_roles TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification recipients table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_roles ON notifications USING GIN(recipient_roles);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user_id ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification_id ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at);

-- Create trigger for notifications updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

