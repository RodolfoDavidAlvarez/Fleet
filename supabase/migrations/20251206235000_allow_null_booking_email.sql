-- Allow NULL customer_email in bookings table
-- This is needed because repair requests may not always have an email address
-- (drivers may only provide phone numbers for SMS communication)

ALTER TABLE bookings
ALTER COLUMN customer_email DROP NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN bookings.customer_email IS 'Customer email address. Optional - drivers may only provide phone numbers.';
