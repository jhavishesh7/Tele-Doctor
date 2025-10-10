/*
  # Enable Supabase Realtime for Video Calls
  
  This script enables Realtime replication for the call_sessions table,
  which is required for WebRTC signaling to work.
*/

-- Enable Realtime for call_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;

-- Verify Realtime is enabled
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'call_sessions';

-- Expected output: Should show one row with call_sessions
