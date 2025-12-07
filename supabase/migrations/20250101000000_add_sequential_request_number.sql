-- Add sequential request number to repair_requests table
-- This creates a shorter, sequential ID for display in SMS/notifications

-- Add the request_number column
ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS request_number INTEGER;

-- Create a trigger to automatically assign request_number on insert
CREATE OR REPLACE FUNCTION assign_repair_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := nextval('repair_request_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_repair_request_number
  BEFORE INSERT ON repair_requests
  FOR EACH ROW
  EXECUTE FUNCTION assign_repair_request_number();

-- Create a sequence for generating sequential numbers
CREATE SEQUENCE IF NOT EXISTS repair_request_number_seq START 1;

-- Function to get next sequential number
CREATE OR REPLACE FUNCTION get_next_repair_request_number() 
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT nextval('repair_request_number_seq') INTO next_num;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing records to have sequential numbers (if any exist)
-- This will assign numbers starting from 1 to existing records
DO $$
DECLARE
  rec RECORD;
  counter INTEGER := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM repair_requests 
    WHERE request_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    UPDATE repair_requests 
    SET request_number = counter 
    WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
  
  -- Set sequence to continue from the highest number
  IF counter > 1 THEN
    PERFORM setval('repair_request_number_seq', counter - 1);
  END IF;
END $$;

-- Create index on request_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_repair_requests_request_number ON repair_requests(request_number);

-- Add NOT NULL constraint after populating existing data
-- We'll do this in a separate step to avoid issues with existing NULL values
-- ALTER TABLE repair_requests ALTER COLUMN request_number SET NOT NULL;

