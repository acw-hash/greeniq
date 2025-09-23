-- 🚨 SUPABASE DATABASE RESET SCRIPT 🚨
-- ⚠️  WARNING: This will permanently delete ALL data from your database
-- ✅ This script preserves your schema but clears all data
-- 📋 Based on your current schema with job_conversations and job_updates tables

-- Step 1: Disable triggers and constraints temporarily
SET session_replication_role = replica;

-- Step 2: Clear all user data (order matters due to foreign keys)
-- Clear dependent tables first
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE certifications CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE job_updates CASCADE;
TRUNCATE TABLE job_conversations CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE jobs CASCADE;
TRUNCATE TABLE professional_profiles CASCADE;
TRUNCATE TABLE golf_course_profiles CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Step 3: Clear auth data (this removes all user accounts)
TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE auth.identities CASCADE;
TRUNCATE TABLE auth.sessions CASCADE;
TRUNCATE TABLE auth.refresh_tokens CASCADE;

-- Step 4: Re-enable constraints
SET session_replication_role = DEFAULT;

-- Step 5: Reset sequences (if any exist)
-- Note: Most tables use gen_random_uuid() so no sequences to reset
-- But if you have any custom sequences, add them here:
-- ALTER SEQUENCE IF EXISTS some_sequence_name RESTART WITH 1;

-- Step 6: Verify all tables are empty
SELECT 
  schemaname,
  tablename,
  n_tup_ins as "Rows"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 7: Check auth tables are empty
SELECT 'Auth users cleared' as status, COUNT(*) as remaining_users FROM auth.users;
SELECT 'Auth sessions cleared' as status, COUNT(*) as remaining_sessions FROM auth.sessions;
SELECT 'Auth identities cleared' as status, COUNT(*) as remaining_identities FROM auth.identities;

-- Step 8: Final verification - all main tables should show 0 rows
SELECT 'Profiles cleared' as status, COUNT(*) as remaining_rows FROM profiles;
SELECT 'Jobs cleared' as status, COUNT(*) as remaining_rows FROM jobs;
SELECT 'Applications cleared' as status, COUNT(*) as remaining_rows FROM applications;
SELECT 'Messages cleared' as status, COUNT(*) as remaining_rows FROM messages;
SELECT 'Job conversations cleared' as status, COUNT(*) as remaining_rows FROM job_conversations;
SELECT 'Job updates cleared' as status, COUNT(*) as remaining_rows FROM job_updates;
SELECT 'Reviews cleared' as status, COUNT(*) as remaining_rows FROM reviews;
SELECT 'Certifications cleared' as status, COUNT(*) as remaining_rows FROM certifications;
SELECT 'Payments cleared' as status, COUNT(*) as remaining_rows FROM payments;
SELECT 'Notifications cleared' as status, COUNT(*) as remaining_rows FROM notifications;

-- ✅ RESET COMPLETE
-- Your database is now completely clean with all schema intact
-- You can now start fresh with new user registrations and data
