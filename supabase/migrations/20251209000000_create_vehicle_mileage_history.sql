-- Create vehicle_mileage_history table to track mileage updates
CREATE TABLE IF NOT EXISTS vehicle_mileage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mileage INTEGER NOT NULL,
  previous_mileage INTEGER,
  updated_by_service_record_id UUID REFERENCES service_records(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_mileage_history_vehicle_id ON vehicle_mileage_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_mileage_history_created_at ON vehicle_mileage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_mileage_history_service_record_id ON vehicle_mileage_history(updated_by_service_record_id);

-- Add comment
COMMENT ON TABLE vehicle_mileage_history IS 'Tracks historical mileage updates for vehicles, typically updated when service records are created';
