-- Add admin_invited column to users table
-- This tracks whether an admin has sent an onboarding link to a user
-- Users with admin_invited=true get auto-approved when they register

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS admin_invited BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.users.admin_invited IS 'True if admin sent onboarding link - user gets auto-approved on registration';
