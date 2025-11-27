-- Add photo_url column to vehicles table
-- Run this in Supabase SQL Editor

-- Add photo_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE vehicles 
    ADD COLUMN photo_url TEXT;
    
    -- Add comment
    COMMENT ON COLUMN vehicles.photo_url IS 'URL to vehicle photo stored in Supabase storage or local uploads';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles' AND column_name = 'photo_url';



