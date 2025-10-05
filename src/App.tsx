import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import Layout from './components/Layout';
import PatientHome from './components/patient/PatientHome';
import DoctorHome from './components/doctor/DoctorHome';
import DoctorSearch from './components/patient/DoctorSearch';
import BookAppointment from './components/patient/BookAppointment';
import AppointmentsView from './components/shared/AppointmentsView';
import DoctorProfileView from './components/doctor/DoctorProfile';
import PatientProfileView from './components/patient/PatientProfileView';
import AdminDashboard from './components/admin/AdminDashboard';
import ManageDoctors from './components/admin/ManageDoctors';
import { DoctorProfile } from './lib/supabase';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [openAppointmentId, setOpenAppointmentId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  const handleNavigate = (view: string, payload?: { openAppointmentId?: string }) => {
    setCurrentView(view);
    setSelectedDoctor(null);
    if (payload?.openAppointmentId) {
      setOpenAppointmentId(payload.openAppointmentId);
    }
  };

  const handleSelectDoctor = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
  };

  const renderContent = () => {
    if (profile.role === 'patient') {
        switch (currentView) {
        case 'home':
          return <PatientHome onNavigate={handleNavigate} />;
        case 'doctors':
          return <DoctorSearch onSelectDoctor={handleSelectDoctor} />;
        case 'appointments':
          return <AppointmentsView openAppointmentId={openAppointmentId} onClearOpen={() => setOpenAppointmentId(null)} />;
        case 'profile':
          // Fetch extended patient profile locally to display detailed fields
          return <PatientProfileView profile={profile} />;
        default:
          return <PatientHome onNavigate={handleNavigate} />;
      }
    }

    if (profile.role === 'doctor') {
      switch (currentView) {
        case 'home':
          return <DoctorHome onNavigate={handleNavigate} />;
        case 'appointments':
          return <AppointmentsView />;
        case 'profile':
          return <DoctorProfileView />;
        default:
          return <DoctorHome onNavigate={handleNavigate} />;
      }
    }

    if (profile.role === 'admin') {
      switch (currentView) {
        case 'home':
          return <AdminDashboard />;
        case 'doctors':
          return <ManageDoctors />;
        case 'users':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">All Users</h1>
                <p className="text-gray-600">View and manage all platform users</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">User management interface coming soon...</p>
              </div>
            </div>
          );
        case 'settings':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">Platform configuration and settings</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">Settings interface coming soon...</p>
              </div>
            </div>
          );
        default:
          return <AdminDashboard />;
      }
    }

    return null;
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {renderContent()}
      {selectedDoctor && (
        <BookAppointment
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={() => {
            setSelectedDoctor(null);
            handleNavigate('appointments');
          }}
        />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
