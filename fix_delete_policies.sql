-- Fix missing DELETE policies for notifications and date_requests tables
-- This file contains the SQL commands to add the missing DELETE policies

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

-- Verify policies are created (for debugging)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('notifications', 'date_requests') 
AND cmd = 'DELETE';