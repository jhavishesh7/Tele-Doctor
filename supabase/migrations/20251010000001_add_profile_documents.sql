/*
  # Add Profile Photos and Document Upload Support

  ## Changes
  1. Add profile photo URLs to profiles table
  2. Add document fields to patient_profiles (citizenship)
  3. Add document fields to doctor_profiles (citizenship, MBBS, MD, NMC number)
  4. Add profile completion tracking
  5. Add verification status fields
*/

-- Add profile_picture_url to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Add document fields to patient_profiles
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS citizenship_document_url text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

-- Add document fields and NMC number to doctor_profiles
ALTER TABLE doctor_profiles
ADD COLUMN IF NOT EXISTS nmc_number text,
ADD COLUMN IF NOT EXISTS citizenship_document_url text,
ADD COLUMN IF NOT EXISTS mbbs_certificate_url text,
ADD COLUMN IF NOT EXISTS md_certificate_url text,
ADD COLUMN IF NOT EXISTS has_md boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS verification_notes text;

-- Create index for NMC number lookup
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_nmc_number ON doctor_profiles(nmc_number);

-- Create index for profile completion status
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_profile_completed ON doctor_profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_profile_completed ON patient_profiles(profile_completed);

-- Add constraint to ensure NMC number is unique if provided
ALTER TABLE doctor_profiles
ADD CONSTRAINT unique_nmc_number UNIQUE (nmc_number);

-- Create function to automatically set profile_completed_at timestamp
CREATE OR REPLACE FUNCTION set_profile_completed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_completed = true AND OLD.profile_completed = false THEN
    NEW.profile_completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for profile completion
CREATE TRIGGER trigger_patient_profile_completed
  BEFORE UPDATE ON patient_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_completed_timestamp();

CREATE TRIGGER trigger_doctor_profile_completed
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_completed_timestamp();

-- Create function to set verification_requested_at when profile is completed
CREATE OR REPLACE FUNCTION set_verification_requested_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_completed = true AND OLD.profile_completed = false THEN
    NEW.verification_requested_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification request
CREATE TRIGGER trigger_doctor_verification_requested
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_requested_timestamp();
