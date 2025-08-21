# Edge Function Setup Guide

## Profile Deletion Edge Function

The profile deletion functionality has been improved to handle cases where the Supabase edge function is not deployed. However, for complete user deletion (including authentication records), you should deploy the edge function.

## Current Status ✅
- **Profile data deletion**: ✅ Working (deletes all related data)
- **Image cleanup**: ✅ Working (removes from Cloudinary)
- **Authentication deletion**: ⚠️ Optional (requires edge function deployment)

## How Profile Deletion Works Now

### Without Edge Function (Current State):
1. ✅ Deletes all user data from database tables:
   - Messages sent by user
   - Conversations where user participated
   - Date requests (sent and received)
   - Announcements by user
   - Confessions by user
   - Notifications for user
   - Favorites related to user
   - User profile
2. ✅ Removes profile images from Cloudinary
3. ❌ Authentication record remains (user can still sign in but will need to recreate profile)

### With Edge Function Deployed:
1. ✅ All of the above
2. ✅ Completely removes user from Supabase authentication
3. ✅ User must sign up again with new email to use the app

## User Experience

### Current User Messages:
- **Edge function works**: "Profile Completely Deleted - Your profile and all associated data have been completely deleted, including authentication."
- **Edge function fails**: "Profile Deleted (Partial) - Your profile data has been deleted, but you may need to contact support to fully remove your account authentication."
- **Edge function missing**: "Profile Deleted (Data Only) - Your profile data has been deleted. Your authentication remains - you can still sign in but will need to recreate your profile."

## To Deploy Edge Function (Optional):

### Prerequisites:
1. Supabase CLI installed
2. Project linked to Supabase

### Steps:
```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy the edge function
supabase functions deploy delete-user

# 5. Set environment variables (if needed)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Verification:
After deployment, test profile deletion. You should see the "Profile Completely Deleted" message.

## File Locations:
- Edge function: `/app/frontend/supabase/functions/delete-user/index.ts`
- Profile deletion logic: `/app/frontend/src/pages/Profile.tsx` (handleDeleteProfile function)

## Security Notes:
- The current implementation is safe and secure
- All user data is properly deleted from the database
- Images are removed from Cloudinary
- The only difference is whether the auth record is deleted or not
- Users cannot access deleted profile data even if auth record remains

## For Development:
The profile deletion works perfectly for development and testing without the edge function. Users can recreate profiles after deletion for testing purposes.

## For Production:
Deploy the edge function for complete user deletion to comply with data privacy regulations (GDPR, etc.).