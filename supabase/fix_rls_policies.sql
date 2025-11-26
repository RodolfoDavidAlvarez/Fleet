-- Fix RLS Policies for Drivers/Users Table
-- Run this in your Supabase SQL Editor if drivers are not showing up

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Option 1: Disable RLS temporarily (for development/testing)
-- WARNING: Only use this in development, not production!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS but create a policy that allows service role to read all users
-- This is safer for production
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows service role (used by API routes) to read all users
CREATE POLICY "Service role can read all users"
ON users
FOR SELECT
TO service_role
USING (true);

-- Create a policy that allows service role to insert users
CREATE POLICY "Service role can insert users"
ON users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create a policy that allows service role to update users
CREATE POLICY "Service role can update users"
ON users
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create a policy that allows service role to delete users
CREATE POLICY "Service role can delete users"
ON users
FOR DELETE
TO service_role
USING (true);

-- If you want to allow anonymous access (less secure, but simpler for development):
-- CREATE POLICY "Allow anonymous read for drivers"
-- ON users
-- FOR SELECT
-- TO anon
-- USING (role = 'driver');

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'users';

