-- Create Storage Bucket for Repair Images and Vehicle Photos
-- Run this SQL in your Supabase SQL Editor

-- Create the 'public' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true, -- Make bucket public so images can be accessed via URL
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow authenticated users to upload
-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Allow anyone to read (since bucket is public)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Allow authenticated users and service role to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow authenticated users and service role to update
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow authenticated users and service role to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Note: Since we're using service_role_key in the API, these policies
-- may need to be adjusted. Service role bypasses RLS, but it's good
-- to have policies in place for future client-side access.

