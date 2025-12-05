-- Add notify_on_repair column to users table
-- This column allows users to opt-in/opt-out of repair notifications

DO $$ 
BEGIN
  -- Add notify_on_repair column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'notify_on_repair'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN notify_on_repair BOOLEAN DEFAULT false;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_users_notify_on_repair ON users(notify_on_repair) WHERE notify_on_repair = true;
    
    -- Set default to true for existing admins and mechanics (they likely want notifications)
    UPDATE users 
    SET notify_on_repair = true 
    WHERE role IN ('admin', 'mechanic') AND notify_on_repair IS NULL;
  END IF;
END $$;


