# Fix for Deletion Issues - Database Policies

## 🐛 Problem
Users cannot delete notifications and date requests because the database is missing DELETE policies in Row Level Security (RLS).

## 🔧 Solution
Add the missing DELETE policies to allow users to delete their own data.

## 📋 Manual Fix Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run these SQL commands:**

```sql
-- Add DELETE policy for notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add DELETE policy for date requests
CREATE POLICY "Users can delete their date requests"
ON public.date_requests
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
```

### Option 2: Using Migration File

1. **Apply the migration file:**
   - The migration file is already created: `/app/frontend/supabase/migrations/20250108000000_add_delete_policies.sql`
   - Run it using your Supabase CLI or dashboard

## 🧪 Testing

After applying the policies:

1. **Test Notifications:**
   - Try deleting individual notifications (hover over notification → click X)
   - Try "Delete All Notifications" button

2. **Test Date Requests:**
   - Go to Date Requests tab
   - Try deleting a date request using the "Delete" button

## 🔍 Verification

To verify the policies were created successfully, run this SQL:

```sql
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('notifications', 'date_requests') 
AND cmd = 'DELETE';
```

You should see:
- `Users can delete their own notifications` policy on `notifications` table
- `Users can delete their date requests` policy on `date_requests` table

## 🎯 What This Fixes

- ✅ Notifications will be permanently deleted from database
- ✅ Date requests will be permanently deleted from database  
- ✅ No more items coming back after refresh
- ✅ Better error messages in console for debugging
- ✅ Real-time updates when items are deleted
- ✅ Individual notification deletion with X button

## 🚨 Important Notes

- The policies allow users to delete only their own notifications
- For date requests, users can delete requests they sent OR received
- The frontend code has been updated with better error handling
- Real-time subscriptions now handle DELETE events properly