-- Add Airtable reference fields to existing tables

-- Add Airtable fields to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS airtable_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS airtable_vehicle_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS asset_number TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS acquisition_value DECIMAL(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add Airtable fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS airtable_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS airtable_record_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_certification TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT;

-- Create repair_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS repair_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  reported_by TEXT,
  reporter_phone TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vehicle_id UUID REFERENCES vehicles(id),
  assigned_to UUID REFERENCES users(id),
  airtable_service_id TEXT,
  jotform_id TEXT,
  photos_attachments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_airtable_id ON vehicles(airtable_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_asset_number ON vehicles(asset_number);
CREATE INDEX IF NOT EXISTS idx_users_airtable_id ON users(airtable_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_priority ON repair_requests(priority);
CREATE INDEX IF NOT EXISTS idx_repair_requests_vehicle_id ON repair_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_assigned_to ON repair_requests(assigned_to);

-- Add unique constraints where appropriate
ALTER TABLE vehicles ADD CONSTRAINT IF NOT EXISTS unique_airtable_id UNIQUE (airtable_id);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_user_airtable_id UNIQUE (airtable_id);