# 🚨 URGENT: Fix Missing avatar_url Column in Profiles Table

## Problem
Getting "Could not find the 'avatar_url' column of 'profiles'" error (PGRST204) when uploading profile pictures.

## Root Cause
The profiles table in the Supabase database is missing the `avatar_url` column, even though it's defined in the schema.sql file.

## ✅ IMMEDIATE FIX - Add Missing Column

### Option 1: Apply via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**
   - Open your project in https://supabase.com/dashboard
   - Navigate to **SQL Editor**

2. **Run this SQL to add the missing column:**
   ```sql
   -- Add avatar_url column to profiles table if it doesn't exist
   DO $$ 
   BEGIN 
       IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'profiles' 
           AND column_name = 'avatar_url'
       ) THEN
           ALTER TABLE profiles ADD COLUMN avatar_url text;
       END IF;
   END $$;
   ```

3. **Click "Run"** to execute the migration

### Option 2: Simple ALTER TABLE (if above doesn't work)

If the DO block doesn't work, use this simpler approach:
```sql
ALTER TABLE profiles ADD COLUMN avatar_url text;
```

### Option 3: Using Table Editor

1. Go to **Table Editor** → **profiles**
2. Click **"+ Add Column"**
3. Set:
   - **Column name**: `avatar_url`
   - **Type**: `text`
   - **Default value**: `NULL`
   - **Allow nullable**: ✅ Yes
   - **Is unique**: ❌ No
4. Click **Save**

## ✅ Verify the Fix

After adding the column, verify it exists:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'avatar_url';
```

Should return:
```
column_name | data_type | is_nullable
avatar_url  | text      | YES
```

## ✅ Test Profile Upload

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Test profile image upload:**
   - Go to http://localhost:3002/profile/edit
   - Try uploading a profile picture
   - Should work without PGRST204 errors

3. **Check the result:**
   - No more "Could not find avatar_url column" errors
   - Profile picture uploads successfully
   - Avatar URL gets saved to database

## 🔍 What This Fixes

- ✅ Adds missing `avatar_url` column to profiles table
- ✅ Allows profile picture URLs to be stored
- ✅ Resolves PGRST204 schema cache error
- ✅ Enables proper avatar upload functionality

## 📁 Files Created

- `supabase/migrations/002_add_avatar_url_to_profiles.sql` - Migration file
- `ADD_AVATAR_URL_COLUMN_FIX.md` - This instruction file

## 🚨 Important Notes

- The column **is already defined** in `schema.sql` and TypeScript types
- The issue is that the **actual database table** is missing this column
- This migration adds the column without affecting existing data
- The column is nullable, so existing profiles won't break

Apply the SQL migration immediately to fix the avatar upload error!
