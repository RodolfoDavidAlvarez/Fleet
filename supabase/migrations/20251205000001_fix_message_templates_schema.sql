-- Fix message_templates table schema to support bilingual messages
-- This migration updates the table if it was created with single 'message' field

DO $$
BEGIN
  -- Check if 'message' column exists (old schema)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'message_templates' 
    AND column_name = 'message'
  ) THEN
    -- Add new columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'message_templates' 
      AND column_name = 'message_en'
    ) THEN
      ALTER TABLE message_templates ADD COLUMN message_en TEXT;
      ALTER TABLE message_templates ADD COLUMN message_es TEXT;
      
      -- Migrate existing data from 'message' to 'message_en'
      UPDATE message_templates 
      SET message_en = message 
      WHERE message_en IS NULL;
      
      -- Make message_en NOT NULL after migration
      ALTER TABLE message_templates ALTER COLUMN message_en SET NOT NULL;
      
      -- Drop old 'message' column
      ALTER TABLE message_templates DROP COLUMN IF EXISTS message;
    END IF;
  END IF;
  
  -- If table doesn't have the columns, ensure they exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'message_templates' 
    AND column_name = 'message_en'
  ) THEN
    ALTER TABLE message_templates ADD COLUMN message_en TEXT NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'message_templates' 
    AND column_name = 'message_es'
  ) THEN
    ALTER TABLE message_templates ADD COLUMN message_es TEXT;
  END IF;
END $$;
