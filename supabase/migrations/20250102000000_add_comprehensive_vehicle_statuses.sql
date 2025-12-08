-- Migration: Add comprehensive vehicle statuses and usage tracking
-- This migration expands the vehicle status system and adds tracking for vehicle usage

-- Step 1: Add last_used_date column to track when vehicle was last used
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS last_used_date DATE;

-- Step 2: Drop the old status constraint and add new comprehensive statuses
-- First, update existing statuses to map to new system
UPDATE vehicles 
SET status = CASE 
  WHEN status = 'active' THEN 'operational'
  WHEN status = 'in_service' THEN 'in_service'
  WHEN status = 'retired' THEN 'retired'
  ELSE 'operational'
END;

-- Drop the old constraint
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Add new comprehensive status constraint
ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN (
  'operational',           -- Fully active and operational
  'active',               -- Active and ready for use (legacy support)
  'in_service',           -- Currently in service/repair
  'broken_down',          -- Broken down, needs repair
  'for_sale',             -- Marked for sale
  'idle',                 -- Sitting unused, needs attention
  'upcoming',             -- Upcoming/new vehicle not yet in service
  'retired',              -- Retired from service
  'maintenance',          -- In maintenance
  'reserved',             -- Reserved for specific use
  'out_of_service'        -- Out of service (temporary)
));

-- Step 3: Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status_comprehensive ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_used_date ON vehicles(last_used_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department) WHERE department IS NOT NULL;

-- Step 4: Create a function to calculate days since last use
CREATE OR REPLACE FUNCTION calculate_days_since_last_use(vehicle_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_used DATE;
BEGIN
  SELECT v.last_used_date INTO last_used
  FROM vehicles v
  WHERE v.id = vehicle_id;
  
  IF last_used IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN CURRENT_DATE - last_used;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a view for vehicles with usage metrics
CREATE OR REPLACE VIEW vehicles_with_usage AS
SELECT 
  v.*,
  v.last_used_date,
  CASE 
    WHEN v.last_used_date IS NULL THEN NULL
    ELSE CURRENT_DATE - v.last_used_date
  END AS days_since_last_use,
  CASE 
    WHEN v.last_used_date IS NULL THEN 'Never tracked'
    WHEN CURRENT_DATE - v.last_used_date = 0 THEN 'Used today'
    WHEN CURRENT_DATE - v.last_used_date = 1 THEN 'Used yesterday'
    WHEN CURRENT_DATE - v.last_used_date <= 7 THEN 'Used this week'
    WHEN CURRENT_DATE - v.last_used_date <= 30 THEN 'Used this month'
    WHEN CURRENT_DATE - v.last_used_date <= 90 THEN 'Used in last 3 months'
    WHEN CURRENT_DATE - v.last_used_date <= 180 THEN 'Used in last 6 months'
    ELSE 'Long idle'
  END AS usage_category
FROM vehicles v;

-- Step 6: Add comment for documentation
COMMENT ON COLUMN vehicles.last_used_date IS 'Date when vehicle was last used. Used to track idle vehicles.';
COMMENT ON COLUMN vehicles.status IS 'Comprehensive vehicle status: operational, active, in_service, broken_down, for_sale, idle, upcoming, retired, maintenance, reserved, out_of_service';
COMMENT ON FUNCTION calculate_days_since_last_use IS 'Calculates the number of days since a vehicle was last used';


