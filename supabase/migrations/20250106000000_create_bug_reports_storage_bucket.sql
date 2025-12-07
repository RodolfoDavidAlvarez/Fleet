-- Create storage bucket for bug report screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for bug-reports bucket
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
