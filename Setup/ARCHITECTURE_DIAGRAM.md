# Video Call Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MeroClinic Platform                          │
│                    Telemedicine Video Call System                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                        ┌──────────────────────┐
│   Patient Browser    │                        │   Doctor Browser     │
│                      │                        │                      │
│  ┌────────────────┐  │                        │  ┌────────────────┐  │
│  │  React App     │  │                        │  │  React App     │  │
│  │                │  │                        │  │                │  │
│  │ - BookAppt     │  │                        │  │ - ApptDetails  │  │
│  │ - VideoCall    │  │                        │  │ - VideoCall    │  │
│  │ - useCallSess  │  │                        │  │ - useCallSess  │  │
│  └────────────────┘  │                        │  └────────────────┘  │
│          │           │                        │          │           │
│          │           │                        │          │           │
│  ┌───────▼────────┐  │                        │  ┌───────▼────────┐  │
│  │   NeatRTC      │◄─┼────WebRTC P2P─────────┼─►│   NeatRTC      │  │
│  │   (WebRTC)     │  │   Video/Audio Stream   │  │   (WebRTC)     │  │
│  └───────┬────────┘  │                        │  └───────┬────────┘  │
│          │           │                        │          │           │
└──────────┼───────────┘                        └──────────┼───────────┘
           │                                               │
           │                                               │
           │         ┌─────────────────────┐              │
           │         │                     │              │
           └────────►│  Supabase Backend   │◄─────────────┘
                     │                     │
                     │  ┌───────────────┐  │
                     │  │   Realtime    │  │
                     │  │  (Signaling)  │  │
                     │  └───────────────┘  │
                     │                     │
                     │  ┌───────────────┐  │
                     │  │  PostgreSQL   │  │
                     │  │   Database    │  │
                     │  │               │  │
                     │  │ - appointments│  │
                     │  │ - call_sessions│ │
                     │  │ - notifications│ │
                     │  └───────────────┘  │
                     │                     │
                     └─────────────────────┘
```

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Appointment Booking Flow                        │
└─────────────────────────────────────────────────────────────────────┘

Patient                    System                      Doctor
  │                          │                           │
  │  1. Select "Video Call"  │                           │
  ├─────────────────────────►│                           │
  │                          │                           │
  │  2. Book Appointment     │                           │
  ├─────────────────────────►│                           │
  │                          │                           │
  │                          │  3. Notification          │
  │                          ├──────────────────────────►│
  │                          │                           │
  │                          │  4. Confirm Appointment   │
  │                          │◄──────────────────────────┤
  │                          │                           │
  │  5. Confirmation         │                           │
  │◄─────────────────────────┤                           │
  │                          │                           │


┌─────────────────────────────────────────────────────────────────────┐
│                        Video Call Flow                               │
└─────────────────────────────────────────────────────────────────────┘

Doctor                     System                     Patient
  │                          │                           │
  │  1. Start Video Call     │                           │
  ├─────────────────────────►│                           │
  │                          │                           │
  │                          │  2. Create call_session   │
  │                          │     (status: waiting)     │
  │                          │                           │
  │                          │  3. Notification          │
  │                          ├──────────────────────────►│
  │                          │                           │
  │                          │  4. Join Call             │
  │                          │◄──────────────────────────┤
  │                          │                           │
  │                          │  5. Exchange Peer IDs     │
  │                          │     via Realtime          │
  │                          │                           │
  │  6. WebRTC Connection Established                    │
  │◄─────────────────────────┼──────────────────────────►│
  │                          │                           │
  │  7. Video/Audio Streaming (P2P)                      │
  │◄────────────────────────────────────────────────────►│
  │                          │                           │
  │  8. End Call             │                           │
  ├─────────────────────────►│                           │
  │                          │                           │
  │                          │  9. Update status: ended  │
  │                          │                           │
  │                          │  10. Notification         │
  │                          ├──────────────────────────►│
  │                          │                           │
```

## Database Schema Relationships

```
┌──────────────────┐
│    profiles      │
│                  │
│ - id (PK)        │
│ - role           │
│ - full_name      │
│ - email          │
└────────┬─────────┘
         │
         │ (user_id)
         │
    ┌────┴─────┬──────────────────┐
    │          │                  │
┌───▼──────┐ ┌─▼────────────┐ ┌──▼───────────┐
│ doctor_  │ │  patient_    │ │ notifications│
│ profiles │ │  profiles    │ │              │
│          │ │              │ │ - user_id    │
│ - id(PK) │ │ - id (PK)    │ │ - title      │
└────┬─────┘ └─────┬────────┘ │ - message    │
     │             │          └──────────────┘
     │             │
     │(doctor_id)  │(patient_id)
     │             │
     └─────┬───────┘
           │
      ┌────▼──────────────┐
      │   appointments    │
      │                   │
      │ - id (PK)         │
      │ - doctor_id (FK)  │
      │ - patient_id (FK) │
      │ - status          │
      │ - appointment_type│◄─── NEW: 'online' | 'offline'
      │ - call_session_id │◄─── NEW: Links to call_sessions
      │ - call_status     │◄─── NEW: Call state tracking
      └────────┬──────────┘
               │
               │ (appointment_id)
               │
      ┌────────▼──────────┐
      │  call_sessions    │◄─── NEW TABLE
      │                   │
      │ - id (PK)         │
      │ - appointment_id  │
      │ - doctor_id       │
      │ - patient_id      │
      │ - status          │
      │ - doctor_joined   │
      │ - patient_joined  │
      │ - doctor_peer_id  │◄─── WebRTC peer ID
      │ - patient_peer_id │◄─── WebRTC peer ID
      │ - signaling_data  │◄─── WebRTC signaling
      └───────────────────┘
```

