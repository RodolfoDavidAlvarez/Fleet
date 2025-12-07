-- Add ticket_number column to repair_requests for shorter, memorable IDs
-- Format: RQ-XXXXXX (e.g., RQ-001234)

-- Create a sequence for generating ticket numbers
CREATE SEQUENCE IF NOT EXISTS repair_request_ticket_seq START 1000;

-- Add ticket_number column
ALTER TABLE repair_requests
ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE;

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
BEGIN
    next_val := nextval('repair_request_ticket_seq');
    RETURN 'RQ-' || LPAD(next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket_number on insert
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_repair_request_ticket_number ON repair_requests;
CREATE TRIGGER set_repair_request_ticket_number
    BEFORE INSERT ON repair_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Update existing records that don't have ticket numbers
UPDATE repair_requests
SET ticket_number = 'RQ-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at) + 999)::TEXT, 6, '0')
WHERE ticket_number IS NULL;

-- Add index for fast lookup by ticket number
CREATE INDEX IF NOT EXISTS idx_repair_requests_ticket_number ON repair_requests(ticket_number);

-- Comment
COMMENT ON COLUMN repair_requests.ticket_number IS 'Human-friendly ticket number format: RQ-XXXXXX';
