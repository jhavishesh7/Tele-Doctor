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
import AdminDashboard from './components/admin/AdminDashboard';
import ManageDoctors from './components/admin/ManageDoctors';
import { DoctorProfile } from './lib/supabase';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);

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

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSelectedDoctor(null);
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
          return <AppointmentsView />;
        case 'profile':
          return (
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600 mb-6">Manage your personal information</p>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.full_name}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
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
