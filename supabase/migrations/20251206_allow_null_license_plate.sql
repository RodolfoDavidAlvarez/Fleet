-- Allow NULL values for license_plate (equipment and trailers may not have plates)
ALTER TABLE vehicles ALTER COLUMN license_plate DROP NOT NULL;

-- Add default empty string for vin if it's not set
ALTER TABLE vehicles ALTER COLUMN vin DROP NOT NULL;
