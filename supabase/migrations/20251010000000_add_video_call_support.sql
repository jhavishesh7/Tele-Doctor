/*
  # Add Video Call Support to Appointments

  ## Changes
  1. Add appointment_type column to appointments table (online/offline)
  2. Add call_session_id for tracking active video calls
  3. Add call_status for managing call state
  4. Add call_started_at and call_ended_at timestamps
  5. Create call_sessions table for managing WebRTC signaling data

  ## New Table: call_sessions
  - Stores WebRTC signaling data and call state
  - Links to appointments table
  - Tracks call participants and their connection status
*/

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

-- Add foreign key constraint
ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_call_session
FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL;

-- RLS Policies for call_sessions
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

-- Create indexes for better query performance
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
CREATE TRIGGER update_call_sessions_updated_at
  BEFORE UPDATE ON call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_call_sessions_updated_at();
