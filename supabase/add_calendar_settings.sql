-- Add calendar_settings table for booking calendar configuration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS calendar_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  max_bookings_per_week INTEGER NOT NULL DEFAULT 5,
  start_time TIME NOT NULL DEFAULT '06:00:00',
  end_time TIME NOT NULL DEFAULT '14:00:00',
  slot_duration INTEGER NOT NULL DEFAULT 30, -- minutes
  working_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- 0=Sunday, 1=Monday, etc.
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if they don't exist
INSERT INTO calendar_settings (id, max_bookings_per_week, start_time, end_time, slot_duration, working_days)
VALUES ('default', 5, '06:00:00', '14:00:00', 30, ARRAY[1,2,3,4,5])
ON CONFLICT (id) DO NOTHING;

-- Verify the table was created
SELECT * FROM calendar_settings;

