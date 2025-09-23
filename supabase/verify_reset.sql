-- 🔍 DATABASE RESET VERIFICATION SCRIPT
-- Run this after executing the database_reset.sql script
-- This will confirm that all data has been cleared successfully

-- Check all public tables are empty
SELECT 
  'Table Status Check' as check_type,
  tablename as table_name,
  n_tup_ins as row_count,
  CASE 
    WHEN n_tup_ins = 0 THEN '✅ CLEARED'
    ELSE '❌ STILL HAS DATA'
  END as status
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check auth tables are empty
SELECT 
  'Auth Tables Check' as check_type,
  'auth.users' as table_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEARED'
    ELSE '❌ STILL HAS DATA'
  END as status
FROM auth.users

UNION ALL

SELECT 
  'Auth Tables Check' as check_type,
  'auth.sessions' as table_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEARED'
    ELSE '❌ STILL HAS DATA'
  END as status
FROM auth.sessions

UNION ALL

SELECT 
  'Auth Tables Check' as check_type,
  'auth.identities' as table_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEARED'
    ELSE '❌ STILL HAS DATA'
  END as status
FROM auth.identities;

-- Verify schema integrity (tables should still exist)
SELECT 
  'Schema Integrity Check' as check_type,
  table_name,
  '✅ EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'golf_course_profiles', 'professional_profiles',
    'jobs', 'applications', 'job_conversations', 'job_updates',
    'messages', 'reviews', 'certifications', 'payments', 'notifications'
  )
ORDER BY table_name;

-- Check that RLS policies are still in place
SELECT 
  'RLS Policies Check' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'golf_course_profiles', 'professional_profiles',
    'jobs', 'applications', 'job_conversations', 'job_updates',
    'messages', 'reviews', 'certifications', 'payments', 'notifications'
  )
ORDER BY tablename;

-- Check that functions still exist
SELECT 
  'Functions Check' as check_type,
  proname as function_name,
  '✅ EXISTS' as status
FROM pg_proc 
WHERE proname IN ('jobs_within_distance', 'update_professional_rating', 'update_updated_at_column')
ORDER BY proname;

-- Check that triggers still exist
SELECT 
  'Triggers Check' as check_type,
  trigger_name,
  event_object_table as table_name,
  '✅ EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_name IN ('update_rating_after_review', 'update_profiles_updated_at', 'update_jobs_updated_at')
ORDER BY trigger_name;

-- Check that indexes still exist
SELECT 
  'Indexes Check' as check_type,
  indexname,
  tablename,
  '✅ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Final summary
SELECT 
  '🎯 RESET VERIFICATION SUMMARY' as summary,
  'If all checks above show ✅, your database reset was successful!' as message;
