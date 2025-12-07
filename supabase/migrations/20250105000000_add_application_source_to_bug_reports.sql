-- Add application_source column to bug_reports table
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS application_source TEXT NOT NULL DEFAULT 'fleet-management';

-- Create index for filtering by application
CREATE INDEX IF NOT EXISTS idx_bug_reports_application_source ON bug_reports(application_source);

-- Add comment for clarity
COMMENT ON COLUMN bug_reports.application_source IS 'Source application: fleet-management, crm-proposal, or other';
