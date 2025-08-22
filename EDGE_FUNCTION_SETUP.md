# Edge Function Setup Guide - UPDATED

## Profile Deletion Edge Function

The profile deletion functionality has been improved to handle cases where the Supabase edge function is not deployed. However, for complete user deletion (including authentication records), you should deploy the edge function.

## 🚨 REQUIRED FIXES APPLIED:

### ✅ **CORS Issues Fixed**:
- Enhanced CORS headers with all required methods and headers
- Added proper preflight request handling
- Added method validation (POST only)

### ✅ **Environment Variables Validation**:
- Added validation for all required environment variables
- Better error messages when variables are missing
- Graceful fallback when configuration is incomplete

### ✅ **Error Handling Improved**:
- Better error logging and user feedback  
- Enhanced response parsing in frontend
- Ignore favorites table errors as requested

## 🔧 **Required Environment Variables**

The edge function requires these environment variables to be set in Supabase:

### **Mandatory Variables:**
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Optional Variables (for Cloudinary image deletion):**
```bash
CLOUDINARY_CLOUD_NAME=dlnatlmdq
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```

## 🚀 **Deployment Steps**

### **Prerequisites:**
1. Supabase CLI installed: `npm install -g supabase`
2. Project linked to Supabase

### **Deploy the Edge Function:**
```bash
# 1. Login to Supabase
supabase login

# 2. Link your project (if not already linked)
supabase link --project-ref ljjyipvvxmduvxoyzvhf

# 3. Deploy the edge function
supabase functions deploy delete-user

# 4. Set the required environment variables
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
supabase secrets set SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 5. Optional: Set Cloudinary secrets (for image deletion)
supabase secrets set CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```

### **Find Your Service Role Key:**
1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. Copy the `service_role` key (not the `anon` key)
4. Use it in the command above

## 📋 **Current Status**

### **With Edge Function Deployed & Configured:**
1. ✅ Deletes all user data from database tables
2. ✅ Removes profile images from Cloudinary  
3. ✅ Completely removes user from Supabase authentication
4. ✅ User must sign up again with new email to use the app

### **Without Edge Function (Fallback Mode):**
1. ✅ Deletes all user data from database tables
2. ❌ Cloudinary images remain (but no database reference)
3. ❌ Authentication record remains (user can still sign in but needs new profile)

## 🧪 **Testing the Fix**

### **Test Profile Deletion:**
1. Login with your credentials
2. Navigate to Profile page (bottom navigation)
3. Click the red "Delete" button
4. Confirm deletion in the popup
5. **Check Console for Logs** - Should show detailed progress without CORS errors

### **Expected Results (With Edge Function):**
- ✅ No CORS errors in console
- ✅ Detailed progress logs showing each deletion step
- ✅ Success message showing what was deleted
- ✅ Complete account deletion including authentication
- ✅ Automatic logout and redirect to login page

### **Expected Results (Without Edge Function):**
- ✅ No CORS errors in console
- ✅ Fallback to manual cleanup
- ✅ Profile data deleted from database
- ⚠️ Authentication remains (user can sign in but needs new profile)

## 🔍 **Troubleshooting**

### **If you see CORS errors:**
- The edge function is deployed but environment variables are missing
- Deploy the function and set the environment variables as shown above

### **If edge function returns 500 error:**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify the service role key has admin permissions

### **If Cloudinary deletion fails:**
- This is optional - profile deletion will still work
- Set `CLOUDINARY_API_SECRET` to enable image deletion

## 🎯 **Summary of Fixes Applied**

1. ✅ **Fixed CORS headers** - Added all required headers and methods
2. ✅ **Added environment variable validation** - Clear error messages
3. ✅ **Enhanced error handling** - Better logging and user feedback
4. ✅ **Improved frontend error handling** - Better response parsing
5. ✅ **Made favorites table deletion optional** - Won't fail if table doesn't exist
6. ✅ **Added deployment guide** - Clear instructions for setup

The profile deletion should now work without CORS errors!