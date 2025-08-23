/*
  # Add missing DELETE policies for notifications and date_requests

  This migration adds the missing DELETE policies that were preventing users 
  from deleting their own notifications and date requests.

  1. Notifications
    - Add DELETE policy for users to delete their own notifications

  2. Date Requests  
    - Add DELETE policy for users to delete date requests they sent or received

  This fixes the bug where deletions were failing silently due to missing RLS policies.
*/

-- Add DELETE policy for notifications table
-- Users should be able to delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add DELETE policy for date_requests table  
-- Users should be able to delete date requests they sent OR received
CREATE POLICY "Users can delete their date requests"
ON public.date_requests
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);