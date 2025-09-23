-- 🗂️ STORAGE BUCKET CLEANUP SCRIPT
-- Run this to clear all files from your Supabase storage buckets
-- ⚠️ This will permanently delete all uploaded files

-- First, let's see what buckets exist
SELECT 
  'Existing Buckets' as info,
  name as bucket_name,
  public as is_public,
  created_at
FROM storage.buckets
ORDER BY name;

-- Clear files from common bucket types
-- Adjust bucket names based on what you actually have

-- Clear avatar files
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
SELECT 'Avatars bucket cleared' as status, COUNT(*) as remaining_files FROM storage.objects WHERE bucket_id = 'avatars';

-- Clear document files
DELETE FROM storage.objects WHERE bucket_id = 'documents';
SELECT 'Documents bucket cleared' as status, COUNT(*) as remaining_files FROM storage.objects WHERE bucket_id = 'documents';

-- Clear certification files
DELETE FROM storage.objects WHERE bucket_id = 'certifications';
SELECT 'Certifications bucket cleared' as status, COUNT(*) as remaining_files FROM storage.objects WHERE bucket_id = 'certifications';

-- Clear job photos
DELETE FROM storage.objects WHERE bucket_id = 'job-photos';
SELECT 'Job photos bucket cleared' as status, COUNT(*) as remaining_files FROM storage.objects WHERE bucket_id = 'job-photos';

-- Clear profile images
DELETE FROM storage.objects WHERE bucket_id = 'profile-images';
SELECT 'Profile images bucket cleared' as status, COUNT(*) as remaining_files FROM storage.objects WHERE bucket_id = 'profile-images';

-- Clear any other common bucket types
DELETE FROM storage.objects WHERE bucket_id = 'uploads';
SELECT 'Uploads bucket cleared' as status, COUNT(*) as remaining_files FROM storage.objects WHERE bucket_id = 'uploads';

DELETE FROM storage.objects WHERE bucket_id = 'files';
SELECT 'Files bucket cleared' as status, COUNT(*) as remaining_files FROM storage.objects WHERE bucket_id = 'files';

-- Nuclear option: Clear ALL files from ALL buckets
-- Uncomment the line below if you want to clear everything
-- DELETE FROM storage.objects;

-- Check remaining files in all buckets
SELECT 
  'Remaining Files Summary' as info,
  bucket_id,
  COUNT(*) as file_count
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- Final verification - should show 0 files if everything was cleared
SELECT 
  'Total remaining files' as summary,
  COUNT(*) as total_files
FROM storage.objects;

-- ✅ STORAGE CLEANUP COMPLETE
-- All uploaded files have been removed from storage buckets
