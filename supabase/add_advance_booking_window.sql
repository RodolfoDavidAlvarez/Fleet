-- Add advance booking window settings to calendar_settings table
-- This controls how far in advance users can book appointments

-- Add columns if they don't exist
ALTER TABLE calendar_settings 
ADD COLUMN IF NOT EXISTS advance_booking_window INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_booking_unit TEXT DEFAULT 'days' CHECK (advance_booking_unit IN ('hours', 'days'));

-- Update existing records to have default values
UPDATE calendar_settings 
SET 
  advance_booking_window = COALESCE(advance_booking_window, 0),
  advance_booking_unit = COALESCE(advance_booking_unit, 'days')
WHERE advance_booking_window IS NULL OR advance_booking_unit IS NULL;

-- Add comment
COMMENT ON COLUMN calendar_settings.advance_booking_window IS 'Number of hours or days before users can book (e.g., 2 days means users can only book 2+ days in advance)';
COMMENT ON COLUMN calendar_settings.advance_booking_unit IS 'Unit for advance booking window: hours or days';


