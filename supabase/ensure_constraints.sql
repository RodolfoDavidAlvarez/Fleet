
-- Ensure Unique Constraints for Upsert
-- Run this to fix potential missing constraints

-- 1. Vehicles airtable_id
DO $$
BEGIN
    -- Check if constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_airtable_id_key'
    ) THEN
        -- Ensure values are unique first (cleanup duplicates if any)
        -- This is a simple strategy: keep the latest one. 
        -- But for now, let's just try to add it. If it fails, user needs to clean up.
        ALTER TABLE vehicles ADD CONSTRAINT vehicles_airtable_id_key UNIQUE (airtable_id);
    END IF;
END $$;

-- 2. Departments airtable_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'departments_airtable_id_key'
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT departments_airtable_id_key UNIQUE (airtable_id);
    END IF;
END $$;

-- 3. Departments name (should exist, but good to check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'departments_name_key'
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT departments_name_key UNIQUE (name);
    END IF;
END $$;
