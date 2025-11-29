-- Add slot buffer time to calendar_settings table
-- This controls the gap/buffer time between booking slots (like Calendly)

ALTER TABLE calendar_settings 
ADD COLUMN IF NOT EXISTS slot_buffer_time INTEGER DEFAULT 0;

-- Update existing records to have default value
UPDATE calendar_settings 
SET slot_buffer_time = COALESCE(slot_buffer_time, 0)
WHERE slot_buffer_time IS NULL;

-- Add comment
COMMENT ON COLUMN calendar_settings.slot_buffer_time IS 'Buffer time in minutes between booking slots (e.g., 15 minutes means 15 min gap between slots)';


