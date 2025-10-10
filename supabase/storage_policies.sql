/*
  # Storage Policies for Profile Pictures and Documents
  
  Run this in Supabase SQL Editor to set up storage access policies.
*/

-- ============================================
-- PROFILE_PICTURE BUCKET POLICIES
-- ============================================

-- Allow authenticated users to upload their own profile picture
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Profile_Picture' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to profile pictures
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Profile_Picture');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Profile_Picture' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Profile_Picture' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- DOCUMENTS BUCKET POLICIES
-- ============================================

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all documents (for verification purposes)
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow users to update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
