-- Migration for Phase 3 Optimizations: Indexes and Cleanup

-- 1. Create Indexes to optimize standard queries and reduce read latency
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at 
ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_date_requests_receiver_status 
ON public.date_requests(receiver_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1
ON public.conversations(participant_1);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_2
ON public.conversations(participant_2);

-- 2. Cleanup function for rejected date requests (> 7 days old)
CREATE OR REPLACE FUNCTION cleanup_rejected_date_requests()
RETURNS integer AS $$
DECLARE
  deleted_rows integer;
BEGIN
  -- Safe to delete: they are strictly 'rejected' and older than 7 days.
  -- There are no foreign key dependencies on date_requests (it doesn't have child tables).
  DELETE FROM date_requests 
  WHERE status = 'rejected' 
    AND created_at < (now() - interval '7 days');
  
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cleanup function for empty conversations (> 24 hours old)
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS integer AS $$
DECLARE
  deleted_rows integer;
BEGIN
  -- Delete conversations older than 24h that have NO messages associated with them.
  -- Safe to run repeatedly because it strictly checks the message table.
  DELETE FROM conversations 
  WHERE created_at < (now() - interval '24 hours')
    AND NOT EXISTS (
      SELECT 1 FROM messages WHERE messages.conversation_id = conversations.id
    );
  
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Master scheduled cleanup function to run all cleanup tasks
CREATE OR REPLACE FUNCTION scheduled_database_cleanup()
RETURNS json AS $$
DECLARE
  confessions_result json;
  rejected_requests_deleted integer;
  empty_conversations_deleted integer;
BEGIN
  -- 1. Run the existing confession cleanup
  SELECT scheduled_confession_cleanup() INTO confessions_result;
  
  -- 2. Clean up rejected date requests
  SELECT cleanup_rejected_date_requests() INTO rejected_requests_deleted;
  
  -- 3. Clean up empty conversations
  SELECT cleanup_empty_conversations() INTO empty_conversations_deleted;
  
  RETURN json_build_object(
    'success', true,
    'timestamp', now(),
    'confessions_cleanup', confessions_result,
    'rejected_requests_deleted', rejected_requests_deleted,
    'empty_conversations_deleted', empty_conversations_deleted,
    'message', 'Phase 3 database cleanup completed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated or anon if running via Edge Functions
GRANT EXECUTE ON FUNCTION scheduled_database_cleanup() TO authenticated;
GRANT EXECUTE ON FUNCTION scheduled_database_cleanup() TO anon;
GRANT EXECUTE ON FUNCTION scheduled_database_cleanup() TO service_role;
