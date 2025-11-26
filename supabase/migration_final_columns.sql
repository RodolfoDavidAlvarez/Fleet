-- Final column additions for complete Airtable integration

-- Add airtable_id to repair_requests table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'repair_requests' AND column_name = 'airtable_id'
  ) THEN
    ALTER TABLE repair_requests ADD COLUMN airtable_id TEXT UNIQUE;
  END IF;
END $$;

-- Create index for repair_requests airtable_id
CREATE INDEX IF NOT EXISTS idx_repair_requests_airtable_id ON repair_requests(airtable_id);

-- Make VIN nullable to handle empty values from Airtable
ALTER TABLE vehicles ALTER COLUMN vin DROP NOT NULL;