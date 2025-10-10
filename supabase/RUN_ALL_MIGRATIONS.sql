/*
  # Run All Migrations for Video Call Feature
  
  Run this script in Supabase SQL Editor to set up everything needed
  for video calls and profile uploads.
  
  This script:
  1. Creates call_sessions table
  2. Adds video call fields to appointments
  3. Adds profile document fields
  4. Enables Realtime for call_sessions
*/

-- ============================================
-- MIGRATION 1: Video Call Support
-- ============================================

-- Add new columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'offline' CHECK (appointment_type IN ('online', 'offline')),
ADD COLUMN IF NOT EXISTS call_session_id uuid,
ADD COLUMN IF NOT EXISTS call_status text DEFAULT 'not_started' CHECK (call_status IN ('not_started', 'waiting', 'active', 'ended')),
ADD COLUMN IF NOT EXISTS call_started_at timestamptz,
ADD COLUMN IF NOT EXISTS call_ended_at timestamptz;

-- Create call_sessions table for managing video calls
CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  doctor_joined boolean DEFAULT false,
  patient_joined boolean DEFAULT false,
  doctor_peer_id text,
  patient_peer_id text,
  signaling_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint (drop first if exists)
DO $$ 
BEGIN
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_call_session;
  ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_call_session
  FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- RLS Policies for call_sessions
DROP POLICY IF EXISTS "Users can view own call sessions" ON call_sessions;
CREATE POLICY "Users can view own call sessions"
  ON call_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = call_sessions.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = call_sessions.doctor_id
      AND dp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Doctors and patients can create call sessions" ON call_sessions;
CREATE POLICY "Doctors and patients can create call sessions"
  ON call_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = call_sessions.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = call_sessions.doctor_id
      AND dp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Doctors and patients can update own call sessions" ON call_sessions;
CREATE POLICY "Doctors and patients can update own call sessions"
  ON call_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = call_sessions.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = call_sessions.doctor_id
      AND dp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = call_sessions.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = call_sessions.doctor_id
      AND dp.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_call_session_id ON appointments(call_session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_call_status ON appointments(call_status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_appointment_id ON call_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_doctor_id ON call_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_patient_id ON call_sessions(patient_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_call_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for call_sessions
DROP TRIGGER IF EXISTS update_call_sessions_updated_at ON call_sessions;
CREATE TRIGGER update_call_sessions_updated_at
  BEFORE UPDATE ON call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_call_sessions_updated_at();

-- ============================================
-- MIGRATION 2: Profile Documents
-- ============================================

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
DO $$ 
BEGIN
  ALTER TABLE doctor_profiles DROP CONSTRAINT IF EXISTS unique_nmc_number;
  ALTER TABLE doctor_profiles ADD CONSTRAINT unique_nmc_number UNIQUE (nmc_number);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create function to automatically set profile_completed_at timestamp
CREATE OR REPLACE FUNCTION set_profile_completed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_completed = true AND (OLD.profile_completed IS NULL OR OLD.profile_completed = false) THEN
    NEW.profile_completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for profile completion
DROP TRIGGER IF EXISTS trigger_patient_profile_completed ON patient_profiles;
CREATE TRIGGER trigger_patient_profile_completed
  BEFORE UPDATE ON patient_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_completed_timestamp();

DROP TRIGGER IF EXISTS trigger_doctor_profile_completed ON doctor_profiles;
CREATE TRIGGER trigger_doctor_profile_completed
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_completed_timestamp();

-- Create function to set verification_requested_at when profile is completed
CREATE OR REPLACE FUNCTION set_verification_requested_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_completed = true AND (OLD.profile_completed IS NULL OR OLD.profile_completed = false) THEN
    NEW.verification_requested_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification request
DROP TRIGGER IF EXISTS trigger_doctor_verification_requested ON doctor_profiles;
CREATE TRIGGER trigger_doctor_verification_requested
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_requested_timestamp();

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable Realtime for call_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify everything is set up correctly
SELECT 'call_sessions table exists' as check, 
       EXISTS (SELECT FROM pg_tables WHERE tablename = 'call_sessions') as result
UNION ALL
SELECT 'Realtime enabled for call_sessions', 
       EXISTS (
         SELECT FROM pg_publication_tables 
         WHERE pubname = 'supabase_realtime' 
         AND tablename = 'call_sessions'
       )
UNION ALL
SELECT 'profile_picture_url column exists', 
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'profiles' 
         AND column_name = 'profile_picture_url'
       )
UNION ALL
SELECT 'nmc_number column exists', 
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'doctor_profiles' 
         AND column_name = 'nmc_number'
       );
