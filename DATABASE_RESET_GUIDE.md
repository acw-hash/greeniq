# 🚨 Supabase Database Reset Guide - Complete Data Wipe & Fresh Start

## ⚠️ WARNING: DATA DESTRUCTION
This process will permanently delete ALL data from your Supabase database. Make sure you have backups if needed.

## 🎯 Reset Options (Choose One)

### Option 1: Quick Data Wipe (RECOMMENDED) ✅
- Clears all data but keeps schema intact
- Fastest recovery - no environment changes needed
- Preserves all tables, functions, triggers, and policies

### Option 2: Complete Database Reset
- Destroys everything including schema - requires rebuilding
- More time-consuming but gives you a completely fresh start

### Option 3: New Project Setup
- Create entirely new Supabase project
- Requires updating environment variables

---

## 🔥 Option 1: Quick Data Wipe (RECOMMENDED)

### Step 1: Connect to Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Execute the Reset Script
Copy and paste the contents of `supabase/database_reset.sql` into the SQL Editor and run it.

This script will:
- ✅ Clear all user data from your tables
- ✅ Remove all authentication data (users, sessions, etc.)
- ✅ Preserve your complete schema
- ✅ Keep all RLS policies, functions, and triggers
- ✅ Verify the reset was successful

### Step 3: Verify the Reset
Run the contents of `supabase/verify_reset.sql` to confirm everything was cleared successfully.

### Step 4: Clear Storage (Optional)
If you want to clear uploaded files as well, run `supabase/storage_cleanup.sql`.

---

## 🧹 Post-Reset Setup

### Step 1: Clear Browser Storage
After the database reset, clear your browser's local storage and cookies to avoid cached authentication issues:
- Open Developer Tools (F12)
- Go to Application/Storage tab
- Clear Local Storage, Session Storage, and Cookies for your domain

### Step 2: Restart Development Server
```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 3: Test Core Functionality

#### Test User Registration
1. **Golf Course Registration:**
   - Go to `/register`
   - Select "Golf Course" user type
   - Complete registration form
   - Verify profile creation

2. **Professional Registration:**
   - Go to `/register`
   - Select "Professional" user type
   - Complete registration form
   - Verify profile creation

#### Test Core Features
1. **Job Posting (as Golf Course):**
   - Login as golf course
   - Navigate to jobs section
   - Create a new job posting
   - Verify job appears in listings

2. **Job Browsing (as Professional):**
   - Login as professional
   - Browse available jobs
   - Apply to a job
   - Verify application was created

3. **Basic Navigation:**
   - Test all main navigation links
   - Verify dashboard loads correctly
   - Check profile pages work

### Step 4: Regenerate Types (If Using TypeScript)
If you're using Supabase CLI to generate types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

---

## 🔥 Option 2: Complete Database Reset

### Step 1: Drop All Custom Tables
```sql
-- ⚠️ NUCLEAR OPTION: Drops all tables and data
-- This will require rebuilding your entire schema

-- Drop all custom tables (order matters)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS job_updates CASCADE;
DROP TABLE IF EXISTS job_conversations CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS professional_profiles CASCADE;
DROP TABLE IF EXISTS golf_course_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop any custom functions
DROP FUNCTION IF EXISTS jobs_within_distance CASCADE;
DROP FUNCTION IF EXISTS update_professional_rating CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Clear auth data
TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE auth.identities CASCADE;
TRUNCATE TABLE auth.sessions CASCADE;
TRUNCATE TABLE auth.refresh_tokens CASCADE;
```

### Step 2: Rebuild Schema
After dropping everything, run your schema file:
```sql
-- Copy and paste the contents of supabase/schema_updated.sql
-- This will recreate all tables, policies, functions, and triggers
```

---

## 🆕 Option 3: New Supabase Project

### Step 1: Create New Project
1. Go to Supabase Dashboard
2. Click "New Project"
3. Choose your organization
4. Set project name: `greeniq-fresh` (or similar)
5. Set database password (save this!)
6. Choose region (same as before for consistency)
7. Click "Create new project"

### Step 2: Update Environment Variables
Update your `.env.local` file with new project details:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

### Step 3: Set Up Fresh Schema
Run your database schema on the new project using `supabase/schema_updated.sql`.

---

## ✅ Verification Checklist

After completing the reset, verify these items:

- [ ] All database tables are empty (run verification script)
- [ ] Authentication system works (can register new users)
- [ ] Job posting functionality works
- [ ] Job browsing and application system works
- [ ] Profile management works
- [ ] Navigation and routing work correctly
- [ ] No console errors in browser
- [ ] Development server runs without errors

---

## 🎯 Recommended Approach

**I recommend Option 1 (Quick Data Wipe)** because:
- ✅ Fastest recovery - Keeps your schema intact
- ✅ No environment variable changes - Same project, same keys
- ✅ No rebuilding required - Just clears data
- ✅ Easiest to execute - One SQL script
- ✅ Preserves all your custom functions and triggers

After running the reset, you'll have a completely clean database with all your tables and relationships intact, ready for fresh data and testing.

---

## 🚨 Important Notes

- **Backup first** if you have any data you want to keep
- **Test in development** before doing this in production
- **Update any seed data** you might want to add back
- **Clear browser storage** after reset to avoid cached auth issues
- **Restart your development server** after the reset

---

## 📁 Files Created

This guide creates the following files in your project:
- `supabase/database_reset.sql` - Main reset script
- `supabase/verify_reset.sql` - Verification script
- `supabase/storage_cleanup.sql` - Storage cleanup script
- `DATABASE_RESET_GUIDE.md` - This guide

---

## 🆘 Need Help?

If you encounter any issues during the reset process:
1. Check the verification script output for any remaining data
2. Ensure all foreign key constraints are properly handled
3. Verify your RLS policies are still in place
4. Check that all functions and triggers are preserved

The reset scripts are designed to be safe and preserve your schema while clearing all data. If you need to rebuild from scratch, use Option 2 or 3.
