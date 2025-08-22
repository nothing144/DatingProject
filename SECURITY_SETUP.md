# 🔒 Security Configuration Guide

This document explains how to properly configure environment variables and secrets for secure deployment.

## 🚨 CRITICAL SECURITY NOTES

### ❌ NEVER DO THIS:
- Put API secrets in frontend code
- Hardcode credentials in source files
- Commit sensitive keys to version control
- Expose private keys in environment variables prefixed with `VITE_`

### ✅ ALWAYS DO THIS:
- Use environment variables for all credentials
- Keep secrets server-side only
- Use public keys in frontend when necessary
- Validate environment variables at startup

## 🔧 Environment Variables Setup

### Frontend Environment Variables (`.env`)
```bash
# Supabase - PUBLIC keys (safe for frontend)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Cloudinary - PUBLIC keys only
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_public_api_key

# Note: NEVER put API_SECRET in frontend environment variables
```

### Server-Side Secrets (Supabase Edge Functions)
```bash
# These should ONLY be set in Supabase dashboard secrets
CLOUDINARY_API_SECRET=your_secret_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🛡️ How to Set Supabase Secrets

1. Go to your Supabase dashboard
2. Navigate to Edge Functions > Settings
3. Add the following secrets:

```bash
supabase secrets set CLOUDINARY_API_SECRET=your_actual_secret_here
supabase secrets set CLOUDINARY_CLOUD_NAME=your_cloud_name
supabase secrets set CLOUDINARY_API_KEY=your_api_key
```

## 📋 Security Checklist

- [ ] All API secrets moved to server-side
- [ ] Frontend only contains public keys
- [ ] Environment variables properly validated
- [ ] No hardcoded credentials in source code
- [ ] Edge functions use environment variables
- [ ] Production secrets different from development

## 🚀 Deployment Notes

### Netlify Deployment
Set these environment variables in Netlify dashboard:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
```

### Local Development
Create `/app/frontend/.env` with public variables only.

## 🔍 Validation

The app will now validate required environment variables at startup and show clear error messages if any are missing.

## 📞 Getting Your Keys

### Supabase Keys:
1. Go to Supabase Dashboard → Project Settings → API
2. Copy "Project URL" → Use as `VITE_SUPABASE_URL`
3. Copy "anon public" key → Use as `VITE_SUPABASE_ANON_KEY`

### Cloudinary Keys:
1. Go to Cloudinary Dashboard → Settings → Account
2. Copy "Cloud name" → Use as `VITE_CLOUDINARY_CLOUD_NAME`
3. Copy "API Key" → Use as `VITE_CLOUDINARY_API_KEY`
4. Copy "API Secret" → Set ONLY in Supabase edge function secrets

Remember: The "API Secret" should NEVER be in frontend code!