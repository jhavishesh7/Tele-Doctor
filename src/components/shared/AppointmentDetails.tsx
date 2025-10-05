import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Appointment } from '../../lib/supabase';
import { X, Calendar, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import { generateAppointmentPDF } from '../../lib/pdf';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AppointmentDetails({ appointment, onClose, onUpdate }: AppointmentDetailsProps) {
  const { profile } = useAuth();
  const [appointmentData, setAppointmentData] = useState<Appointment>(appointment);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [location, setLocation] = useState(appointment.location || '');
  const [doctorNotes, setDoctorNotes] = useState(appointment.doctor_notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consultation, setConsultation] = useState<any | null>(null);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState('');
  const [additionalAdvice, setAdditionalAdvice] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  const isDoctor = profile?.role === 'doctor';
  const otherParty = isDoctor ? appointmentData.patient_profiles : appointmentData.doctor_profiles;
  const otherProfile = otherParty?.profiles as any;

  // load consultation for this appointment (if any) to show follow-up details
  useEffect(() => {
    let mounted = true;
    const loadConsult = async () => {
      try {
        const { data, error } = await supabase
          .from('consultations')
          .select('*')
          .eq('appointment_id', appointment.id)
          .maybeSingle();

        if (error) {
          console.warn('Failed to load consultation for appointment', error);
          return;
        }

        if (mounted) setConsultation(data || null);
      } catch (err) {
        console.error('Error loading consultation', err);
      }
    };

    loadConsult();
    // ensure appointmentData is kept in sync with prop on mount
    if (mounted) setAppointmentData(appointment);
    return () => { mounted = false; };
  }, [appointment.id]);

  const handleProposeTime = async () => {
    if (!proposedDate || !proposedTime) {
      setError('Please select both date and time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`);

      await supabase
        .from('appointments')
        .update({
          status: 'proposed',
          proposed_date: proposedDateTime.toISOString(),
          location,
          doctor_notes: doctorNotes,
        })
        .eq('id', appointment.id);

      // refresh the appointment record (with joins) so modal can show contact info
      const { data: refreshed } = await supabase
        .from('appointments')
        .select(`
          *,
          patient_profiles(*, profiles!patient_profiles_user_id_fkey(full_name, email)),
          doctor_profiles(*, profiles!doctor_profiles_user_id_fkey(full_name, email))
        `)
        .eq('id', appointment.id)
        .maybeSingle();

      if (refreshed) setAppointmentData(refreshed as any);

      onUpdate();
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

  const handleAccept = async () => {
    // Doctor accepts the requested time and confirms appointment at the requested_date
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', confirmed_date: appointment.requested_date })
        .eq('id', appointment.id);

      if (error) throw error;

      const patientProfile = appointment.patient_profiles as any;
      await supabase.from('notifications').insert({
        user_id: patientProfile.user_id,
        title: 'Appointment Confirmed',
        message: `Dr. ${profile?.full_name} has accepted your requested time for the appointment`,
        type: 'appointment_confirmed',
        related_id: appointment.id,
      });

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to accept appointment');
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

  const handleCompleteSubmit = async () => {
    // Submit consultation details, mark appointment completed, and optionally create follow-up appointment
    if (followUp && (!followUpDate || !followUpTime)) {
      setError('Please select a follow-up date and time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Insert consultation record
      const { data: consult, error: consultError } = await supabase
        .from('consultations')
        .insert({
          appointment_id: appointment.id,
          doctor_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          symptoms,
          medicines,
          additional_advice: additionalAdvice,
          follow_up: followUp,
          // combine date + time into a single ISO datetime to preserve chosen time
          follow_up_date: followUp ? new Date(`${followUpDate}T${followUpTime}`).toISOString() : null,
        })
        .select()
        .maybeSingle();

      if (consultError) throw consultError;

      // Mark appointment as completed
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      // If follow up requested, create a new appointment request for the follow-up date
      if (followUp && consult?.follow_up_date) {
        await supabase.from('appointments').insert({
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          requested_date: consult.follow_up_date,
          patient_notes: '',
          doctor_notes: '',
          status: 'pending',
        });
        // Also create a scheduled notification that a follow-up is due on that date.
        try {
          await supabase.from('notifications').insert({
            user_id: (appointment.patient_profiles as any)?.user_id,
            title: 'Follow-up Scheduled',
            message: `A follow-up with Dr. ${(appointment.doctor_profiles as any)?.profiles?.full_name || ''} is scheduled for ${new Date(consult.follow_up_date).toLocaleString()}.`,
            type: 'follow_up_scheduled',
            related_id: appointment.id,
            // set created_at to the follow-up datetime so backend digest jobs can query by this timestamp
            created_at: consult.follow_up_date,
          });
        } catch (notifErr) {
          console.warn('Failed to insert follow-up notification (non-blocking)', notifErr);
        }
      }

      // Notify patient about completed consultation
      const patientUserId = (appointment.patient_profiles as any)?.user_id;
      await supabase.from('notifications').insert({
        user_id: patientUserId,
        title: 'Consultation Completed',
        message: `Dr. ${profile?.full_name} has marked your appointment as completed. Check details in your consultations.`,
        type: 'consultation_completed',
        related_id: appointment.id,
      });

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save consultation');
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
            <div className="flex items-center gap-4 mb-4 justify-between">
              <div className="flex items-center gap-4">
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

              <div>
                <button
                  onClick={async () => {
                    if (!consultation) return;
                    try {
                      await generateAppointmentPDF(appointmentData, consultation);
                    } catch (err) {
                      console.error('Failed to generate PDF', err);
                    }
                  }}
                  disabled={!consultation}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${consultation ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
                >
                  Download Report (PDF)
                </button>
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

                {consultation?.follow_up && consultation?.follow_up_date && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Clock className="w-4 h-4" />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <span>Follow-up</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 relative">
                          <span className="absolute -left-2 -top-1 w-3 h-3 bg-purple-300 rounded-full animate-ping opacity-60"></span>
                          <span className="relative">Scheduled</span>
                        </span>
                      </p>
                      <p>{new Date(consultation.follow_up_date).toLocaleString()}</p>
                    </div>
                  </div>
                )}

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

              {/* Show contact info once confirmed */}
              {appointmentData.status === 'confirmed' && (
                <div className="col-span-full mt-4 bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Contact Details</h4>
                  {isDoctor ? (
                    <div className="text-sm text-gray-700">
                      <p><strong>Patient:</strong> {(appointmentData.patient_profiles as any)?.profiles?.full_name || '—'}</p>
                      <p><strong>Email:</strong> {(appointmentData.patient_profiles as any)?.profiles?.email || '—'}</p>
                      <p><strong>Phone:</strong> {(appointmentData.patient_profiles as any)?.phone || '—'}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      <p><strong>Doctor:</strong> {(appointmentData.doctor_profiles as any)?.profiles?.full_name || '—'}</p>
                      <p><strong>Email:</strong> {(appointmentData.doctor_profiles as any)?.profiles?.email || '—'}</p>
                      <p><strong>Phone:</strong> {(appointmentData.doctor_profiles as any)?.contact_phone || '—'}</p>
                    </div>
                  )}
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

              {/* Accept requested time */}
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Accepting...' : 'Accept Requested Time'}
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
            <div className="space-y-4">
              {!showCompleteForm ? (
                <div>
                  <button
                    onClick={() => setShowCompleteForm(true)}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Mark as Completed
                  </button>
                </div>
              ) : (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-gray-900">Consultation Summary</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medicines</label>
                    <textarea
                      value={medicines}
                      onChange={(e) => setMedicines(e.target.value)}
                      rows={2}
                      placeholder="List medicines, dosage, duration"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Advice</label>
                    <textarea
                      value={additionalAdvice}
                      onChange={(e) => setAdditionalAdvice(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} />
                      <span className="text-sm">Schedule follow-up</span>
                    </label>
                    {followUp && (
                      <div className="flex items-center gap-2">
                        <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                        <input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCompleteSubmit}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save & Complete'}
                    </button>
                    <button
                      onClick={() => setShowCompleteForm(false)}
                      className="flex-1 bg-gray-50 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
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
