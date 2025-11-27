-- Verify the constraint includes 'driver' and then update users
-- Run this in Supabase SQL Editor

-- Step 1: Verify the constraint includes 'driver'
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';

-- Step 2: Check current user roles
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Step 3: Test if we can insert a test driver (will rollback)
BEGIN;
INSERT INTO users (email, name, role, approval_status)
VALUES ('test_driver_check@test.com', 'Test Driver', 'driver', 'approved');
ROLLBACK;

-- If the test insert above works (no error), then the constraint is correct
-- If it fails, run the fix script again

-- Step 4: Update customers to drivers (uncomment when ready)
-- UPDATE users SET role = 'driver' WHERE role = 'customer';

-- Step 5: Verify the update worked
-- SELECT role, COUNT(*) as count
-- FROM users
-- GROUP BY role
-- ORDER BY role;



