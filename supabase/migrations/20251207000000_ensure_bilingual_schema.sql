-- Ensure message_templates table has bilingual schema (message_en, message_es)
-- This migration safely updates the schema if it was created with single 'message' field

DO $$
BEGIN
  -- Check if table exists with old 'message' column
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
      WHERE message_en IS NULL AND message IS NOT NULL;
      
      -- Make message_en NOT NULL after migration
      ALTER TABLE message_templates ALTER COLUMN message_en SET NOT NULL;
      
      -- Drop old 'message' column
      ALTER TABLE message_templates DROP COLUMN message;
    END IF;
  END IF;
  
  -- Ensure message_en column exists and is NOT NULL
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'message_templates' 
    AND column_name = 'message_en'
  ) THEN
    ALTER TABLE message_templates ADD COLUMN message_en TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Ensure message_es column exists (nullable)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'message_templates' 
    AND column_name = 'message_es'
  ) THEN
    ALTER TABLE message_templates ADD COLUMN message_es TEXT;
  END IF;
END $$;
