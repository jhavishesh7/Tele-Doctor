import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'doctor' | 'patient' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  category_id: string;
  qualifications: string;
  experience_years: number;
  bio: string;
  consultation_fee: number;
  contact_phone: string;
  contact_email: string;
  location: string;
  is_verified: boolean;
  is_visible: boolean;
  rank_score: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  medical_categories?: MedicalCategory;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  phone: string;
  date_of_birth: string | null;
  address: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export type AppointmentStatus = 'pending' | 'proposed' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: AppointmentStatus;
  requested_date: string;
  proposed_date: string | null;
  confirmed_date: string | null;
  location: string;
  patient_notes: string;
  doctor_notes: string;
  created_at: string;
  updated_at: string;
  patient_profiles?: PatientProfile;
  doctor_profiles?: DoctorProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}
