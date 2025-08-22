# 🛠️ Delete Profile Functionality - Setup Instructions

## 🚨 Issues Found & Fixed

### **Issue 1: CORS Configuration** ✅ FIXED
**Problem:** Edge function CORS headers only allowed production domain
**Solution:** Changed `'Access-Control-Allow-Origin': 'https://iterdating.netlify.app'` to `'Access-Control-Allow-Origin': '*'`

### **Issue 2: Missing Environment Variables** ⚠️ REQUIRES ACTION
**Problem:** Edge function needs Supabase environment variables
**Required Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` 
- `SUPABASE_ANON_KEY`
- `CLOUDINARY_API_SECRET` (optional for image deletion)

### **Issue 3: Edge Function Not Deployed** ⚠️ REQUIRES ACTION
**Problem:** Function exists locally but isn't deployed to Supabase

---

## 📋 **WHAT YOU NEED TO DO**

### **Step 1: Install Supabase CLI** 
```bash
npm install -g supabase
# OR
yarn global add supabase
```

### **Step 2: Login to Supabase**
```bash
supabase login
```

### **Step 3: Link Your Project**
```bash
cd /app/frontend
supabase link --project-ref ljjyipvvxmduvxoyzvhf
```

### **Step 4: Set Environment Variables**
```bash
# Set the required environment variables for the edge function
supabase secrets set SUPABASE_URL=https://ljjyipvvxmduvxoyzvhf.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ⚠️ YOU NEED TO GET THIS FROM YOUR SUPABASE DASHBOARD
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Optional - Only needed if you want Cloudinary image deletion
supabase secrets set CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_SECRET_HERE
```

### **Step 5: Get Your Service Role Key**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ljjyipvvxmduvxoyzvhf)
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Run: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here`

### **Step 6: Deploy the Edge Function**
```bash
cd /app/frontend
supabase functions deploy delete-user
```

### **Step 7: Test the Delete Function**
1. Start your frontend: `yarn dev`
2. Create a test account or login
3. Go to Profile → Edit Profile
4. Click the **Delete** button
5. Check browser console for detailed logs

---

## 🧪 **Testing Commands**

### **Test Edge Function Directly:**
```bash
# Test if function is deployed and working
curl -X POST 'https://ljjyipvvxmduvxoyzvhf.supabase.co/functions/v1/delete-user' \
  -H 'Authorization: Bearer YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json'
```

### **Check Function Logs:**
```bash
supabase functions logs delete-user
```

### **Test CORS:**
```bash
curl -X OPTIONS 'https://ljjyipvvxmduvxoyzvhf.supabase.co/functions/v1/delete-user' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Origin: http://localhost:3000'
```

---

## 🔍 **Console Errors You'll See Until Fixed**

### **Before Deployment:**
```
❌ Failed to fetch delete-user function
❌ TypeError: Failed to fetch at http://localhost:3000/
```

### **Missing Service Role Key:**
```
❌ Server configuration error: Missing service role key
❌ Status: 500 - Missing SUPABASE_SERVICE_ROLE_KEY
```

### **CORS Issues (Fixed):**
```
❌ Access to fetch blocked by CORS policy
❌ Origin 'http://localhost:3000' not allowed
```

---

## ✅ **Expected Working Flow**

Once properly set up, you should see these console logs:

```
📡 Calling edge function for complete user deletion...
🔗 Edge function URL: https://ljjyipvvxmduvxoyzvhf.supabase.co/functions/v1/delete-user
🚀 Edge function called with method: POST
🔍 Validating environment variables...
Environment check - URL: ✅, Service Key: ✅, Anon Key: ✅
🔐 Creating Supabase clients...
👤 Verifying user authentication...
✅ User authenticated: [user-id]
🚀 Starting complete user deletion for user: [user-id]
📸 Fetching user profile for avatar deletion...
🗑️ Starting database cleanup...
📧 Deleting messages...
✅ Messages deleted
💬 Deleting conversations...
✅ Conversations deleted
[... more deletion steps ...]
🔐 Deleting authentication user...
✅ Complete user deletion successful
```

---

## 🚀 **Quick Fix Summary**

1. **Fixed CORS** ✅ (Already done)
2. **Install Supabase CLI** → `npm install -g supabase`
3. **Login to Supabase** → `supabase login`
4. **Link project** → `supabase link --project-ref ljjyipvvxmduvxoyzvhf`
5. **Get service role key** → From Supabase Dashboard Settings → API
6. **Set environment variables** → `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key`
7. **Deploy function** → `supabase functions deploy delete-user`
8. **Test** → Create account, go to profile, click delete, check console

---

## 📞 **Need Help?**

If you get stuck on any step, run these diagnostic commands:

```bash
# Check if CLI is installed
supabase --version

# Check if logged in
supabase projects list

# Check if project is linked
supabase status

# Check current secrets
supabase secrets list

# Check function deployment status
supabase functions list
```

The delete profile functionality is **well-implemented** - it just needs proper **deployment and configuration**! 🎯