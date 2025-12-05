-- Update repair_requests table division and vehicle_type options
-- This migration documents the new valid values for division and vehicle_type fields
-- No schema changes needed as these are TEXT fields, but we add comments for documentation

COMMENT ON COLUMN repair_requests.division IS 'Division: Construction, Salvage, Enhancements, Maintenance, Tree, Office/Sales, SSW, UFE, Misc. Use Vehicles/Fleet';
COMMENT ON COLUMN repair_requests.vehicle_type IS 'Type of vehicle: Vehicle, Heavy Equipment, Trailer, Not listed';

-- Note: Since these are TEXT fields without constraints, existing data will not be automatically updated
-- Application layer enforces the new options in the form dropdown
