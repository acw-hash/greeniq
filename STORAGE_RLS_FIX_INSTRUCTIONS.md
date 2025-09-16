# 🚨 URGENT: Fix Supabase Storage RLS Policy Error

## Problem
Getting "new row violates row-level security policy" error (403 Forbidden) when uploading profile images to Supabase Storage.

## Root Cause
The `avatars` bucket has Row Level Security (RLS) enabled but no policies exist to allow authenticated users to upload files.

## ✅ IMMEDIATE FIX - Apply Storage Policies

### Option 1: Apply via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**
   - Open your project in https://supabase.com/dashboard
   - Navigate to **SQL Editor**

2. **Run the Storage Policy Migration**
   - Copy the contents of `supabase/migrations/001_create_storage_avatars_policies.sql`
   - Paste into SQL Editor and click **Run**

3. **Verify the Policies**
   - Go to **Authentication** → **Policies**
   - Look for table `storage.objects`
   - You should see these new policies:
     - "Allow authenticated users to upload files to avatars bucket"
     - "Allow public read access to avatars bucket"
     - "Allow users to update own avatars"
     - "Allow users to delete own avatars"

### Option 2: Alternative Simple Policies

If the above doesn't work, try the simpler version:
- Use `supabase/migrations/001_alternative_simple_storage_policies.sql` instead
- This has less restrictive folder-based permissions

### Option 3: Manual Policy Creation in Dashboard

1. **Go to Authentication → Policies**
2. **Find `storage.objects` table**
3. **Create Upload Policy:**
   - Click "New Policy"
   - Choose "Custom policy"
   - Policy name: `Allow authenticated users to upload files to avatars bucket`
   - Allowed operation: `INSERT`
   - Policy definition: `bucket_id = 'avatars' AND auth.uid() IS NOT NULL`

4. **Create Read Policy:**
   - Click "New Policy"
   - Choose "Custom policy"  
   - Policy name: `Allow public read access to avatars bucket`
   - Allowed operation: `SELECT`
   - Policy definition: `bucket_id = 'avatars'`

## ✅ Test the Fix

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Test profile image upload:**
   - Go to http://localhost:3001/profile/edit
   - Try uploading a profile picture
   - Should work without 403 errors

3. **Check the terminal output:**
   - No more "Upload error: StorageApiError" messages
   - Should see successful upload confirmations

## 🔍 What These Policies Do

- **Upload Policy**: Allows any authenticated user to upload files to the `avatars` bucket
- **Read Policy**: Allows anyone (public) to view/download files from the `avatars` bucket
- **Update/Delete Policies**: Allow users to manage their own uploaded files

## 🛡️ Security Features

- Only authenticated users can upload
- Users can organize files in their own folders (`user_id/filename`)
- Public can view uploaded avatars (needed for profile pictures)
- RLS ensures data isolation and security

## ✅ Expected Results After Fix

- ✅ Profile image uploads work without errors
- ✅ Users can see their uploaded profile pictures
- ✅ No more 403 Forbidden errors in console
- ✅ Storage RLS policies properly configured

## 🚨 If Issues Persist

1. **Check bucket exists:**
   - Go to Storage in Supabase Dashboard
   - Verify `avatars` bucket exists and is public

2. **Verify user authentication:**
   - Ensure user is logged in when uploading
   - Check JWT token is valid

3. **Test with simpler policy:**
   - Try the alternative migration file
   - Temporarily use less restrictive policies

## 📁 Files Created

- `supabase/migrations/001_create_storage_avatars_policies.sql` - Main migration
- `supabase/migrations/001_alternative_simple_storage_policies.sql` - Backup option
- `STORAGE_RLS_FIX_INSTRUCTIONS.md` - This instruction file

Apply the migration and test immediately to resolve the storage upload error!
