/*
  # Add message cleanup and optimization

  1. Functions
    - Add function to clean up old messages
    - Add function to get message count per conversation
  
  2. Optimizations
    - Add indexes for better performance
    - Add constraints for message limits
*/

-- Function to clean up old messages (keep only last 10 per conversation)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- Delete messages beyond the 10 most recent per conversation
  DELETE FROM messages 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
      FROM messages
    ) ranked
    WHERE rn > 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get message count for a conversation
CREATE OR REPLACE FUNCTION get_conversation_message_count(conv_id uuid)
RETURNS integer AS $$
DECLARE
  msg_count integer;
BEGIN
  SELECT COUNT(*) INTO msg_count
  FROM messages
  WHERE conversation_id = conv_id;
  
  RETURN msg_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance on message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Add index for daily message count queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_date 
ON messages(sender_id, created_at);

-- Add a check constraint to limit message length (save storage)
ALTER TABLE messages 
ADD CONSTRAINT check_message_length 
CHECK (char_length(content) <= 500);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_message_count(uuid) TO authenticated;