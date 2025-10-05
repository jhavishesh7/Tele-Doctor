import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Appointment } from '../../lib/supabase';
import { X, Calendar, Clock, MapPin, FileText, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AppointmentDetails({ appointment, onClose, onUpdate }: AppointmentDetailsProps) {
  const { profile } = useAuth();
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [location, setLocation] = useState(appointment.location || '');
  const [doctorNotes, setDoctorNotes] = useState(appointment.doctor_notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDoctor = profile?.role === 'doctor';
  const otherParty = isDoctor ? appointment.patient_profiles : appointment.doctor_profiles;
  const otherProfile = otherParty?.profiles as any;

  const handleProposeTime = async () => {
    if (!proposedDate || !proposedTime) {
      setError('Please select both date and time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`);

      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'proposed',
          proposed_date: proposedDateTime.toISOString(),
          location,
          doctor_notes: doctorNotes,
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      const patientProfile = appointment.patient_profiles as any;
      await supabase.from('notifications').insert({
        user_id: patientProfile.user_id,
        title: 'Appointment Time Proposed',
        message: `Dr. ${profile?.full_name} has proposed ${new Date(proposedDateTime).toLocaleDateString()} at ${proposedTime} for your appointment`,
        type: 'appointment_proposal',
        related_id: appointment.id,
      });

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to propose time');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          confirmed_date: appointment.proposed_date,
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      const doctorProfile = appointment.doctor_profiles as any;
      await supabase.from('notifications').insert({
        user_id: doctorProfile.user_id,
        title: 'Appointment Confirmed',
        message: `${profile?.full_name} has confirmed the appointment`,
        type: 'appointment_confirmed',
        related_id: appointment.id,
      });

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      const otherUserId = isDoctor
        ? (appointment.patient_profiles as any).user_id
        : (appointment.doctor_profiles as any).user_id;

      await supabase.from('notifications').insert({
        user_id: otherUserId,
        title: 'Appointment Cancelled',
        message: `${profile?.full_name} has cancelled the appointment`,
        type: 'appointment_cancelled',
        related_id: appointment.id,
      });

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to mark as completed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {otherProfile?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isDoctor ? '' : 'Dr. '}
                  {otherProfile?.full_name || 'Unknown'}
                </h3>
                <p className="text-sm text-gray-600">{otherProfile?.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <div>
                  <p className="font-medium">Requested</p>
                  <p>{new Date(appointment.requested_date).toLocaleString()}</p>
                </div>
              </div>

              {appointment.proposed_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Proposed</p>
                    <p>{new Date(appointment.proposed_date).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {appointment.confirmed_date && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Confirmed</p>
                    <p>{new Date(appointment.confirmed_date).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {appointment.patient_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Patient Notes
              </label>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                {appointment.patient_notes}
              </div>
            </div>
          )}

          {appointment.doctor_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Doctor Notes
              </label>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                {appointment.doctor_notes}
              </div>
            </div>
          )}

          {isDoctor && appointment.status === 'pending' && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-gray-900">Propose Appointment Time</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter appointment location"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes or instructions"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <button
                onClick={handleProposeTime}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Proposing...' : 'Propose Time'}
              </button>
            </div>
          )}

          {!isDoctor && appointment.status === 'proposed' && (
            <div className="space-y-3 border-t pt-6">
              <p className="text-sm text-gray-600">
                The doctor has proposed a new time. Would you like to confirm?
              </p>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {loading ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          )}

          {isDoctor && appointment.status === 'confirmed' && (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Mark as Completed'}
            </button>
          )}

          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-red-200"
            >
              <XCircle className="w-5 h-5" />
              Cancel Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
