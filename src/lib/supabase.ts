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
  profile_picture_url: string | null;
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
  nmc_number: string | null;
  citizenship_document_url: string | null;
  mbbs_certificate_url: string | null;
  md_certificate_url: string | null;
  has_md: boolean;
  profile_completed: boolean;
  profile_completed_at: string | null;
  verification_requested_at: string | null;
  verification_notes: string | null;
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
  citizenship_document_url: string | null;
  profile_completed: boolean;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export type AppointmentStatus = 'pending' | 'proposed' | 'confirmed' | 'completed' | 'cancelled';
export type AppointmentType = 'online' | 'offline';
export type CallStatus = 'not_started' | 'waiting' | 'active' | 'ended';

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
  appointment_type: AppointmentType;
  call_session_id: string | null;
  call_status: CallStatus;
  call_started_at: string | null;
  call_ended_at: string | null;
  created_at: string;
  updated_at: string;
  patient_profiles?: PatientProfile;
  doctor_profiles?: DoctorProfile;
}

export interface CallSession {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  status: 'waiting' | 'active' | 'ended';
  doctor_joined: boolean;
  patient_joined: boolean;
  doctor_peer_id: string | null;
  patient_peer_id: string | null;
  signaling_data: any;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
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
