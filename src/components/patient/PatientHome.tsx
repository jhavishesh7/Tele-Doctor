import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Appointment } from '../../lib/supabase';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';

interface PatientHomeProps {
  onNavigate: (view: string, payload?: { openAppointmentId?: string }) => void;
}

export default function PatientHome({ onNavigate }: PatientHomeProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    upcoming: 0,
    pending: 0,
    completed: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchStats();
      fetchRecentAppointments();
      fetchFollowUps();
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;

    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!patientProfile) return;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('status')
      .eq('patient_id', patientProfile.id);

    if (appointments) {
      setStats({
        upcoming: appointments.filter(a => a.status === 'confirmed').length,
        pending: appointments.filter(a => a.status === 'pending' || a.status === 'proposed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
      });
    }
  };

  const fetchRecentAppointments = async () => {
    if (!profile) return;

    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!patientProfile) return;

    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor_profiles(
          *,
          profiles!doctor_profiles_user_id_fkey(full_name),
          medical_categories(name)
        )
      `)
      .eq('patient_id', patientProfile.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) setRecentAppointments(data as any);
  };

  const fetchFollowUps = async () => {
    if (!profile) return;

    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!patientProfile) return;

    const now = new Date().toISOString();
    const { data } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientProfile.id)
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
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-gray-600">Here's an overview of your healthcare appointments</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.upcoming}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Upcoming</h3>
          <p className="text-sm text-gray-600">Confirmed appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pending}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Pending</h3>
          <p className="text-sm text-gray-600">Awaiting confirmation</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.completed}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Completed</h3>
          <p className="text-sm text-gray-600">Past appointments</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Find a Doctor</h2>
          <p className="mb-6 text-teal-50">
            Search from our network of verified healthcare professionals across multiple specialties
          </p>
          <button
            onClick={() => onNavigate('doctors')}
            className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-teal-50 transition-colors inline-flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Browse Doctors
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Recent Appointments
          </h3>

          {recentAppointments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No appointments yet. Find a doctor to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => {
                const doctor = apt.doctor_profiles as any;
                const doctorProfile = doctor?.profiles;
                const category = doctor?.medical_categories;
                const displayDate = apt.confirmed_date || apt.proposed_date || apt.requested_date;

                return (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('appointments')}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {doctorProfile?.full_name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        Dr. {doctorProfile?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{category?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        {new Date(displayDate).toLocaleDateString()}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
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
