-- Allow null email for users (for adding members without email)
ALTER TABLE users
ALTER COLUMN email DROP NOT NULL;

-- Add a comment explaining why email can be null
COMMENT ON COLUMN users.email IS 'User email address - optional for drivers/mechanics added by admin';
