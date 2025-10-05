import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Appointment } from '../../lib/supabase';
import { Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface DoctorHomeProps {
  onNavigate: (view: string, payload?: { openAppointmentId?: string }) => void;
}

export default function DoctorHome({ onNavigate }: DoctorHomeProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      checkVerification();
      fetchStats();
      fetchRecentAppointments();
      fetchFollowUps();
    }
  }, [profile]);

  const checkVerification = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('doctor_profiles')
      .select('is_verified')
      .eq('user_id', profile.id)
      .single();

    if (data) setIsVerified(data.is_verified);
  };

  const fetchStats = async () => {
    if (!profile) return;

    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!doctorProfile) return;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('status')
      .eq('doctor_id', doctorProfile.id);

    if (appointments) {
      setStats({
        pending: appointments.filter(a => a.status === 'pending' || a.status === 'proposed').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
      });
    }
  };

  const fetchRecentAppointments = async () => {
    if (!profile) return;

    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!doctorProfile) return;

    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        patient_profiles(
          *,
          profiles!patient_profiles_user_id_fkey(full_name)
        )
      `)
      .eq('doctor_id', doctorProfile.id)
      .in('status', ['pending', 'proposed', 'confirmed'])
      .order('requested_date', { ascending: true })
      .limit(5);

    if (data) setRecentAppointments(data as any);
  };

  const fetchFollowUps = async () => {
    if (!profile) return;

    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!doctorProfile) return;

    const now = new Date().toISOString();
    const { data } = await supabase
      .from('consultations')
      .select('*')
      .eq('doctor_id', doctorProfile.id)
      .eq('follow_up', true)
      .gte('follow_up_date', now)
      .order('follow_up_date', { ascending: true })
      .limit(5);

    if (data) setFollowUps(data as any);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, Dr. {profile?.full_name}!
        </h1>
        <p className="text-gray-600">Manage your appointments and patient requests</p>
      </div>

      {!isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Profile Pending Verification</p>
            <p className="text-sm text-yellow-700 mt-1">
              Your profile is awaiting admin approval. Once verified, patients will be able to book appointments with you.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pending}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Pending Requests</h3>
          <p className="text-sm text-gray-600">Awaiting your response</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.confirmed}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Confirmed</h3>
          <p className="text-sm text-gray-600">Scheduled appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.completed}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Completed</h3>
          <p className="text-sm text-gray-600">Total appointments</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Recent Appointment Requests
          </h3>

          {recentAppointments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No pending appointments at the moment
            </p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => {
                const patient = apt.patient_profiles as any;
                const patientProfile = patient?.profiles;
                const displayDate = apt.confirmed_date || apt.proposed_date || apt.requested_date;

                return (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('appointments')}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {patientProfile?.full_name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {patientProfile?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(displayDate).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      apt.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : apt.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {recentAppointments.length > 0 && (
            <button
              onClick={() => onNavigate('appointments')}
              className="w-full mt-4 text-teal-600 font-medium text-sm hover:text-teal-700 transition-colors"
            >
              View All Appointments →
            </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
          <p className="mb-6 text-teal-50">
            Keep your professional information up to date to attract more patients
          </p>
          <button
            onClick={() => onNavigate('profile')}
            className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-teal-50 transition-colors"
          >
            Manage Profile
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Upcoming Follow-ups
          </h3>

          {followUps.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No upcoming follow-ups</p>
          ) : (
            <div className="space-y-3">
              {followUps.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {new Date(f.follow_up_date).toLocaleDateString()}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 relative">
                        <span className="absolute -left-2 -top-1 w-3 h-3 bg-purple-300 rounded-full animate-ping opacity-60"></span>
                        <span className="relative">Follow-up</span>
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 truncate">{(f.symptoms || 'No notes')}</p>
                  </div>
                  <button onClick={() => onNavigate('appointments', { openAppointmentId: f.appointment_id })} className="text-teal-600 text-sm">View</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
