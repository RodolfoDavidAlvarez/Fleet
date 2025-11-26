-- Enhanced Data Migration (Fixed for view column conflict)
-- Adds tables and columns for enhanced Airtable data extraction

-- Add departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  manager TEXT,
  vehicle_count INTEGER DEFAULT 0,
  airtable_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add enhanced columns to vehicles table
DO $$ 
BEGIN
  -- Add vehicle_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_number'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_number TEXT;
  END IF;

  -- Add department column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'department'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN department TEXT;
  END IF;

  -- Add supervisor column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'supervisor'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN supervisor TEXT;
  END IF;

  -- Add loan_lender column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'loan_lender'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN loan_lender TEXT;
  END IF;

  -- Add tag_expiry column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'tag_expiry'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN tag_expiry DATE;
  END IF;

  -- Add first_aid_fire column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'first_aid_fire'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN first_aid_fire TEXT;
  END IF;

  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'title'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN title TEXT;
  END IF;

  -- Add photo_urls column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'photo_urls'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN photo_urls TEXT[] DEFAULT '{}';
  END IF;

  -- Add airtable_id column to vehicles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'airtable_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN airtable_id TEXT UNIQUE;
  END IF;
END $$;

-- Add enhanced columns to service_records table
DO $$ 
BEGIN
  -- Add mileage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_records' AND column_name = 'mileage'
  ) THEN
    ALTER TABLE service_records ADD COLUMN mileage INTEGER;
  END IF;

  -- Add mechanic_name column (for cases where we don't have mechanic_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_records' AND column_name = 'mechanic_name'
  ) THEN
    ALTER TABLE service_records ADD COLUMN mechanic_name TEXT;
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_records' AND column_name = 'status'
  ) THEN
    ALTER TABLE service_records ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;

  -- Add next_service_due column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_records' AND column_name = 'next_service_due'
  ) THEN
    ALTER TABLE service_records ADD COLUMN next_service_due DATE;
  END IF;

  -- Add airtable_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_records' AND column_name = 'airtable_id'
  ) THEN
    ALTER TABLE service_records ADD COLUMN airtable_id TEXT UNIQUE;
  END IF;
END $$;

-- Add airtable_id to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'airtable_id'
  ) THEN
    ALTER TABLE users ADD COLUMN airtable_id TEXT UNIQUE;
  END IF;
END $$;

-- Add airtable_id to mechanics table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanics' AND column_name = 'airtable_id'
  ) THEN
    ALTER TABLE mechanics ADD COLUMN airtable_id TEXT UNIQUE;
  END IF;
END $$;

-- Add airtable_id to bookings table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'airtable_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN airtable_id TEXT UNIQUE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department);
CREATE INDEX IF NOT EXISTS idx_vehicles_supervisor ON vehicles(supervisor);
CREATE INDEX IF NOT EXISTS idx_vehicles_airtable_id ON vehicles(airtable_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_service_records_airtable_id ON service_records(airtable_id);
CREATE INDEX IF NOT EXISTS idx_users_airtable_id ON users(airtable_id);
CREATE INDEX IF NOT EXISTS idx_mechanics_airtable_id ON mechanics(airtable_id);
CREATE INDEX IF NOT EXISTS idx_bookings_airtable_id ON bookings(airtable_id);

-- Drop and recreate the view to avoid column conflicts
DROP VIEW IF EXISTS vehicles_with_drivers;
CREATE VIEW vehicles_with_drivers AS
SELECT 
  v.id,
  v.make,
  v.model,
  v.year,
  v.vin,
  v.license_plate,
  v.vehicle_number as vehicle_num,  -- Renamed to avoid conflict
  v.department,
  v.status as vehicle_status,       -- Renamed to avoid conflict
  v.mileage,
  v.supervisor,
  v.loan_lender,
  v.tag_expiry,
  v.first_aid_fire,
  v.title,
  v.photo_urls,
  v.created_at,
  v.last_service_date,
  v.next_service_due,
  v.driver_id,
  v.airtable_id,
  u.name as driver_name,
  u.phone as driver_phone,
  u.email as driver_email,
  vd.is_primary,
  vd.assigned_date
FROM vehicles v
LEFT JOIN vehicle_drivers vd ON v.id = vd.vehicle_id AND vd.is_primary = true
LEFT JOIN users u ON vd.driver_id = u.id;

-- Create function to sync department vehicle counts
CREATE OR REPLACE FUNCTION update_department_vehicle_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vehicle counts for all departments
  UPDATE departments 
  SET vehicle_count = (
    SELECT COUNT(*) 
    FROM vehicles 
    WHERE department = departments.name
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to keep department counts in sync
DROP TRIGGER IF EXISTS update_dept_counts_on_vehicle_change ON vehicles;
CREATE TRIGGER update_dept_counts_on_vehicle_change
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_department_vehicle_counts();

-- Insert default departments if they don't exist
INSERT INTO departments (name, description) VALUES
  ('Construction', 'Construction Department'),
  ('Salvage', 'Salvage Department'),
  ('Fleet Administrative', 'Fleet Administrative Department'),
  ('Maintenance', 'Maintenance Department')
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE departments IS 'Fleet departments/divisions';
COMMENT ON COLUMN vehicles.vehicle_number IS 'Company vehicle number/identifier';
COMMENT ON COLUMN vehicles.department IS 'Department this vehicle belongs to';
COMMENT ON COLUMN vehicles.supervisor IS 'Supervisor responsible for this vehicle';
COMMENT ON COLUMN vehicles.photo_urls IS 'URLs of vehicle photos from Airtable';
COMMENT ON COLUMN vehicles.airtable_id IS 'Airtable record ID for sync purposes';