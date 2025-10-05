import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Appointment } from '../../lib/supabase';
import { Calendar, Clock, MapPin, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AppointmentDetails from './AppointmentDetails';

export default function AppointmentsView() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    if (profile) {
      fetchAppointments();

      const channel = supabase
        .channel('appointments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
          },
          () => {
            fetchAppointments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchAppointments = async () => {
    if (!profile) return;

    setLoading(true);

    if (profile.role === 'patient') {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (patientProfile) {
        const { data } = await supabase
          .from('appointments')
          .select(`
            *,
            doctor_profiles(
              *,
              profiles!doctor_profiles_user_id_fkey(full_name, email, avatar_url),
              medical_categories(name, icon)
            )
          `)
          .eq('patient_id', patientProfile.id)
          .order('created_at', { ascending: false });

        if (data) setAppointments(data as any);
      }
    } else if (profile.role === 'doctor') {
      const { data: doctorProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (doctorProfile) {
        const { data } = await supabase
          .from('appointments')
          .select(`
            *,
            patient_profiles(
              *,
              profiles!patient_profiles_user_id_fkey(full_name, email, avatar_url)
            )
          `)
          .eq('doctor_id', doctorProfile.id)
          .order('created_at', { ascending: false });

        if (data) setAppointments(data as any);
      }
    }

    setLoading(false);
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'proposed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
        <p className="text-gray-600">Manage your appointment schedule</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'confirmed', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No appointments found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const otherParty = profile?.role === 'patient'
              ? appointment.doctor_profiles
              : appointment.patient_profiles;
            const otherProfile = otherParty?.profiles as any;
            const category = profile?.role === 'patient'
              ? (appointment.doctor_profiles as any)?.medical_categories
              : null;

            const displayDate = appointment.confirmed_date || appointment.proposed_date || appointment.requested_date;

            return (
              <div
                key={appointment.id}
                onClick={() => setSelectedAppointment(appointment)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {otherProfile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {profile?.role === 'patient' ? 'Dr. ' : ''}
                        {otherProfile?.full_name || 'Unknown'}
                      </h3>
                      {category && (
                        <p className="text-sm text-teal-600">{category.name}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{new Date(displayDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{new Date(displayDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {appointment.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{appointment.location}</span>
                    </div>
                  )}
                  {(appointment.patient_notes || appointment.doctor_notes) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>Has notes</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={fetchAppointments}
        />
      )}
    </div>
  );
}
