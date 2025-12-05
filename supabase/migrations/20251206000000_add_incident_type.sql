-- Add incident_type column to repair_requests table
-- This field stores a standardized incident type from a predefined list
-- for historical graphing and analytics

ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS incident_type TEXT;

-- Create index for faster queries on incident types
CREATE INDEX IF NOT EXISTS idx_repair_requests_incident_type ON repair_requests(incident_type);

-- Add comment for documentation
COMMENT ON COLUMN repair_requests.incident_type IS 'Standardized incident type from predefined list (e.g., "Tire punctures", "Oil leaks", "Engine problems") for historical analytics';
