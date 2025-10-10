# Complete Database Setup Guide

## 🚨 IMPORTANT: Run in This Order!

You need to run **3 migration files** in Supabase SQL Editor in this exact order:

---

## Step 1: Create Initial Schema (REQUIRED FIRST!)

**File**: `supabase/migrations/20251005042115_create_initial_schema.sql`

This creates:
- ✅ `profiles` table
- ✅ `medical_categories` table
- ✅ `doctor_profiles` table
- ✅ `patient_profiles` table
- ✅ `appointments` table
- ✅ `notifications` table
- ✅ All RLS policies
- ✅ Initial data (medical categories)

**How to run**:
1. Open Supabase Dashboard → SQL Editor
2. Copy the entire content of `20251005042115_create_initial_schema.sql`
3. Paste and click **Run**
4. Wait for "Success" message

---

## Step 2: Add Video Call Support

**File**: `supabase/migrations/20251010000000_add_video_call_support.sql`

This adds:
- ✅ `call_sessions` table
- ✅ Video call fields to `appointments`
- ✅ WebRTC signaling support
- ✅ Call status tracking

**How to run**:
1. In Supabase SQL Editor
2. Copy the entire content of `20251010000000_add_video_call_support.sql`
3. Paste and click **Run**
4. Wait for "Success" message

---

## Step 3: Add Profile Documents

**File**: `supabase/migrations/20251010000001_add_profile_documents.sql`

This adds:
- ✅ Profile picture URLs
- ✅ Document upload fields
- ✅ NMC number for doctors
- ✅ Profile completion tracking
- ✅ Verification workflow

**How to run**:
1. In Supabase SQL Editor
2. Copy the entire content of `20251010000001_add_profile_documents.sql`
3. Paste and click **Run**
4. Wait for "Success" message

---

## Step 4: Enable Realtime

**File**: `supabase/enable_realtime.sql`

This enables:
- ✅ Realtime updates for video calls
- ✅ WebRTC signaling via Supabase

**How to run**:
1. In Supabase SQL Editor
2. Copy the content of `enable_realtime.sql`
3. Paste and click **Run**
4. Should see: `call_sessions` in the results

---

## Step 5: Allow Storage Uploads (Optional - for development)

**File**: `supabase/allow_all_storage.sql`

This allows:
- ✅ File uploads without RLS errors
- ✅ Profile picture uploads
- ✅ Document uploads

**How to run**:
1. In Supabase SQL Editor
2. Copy the content of `allow_all_storage.sql`
3. Paste and click **Run**

---

## ✅ Verification

After running all scripts, verify everything is set up:

```sql
-- Run this to check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles',
  'medical_categories',
  'doctor_profiles',
  'patient_profiles',
  'appointments',
  'notifications',
  'call_sessions'
)
ORDER BY table_name;
```

**Expected output**: Should show all 7 tables

```sql
-- Check Realtime is enabled
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

**Expected output**: Should include `call_sessions`

---

## 🎯 Quick Setup (Copy-Paste Order)

If you want to do it all at once, run these files in this exact order:

1. `20251005042115_create_initial_schema.sql` ← **MUST BE FIRST!**
2. `20251010000000_add_video_call_support.sql`
3. `20251010000001_add_profile_documents.sql`
4. `enable_realtime.sql`
5. `allow_all_storage.sql` (optional, for dev)

---

## 🐛 Troubleshooting

### Error: "relation does not exist"
**Cause**: You skipped Step 1 (initial schema)
**Fix**: Run `20251005042115_create_initial_schema.sql` first!

### Error: "already exists"
**Cause**: You already ran that migration
**Fix**: Skip it and continue to next one

### Error: "permission denied"
**Cause**: RLS policies blocking you
**Fix**: Run `allow_all_storage.sql`

---

## 📝 What Each Migration Does

### Initial Schema (Step 1)
Creates the entire database structure - profiles, doctors, patients, appointments, notifications.

### Video Call Support (Step 2)
Adds WebRTC video calling capability to appointments.

### Profile Documents (Step 3)
Adds document upload fields for verification (citizenship, certificates, NMC number).

### Realtime (Step 4)
Enables real-time updates for video call signaling.

### Storage (Step 5)
Allows file uploads for profile pictures and documents.

---

## ✨ After Setup

Once all migrations are complete:

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Test the features**:
   - ✅ User registration/login
   - ✅ Profile creation
   - ✅ Appointment booking
   - ✅ Video calls
   - ✅ File uploads

3. **Check debug mode**:
   - Edit `src/config/debug.ts` to enable/disable features
   - Set all to `false` for easy testing without uploads

---

## 🆘 Still Having Issues?

1. Check Supabase Dashboard → Database → Tables
   - Should see all 7 tables listed

2. Check Supabase Dashboard → Database → Replication
   - `call_sessions` should be enabled

3. Check browser console for errors
   - Look for red error messages
   - Share them for specific help

4. Check Supabase logs
   - Dashboard → Logs → Database
   - Look for SQL errors
