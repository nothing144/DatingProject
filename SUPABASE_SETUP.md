# Storage Setup Instructions

## To complete the image upload fix, you need to set up the Supabase Storage bucket:

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Storage → Buckets
3. Create a new bucket with:
   - Name: `avatars`
   - Public: `true`

### Option 2: Using SQL in Supabase SQL Editor
Run the migration file `/app/frontend/supabase/migrations/20250131000000_setup_avatar_storage.sql`

### Option 3: Manual SQL Commands
Execute these commands in your Supabase SQL Editor:

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create policy to allow users to upload their own avatars
CREATE POLICY "Users can upload avatar images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy to allow users to view all avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Create policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Edge Function Setup
To complete the secure user deletion:
1. Deploy the edge function in `/app/frontend/supabase/functions/delete-user/index.ts`
2. This can be done via Supabase CLI: `supabase functions deploy delete-user`

## What's Fixed:
1. ✅ **Image Upload Performance**: Now uses Supabase Storage instead of Base64
2. ✅ **Profile Deletion Security**: Removed dangerous admin.deleteUser() client call
3. ✅ **Secure User Deletion**: Added edge function for proper auth user deletion