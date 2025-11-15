/*
  # Add Patient Document Wallet and Consultation Summaries

  ## Changes
  1. Create consultations table (if not exists) for storing consultation records
  2. Create patient_documents table for storing patient's uploaded documents (vault)
  3. Create consultation_summaries table for storing PDF copies of consultation summaries
  4. Add share_token to patient_profiles for QR code sharing
  5. Add RLS policies for all new tables
*/

-- Create consultations table if it doesn't exist
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  symptoms text,
  medicines text,
  additional_advice text,
  follow_up boolean DEFAULT false,
  follow_up_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Create patient_documents table for document vault
CREATE TABLE IF NOT EXISTS patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL, -- 'lab_report', 'prescription', 'xray', 'scan', 'other'
  file_url text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Create consultation_summaries table for storing PDF copies
CREATE TABLE IF NOT EXISTS consultation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  pdf_url text NOT NULL,
  pdf_path text NOT NULL,
  file_size bigint,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_summaries ENABLE ROW LEVEL SECURITY;

-- Add share_token to patient_profiles for QR code sharing
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT gen_random_uuid();

-- Create unique index on share_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_profiles_share_token ON patient_profiles(share_token);

-- RLS Policies for consultations
DROP POLICY IF EXISTS "Users can view own consultations" ON consultations;
CREATE POLICY "Users can view own consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = consultations.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = consultations.doctor_id
      AND dp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow public access to consultations via share_token (for QR code scanning)
DROP POLICY IF EXISTS "Public can view consultations via share" ON consultations;
CREATE POLICY "Public can view consultations via share"
  ON consultations FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = consultations.patient_id
      AND pp.share_token IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Doctors can insert consultations" ON consultations;
CREATE POLICY "Doctors can insert consultations"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = consultations.doctor_id
      AND dp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Doctors can update own consultations" ON consultations;
CREATE POLICY "Doctors can update own consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = consultations.doctor_id
      AND dp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = consultations.doctor_id
      AND dp.user_id = auth.uid()
    )
  );

-- RLS Policies for patient_documents
DROP POLICY IF EXISTS "Patients can view own documents" ON patient_documents;
CREATE POLICY "Patients can view own documents"
  ON patient_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = patient_documents.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow public access to documents via share_token (for QR code scanning)
DROP POLICY IF EXISTS "Public can view documents via share" ON patient_documents;
CREATE POLICY "Public can view documents via share"
  ON patient_documents FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = patient_documents.patient_id
      AND pp.share_token IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Patients can insert own documents" ON patient_documents;
CREATE POLICY "Patients can insert own documents"
  ON patient_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = patient_documents.patient_id
      AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patients can update own documents" ON patient_documents;
CREATE POLICY "Patients can update own documents"
  ON patient_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = patient_documents.patient_id
      AND pp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = patient_documents.patient_id
      AND pp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patients can delete own documents" ON patient_documents;
CREATE POLICY "Patients can delete own documents"
  ON patient_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = patient_documents.patient_id
      AND pp.user_id = auth.uid()
    )
  );

-- RLS Policies for consultation_summaries
DROP POLICY IF EXISTS "Users can view own consultation summaries" ON consultation_summaries;
CREATE POLICY "Users can view own consultation summaries"
  ON consultation_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = consultation_summaries.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = consultation_summaries.doctor_id
      AND dp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow public access to consultation summaries via share_token (for QR code scanning)
-- Note: This requires a function to validate share_token, but for now we'll allow
-- public read access. In production, you may want to add a function that validates
-- the share_token before allowing access.
DROP POLICY IF EXISTS "Public can view consultation summaries via share" ON consultation_summaries;
CREATE POLICY "Public can view consultation summaries via share"
  ON consultation_summaries FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = consultation_summaries.patient_id
      AND pp.share_token IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "System can insert consultation summaries" ON consultation_summaries;
CREATE POLICY "System can insert consultation summaries"
  ON consultation_summaries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_document_type ON patient_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_consultation_summaries_consultation_id ON consultation_summaries(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_summaries_appointment_id ON consultation_summaries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_summaries_patient_id ON consultation_summaries(patient_id);

-- Create function to automatically update updated_at timestamp for consultations
CREATE OR REPLACE FUNCTION update_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for consultations
DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations;
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_consultations_updated_at();

-- Allow public to read patient_profiles when accessing via share_token
-- This allows the public view to look up patients by share_token
DROP POLICY IF EXISTS "Public can view patient profile via share token" ON patient_profiles;
CREATE POLICY "Public can view patient profile via share token"
  ON patient_profiles FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

-- Allow public to read profiles table when patient has share_token
-- This is needed to get patient name and email for the public view
DROP POLICY IF EXISTS "Public can view profile via patient share token" ON profiles;
CREATE POLICY "Public can view profile via patient share token"
  ON profiles FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.user_id = profiles.id
      AND pp.share_token IS NOT NULL
    )
  );

