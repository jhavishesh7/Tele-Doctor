# Profile Photos and Document Upload Implementation

## Overview
Implemented comprehensive profile photo and document upload functionality for both patients and doctors with verification workflow.

## Features Implemented

### For Patients
- **Profile Picture Upload**: Required for profile completion
- **Citizenship Document Upload**: Required for verification
- **Profile Completion Tracking**: Automatic detection when all required fields are filled
- **Completion Prompts**: Visual indicators showing what's missing

### For Doctors
- **Profile Picture Upload**: Required for profile completion
- **Document Uploads**:
  - Citizenship document (required)
  - MBBS certificate (required)
  - MD certificate (conditional - only if doctor has MD)
- **NMC Registration Number**: Required field for verification
- **Profile Completion Tracking**: Automatic detection
- **Verification Workflow**:
  - Prompt to complete profile on first login
  - Message when profile is submitted: "Your profile will be verified within 24 hours"
  - Status indicator during verification
  - Confirmation when verified

## Database Changes

### New Migration: `20251010000001_add_profile_documents.sql`

**Profiles Table**:
- `profile_picture_url` - URL to profile photo

**Patient Profiles Table**:
- `citizenship_document_url` - URL to citizenship document
- `profile_completed` - Boolean flag
- `profile_completed_at` - Timestamp

**Doctor Profiles Table**:
- `nmc_number` - NMC registration number (unique)
- `citizenship_document_url` - URL to citizenship
- `mbbs_certificate_url` - URL to MBBS certificate
- `md_certificate_url` - URL to MD certificate (optional)
- `has_md` - Boolean flag for MD degree
- `profile_completed` - Boolean flag
- `profile_completed_at` - Timestamp
- `verification_requested_at` - Timestamp
- `verification_notes` - Admin notes

## Storage Buckets Required

✅ You already have these buckets created in Supabase Storage:

### 1. `Profile_Picture`
- **Purpose**: Store user profile photos
- **Access**: Public read
- **Max file size**: 5MB
- **Allowed types**: JPG, PNG

### 2. `Documents`
- **Purpose**: Store verification documents
- **Access**: Public read (both are set to public in your setup)
- **Max file size**: 10MB
- **Allowed types**: JPG, PNG, PDF

## Setup Instructions

### 1. Run Database Migration
```bash
# Using Supabase CLI
supabase db push

# Or manually execute:
# supabase/migrations/20251010000001_add_profile_documents.sql
```

### 2. Set Up Storage Policies

Since both buckets are already created and set to public, you need to add RLS policies for security.

Go to **Supabase Dashboard → Storage → Policies**

**For `Profile_Picture` bucket**:
```sql
-- Allow authenticated users to upload their own profile picture
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Profile_Picture' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Profile_Picture');

-- Allow users to update their own pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Profile_Picture' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Profile_Picture' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**For `Documents` bucket**:
```sql
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

-- Allow admins to view all documents (for verification)
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
```

## New Components

### 1. `PatientProfileEdit.tsx`
- Complete patient profile management
- Profile picture upload
- Citizenship document upload
- Form validation
- Completion status tracking

### 2. `DoctorProfileEdit.tsx`
- Complete doctor profile management
- Profile picture upload
- Multiple document uploads (citizenship, MBBS, MD)
- NMC number field
- Verification status display
- Conditional MD certificate upload

### 3. `storage.ts` (Utility Library)
- `uploadFile()` - Generic file upload
- `uploadProfilePicture()` - Profile photo upload
- `uploadDocument()` - Document upload
- `validateFile()` - File validation
- `deleteFile()` - File deletion

## User Experience Flow

### Patient Flow
1. Sign up → Create account
2. Redirected to profile page
3. See yellow alert: "Complete Your Profile"
4. Upload profile picture
5. Fill in phone and address
6. Upload citizenship document
7. Click "Save Changes"
8. See green success: "Profile Complete"
9. Can now book appointments

### Doctor Flow
1. Sign up → Create account
2. Redirected to profile page
3. See yellow alert with checklist of missing items
4. Upload profile picture
5. Select medical specialty
6. Enter NMC registration number
7. Fill in qualifications, experience, contact info
8. Upload citizenship document
9. Upload MBBS certificate
10. If has MD: Check box and upload MD certificate
11. Click "Save Changes"
12. See blue alert: "Your profile will be verified within 24 hours"
13. Admin verifies documents and NMC number
14. Profile becomes visible to patients

## Validation Rules

### Profile Picture
- Max size: 5MB
- Formats: JPG, PNG
- Required for both patients and doctors

### Documents
- Max size: 10MB
- Formats: JPG, PNG, PDF
- Required documents:
  - **Patients**: Citizenship
  - **Doctors**: Citizenship, MBBS, MD (if applicable)

### Required Fields
**Patients**:
- Profile picture
- Phone number
- Address
- Citizenship document

**Doctors**:
- Profile picture
- Medical specialty
- NMC number
- Qualifications
- Contact phone
- Practice location
- Citizenship document
- MBBS certificate
- MD certificate (if has_md = true)

## Admin Verification

Admins can now verify doctors by:
1. Viewing uploaded documents
2. Checking NMC number validity
3. Reviewing qualifications
4. Setting `is_verified = true`
5. Adding verification notes if needed

## Testing Checklist

- [ ] Create storage buckets
- [ ] Set up storage policies
- [ ] Run database migration
- [ ] Test patient profile picture upload
- [ ] Test patient citizenship upload
- [ ] Test patient profile completion
- [ ] Test doctor profile picture upload
- [ ] Test doctor document uploads
- [ ] Test NMC number uniqueness
- [ ] Test MD certificate conditional display
- [ ] Test profile completion detection
- [ ] Test verification workflow
- [ ] Test admin document viewing

## Notes

- All file uploads are validated before upload
- Files are stored with unique names to prevent conflicts
- Profile completion is automatically detected
- Verification timestamp is set when profile is completed
- Storage policies ensure users can only access their own documents
- Admins have read access to all documents for verification