## State Machine: Call Status

```
┌─────────────────────────────────────────────────────────────┐
│                    Call Status States                        │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ not_started  │  Initial state for online appointments
    └──────┬───────┘
           │
           │ Doctor clicks "Start Video Call"
           │
    ┌──────▼───────┐
    │   waiting    │  Waiting for patient to join
    └──────┬───────┘
           │
           │ Patient clicks "Join Video Call"
           │ WebRTC connection established
           │
    ┌──────▼───────┐
    │    active    │  Call in progress
    └──────┬───────┘
           │
           │ Either party clicks "End Call"
           │
    ┌──────▼───────┐
    │    ended     │  Call completed
    └──────────────┘
```

## Component Structure

```
src/
├── components/
│   ├── patient/
│   │   └── BookAppointment.tsx ──┐
│   │       - Appointment type    │
│   │       - Online/Offline      │
│   │                              │
│   └── shared/                    │
│       ├── AppointmentDetails.tsx├─► Uses VideoCall
│       │   - Call controls        │   & useCallSession
│       │   - Start/Join buttons   │
│       │                          │
│       └── VideoCall.tsx ◄────────┘
│           - Video interface
│           - WebRTC connection
│           - Media controls
│
├── hooks/
│   └── useCallSession.ts
│       - startCall()
│       - joinCall()
│       - endCall()
│       - Realtime subscription
│
└── lib/
    └── supabase.ts
        - Type definitions
        - Supabase client
```

## Real-time Signaling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Realtime Signaling Process                 │
└─────────────────────────────────────────────────────────────────┘

Doctor Side                 Supabase                 Patient Side
    │                          │                          │
    │  1. Update call_session  │                          │
    │     (doctor_peer_id)     │                          │
    ├─────────────────────────►│                          │
    │                          │                          │
    │                          │  2. Broadcast UPDATE     │
    │                          ├─────────────────────────►│
    │                          │                          │
    │                          │  3. Update call_session  │
    │                          │     (patient_peer_id)    │
    │                          │◄─────────────────────────┤
    │                          │                          │
    │  4. Broadcast UPDATE     │                          │
    │◄─────────────────────────┤                          │
    │                          │                          │
    │  5. Connect to patient   │                          │
    │     using peer_id        │                          │
    │                          │                          │
    │  6. WebRTC Handshake (SDP/ICE via NeatRTC)         │
    │◄────────────────────────────────────────────────────►│
    │                          │                          │
    │  7. Direct P2P Connection Established               │
    │◄════════════════════════════════════════════════════►│
    │         (Video/Audio streams bypass server)         │
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Architecture                   │
└─────────────────────────────────────────────────────────────┘

Application Layer
├── Authentication (Supabase Auth)
│   └── JWT tokens for API access
│
├── Authorization (RLS Policies)
│   ├── appointments: Only participants can view
│   ├── call_sessions: Only participants can access
│   └── notifications: Only recipient can read
│
├── Session Validation
│   ├── Verify appointment is confirmed
│   ├── Check appointment type is 'online'
│   └── Validate user is participant
│
└── Media Layer (WebRTC)
    ├── DTLS-SRTP encryption
    ├── End-to-end encrypted streams
    └── Peer authentication via signaling
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Optimizations                 │
└─────────────────────────────────────────────────────────────┘

1. Peer-to-Peer Connection
   └─► Direct media streaming (no server relay)
       └─► Lower latency, reduced bandwidth costs

2. Supabase Realtime
   └─► WebSocket connection for instant updates
       └─► No polling required

3. Lazy Loading
   └─► VideoCall component loaded only when needed
       └─► Reduced initial bundle size

4. Media Optimization
   └─► Adaptive bitrate
   └─► Resolution scaling
   └─► Audio/Video codec selection

5. Database Indexes
   └─► Fast queries on call_session_id
   └─► Efficient appointment lookups
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                      Error Scenarios                         │
└─────────────────────────────────────────────────────────────┘

Camera/Mic Access Denied
├─► Show error message
└─► Provide instructions to enable

Connection Failed
├─► Retry mechanism
├─► Fallback to audio-only
└─► Show connection status

Peer Disconnected
├─► Detect disconnect event
├─► Update call status
└─► Notify other party

Network Issues
├─► Monitor connection quality
├─► Attempt reconnection
└─► Graceful degradation
```
