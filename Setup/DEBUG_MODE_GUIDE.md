# Debug Mode Guide

## Overview
Debug flags have been added to bypass document upload and verification requirements during development and testing.

## Configuration File
**Location**: `src/config/debug.ts`

## Available Flags

### 1. `REQUIRE_DOCUMENTS` (default: `false`)
Controls whether document uploads are required for profile completion.

**When `false`**:
- ✅ Citizenship documents NOT required
- ✅ MBBS certificate NOT required
- ✅ MD certificate NOT required
- ✅ Profile can be completed without uploading any documents

**When `true`**:
- ❌ All documents must be uploaded
- ❌ Profile incomplete without documents

### 2. `REQUIRE_PROFILE_PICTURE` (default: `false`)
Controls whether profile picture upload is required.

**When `false`**:
- ✅ Profile picture NOT required
- ✅ Can use default avatar

**When `true`**:
- ❌ Must upload profile picture

### 3. `REQUIRE_NMC_NUMBER` (default: `false`)
Controls whether NMC registration number is required for doctors.

**When `false`**:
- ✅ NMC number field optional
- ✅ Profile can be completed without NMC number

**When `true`**:
- ❌ NMC number must be provided

### 4. `ENABLE_DOCTOR_VERIFICATION` (default: `false`)
Controls the doctor verification workflow.

**When `false`**:
- ✅ Doctors don't need admin verification
- ✅ Profile becomes active immediately after completion
- ✅ No "verification pending" message
- ✅ Can start receiving appointments right away

**When `true`**:
- ❌ Doctors must wait for admin verification
- ❌ Shows "Your profile will be verified within 24 hours"
- ❌ Profile not visible to patients until verified

### 5. `SHOW_DEBUG_LOGS` (default: `true`)
Controls console logging for debugging.

**When `true`**:
- Shows detailed logs in browser console
- Logs profile completion checks
- Logs save operations

**When `false`**:
- No debug logs in console

## How to Use

### Quick Test Mode (Current Settings)
All requirements are disabled by default for easy testing:

```typescript
export const DEBUG_CONFIG = {
  REQUIRE_DOCUMENTS: false,           // Documents NOT required
  REQUIRE_PROFILE_PICTURE: false,     // Photo NOT required
  ENABLE_DOCTOR_VERIFICATION: false,  // Verification DISABLED
  REQUIRE_NMC_NUMBER: false,          // NMC NOT required
  SHOW_DEBUG_LOGS: true,              // Show logs
};
```

**Result**: You can complete profiles by just filling in:
- **Doctors**: Specialty, qualifications, phone, location
- **Patients**: Phone, address

### Enable Specific Requirements

To test with documents required:
```typescript
REQUIRE_DOCUMENTS: true,
```

To test with verification workflow:
```typescript
ENABLE_DOCTOR_VERIFICATION: true,
```

### Production Mode
For production, enable all requirements:

```typescript
export const DEBUG_CONFIG = {
  REQUIRE_DOCUMENTS: true,
  REQUIRE_PROFILE_PICTURE: true,
  ENABLE_DOCTOR_VERIFICATION: true,
  REQUIRE_NMC_NUMBER: true,
  SHOW_DEBUG_LOGS: false,
};
```

## Visual Indicators

### Debug Mode Banner
When any requirement is disabled, you'll see a **purple banner** at the top of the profile page:

```
🐛 Debug Mode Active
Some requirements are disabled for testing:
• Profile picture NOT required
• Documents NOT required
• NMC number NOT required
• Verification workflow DISABLED
```

### Checklist Updates
The "Complete Your Profile" checklist only shows items that are actually required based on the current debug flags.

## Testing Scenarios

### Scenario 1: Test Basic Profile Flow
```typescript
// All disabled - fastest testing
REQUIRE_DOCUMENTS: false,
REQUIRE_PROFILE_PICTURE: false,
ENABLE_DOCTOR_VERIFICATION: false,
REQUIRE_NMC_NUMBER: false,
```

**Test**: Fill in basic info → Save → Profile complete immediately

### Scenario 2: Test Document Uploads
```typescript
// Enable documents only
REQUIRE_DOCUMENTS: true,
REQUIRE_PROFILE_PICTURE: true,
ENABLE_DOCTOR_VERIFICATION: false,  // Still no verification wait
REQUIRE_NMC_NUMBER: false,
```

**Test**: Upload documents → Save → Profile complete immediately

### Scenario 3: Test Full Verification Workflow
```typescript
// Enable everything
REQUIRE_DOCUMENTS: true,
REQUIRE_PROFILE_PICTURE: true,
ENABLE_DOCTOR_VERIFICATION: true,
REQUIRE_NMC_NUMBER: true,
```

**Test**: Complete all requirements → Save → See "Verification pending" message

## Console Logs

With `SHOW_DEBUG_LOGS: true`, you'll see logs like:

```
[DEBUG] Profile completion check {
  hasProfilePicture: false,
  hasRequiredFields: true,
  hasDocuments: false,
  hasNmcNumber: false,
  isComplete: true,  // Because requirements are disabled
  activeFlags: {
    REQUIRE_PROFILE_PICTURE: false,
    REQUIRE_DOCUMENTS: false,
    REQUIRE_NMC_NUMBER: false
  }
}
```

## Important Notes

1. **Changes Take Effect Immediately**: Just edit `src/config/debug.ts` and save. No restart needed.

2. **Database Still Updates**: Profile completion status is still saved to database based on current flags.

3. **Not for Production**: Remember to enable all requirements before deploying to production!

4. **Storage RLS**: If you're still getting upload errors, you may need to disable storage RLS using:
   ```sql
   -- Run in Supabase SQL Editor
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   ```

## Quick Reference

| What You Want to Test | Flags to Enable |
|----------------------|-----------------|
| Just the UI | All `false` |
| Document uploads | `REQUIRE_DOCUMENTS: true` |
| Profile pictures | `REQUIRE_PROFILE_PICTURE: true` |
| NMC validation | `REQUIRE_NMC_NUMBER: true` |
| Verification workflow | `ENABLE_DOCTOR_VERIFICATION: true` |
| Everything (production) | All `true` |

## Troubleshooting

**Q: Profile still says incomplete?**
A: Check console logs to see which requirement is failing. Make sure the flag is set to `false` for that requirement.

**Q: Not seeing debug banner?**
A: The banner only shows when at least one requirement is disabled. If all are `true`, no banner appears.

**Q: Changes not taking effect?**
A: Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

**Q: Still can't upload files?**
A: Run the `disable_storage_rls.sql` script in Supabase to temporarily disable storage security.
