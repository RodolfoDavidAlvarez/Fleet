-- Add extra Airtable-mapped columns to capture more inventory/member/repair metadata

-- Vehicles: extended metadata from Equipment Inventory export
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'company_unique_id') THEN
    ALTER TABLE vehicles ADD COLUMN company_unique_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'asset_number') THEN
    ALTER TABLE vehicles ADD COLUMN asset_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'airtable_vid_number') THEN
    ALTER TABLE vehicles ADD COLUMN airtable_vid_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'weekly_inspection_state') THEN
    ALTER TABLE vehicles ADD COLUMN weekly_inspection_state TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'reminder_state') THEN
    ALTER TABLE vehicles ADD COLUMN reminder_state TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'last_inspection_date') THEN
    ALTER TABLE vehicles ADD COLUMN last_inspection_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'last_maintenance_date') THEN
    ALTER TABLE vehicles ADD COLUMN last_maintenance_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'last_maintenance_mileage') THEN
    ALTER TABLE vehicles ADD COLUMN last_maintenance_mileage INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_state') THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_state TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'book_status') THEN
    ALTER TABLE vehicles ADD COLUMN book_status TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'alert_method') THEN
    ALTER TABLE vehicles ADD COLUMN alert_method TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_system') THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_system TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'new_vehicle_condition') THEN
    ALTER TABLE vehicles ADD COLUMN new_vehicle_condition TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'starting_mileage') THEN
    ALTER TABLE vehicles ADD COLUMN starting_mileage INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'acquisition_value') THEN
    ALTER TABLE vehicles ADD COLUMN acquisition_value NUMERIC(12,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'placed_in_service') THEN
    ALTER TABLE vehicles ADD COLUMN placed_in_service DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'loan_maturity_date') THEN
    ALTER TABLE vehicles ADD COLUMN loan_maturity_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'depreciation_method') THEN
    ALTER TABLE vehicles ADD COLUMN depreciation_method TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'serial_number') THEN
    ALTER TABLE vehicles ADD COLUMN serial_number TEXT;
  END IF;
END $$;

-- Users/Members: store legacy IDs and oversight metadata
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'member_legacy_id') THEN
    ALTER TABLE users ADD COLUMN member_legacy_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'level_certification') THEN
    ALTER TABLE users ADD COLUMN level_certification TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notes') THEN
    ALTER TABLE users ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_language') THEN
    ALTER TABLE users ADD COLUMN preferred_language TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'equipment_oversight') THEN
    ALTER TABLE users ADD COLUMN equipment_oversight TEXT[];
  END IF;
END $$;

-- Repair requests: keep legacy identifiers from Airtable/Jotform
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'legacy_service_id') THEN
    ALTER TABLE repair_requests ADD COLUMN legacy_service_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'legacy_autonumber') THEN
    ALTER TABLE repair_requests ADD COLUMN legacy_autonumber INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'jotform_id') THEN
    ALTER TABLE repair_requests ADD COLUMN jotform_id TEXT;
  END IF;
END $$;
