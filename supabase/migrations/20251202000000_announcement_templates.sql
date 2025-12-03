-- Migration: Announcement Templates and SMS Features
-- This adds support for reusable templates and SMS optimization

-- Create announcement templates table
CREATE TABLE IF NOT EXISTS announcement_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'booking', 'repair_request')),
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'sms', 'both')) DEFAULT 'in_app',
  recipient_roles TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  use_count INTEGER DEFAULT 0
);

-- Add SMS-related fields to notifications table
DO $$
BEGIN
  -- Add channel column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'channel'
  ) THEN
    ALTER TABLE notifications
    ADD COLUMN channel TEXT NOT NULL CHECK (channel IN ('in_app', 'sms', 'both')) DEFAULT 'in_app';
  END IF;

  -- Add template_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE notifications
    ADD COLUMN template_id UUID REFERENCES announcement_templates(id) ON DELETE SET NULL;
  END IF;

  -- Add sms_sent_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'sms_sent_count'
  ) THEN
    ALTER TABLE notifications
    ADD COLUMN sms_sent_count INTEGER DEFAULT 0;
  END IF;

  -- Add sms_sent_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'sms_sent_at'
  ) THEN
    ALTER TABLE notifications
    ADD COLUMN sms_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcement_templates_created_by ON announcement_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_announcement_templates_is_active ON announcement_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_announcement_templates_channel ON announcement_templates(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_template_id ON notifications(template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);

-- Create trigger for templates updated_at
DROP TRIGGER IF EXISTS update_announcement_templates_updated_at ON announcement_templates;
CREATE TRIGGER update_announcement_templates_updated_at
  BEFORE UPDATE ON announcement_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default templates for common use cases
INSERT INTO announcement_templates (name, title, message, type, channel, recipient_roles) VALUES
  ('Fleet Maintenance Alert', 'Scheduled Maintenance Reminder', 'Your vehicle is due for scheduled maintenance. Please schedule an appointment at your earliest convenience.', 'info', 'both', ARRAY['driver']),
  ('Urgent Repair Notice', 'Urgent: Vehicle Repair Required', 'URGENT: Your assigned vehicle requires immediate attention. Please contact the fleet manager immediately.', 'warning', 'sms', ARRAY['driver']),
  ('Booking Confirmation', 'Booking Confirmed', 'Your service booking has been confirmed. We will contact you shortly with further details.', 'success', 'both', ARRAY['customer']),
  ('Service Complete', 'Service Completed', 'Your vehicle service has been completed and is ready for pickup. Thank you for choosing our service!', 'success', 'both', ARRAY['customer', 'driver']),
  ('Payment Reminder', 'Payment Reminder', 'This is a friendly reminder that payment is due for your recent service. Please complete payment at your earliest convenience.', 'info', 'both', ARRAY['customer'])
ON CONFLICT DO NOTHING;
