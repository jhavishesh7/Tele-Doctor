import { useState, useEffect } from 'react';
import { supabase, CallSession, Appointment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useCallSession(appointment: Appointment | null) {
  const { profile } = useAuth();
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDoctor = profile?.role === 'doctor';

  // Subscribe to call session updates
  useEffect(() => {
    if (!appointment?.call_session_id) return;

    const channel = supabase
      .channel(`call_session:${appointment.call_session_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${appointment.call_session_id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setCallSession(payload.new as CallSession);
          } else if (payload.eventType === 'DELETE') {
            setCallSession(null);
          }
        }
      )
      .subscribe();

    // Load initial call session
    loadCallSession(appointment.call_session_id);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointment?.call_session_id]);

  const loadCallSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setCallSession(data);
    } catch (err: any) {
      console.error('Failed to load call session:', err);
    }
  };

  const startCall = async () => {
    if (!appointment) return;

    setLoading(true);
    setError(null);

    try {
      // Create call session
      const { data: session, error: sessionError } = await supabase
        .from('call_sessions')
        .insert({
          appointment_id: appointment.id,
          doctor_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          status: 'waiting',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update appointment with call session
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          call_session_id: session.id,
          call_status: 'waiting',
          call_started_at: new Date().toISOString(),
        })
        .eq('id', appointment.id);

      if (appointmentError) throw appointmentError;

      // Notify other party
      const otherUserId = isDoctor
        ? (appointment.patient_profiles as any)?.user_id
        : (appointment.doctor_profiles as any)?.user_id;

      await supabase.from('notifications').insert({
        user_id: otherUserId,
        title: 'Video Call Started',
        message: `${profile?.full_name} has started a video call. Join now!`,
        type: 'call_started',
        related_id: appointment.id,
      });

      setCallSession(session);
      return session;
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setError(err.message || 'Failed to start call');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinCall = async () => {
    if (!appointment?.call_session_id) return;

    setLoading(true);
    setError(null);

    try {
      // Load the call session
      await loadCallSession(appointment.call_session_id);
      return true;
    } catch (err: any) {
      console.error('Failed to join call:', err);
      setError(err.message || 'Failed to join call');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const endCall = async () => {
    if (!callSession) return;

    setLoading(true);
    setError(null);

    try {
      // Update call session
      await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', callSession.id);

      // Update appointment
      await supabase
        .from('appointments')
        .update({
          call_status: 'ended',
          call_ended_at: new Date().toISOString(),
        })
        .eq('id', appointment?.id);

      setCallSession(null);
    } catch (err: any) {
      console.error('Failed to end call:', err);
      setError(err.message || 'Failed to end call');
    } finally {
      setLoading(false);
    }
  };

  return {
    callSession,
    loading,
    error,
    startCall,
    joinCall,
    endCall,
  };
}
