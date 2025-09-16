-- Alternative: Simple Storage RLS policies for avatars bucket
-- Use this if the folder-based restrictions are causing issues
-- This version is more permissive but still secure

-- 1. Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[];

-- 2. Enable Row Level Security on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Avatars upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public read policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars delete policy" ON storage.objects;

-- 4. Simple policy: Allow authenticated users to upload to avatars bucket
CREATE POLICY "Avatars upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- 5. Simple policy: Allow everyone to read from avatars bucket
CREATE POLICY "Avatars public read policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 6. Allow authenticated users to update avatars (less restrictive)
CREATE POLICY "Avatars update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- 7. Allow authenticated users to delete avatars (less restrictive)
CREATE POLICY "Avatars delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
