# Video Call Feature Setup Guide

## Overview
This guide explains how to set up and use the video call feature in MeroClinic telemedicine platform.
## Prerequisites
- Node.js and npm installed
- Supabase project configured
- Camera and microphone permissions in browser

### Installation Steps

### 1. Install Dependencies
```bash
npm install simple-peer
```

This will install the `simple-peer` package along with other dependencies.

### 2. Run Database Migration
Execute the migration file to add video call support to your database:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL file:
# supabase/migrations/20251010000000_add_video_call_support.sql
```

This migration adds:
- `appointment_type` column (online/offline)
- `call_status` tracking
- `call_sessions` table for WebRTC signaling
- Necessary indexes and RLS policies

### 3. Enable Realtime in Supabase
Ensure Supabase Realtime is enabled for the following tables:
- `appointments`
- `call_sessions`

In your Supabase dashboard:
1. Go to Database → Replication
2. Enable replication for `appointments` and `call_sessions` tables

## Usage

### For Patients

#### Booking an Online Appointment
1. Search for a doctor
2. Click "Book Appointment"
3. Select **"Video Call"** as appointment type
4. Fill in date, time, and notes
5. Submit the request

#### Joining a Video Call
1. Navigate to "My Appointments"
2. When doctor starts the call, you'll see a **"Join Video Call"** button
3. Click to join and grant camera/microphone permissions
4. Use controls to mute/unmute or turn video on/off

### For Doctors

#### Accepting Online Appointments
1. Review appointment requests in your dashboard
2. Propose time or accept requested time
3. System automatically recognizes it as an online appointment

#### Starting a Video Call
1. Go to confirmed appointments
2. At the scheduled time, click **"Start Video Call"**
3. Patient will be notified to join
4. Use controls for:
   - Mute/unmute microphone
   - Turn video on/off
   - Share screen
   - End call

## Features

### Video Call Controls
- **Audio Toggle**: Mute/unmute microphone
- **Video Toggle**: Turn camera on/off
- **Screen Share**: Share your screen (doctor only)
- **End Call**: Terminate the session

### Real-time Features
- Automatic notifications when call starts
- Live connection status
- Peer-to-peer video streaming
- Low latency communication

## Technical Details

### Architecture
```
Patient Browser <--WebRTC--> Doctor Browser
       ↓                           ↓
       └─── Supabase Realtime ────┘
              (Signaling)
```

### Call Flow
1. Doctor clicks "Start Video Call"
   - Creates `call_session` record
   - Updates appointment `call_status` to 'waiting'
   - Sends notification to patient

2. Patient clicks "Join Video Call"
   - Retrieves call session
   - Establishes WebRTC connection
   - Updates session with peer ID

3. Both parties connected
   - Status changes to 'active'
   - Video/audio streams exchanged
   - Real-time communication begins

4. Call ends
   - Either party clicks "End Call"
   - Session marked as 'ended'
   - Appointment updated

### Security
- **End-to-End Encryption**: WebRTC uses DTLS-SRTP
- **Row Level Security**: Database access controlled by RLS policies
- **Peer Authentication**: Only appointment participants can join
- **Session Validation**: Call sessions linked to confirmed appointments

## Troubleshooting

### Camera/Microphone Not Working
- Check browser permissions
- Ensure HTTPS connection (required for WebRTC)
- Try different browser (Chrome/Firefox recommended)

### Connection Issues
- Check internet connection
- Verify Supabase Realtime is enabled
- Check browser console for errors

### Call Not Starting
- Ensure appointment is confirmed
- Verify appointment type is 'online'
- Check that both users have stable connection

## Browser Compatibility
- Chrome 74+
- Firefox 66+
- Safari 12.1+
- Edge 79+

## Development Notes

### Simple-Peer Configuration
The VideoCall component uses simple-peer for WebRTC connections with `trickle: false` for simpler signaling.

For production, you may want to enable trickle ICE:
```typescript
const peer = new SimplePeer({
  initiator,
  trickle: true, // Enable for better performance
  stream,
});
```

### Customization
You can customize the video call UI by modifying:
- `src/components/shared/VideoCall.tsx` - Main video interface
- `src/hooks/useCallSession.ts` - Call session management
- `src/components/shared/AppointmentDetails.tsx` - Call controls

## Support
For issues or questions, refer to:
- [Simple-Peer Documentation](https://github.com/feross/simple-peer)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
