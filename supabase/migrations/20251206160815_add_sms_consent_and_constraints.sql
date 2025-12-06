-- Add SMS consent column to repair_requests
ALTER TABLE repair_requests
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false;

-- Add index for faster SMS consent lookups
CREATE INDEX IF NOT EXISTS idx_repair_requests_sms_consent ON repair_requests(sms_consent);

-- Fix foreign key constraints with proper ON DELETE behavior
-- Note: PostgreSQL doesn't allow modifying constraint behavior directly,
-- so we need to drop and recreate constraints

-- 1. vehicles.driver_id - SET NULL when user deleted (vehicle should remain)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_driver_id_fkey') THEN
        ALTER TABLE vehicles DROP CONSTRAINT vehicles_driver_id_fkey;
    END IF;

    -- Add constraint with ON DELETE SET NULL
    ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update vehicles_driver_id_fkey: %', SQLERRM;
END $$;

-- 2. bookings.vehicle_id - SET NULL when vehicle deleted (booking history should remain)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_vehicle_id_fkey') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_vehicle_id_fkey;
    END IF;

    ALTER TABLE bookings
    ADD CONSTRAINT bookings_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update bookings_vehicle_id_fkey: %', SQLERRM;
END $$;

-- 3. bookings.mechanic_id - SET NULL when mechanic deleted
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_mechanic_id_fkey') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_mechanic_id_fkey;
    END IF;

    ALTER TABLE bookings
    ADD CONSTRAINT bookings_mechanic_id_fkey
    FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update bookings_mechanic_id_fkey: %', SQLERRM;
END $$;

-- 4. bookings.repair_request_id - SET NULL when repair request deleted
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_repair_request_id_fkey') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_repair_request_id_fkey;
    END IF;

    ALTER TABLE bookings
    ADD CONSTRAINT bookings_repair_request_id_fkey
    FOREIGN KEY (repair_request_id) REFERENCES repair_requests(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update bookings_repair_request_id_fkey: %', SQLERRM;
END $$;

-- 5. repair_requests.driver_id - SET NULL when user deleted (request history should remain)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'repair_requests_driver_id_fkey') THEN
        ALTER TABLE repair_requests DROP CONSTRAINT repair_requests_driver_id_fkey;
    END IF;

    ALTER TABLE repair_requests
    ADD CONSTRAINT repair_requests_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update repair_requests_driver_id_fkey: %', SQLERRM;
END $$;

-- 6. repair_requests.vehicle_id - SET NULL when vehicle deleted
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'repair_requests_vehicle_id_fkey') THEN
        ALTER TABLE repair_requests DROP CONSTRAINT repair_requests_vehicle_id_fkey;
    END IF;

    ALTER TABLE repair_requests
    ADD CONSTRAINT repair_requests_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update repair_requests_vehicle_id_fkey: %', SQLERRM;
END $$;

-- 7. repair_requests.booking_id - SET NULL when booking deleted
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'repair_requests_booking_id_fkey') THEN
        ALTER TABLE repair_requests DROP CONSTRAINT repair_requests_booking_id_fkey;
    END IF;

    ALTER TABLE repair_requests
    ADD CONSTRAINT repair_requests_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update repair_requests_booking_id_fkey: %', SQLERRM;
END $$;

-- 8. repair_reports.mechanic_id - SET NULL when mechanic deleted
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'repair_reports_mechanic_id_fkey') THEN
        ALTER TABLE repair_reports DROP CONSTRAINT repair_reports_mechanic_id_fkey;
    END IF;

    ALTER TABLE repair_reports
    ADD CONSTRAINT repair_reports_mechanic_id_fkey
    FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update repair_reports_mechanic_id_fkey: %', SQLERRM;
END $$;

-- 9. service_records.mechanic_id - SET NULL when mechanic/user deleted (service history should remain)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_records_mechanic_id_fkey') THEN
        ALTER TABLE service_records DROP CONSTRAINT service_records_mechanic_id_fkey;
    END IF;

    ALTER TABLE service_records
    ADD CONSTRAINT service_records_mechanic_id_fkey
    FOREIGN KEY (mechanic_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update service_records_mechanic_id_fkey: %', SQLERRM;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN repair_requests.sms_consent IS 'User consent for receiving SMS notifications about this repair request';
