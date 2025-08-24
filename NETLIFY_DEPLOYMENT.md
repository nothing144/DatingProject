# 🚀 Netlify Deployment Guide

## Quick Deploy to Netlify

### Method 1: Connect GitHub Repository (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Netlify will automatically detect the configuration from `netlify.toml`

### Method 2: Manual Deploy

1. **Build locally:**
   ```bash
   ./build.sh
   ```

2. **Deploy the `frontend/dist` folder:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `frontend/dist` folder to Netlify

## ⚙️ Environment Variables Setup

**CRITICAL**: Set these environment variables in Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add these variables:

```bash
VITE_SUPABASE_URL=https://ljjyipvvxmduvxoyzvhf.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_CLOUDINARY_CLOUD_NAME=dlnatlmdq
VITE_CLOUDINARY_API_KEY=855887866717832
```

> **Note:** Get the actual `VITE_SUPABASE_ANON_KEY` from your local `/app/frontend/.env` file

## 🔧 Build Settings

Netlify will automatically use these settings from `netlify.toml`:

- **Build command:** `cd frontend && yarn install && yarn build`
- **Publish directory:** `frontend/dist`
- **Node version:** 18

## 🌐 Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Add your custom domain
3. Configure DNS settings as instructed

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Environment variables set in Netlify
- [ ] Build completes successfully
- [ ] Site loads without errors
- [ ] Authentication works (can sign in/up)
- [ ] All features functional

## 🚨 Troubleshooting

**Build fails?**
- Check build logs in Netlify dashboard
- Ensure all environment variables are set
- Verify Node version is 18+

**App loads but authentication fails?**
- Double-check environment variables
- Ensure `VITE_SUPABASE_ANON_KEY` is correct
- Check browser console for errors

**404 errors on refresh?**
- The `netlify.toml` handles SPA routing automatically
- If still occurring, check the redirects configuration

## 📞 Support

If you encounter issues:
1. Check Netlify build logs
2. Verify environment variables match your local `.env`
3. Test build locally with `./build.sh`

Your HeartBeat@ITER app is ready for the world! 🎉