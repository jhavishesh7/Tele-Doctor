# WebRTC Video Call Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Issue 1: "Permission denied" Error

**Cause**: Browser doesn't have camera/microphone permissions

**Solution**:
1. Click the camera icon in browser address bar
2. Allow camera and microphone access
3. Refresh the page
4. Try joining the call again

### Issue 2: "Waiting for patient/doctor to join..." (Stuck)

**Possible Causes**:
1. ❌ Supabase Realtime not enabled
2. ❌ WebRTC signaling not working
3. ❌ One party hasn't joined yet
4. ❌ Network/firewall blocking WebRTC

**Solutions**:

#### A. Check Supabase Realtime is Enabled
1. Go to **Supabase Dashboard → Database → Replication**
2. Make sure `call_sessions` table has **Realtime enabled**
3. Run this SQL to enable it:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
```

#### B. Check Browser Console Logs
Open DevTools (F12) and look for:
- ✅ `📡 Successfully subscribed to Realtime channel`
- ✅ `Creating peer - Initiator: true/false`
- ✅ `Doctor/Patient sending signal: offer/answer`
- ✅ `✅ Received remote stream`

If you see errors, check below:

#### C. Check Network/Firewall
WebRTC needs these ports open:
- UDP ports 3478-3479 (STUN)
- UDP ports 49152-65535 (media)

Test with: https://test.webrtc.org/

### Issue 3: "Cannot read properties of undefined (reading 'call')"

**Cause**: Missing Node.js polyfills for browser

**Solution**: Install polyfills
```bash
npm install events stream-browserify util
```

Then restart dev server:
```bash
npm run dev
```

### Issue 4: Video Connects but No Audio/Video

**Possible Causes**:
1. ❌ Tracks disabled
2. ❌ Wrong device selected
3. ❌ Browser permissions incomplete

**Solution**:
1. Check microphone/camera icons aren't muted
2. Check browser permissions are granted
3. Try toggling video/audio off and on

### Issue 5: Camera Still On After Call Ends

**Cause**: Media tracks not properly stopped

**Solution**: This is now fixed in the latest code. If still happening:
1. Close the browser tab
2. Restart browser
3. Check for browser updates

## 🧪 Testing Checklist

### Before Starting a Call:
- [ ] Camera permission granted
- [ ] Microphone permission granted
- [ ] Supabase Realtime enabled for `call_sessions` table
- [ ] Both users are logged in
- [ ] Appointment exists and is confirmed
- [ ] Network connection is stable

### During Call Setup:
- [ ] Doctor joins first (sees "Waiting for patient...")
- [ ] Patient joins second (sees "Waiting for doctor...")
- [ ] Console shows: "📡 Successfully subscribed to Realtime channel"
- [ ] Console shows: "Doctor/Patient sending signal"
- [ ] Console shows: "✅ Received remote stream"
- [ ] Both videos appear

### Testing on Same Computer:
Use two different browsers (e.g., Chrome and Firefox) or:
1. Open one browser in normal mode (Doctor)
2. Open another browser in incognito mode (Patient)
3. Log in with different accounts in each

## 📊 Console Log Meanings

| Log Message | Meaning | What to Check |
|------------|---------|---------------|
| `📡 Setting up Realtime signaling` | Starting setup | Normal |
| `✅ Successfully subscribed` | Realtime connected | Good! |
| `Creating peer - Initiator: true` | Doctor creating offer | Normal |
| `Creating peer - Initiator: false` | Patient creating answer | Normal |
| `Doctor sending signal: offer` | Doctor's WebRTC offer sent | Good! |
| `Patient sending signal: answer` | Patient's WebRTC answer sent | Good! |
| `✅ Received remote stream` | Video/audio connected! | Success! |
| `❌ Peer error` | Connection failed | Check network/firewall |
| `❌ Realtime subscription error` | Realtime not working | Enable Realtime in Supabase |

## 🔧 Quick Fixes

### Fix 1: Enable Realtime for call_sessions
```sql
-- Run in Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
```

### Fix 2: Check Realtime Status
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

Should show `call_sessions` in the results.

### Fix 3: Reset Call Session
```sql
-- If a call is stuck, reset it
UPDATE call_sessions 
SET status = 'ended', 
    ended_at = NOW() 
WHERE status = 'waiting' OR status = 'active';
```

### Fix 4: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## 🎯 Step-by-Step Call Test

### Doctor Side:
1. Open browser console (F12)
2. Navigate to appointment
3. Click "Start Call"
4. Allow camera/microphone
5. Look for: `📡 Successfully subscribed to Realtime channel`
6. Look for: `Creating peer - Initiator: true`
7. Look for: `Doctor sending signal: offer`
8. Wait for patient...

### Patient Side:
1. Open different browser/incognito
2. Open browser console (F12)
3. Navigate to same appointment
4. Click "Join Call"
5. Allow camera/microphone
6. Look for: `📡 Successfully subscribed to Realtime channel`
7. Look for: `👤 Patient: Received doctor signal`
8. Look for: `Creating peer - Initiator: false`
9. Look for: `Patient sending signal: answer`
10. Look for: `✅ Received remote stream`

### Both Sides Should See:
- ✅ Own video (small, top-right)
- ✅ Other person's video (large, center)
- ✅ "Connected" status
- ✅ Working controls (mute, video, end call)

## 🆘 Still Not Working?

### Check These:
1. **Supabase Project**: Is it active? Not paused?
2. **Realtime Enabled**: Database → Replication → call_sessions enabled?
3. **RLS Policies**: Do users have permission to read/write call_sessions?
4. **Browser**: Try Chrome or Firefox (best WebRTC support)
5. **Network**: Are you behind a corporate firewall?
6. **HTTPS**: WebRTC requires HTTPS (localhost is OK for testing)

### Get Detailed Logs:
Add this to browser console before starting call:
```javascript
localStorage.debug = 'simple-peer:*'
```

This will show detailed WebRTC logs.

## 📞 Support

If still having issues, check console logs and look for:
- Red error messages (❌)
- Missing green success messages (✅)
- Network errors
- Permission errors

Share the console logs for more specific help!
