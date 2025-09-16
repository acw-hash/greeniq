-- Add avatar_url column to profiles table
-- This migration ensures the profiles table has the avatar_url column for storing uploaded profile images

-- Add the avatar_url column if it doesn't exist
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

-- Ensure the column is nullable (allows NULL values)
ALTER TABLE profiles ALTER COLUMN avatar_url DROP NOT NULL;
