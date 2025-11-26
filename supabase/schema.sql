-- Fleet Management System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'mechanic', 'customer')),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
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

