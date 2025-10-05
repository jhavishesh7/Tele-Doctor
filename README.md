# MediConnect - Healthcare Appointment Booking Platform

A comprehensive healthcare appointment booking platform connecting patients with verified doctors across multiple medical specialties.

## Features

### Patient Features
- Search and filter doctors by specialty, location, and experience
- View detailed doctor profiles with qualifications and fees
- Request appointments with preferred dates and times
- Receive and respond to doctor's proposed appointment times
- View appointment history and upcoming appointments
- Real-time notifications for appointment updates

### Doctor Features
- Create and manage professional profiles
- Set consultation fees and availability
- Review appointment requests from patients
- Propose alternative times and locations
- Manage confirmed appointments
- Profile visibility controls

### Admin Features
- Verify and approve doctor registrations
- Manage doctor rankings (internal, not public)
- Monitor platform statistics
- Control doctor profile visibility
- Oversee all appointments and users

## Technology Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Supabase for backend (authentication, database, real-time)
- Lucide React for icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (already configured):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## User Roles

### Patient
- Search for doctors
- Book appointments
- Manage personal profile

### Doctor
- Create professional profile
- Manage appointment requests
- View patient details

### Admin
- Verify doctor profiles
- Manage rankings
- Monitor platform activity

## Appointment Flow

1. Patient searches for a doctor
2. Patient requests an appointment with preferred date/time
3. Doctor receives notification and reviews request
4. Doctor proposes a final time and location
5. Patient receives notification and confirms
6. Appointment is confirmed and both parties are notified
7. Doctor can mark as completed after the appointment

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication with Supabase Auth
- Private doctor rankings (admin-only access)

## Database Schema

- `profiles` - User profiles with role information
- `medical_categories` - Medical specialties
- `doctor_profiles` - Extended doctor information
- `patient_profiles` - Patient information
- `appointments` - Appointment bookings and status
- `notifications` - Real-time notification system
