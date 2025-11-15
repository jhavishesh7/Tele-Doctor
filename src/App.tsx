import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import PatientHome from './components/patient/PatientHome';
import DoctorHome from './components/doctor/DoctorHome';
import DoctorSearch from './components/patient/DoctorSearch';
import BookAppointment from './components/patient/BookAppointment';
import AppointmentsView from './components/shared/AppointmentsView';
import DoctorProfileEdit from './components/doctor/DoctorProfileEdit';
import PatientProfileEdit from './components/patient/PatientProfileEdit';
import PatientVault from './components/patient/PatientVault';
import PatientPublicView from './components/patient/PatientPublicView';
import AdminDashboard from './components/admin/AdminDashboard';
import ManageDoctors from './components/admin/ManageDoctors';
import TermsOfService from './components/LegalPages/TermsOfService';
import PrivacyPolicy from './components/LegalPages/PrivacyPolicy';
import CookiePolicy from './components/LegalPages/CookiePolicy';
import ResetPassword from './components/ResetPassword';
import { DoctorProfile } from './lib/supabase';

function AppContent() {
  const { user, profile, loading, isSigningUp } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [openAppointmentId, setOpenAppointmentId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [legalPage, setLegalPage] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Check for public routes
  const checkRoutes = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Reset states
    setShareToken(null);
    setLegalPage(null);
    setShowResetPassword(false);
    
    // Check for reset password (can be in path or hash)
    if (path === '/reset-password' || hash.includes('type=recovery')) {
      setShowResetPassword(true);
      return;
    }
    
    // Check for patient public view
    const patientMatch = path.match(/^\/patient\/([a-f0-9-]+)$/i);
    if (patientMatch) {
      setShareToken(patientMatch[1]);
      return;
    }
    
    // Check for legal pages
    if (path === '/terms' || path === '/terms-of-service') {
      setLegalPage('terms');
    } else if (path === '/privacy' || path === '/privacy-policy') {
      setLegalPage('privacy');
    } else if (path === '/cookies' || path === '/cookie-policy') {
      setLegalPage('cookies');
    }
  };

  useEffect(() => {
    checkRoutes();
    
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', checkRoutes);
    
    // Also check on any navigation
    const interval = setInterval(checkRoutes, 100);
    
    return () => {
      window.removeEventListener('popstate', checkRoutes);
      clearInterval(interval);
    };
  }, []);

  // Check if URL has ?auth=true to show auth page
  const urlParams = new URLSearchParams(window.location.search);
  const showAuthFromUrl = urlParams.get('auth') === 'true';

  // Show reset password page
  if (showResetPassword) {
    return <ResetPassword />;
  }

  // Show public patient view if share token is in URL
  if (shareToken) {
    return <PatientPublicView />;
  }

  // Show legal pages
  if (legalPage === 'terms') {
    return <TermsOfService />;
  }
  if (legalPage === 'privacy') {
    return <PrivacyPolicy />;
  }
  if (legalPage === 'cookies') {
    return <CookiePolicy />;
  }

  // When a signup is in progress show a focused signing-up screen so the user
  // isn't bounced back to the landing page during the account creation flow.
  if (isSigningUp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-teal-200 animate-ping"></div>
            <div className="rounded-full h-20 w-20 flex items-center justify-center bg-teal-600 shadow-lg">
              <span className="text-white text-2xl font-bold">+</span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-teal-700 animate-pulse tracking-wide">
            Mero Clinic
          </h1>

          <p className="text-gray-600 text-lg">Signing up... Redirecting to the app</p>
        </div>
      </div>
    );
  }

  if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Heartbeat pulse circle */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-teal-200 animate-ping"></div>
          <div className="rounded-full h-20 w-20 flex items-center justify-center bg-teal-600 shadow-lg">
            <span className="text-white text-2xl font-bold">+</span>
          </div>
        </div>

        {/* App name with heartbeat animation */}
        <h1 className="text-3xl font-extrabold text-teal-700 animate-pulse tracking-wide">
          Mero Clinic
        </h1>

        {/* Fancy loading text */}
        <p className="text-gray-600 text-lg flex items-center space-x-1">
          <span className="animate-bounce">L</span>
          <span className="animate-bounce delay-100">o</span>
          <span className="animate-bounce delay-200">a</span>
          <span className="animate-bounce delay-300">d</span>
          <span className="animate-bounce delay-400">i</span>
          <span className="animate-bounce delay-500">n</span>
          <span className="animate-bounce delay-600">g</span>
          <span className="animate-bounce delay-700">.</span>
          <span className="animate-bounce delay-800">.</span>
          <span className="animate-bounce delay-900">.</span>
        </p>
      </div>
    </div>
  );
}

    if (!user || !profile) {
    // Show auth page if URL has ?auth=true, otherwise show landing page
    if (showAuthFromUrl) return <AuthPage />;
    return <LandingPage />;
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
          return <PatientProfileEdit />;
        case 'vault':
          return <PatientVault />;
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
          return <DoctorProfileEdit />;
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
