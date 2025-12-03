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

-- Only create repair_requests indexes if table exists and has the columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'repair_requests') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'priority') THEN
      CREATE INDEX IF NOT EXISTS idx_repair_requests_priority ON repair_requests(priority);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'vehicle_id') THEN
      CREATE INDEX IF NOT EXISTS idx_repair_requests_vehicle_id ON repair_requests(vehicle_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'assigned_to') THEN
      CREATE INDEX IF NOT EXISTS idx_repair_requests_assigned_to ON repair_requests(assigned_to);
    END IF;
  END IF;
END $$;

-- Add unique constraints where appropriate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_airtable_id'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT unique_airtable_id UNIQUE (airtable_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_airtable_id'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT unique_user_airtable_id UNIQUE (airtable_id);
  END IF;
END $$;