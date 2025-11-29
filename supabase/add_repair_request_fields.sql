-- Add new fields to repair_requests table to match the new form
ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS division TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS make_model TEXT,
ADD COLUMN IF NOT EXISTS incident_date DATE,
ADD COLUMN IF NOT EXISTS is_immediate BOOLEAN DEFAULT false;





