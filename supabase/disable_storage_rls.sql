/*
  # Disable RLS on Storage Buckets (Temporary Fix)
  
  WARNING: This makes your storage buckets completely public!
  Only use this for development/testing.
  
  This script:
  1. Drops ALL existing storage policies
  2. Disables RLS on storage.objects table
  3. Makes buckets public
*/

-- First, get all existing policies on storage.objects
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Disable RLS on storage.objects (allows all operations)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.buckets as well
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Make buckets public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('Profile_Picture', 'Documents');

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename IN ('objects', 'buckets');

-- Verify buckets are public
SELECT 
  id as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('Profile_Picture', 'Documents');
