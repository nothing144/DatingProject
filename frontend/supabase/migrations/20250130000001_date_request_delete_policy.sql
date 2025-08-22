/*
  # Add Delete Policy for Date Requests
  
  1. Policies
    - Allow users to delete their own date requests (both sent and received)
    - Add function for bulk notification deletion
*/

-- Allow users to delete date requests they are involved in (sender or receiver)
CREATE POLICY "Users can delete their date requests"
  ON date_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Function to delete all notifications for a user (for bulk deletion)
CREATE OR REPLACE FUNCTION delete_all_user_notifications(target_user_id UUID)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete all notifications for the user
  DELETE FROM notifications 
  WHERE user_id = target_user_id;
  
  -- Get count of deleted rows
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_all_user_notifications(UUID) TO authenticated;

-- Add policy to allow users to delete their own notifications (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Users can delete their own notifications'
  ) THEN
    CREATE POLICY "Users can delete their own notifications"
      ON notifications
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON FUNCTION delete_all_user_notifications(UUID) IS 'Bulk delete all notifications for a specific user to reduce database load';