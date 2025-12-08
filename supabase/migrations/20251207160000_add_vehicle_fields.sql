-- Add missing vehicle fields for enhanced tracking
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS supervisor TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tag_expiry TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS loan_lender TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS first_aid_fire TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS title TEXT;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_vehicles_supervisor ON vehicles(supervisor);
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department);
