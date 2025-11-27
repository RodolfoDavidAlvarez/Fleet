-- Add booking_link_sent_at field to repair_requests table
-- This tracks when the booking link was sent to prevent duplicate sends

ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS booking_link_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_repair_requests_booking_link_sent_at 
ON repair_requests(booking_link_sent_at);

-- Add comment
COMMENT ON COLUMN repair_requests.booking_link_sent_at IS 'Timestamp when booking link was sent to driver';

