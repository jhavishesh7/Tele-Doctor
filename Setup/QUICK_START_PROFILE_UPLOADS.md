# Quick Start: Profile Photos & Document Uploads

## ✅ What's Been Updated

Your application now has the new profile components with document upload functionality!

### Files Modified:
1. **`src/App.tsx`** - Updated routing to use new components
   - `DoctorProfileView` → `DoctorProfileEdit`
   - `PatientProfileView` → `PatientProfileEdit`

### New Features Available:
- ✅ Profile picture upload
- ✅ Document uploads (citizenship, MBBS, MD)
- ✅ NMC registration number field
- ✅ Profile completion tracking
- ✅ Verification workflow messages

## 🚀 Next Steps to Make It Work

### Step 1: Run Database Migration
```bash
# In your terminal, from project directory
supabase db push
```

Or manually in Supabase SQL Editor, run:
```
supabase/migrations/20251010000001_add_profile_documents.sql
```

### Step 2: Set Up Storage Policies
In Supabase Dashboard → SQL Editor, run:
```
supabase/storage_policies.sql
```

This sets up security policies for your `Profile_Picture` and `Documents` buckets.

### Step 3: Test the New Features

**As a Doctor:**
1. Log in to your account
2. Click "My Profile" in the navigation
3. You should now see:
   - Profile picture upload section
   - NMC registration number field
   - Document upload sections (Citizenship, MBBS, MD)
   - Profile completion checklist
   - Save button

**As a Patient:**
1. Log in to your account
2. Click "My Profile" in the navigation
3. You should now see:
   - Profile picture upload section
   - Citizenship document upload
   - Required fields (phone, address)
   - Save button

## 📋 What Each User Will See

### New Doctor Experience:
1. **First Login**: Yellow alert showing "Complete Your Profile" with checklist
2. **After Uploading All Documents**: Blue alert "Your profile will be verified within 24 hours"
3. **After Admin Verification**: Green alert "Profile Verified"

### New Patient Experience:
1. **First Login**: Yellow alert showing "Complete Your Profile"
2. **After Completing Profile**: Green alert "Profile Complete"
3. Can now book appointments

## 🔍 Verification Workflow

### For Doctors:
1. Doctor completes profile with all documents
2. `profile_completed` = true, `verification_requested_at` timestamp set
3. Admin reviews:
   - NMC number
   - Citizenship document
   - MBBS certificate
   - MD certificate (if applicable)
4. Admin sets `is_verified` = true
5. Doctor profile becomes visible to patients

### For Patients:
1. Patient completes profile with citizenship document
2. `profile_completed` = true
3. Can immediately book appointments (no admin verification needed)

## 📁 File Structure

```
src/
├── components/
│   ├── doctor/
│   │   └── DoctorProfileEdit.tsx ← NEW (replaces DoctorProfile.tsx)
│   └── patient/
│       └── PatientProfileEdit.tsx ← NEW (replaces PatientProfileView.tsx)
├── lib/
│   └── storage.ts ← NEW (file upload utilities)
└── App.tsx ← UPDATED (routing)

supabase/
├── migrations/
│   └── 20251010000001_add_profile_documents.sql ← NEW
└── storage_policies.sql ← NEW
```

## 🐛 Troubleshooting

### "Failed to upload file"
- Check that storage buckets exist: `Profile_Picture` and `Documents`
- Verify storage policies are set up correctly
- Check file size (max 5MB for photos, 10MB for documents)

### "Profile not updating"
- Check browser console for errors
- Verify database migration ran successfully
- Check that user is authenticated

### "Documents not showing"
- Verify storage policies allow authenticated users to view their own files
- Check that URLs are being saved to database correctly

## 🎯 Testing Checklist

- [ ] Database migration executed successfully
- [ ] Storage policies created
- [ ] Doctor can upload profile picture
- [ ] Doctor can upload citizenship document
- [ ] Doctor can upload MBBS certificate
- [ ] Doctor can upload MD certificate (when has_md checked)
- [ ] Doctor can enter NMC number
- [ ] Doctor sees "Complete your profile" message
- [ ] Doctor sees "Verification pending" after completion
- [ ] Patient can upload profile picture
- [ ] Patient can upload citizenship document
- [ ] Patient sees "Profile complete" after completion
- [ ] Admin can view all documents for verification

## 💡 Tips

1. **File Formats**: JPG, PNG for photos; JPG, PNG, PDF for documents
2. **File Sizes**: Keep under limits (5MB photos, 10MB documents)
3. **NMC Number**: Must be unique per doctor
4. **Profile Completion**: Automatically detected when all required fields filled

## 🔐 Security

- Users can only upload/view their own files
- Admins can view all documents for verification
- Profile pictures are publicly accessible
- Documents require authentication to view
- All uploads validated before storage

---

**Need Help?** Check the detailed documentation in `PROFILE_DOCUMENTS_SETUP.md`
