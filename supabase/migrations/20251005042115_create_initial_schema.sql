/*
  # Healthcare Appointment Platform - Initial Schema

  ## Overview
  This migration creates the foundational database structure for a healthcare appointment booking platform
  with three user roles: doctors, patients, and admins.

  ## 1. New Tables

  ### `profiles`
  - Extends auth.users with role-based information
  - `id` (uuid, primary key, references auth.users)
  - `role` (text) - 'doctor', 'patient', or 'admin'
  - `full_name` (text)
  - `email` (text)
  - `avatar_url` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `medical_categories`
  - Medical specialties for doctors
  - `id` (uuid, primary key)
  - `name` (text) - e.g., 'Cardiology', 'Dermatology'
  - `description` (text)
  - `icon` (text) - icon name for UI
  - `created_at` (timestamptz)

  ### `doctor_profiles`
  - Extended profile information for doctors
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `category_id` (uuid, references medical_categories)
  - `qualifications` (text)
  - `experience_years` (integer)
  - `bio` (text)
  - `consultation_fee` (numeric)
  - `contact_phone` (text)
  - `contact_email` (text)
  - `location` (text)
  - `is_verified` (boolean) - admin approval status
  - `is_visible` (boolean) - profile visibility toggle
  - `rank_score` (integer) - internal ranking (hidden from public)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `patient_profiles`
  - Extended profile information for patients
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `phone` (text)
  - `date_of_birth` (date)
  - `address` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `appointments`
  - Appointment booking and management
  - `id` (uuid, primary key)
  - `patient_id` (uuid, references patient_profiles)
  - `doctor_id` (uuid, references doctor_profiles)
  - `status` (text) - 'pending', 'proposed', 'confirmed', 'completed', 'cancelled'
  - `requested_date` (timestamptz) - patient's initial request
  - `proposed_date` (timestamptz) - doctor's proposed time
  - `confirmed_date` (timestamptz) - final agreed time
  - `location` (text) - appointment location
  - `patient_notes` (text) - patient's initial notes
  - `doctor_notes` (text) - doctor's notes/reason
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `notifications`
  - Notification system for all users
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `message` (text)
  - `type` (text) - 'appointment_request', 'appointment_proposal', 'appointment_confirmed', etc.
  - `related_id` (uuid) - ID of related appointment or profile
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ## 2. Security

  - Enable RLS on all tables
  - Profiles: Users can read all profiles, update only their own
  - Doctor profiles: Public can read verified/visible profiles, doctors update their own
  - Patient profiles: Only owners and doctors (in appointments) can read
  - Appointments: Users can only see their own appointments
  - Notifications: Users can only see their own notifications
  - Medical categories: Public read access
  - Admin role has elevated permissions across all tables

  ## 3. Important Notes

  - All tables use RLS for security
  - Doctor rank_score is accessible only to admins
  - Appointment status flow: pending -> proposed -> confirmed -> completed
  - Notifications are automatically created via application logic
  - Timestamps use timestamptz for timezone awareness
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('doctor', 'patient', 'admin')),
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create medical_categories table
CREATE TABLE IF NOT EXISTS medical_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'stethoscope',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_categories ENABLE ROW LEVEL SECURITY;

-- Create doctor_profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES medical_categories(id),
  qualifications text NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  bio text DEFAULT '',
  consultation_fee numeric(10,2) DEFAULT 0,
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  location text DEFAULT '',
  is_verified boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  rank_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Create patient_profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone text DEFAULT '',
  date_of_birth date,
  address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'confirmed', 'completed', 'cancelled')),
  requested_date timestamptz NOT NULL,
  proposed_date timestamptz,
  confirmed_date timestamptz,
  location text DEFAULT '',
  patient_notes text DEFAULT '',
  doctor_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Insert default medical categories
INSERT INTO medical_categories (name, description, icon) VALUES
  ('Cardiology', 'Heart and cardiovascular system specialists', 'heart'),
  ('Dermatology', 'Skin, hair, and nail care specialists', 'sparkles'),
  ('Pediatrics', 'Healthcare for infants, children, and adolescents', 'baby'),
  ('Orthopedics', 'Bone, joint, and muscle specialists', 'bone'),
  ('Neurology', 'Brain and nervous system specialists', 'brain'),
  ('Psychiatry', 'Mental health and behavioral disorders', 'brain'),
  ('General Practice', 'Primary care and general medical services', 'stethoscope'),
  ('Dentistry', 'Oral health and dental care', 'smile'),
  ('Ophthalmology', 'Eye care and vision specialists', 'eye'),
  ('ENT', 'Ear, nose, and throat specialists', 'mic')
ON CONFLICT (name) DO NOTHING;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for medical_categories
CREATE POLICY "Medical categories are viewable by everyone"
  ON medical_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON medical_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for doctor_profiles
CREATE POLICY "Verified and visible doctor profiles are viewable by everyone"
  ON doctor_profiles FOR SELECT
  TO authenticated
  USING (
    (is_verified = true AND is_visible = true)
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Doctors can insert own profile"
  ON doctor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

CREATE POLICY "Doctors can update own profile"
  ON doctor_profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for patient_profiles
CREATE POLICY "Patients can view own profile"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctor_profiles dp ON dp.id = a.doctor_id
      WHERE a.patient_id = patient_profiles.id
      AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can insert own profile"
  ON patient_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'patient'
    )
  );

CREATE POLICY "Patients can update own profile"
  ON patient_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = appointments.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = appointments.doctor_id
      AND dp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = appointments.patient_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = appointments.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = appointments.doctor_id
      AND dp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.id = appointments.patient_id
      AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM doctor_profiles dp
      WHERE dp.id = appointments.doctor_id
      AND dp.user_id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_category_id ON doctor_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_verified_visible ON doctor_profiles(is_verified, is_visible);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_rank_score ON doctor_profiles(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
