-- Fleet Management System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'mechanic', 'customer', 'driver')),
  phone TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT UNIQUE NOT NULL,
  license_plate TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'in_service', 'retired')) DEFAULT 'active',
  last_service_date DATE,
  next_service_due DATE,
  mileage INTEGER DEFAULT 0,
  driver_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Many-to-many driver mapping (optional if multiple drivers per vehicle)
CREATE TABLE IF NOT EXISTS vehicle_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  assigned_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vehicle_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_vehicle_id ON vehicle_drivers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_driver_id ON vehicle_drivers(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_primary ON vehicle_drivers(vehicle_id, is_primary) WHERE is_primary = true;

CREATE OR REPLACE VIEW vehicles_with_drivers AS
SELECT 
  v.id,
  v.make,
  v.model,
  v.year,
  v.vin,
  v.license_plate,
  v.status,
  v.mileage,
  v.created_at,
  v.last_service_date,
  v.next_service_due,
  v.driver_id,
  u.name as driver_name,
  u.phone as driver_phone,
  u.email as driver_email,
  vd.is_primary,
  vd.assigned_date
FROM vehicles v
LEFT JOIN vehicle_drivers vd ON v.id = vd.vehicle_id AND vd.is_primary = true
LEFT JOIN users u ON vd.driver_id = u.id;

CREATE OR REPLACE FUNCTION get_vehicle_driver_phone(vehicle_uuid UUID)
RETURNS TEXT AS $$
  SELECT u.phone
  FROM vehicle_drivers vd
  JOIN users u ON vd.driver_id = u.id
  WHERE vd.vehicle_id = vehicle_uuid
    AND vd.is_primary = true
  LIMIT 1;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION assign_driver_to_vehicle(
  p_vehicle_id UUID,
  p_driver_id UUID,
  p_is_primary BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  IF p_is_primary THEN
    UPDATE vehicle_drivers 
    SET is_primary = false 
    WHERE vehicle_id = p_vehicle_id;
  END IF;
  
  INSERT INTO vehicle_drivers (vehicle_id, driver_id, is_primary)
  VALUES (p_vehicle_id, p_driver_id, p_is_primary)
  ON CONFLICT (vehicle_id, driver_id) 
  DO UPDATE SET is_primary = p_is_primary, assigned_date = CURRENT_DATE
  RETURNING id INTO v_assignment_id;
  
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE vehicle_drivers IS 'Junction table for many-to-many relationship between vehicles and drivers';
COMMENT ON COLUMN vehicle_drivers.is_primary IS 'True if this is the primary driver for the vehicle';
COMMENT ON FUNCTION get_vehicle_driver_phone IS 'Returns the phone number of the primary driver for a vehicle';
COMMENT ON FUNCTION assign_driver_to_vehicle IS 'Assigns a driver to a vehicle, optionally as primary driver';

-- Service Records table (for vehicle service history)
CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  mechanic_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts table (for parts used in services)
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_record_id UUID REFERENCES service_records(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mechanics table (extends users)
CREATE TABLE IF NOT EXISTS mechanics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  specializations TEXT[] DEFAULT '{}',
  availability TEXT NOT NULL CHECK (availability IN ('available', 'busy', 'unavailable')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  mechanic_id UUID REFERENCES mechanics(id),
  vehicle_info TEXT,
  sms_consent BOOLEAN DEFAULT true,
  compliance_accepted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  mechanic_id UUID REFERENCES mechanics(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('assigned', 'in_progress', 'waiting_parts', 'completed', 'cancelled')) DEFAULT 'assigned',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5, 2),
  actual_hours DECIMAL(5, 2),
  labor_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Parts table (parts used in jobs)
CREATE TABLE IF NOT EXISTS job_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_mechanic_id ON bookings(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_mechanic_id ON jobs(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority);
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mechanics_availability ON mechanics(availability);

-- Repair Requests table
CREATE TABLE IF NOT EXISTS repair_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id),
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  driver_email TEXT,
  preferred_language TEXT DEFAULT 'en',
  vehicle_id UUID REFERENCES vehicles(id),
  vehicle_identifier TEXT,
  odometer INTEGER,
  location TEXT,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('submitted', 'triaged', 'waiting_booking', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'submitted',
  ai_category TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_confidence DECIMAL(5,2),
  photo_urls TEXT[] DEFAULT '{}',
  thumb_urls TEXT[] DEFAULT '{}',
  booking_id UUID REFERENCES bookings(id),
  booking_link TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_created_at ON repair_requests(created_at DESC);

-- Repair Reports table
CREATE TABLE IF NOT EXISTS repair_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_request_id UUID REFERENCES repair_requests(id) ON DELETE CASCADE,
  mechanic_id UUID REFERENCES mechanics(id),
  summary TEXT NOT NULL,
  parts_used JSONB DEFAULT '[]',
  labor_hours DECIMAL(5,2),
  labor_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_reports_request ON repair_reports(repair_request_id);

-- Link bookings to repair requests
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS repair_request_id UUID REFERENCES repair_requests(id);

CREATE INDEX IF NOT EXISTS idx_bookings_repair_request_id ON bookings(repair_request_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repair_requests_updated_at ON repair_requests;
CREATE TRIGGER update_repair_requests_updated_at BEFORE UPDATE ON repair_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for development)
-- Uncomment to add sample data

/*
-- Sample users
INSERT INTO users (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@fleetpro.com', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'mechanic@fleetpro.com', 'John Smith', 'mechanic');

-- Sample mechanics
INSERT INTO mechanics (id, user_id, name, email, phone, specializations, availability) VALUES
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'John Smith', 'john@fleetpro.com', '+1234567890', ARRAY['Engine', 'Transmission'], 'available');

-- Sample vehicles
INSERT INTO vehicles (id, make, model, year, vin, license_plate, status, mileage) VALUES
  ('00000000-0000-0000-0000-000000000004', 'Ford', 'F-150', 2022, '1FTFW1E50NFA12345', 'ABC-1234', 'active', 15000),
  ('00000000-0000-0000-0000-000000000005', 'Chevrolet', 'Silverado', 2021, '1GCVKREC1MZ123456', 'XYZ-5678', 'in_service', 25000);
*/
