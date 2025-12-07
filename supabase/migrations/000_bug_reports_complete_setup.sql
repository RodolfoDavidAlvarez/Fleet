-- ============================================================================
-- Bug Reports Complete Setup Migration
-- ============================================================================
-- This migration creates the bug_reports table, adds necessary columns,
-- and sets up the storage bucket for screenshots.
-- Run this in your Supabase SQL Editor to set up the bug reports feature.
-- ============================================================================

-- Step 1: Create bug_reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Step 2: Add application_source column (if not exists)
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS application_source TEXT NOT NULL DEFAULT 'fleet-management';

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_application_source ON bug_reports(application_source);

-- Step 4: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for updated_at
DROP TRIGGER IF EXISTS bug_reports_updated_at ON bug_reports;
CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

-- Step 6: Enable Row Level Security
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies (if any) and create new ones
DROP POLICY IF EXISTS "Users can view their own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON bug_reports;

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
  ON bug_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bug reports
CREATE POLICY "Users can create bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (true);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports"
  ON bug_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update bug reports
CREATE POLICY "Admins can update bug reports"
  ON bug_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Step 8: Create storage bucket for bug report screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Step 9: Set up storage policies for bug-reports bucket
-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can upload bug report screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for bug report screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete bug report screenshots" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload bug report screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bug-reports');

-- Allow public read access
CREATE POLICY "Public read access for bug report screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bug-reports');

-- Allow admins to delete screenshots
CREATE POLICY "Admins can delete bug report screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bug-reports' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Step 10: Add comment for documentation
COMMENT ON TABLE bug_reports IS 'User-submitted bug reports and feature requests';
COMMENT ON COLUMN bug_reports.application_source IS 'Source application: fleet-management, crm-proposal, or other';

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Verify the setup by running:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'bug_reports';
-- SELECT id, name FROM storage.buckets WHERE id = 'bug-reports';
-- ============================================================================
