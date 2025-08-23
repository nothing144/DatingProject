# 🔧 Cloudinary CORS Fix - Complete Solution Guide

## 🎯 **Problem Identified**
Your Cloudinary image deletion is failing due to **CORS policy blocking** requests from `https://iterdating.netlify.app` to your Supabase edge function.

## ✅ **What I Fixed**
I updated both your edge functions with the correct CORS configuration:

### Files Updated:
1. `/app/frontend/supabase/functions/delete-cloudinary-image/index.ts`
2. `/app/frontend/supabase/functions/delete-user/index.ts`

### Changes Made:
```typescript
// OLD (Blocked your domain)
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Credentials': 'false',

// NEW (Fixed for your domain)
'Access-Control-Allow-Origin': 'https://iterdating.netlify.app',
'Access-Control-Allow-Credentials': 'true',
```

## 🚀 **Required Steps to Complete the Fix**

### Step 1: Deploy the Updated Edge Functions
```bash
# Navigate to your frontend directory
cd /app/frontend

# Deploy the Cloudinary deletion function
npx supabase functions deploy delete-cloudinary-image --project-ref ljjyipvvxmduvxoyzvhf

# Deploy the user deletion function
npx supabase functions deploy delete-user --project-ref ljjyipvvxmduvxoyzvhf
```

**Note:** You'll need to login to Supabase CLI first:
```bash
npx supabase login
```

### Step 2: Set Cloudinary API Secret (CRITICAL)
Your edge functions need the Cloudinary API secret to delete images. Set this in your Supabase dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Navigate to **Edge Functions** → **Settings** → **Secrets**
3. Add this secret:
   ```
   CLOUDINARY_API_SECRET=your_actual_cloudinary_api_secret_here
   ```

### Step 3: Get Your Cloudinary API Secret
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Click **Settings** → **Account**
3. Copy the **API Secret** (NOT the API Key)
4. Add it to Supabase Edge Function secrets

## 🧪 **Testing the Fix**

### Test 1: Profile Image Deletion
1. Upload a new profile image
2. Upload another image (should delete the old one)
3. Check browser DevTools → Network → Should see successful requests to edge function
4. Check browser DevTools → Console → Should see "✅ Image deleted successfully"

### Test 2: Complete Profile Deletion
1. Create test profile with image
2. Delete profile completely
3. Should see all items deleted including Cloudinary images
4. No CORS errors in console

## 📊 **What You Should See After Fix**

### ✅ Success Indicators:
- ✅ No CORS errors in browser console
- ✅ "Cloudinary image deleted securely" messages
- ✅ Images actually removed from Cloudinary dashboard
- ✅ Profile deletion shows "Cloudinary Images: ✅"

### 🚨 If Still Failing:
Check browser console for specific error messages and ensure:
1. Edge functions are deployed with correct CORS headers
2. Cloudinary API secret is set in Supabase edge function secrets
3. Your domain matches exactly: `https://iterdating.netlify.app`

## 🔍 **Quick Verification Commands**

Check if functions are deployed:
```bash
npx supabase functions list --project-ref ljjyipvvxmduvxoyzvhf
```

Test the edge function directly:
```bash
curl -X POST https://ljjyipvvxmduvxoyzvhf.supabase.co/functions/v1/delete-cloudinary-image \
  -H "Origin: https://iterdating.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS
```

## 🎉 **Expected Results**
After completing these steps:
- ❌ CORS errors will be **eliminated**
- ✅ Cloudinary images will delete **securely** 
- ✅ Complete profile deletion will work **flawlessly**
- ✅ All delete operations will show **success status**

Your Cloudinary deletion should work perfectly after these fixes! 🛡️