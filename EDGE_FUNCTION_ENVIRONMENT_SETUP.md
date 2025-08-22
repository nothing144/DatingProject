# Edge Function Environment Setup

## 🔧 Required Environment Variables for Edge Functions

The edge function `delete-user` requires the following environment variables to be set in your Supabase project:

### **1. Cloudinary Configuration**

You need to set these secrets in your Supabase project dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Settings > Edge Functions**
3. Add the following secrets:

```bash
CLOUDINARY_CLOUD_NAME=dlnatlmdq
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### **2. How to get CLOUDINARY_API_SECRET**

1. Login to your Cloudinary dashboard (https://cloudinary.com/console)
2. Go to **Settings > Security** or **Dashboard**
3. Copy the **API Secret** value
4. Add it to your Supabase edge function secrets

### **3. Alternative: Set via Supabase CLI**

If you have Supabase CLI installed:

```bash
# Set the Cloudinary API secret
supabase secrets set CLOUDINARY_API_SECRET=your_actual_api_secret_here

# Set other required secrets (if not already set)
supabase secrets set CLOUDINARY_CLOUD_NAME=dlnatlmdq
supabase secrets set CLOUDINARY_API_KEY=855887866717832
```

### **4. Verify Edge Function Deployment**

After setting the secrets, deploy the edge function:

```bash
# Deploy the updated edge function
supabase functions deploy delete-user

# Test the function (optional)
supabase functions invoke delete-user --method POST
```

### **5. Important Security Notes**

- ✅ **Never expose API secrets in client-side code**
- ✅ **API secrets should only be set in server-side environment variables**
- ✅ **The edge function now handles secure Cloudinary deletion with proper signatures**
- ✅ **Client-side code no longer attempts insecure deletions**

### **6. Testing the Fix**

Once the environment variables are set:

1. **Create a test account** with the provided credentials
2. **Upload a profile picture** (should work normally)
3. **Delete the account** - this should now:
   - ✅ Delete the user from authentication
   - ✅ Delete all database records
   - ✅ Delete the Cloudinary image with proper signature
   - ✅ Provide detailed success/failure feedback

### **7. Troubleshooting**

If deletion still fails:

1. **Check edge function logs** in Supabase dashboard
2. **Verify all environment variables** are set correctly
3. **Ensure Cloudinary upload preset** exists (`heartbeat_preset`)
4. **Check console logs** for detailed error messages

---

## 🎯 Summary of Fixes

### **What was fixed:**

1. **✅ Edge Function Enhancement**: Now handles complete user deletion including Cloudinary images
2. **✅ Secure Cloudinary Deletion**: Uses proper signature generation for secure server-side deletion
3. **✅ Fallback Mechanism**: Client-side manual cleanup if edge function fails
4. **✅ Better Error Handling**: Comprehensive logging and user feedback
5. **✅ Security Improvement**: Removed insecure client-side deletion attempts

### **What you need to do:**

1. **Set CLOUDINARY_API_SECRET** in Supabase edge function environment
2. **Deploy the updated edge function**
3. **Test with the provided credentials**

The app should now properly delete users from both authentication and Cloudinary!