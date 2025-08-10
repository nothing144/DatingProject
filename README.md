# Heartbeat@ITER - College Dating App

A modern college dating application built with React, TypeScript, and Supabase.

## 🚀 Quick Start

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Built Application
```bash
npm run preview
```

## 📁 Project Structure
```
/app
├── package.json          # Root build configuration
├── netlify.toml          # Deployment configuration
└── frontend/             # React application
    ├── src/              # Source code
    ├── public/           # Static assets
    ├── dist/             # Built application (generated)
    └── package.json      # Frontend dependencies
```

## 🛠 Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database + Auth + API)
- **Deployment**: Netlify Ready

## ✨ Features Implemented
- ✅ User authentication (Sign up/Sign in)
- ✅ Profile management with username functionality
- ✅ Swipe gestures for profile browsing (replaces cross button)
- ✅ Username search in discover page
- ✅ Pink-colored usernames in discover page
- ✅ Proper Bio/Interests labels in profile cards
- ✅ Mobile-responsive design and save button layout
- ✅ Real-time messaging system
- ✅ Date requests functionality
- ✅ Announcements and confessions
- ✅ Favorites system

## 🎯 App Description
**"College ka pyaar, semester jaisa — short & intense"**

Heartbeat@ITER is a college-focused dating app designed for authentic connections within the campus community.

## 🔧 Build Fixed
The build issue has been resolved by:
1. ✅ Created proper root `package.json` with build scripts
2. ✅ Added `netlify.toml` for deployment configuration
3. ✅ Configured build to run from `frontend/` directory
4. ✅ Set publish directory to `frontend/dist`

## 🚀 Ready for Deployment
The application is now ready for deployment on Netlify or any static hosting platform.
