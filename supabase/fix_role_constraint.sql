-- Fix users table role constraint to allow 'driver' role
-- Run this in Supabase SQL Editor

-- First, check the current constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname LIKE '%role%';

-- Drop the existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Recreate the constraint with all valid roles including 'driver'
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'mechanic', 'customer', 'driver'));

-- Verify the constraint was created correctly
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';

-- Now you can update users to driver role
-- Uncomment the line below to convert all customers to drivers:
-- UPDATE users SET role = 'driver' WHERE role = 'customer';

-- Or update specific users:
-- UPDATE users SET role = 'driver' WHERE email = 'simon.carrasco@fleet.local';



