-- Optional: Update existing users to approved status
-- Run this ONLY if you want to automatically approve all existing users
-- Otherwise, they will remain in pending_approval status and need manual approval

-- Update all existing users to approved (uncomment to use)
-- UPDATE users 
-- SET approval_status = 'approved' 
-- WHERE approval_status IS NULL OR approval_status = 'pending_approval';

-- Or update only specific roles to approved
-- UPDATE users 
-- SET approval_status = 'approved' 
-- WHERE role IN ('admin', 'mechanic') 
--   AND (approval_status IS NULL OR approval_status = 'pending_approval');



