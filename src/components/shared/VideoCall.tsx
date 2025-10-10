import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, CallSession, Appointment } from '../../lib/supabase';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';
import SimplePeer from 'simple-peer';

interface VideoCallProps {
  appointment: Appointment;
  callSession: CallSession;
  onClose: () => void;
  onCallEnded: () => void;
}

export default function VideoCall({ appointment, callSession, onClose, onCallEnded }: VideoCallProps) {
  const { profile } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  const isDoctor = profile?.role === 'doctor';
  const otherParty = isDoctor ? appointment.patient_profiles : appointment.doctor_profiles;
  const otherProfile = otherParty?.profiles as any;

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Set up Supabase Realtime for signaling
      setupRealtimeSignaling(stream);

      // Doctor initiates the peer connection
      if (isDoctor) {
        createPeer(stream, true);
      }

    } catch (err: any) {
      console.error('Failed to initialize call:', err);
      setError(err.message || 'Failed to access camera/microphone');
    }
  };

  const createPeer = (stream: MediaStream, initiator: boolean) => {
    console.log(`Creating peer - Initiator: ${initiator}, Role: ${isDoctor ? 'doctor' : 'patient'}`);
    
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('signal', async (signal: SimplePeer.SignalData) => {
      console.log(`${isDoctor ? 'Doctor' : 'Patient'} sending signal:`, signal.type);
      
      // Send signal data to the other peer via Supabase
      const signalData = JSON.stringify(signal);
      const updateData = isDoctor
        ? { doctor_peer_id: signalData, doctor_joined: true }
        : { patient_peer_id: signalData, patient_joined: true };

      const { error } = await supabase
        .from('call_sessions')
        .update(updateData)
        .eq('id', callSession.id);

      if (error) {
        console.error('Failed to update call session:', error);
        setError('Failed to establish connection');
        return;
      }

      console.log(`${isDoctor ? 'Doctor' : 'Patient'} signal sent successfully`);

      // Update appointment call status
      await supabase
        .from('appointments')
        .update({ call_status: 'active' })
        .eq('id', appointment.id);
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      console.log('✅ Received remote stream');
      setRemoteStream(remoteStream);
      setConnectionStatus('connected');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peer.on('connect', () => {
      console.log('✅ Peer connection established');
      setConnectionStatus('connected');
    });

    peer.on('error', (err: Error) => {
      console.error('❌ Peer error:', err);
      setError(`Connection error: ${err.message}`);
      setConnectionStatus('disconnected');
    });

    peer.on('close', () => {
      console.log('Peer connection closed');
      setConnectionStatus('disconnected');
    });

    peerRef.current = peer;
    return peer;
  };

  const setupRealtimeSignaling = (stream: MediaStream) => {
    console.log(`📡 Setting up Realtime signaling for call session: ${callSession.id}`);
    
    // Subscribe to call session updates for WebRTC signaling
    const channel = supabase
      .channel(`call_session:${callSession.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: profile?.id },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${callSession.id}`,
        },
        async (payload) => {
          const updatedSession = payload.new as CallSession;
          console.log('📨 Call session updated:', {
            doctor_joined: updatedSession.doctor_joined,
            patient_joined: updatedSession.patient_joined,
            has_doctor_signal: !!updatedSession.doctor_peer_id,
            has_patient_signal: !!updatedSession.patient_peer_id,
          });
          
          // Patient receives doctor's signal and creates answering peer
          if (!isDoctor && updatedSession.doctor_peer_id && !peerRef.current) {
            console.log('👤 Patient: Received doctor signal, creating answering peer');
            try {
              const doctorSignal = JSON.parse(updatedSession.doctor_peer_id);
              console.log('👤 Patient: Doctor signal type:', doctorSignal.type);
              
              const peer = createPeer(stream, false);
              
              // Wait a bit for peer to be created
              setTimeout(() => {
                if (peer && !peer.destroyed) {
                  console.log('👤 Patient: Signaling doctor offer');
                  peer.signal(doctorSignal);
                } else {
                  console.error('👤 Patient: Peer was destroyed before signaling');
                }
              }, 100);
            } catch (err) {
              console.error('❌ Patient: Failed to parse doctor signal:', err);
              setError('Failed to connect to doctor');
            }
          }
          
          // Doctor receives patient's signal
          if (isDoctor && updatedSession.patient_peer_id && peerRef.current) {
            console.log('👨‍⚕️ Doctor: Received patient signal');
            try {
              const patientSignal = JSON.parse(updatedSession.patient_peer_id);
              console.log('👨‍⚕️ Doctor: Patient signal type:', patientSignal.type);
              
              if (!peerRef.current.destroyed) {
                console.log('👨‍⚕️ Doctor: Signaling patient answer');
                peerRef.current.signal(patientSignal);
              } else {
                console.error('👨‍⚕️ Doctor: Peer was destroyed before signaling');
              }
            } catch (err) {
              console.error('❌ Doctor: Failed to parse patient signal:', err);
              setError('Failed to connect to patient');
            }
          }

          // Update session status when both joined
          if (updatedSession.doctor_joined && updatedSession.patient_joined && updatedSession.status === 'waiting') {
            console.log('✅ Both parties joined, updating session to active');
            await supabase
              .from('call_sessions')
              .update({ status: 'active', started_at: new Date().toISOString() })
              .eq('id', callSession.id);
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 Realtime subscription status: ${status}`);
        if (err) {
          console.error('❌ Realtime subscription error:', err);
          setError('Failed to establish real-time connection');
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to Realtime channel');
        }
      });

    realtimeChannelRef.current = channel;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing && peerRef.current && localStream) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        // Replace video track with screen share
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Access the underlying RTCPeerConnection
        const peer = peerRef.current as any;
        const pc = peer._pc as RTCPeerConnection;
        
        if (pc) {
          const sender = pc.getSenders().find((s: RTCRtpSender) => 
            s.track?.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        // Update local video to show screen share
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          // When screen share stops, revert to camera
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } else if (peerRef.current && localStream) {
        // Revert to camera
        const videoTrack = localStream.getVideoTracks()[0];
        
        // Access the underlying RTCPeerConnection
        const peer = peerRef.current as any;
        const pc = peer._pc as RTCPeerConnection;
        
        if (pc) {
          const sender = pc.getSenders().find((s: RTCRtpSender) => 
            s.track?.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }

        // Restore local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Screen share error:', err);
      setError('Failed to share screen');
    }
  };

  const endCall = async () => {
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
        .eq('id', appointment.id);

      // Notify other party
      const otherUserId = isDoctor
        ? (appointment.patient_profiles as any)?.user_id
        : (appointment.doctor_profiles as any)?.user_id;

      await supabase.from('notifications').insert({
        user_id: otherUserId,
        title: 'Call Ended',
        message: `${profile?.full_name} has ended the video call`,
        type: 'call_ended',
        related_id: appointment.id,
      });

      cleanup();
      onCallEnded();
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up video call resources...');
    
    // Stop all local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log(`Stopping local ${track.kind} track`);
        track.stop();
      });
      setLocalStream(null);
    }

    // Stop all remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        console.log(`Stopping remote ${track.kind} track`);
        track.stop();
      });
      setRemoteStream(null);
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Close peer connection
    if (peerRef.current) {
      console.log('Destroying peer connection');
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Unsubscribe from realtime channel
    if (realtimeChannelRef.current) {
      console.log('Unsubscribing from realtime channel');
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    console.log('✅ Cleanup complete');
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {otherProfile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {isDoctor ? '' : 'Dr. '}
              {otherProfile?.full_name || 'Unknown'}
            </h3>
            <p className="text-sm text-gray-400">
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'disconnected' && 'Disconnected'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
        
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">{otherProfile?.full_name?.charAt(0) || 'U'}</span>
              </div>
              <p className="text-lg">Waiting for {isDoctor ? 'patient' : 'doctor'} to join...</p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6 text-white" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-colors ${
              isScreenSharing ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-6 h-6 text-white" />
            ) : (
              <Monitor className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
