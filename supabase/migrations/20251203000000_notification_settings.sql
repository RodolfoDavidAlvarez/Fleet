-- Migration: Notification Settings and Message Templates
-- Stores which admins are assigned to receive which notifications
-- Stores customizable message templates for driver notifications

-- Create notification_assignments table
CREATE TABLE IF NOT EXISTS notification_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  admin_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_type)
);

-- Create notification_message_templates table
CREATE TABLE IF NOT EXISTS notification_message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL UNIQUE,
  message_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_assignments_type ON notification_assignments(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_message_templates(notification_type);

-- Create trigger for notification_assignments updated_at
DROP TRIGGER IF EXISTS update_notification_assignments_updated_at ON notification_assignments;
CREATE TRIGGER update_notification_assignments_updated_at
  BEFORE UPDATE ON notification_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for notification_message_templates updated_at
DROP TRIGGER IF EXISTS update_notification_message_templates_updated_at ON notification_message_templates;
CREATE TRIGGER update_notification_message_templates_updated_at
  BEFORE UPDATE ON notification_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


