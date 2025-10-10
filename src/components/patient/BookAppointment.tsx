import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, DoctorProfile, AppointmentType } from '../../lib/supabase';
import { X, Calendar, Clock, FileText, Video, MapPin } from 'lucide-react';

interface BookAppointmentProps {
  doctor: DoctorProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookAppointment({ doctor, onClose, onSuccess }: BookAppointmentProps) {
  const { profile } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('offline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doctorProfile = doctor.profiles as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      if (!patientProfile) {
        throw new Error('Patient profile not found');
      }

      // enforce profile completeness: phone and address required before booking
      const { data: patientDetails } = await supabase.from('patient_profiles').select('phone,address').eq('id', patientProfile.id).maybeSingle();
      if (!patientDetails || !patientDetails.phone || !patientDetails.address) {
        throw new Error('Please complete your profile (phone and address required) before booking an appointment');
      }

      const requestedDateTime = new Date(`${date}T${time}`);

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientProfile.id,
          doctor_id: doctor.id,
          requested_date: requestedDateTime.toISOString(),
          patient_notes: notes,
          location: appointmentType === 'offline' ? location : 'Online Video Call',
          appointment_type: appointmentType,
          status: 'pending',
        });

      if (appointmentError) throw appointmentError;

      await supabase.from('notifications').insert({
        user_id: doctor.user_id,
        title: 'New Appointment Request',
        message: `${profile?.full_name} has requested an appointment on ${new Date(requestedDateTime).toLocaleDateString()} at ${time}`,
        type: 'appointment_request',
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-teal-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {doctorProfile?.full_name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Dr. {doctorProfile?.full_name}
                </h3>
                <p className="text-sm text-gray-600">{doctor.medical_categories?.name}</p>
                <p className="text-sm text-teal-600 font-medium mt-1">
                  ${doctor.consultation_fee} consultation fee
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Preferred Date
              </label>
              <input
                type="date"
                required
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preferred Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Describe your symptoms or reason for visit..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppointmentType('offline')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    appointmentType === 'offline'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">In-Person</span>
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming Soon"
                  className="relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-default"
                >
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Video Call</span>
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    Coming Soon
                  </span>
                </button>
              </div>
            </div>

            {appointmentType === 'offline' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (optional)</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Clinic A, Main St" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a request. The doctor will review and propose a final appointment time{appointmentType === 'offline' ? ' and location' : ''}.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Request Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
