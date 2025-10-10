/*
  # Allow All Storage Operations (Development Only)
  
  This creates permissive policies that allow all authenticated users
  to upload, view, update, and delete files in storage buckets.
  
  WARNING: This is for development only!
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on Profile_Picture" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on Documents" ON storage.objects;
DROP POLICY IF EXISTS "Public access to Profile_Picture" ON storage.objects;
DROP POLICY IF EXISTS "Public access to Documents" ON storage.objects;

-- Create permissive policies for Profile_Picture bucket
CREATE POLICY "Allow all operations on Profile_Picture"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'Profile_Picture')
WITH CHECK (bucket_id = 'Profile_Picture');

-- Create permissive policies for Documents bucket
CREATE POLICY "Allow all operations on Documents"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'Documents')
WITH CHECK (bucket_id = 'Documents');

-- Allow public read access to both buckets
CREATE POLICY "Public access to Profile_Picture"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Profile_Picture');

CREATE POLICY "Public access to Documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Documents');

-- Make buckets public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('Profile_Picture', 'Documents');

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Profile_Picture%' OR policyname LIKE '%Documents%'
ORDER BY policyname;
