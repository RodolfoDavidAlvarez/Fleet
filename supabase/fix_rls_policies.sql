-- Fix RLS Policies for Drivers/Users Table
-- Run this in your Supabase SQL Editor if drivers are not showing up

-- Quick reference: you must set SUPABASE_SERVICE_ROLE_KEY in your environment for API routes.
-- These policies keep anon inserts for public forms (bookings + repair_requests) and gate everything else to service_role.

-- Inspect current RLS status (optional)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'vehicles',
    'vehicle_drivers',
    'bookings',
    'jobs',
    'mechanics',
    'repair_requests',
    'repair_reports',
    'service_records',
    'parts',
    'job_parts',
    'notifications',
    'notification_recipients'
  );

--------------------------------------------------------------------
-- Users
--------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can read all users" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;
DROP POLICY IF EXISTS "Service role can delete users" ON users;

CREATE POLICY "Service role can read all users"
  ON users FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert users"
  ON users FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update users"
  ON users FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can delete users"
  ON users FOR DELETE TO service_role USING (true);

--------------------------------------------------------------------
-- Vehicles + assignments
--------------------------------------------------------------------
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access vehicles" ON vehicles;
DROP POLICY IF EXISTS "Service role full access vehicle_drivers" ON vehicle_drivers;

CREATE POLICY "Service role full access vehicles"
  ON vehicles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access vehicle_drivers"
  ON vehicle_drivers FOR ALL TO service_role USING (true) WITH CHECK (true);

--------------------------------------------------------------------
-- Mechanics
--------------------------------------------------------------------
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access mechanics" ON mechanics;
CREATE POLICY "Service role full access mechanics"
  ON mechanics FOR ALL TO service_role USING (true) WITH CHECK (true);

--------------------------------------------------------------------
-- Bookings (public form insert allowed when compliance is accepted)
--------------------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access bookings" ON bookings;
DROP POLICY IF EXISTS "Anon can create booking with compliance" ON bookings;

CREATE POLICY "Service role full access bookings"
  ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon can create booking with compliance"
  ON bookings FOR INSERT TO anon
  WITH CHECK (coalesce(compliance_accepted, false) = true);

--------------------------------------------------------------------
-- Jobs
--------------------------------------------------------------------
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access jobs" ON jobs;
DROP POLICY IF EXISTS "Service role full access job_parts" ON job_parts;

CREATE POLICY "Service role full access jobs"
  ON jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access job_parts"
  ON job_parts FOR ALL TO service_role USING (true) WITH CHECK (true);

--------------------------------------------------------------------
-- Repair requests + reports (public intake insert allowed)
--------------------------------------------------------------------
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access repair_requests" ON repair_requests;
DROP POLICY IF EXISTS "Anon can submit repair_request" ON repair_requests;
DROP POLICY IF EXISTS "Service role full access repair_reports" ON repair_reports;

CREATE POLICY "Service role full access repair_requests"
  ON repair_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon can submit repair_request"
  ON repair_requests FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Service role full access repair_reports"
  ON repair_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

--------------------------------------------------------------------
-- Service history
--------------------------------------------------------------------
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access service_records" ON service_records;
DROP POLICY IF EXISTS "Service role full access parts" ON parts;

CREATE POLICY "Service role full access service_records"
  ON service_records FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access parts"
  ON parts FOR ALL TO service_role USING (true) WITH CHECK (true);

--------------------------------------------------------------------
-- Notifications (admin system)
--------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
DROP POLICY IF EXISTS "Service role full access notification_recipients" ON notification_recipients;

CREATE POLICY "Service role full access notifications"
  ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access notification_recipients"
  ON notification_recipients FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Verify policies (optional)
SELECT *
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
