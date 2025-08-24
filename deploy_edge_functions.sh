#!/bin/bash

# 🚀 Deploy Edge Functions - Cloudinary CORS Fix
# This script deploys the fixed edge functions to resolve the JSON parsing and CORS issues

echo "🔧 Deploying Cloudinary Edge Function Fixes..."
echo "Project: ljjyipvvxmduvxoyzvhf"
echo ""

# Navigate to frontend directory
cd /app/frontend

# Check if Supabase CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ NPX not found. Please install Node.js and npm first."
    exit 1
fi

echo "📋 Available edge functions:"
ls -la supabase/functions/

echo ""
echo "🚀 Starting deployment..."

# Deploy delete-cloudinary-image function
echo "📤 Deploying delete-cloudinary-image function..."
npx supabase functions deploy delete-cloudinary-image --project-ref ljjyipvvxmduvxoyzvhf

if [ $? -eq 0 ]; then
    echo "✅ delete-cloudinary-image deployed successfully"
else
    echo "❌ Failed to deploy delete-cloudinary-image"
    echo "💡 You may need to login first: npx supabase login"
    exit 1
fi

echo ""

# Deploy delete-user function
echo "📤 Deploying delete-user function..."
npx supabase functions deploy delete-user --project-ref ljjyipvvxmduvxoyzvhf

if [ $? -eq 0 ]; then
    echo "✅ delete-user deployed successfully"
else
    echo "❌ Failed to deploy delete-user"
    exit 1
fi

echo ""
echo "🎉 All edge functions deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Set your Cloudinary API Secret in Supabase Dashboard:"
echo "   Go to: https://supabase.com/dashboard/project/ljjyipvvxmduvxoyzvhf/edge-functions/secrets"
echo "   Add: CLOUDINARY_API_SECRET=your_actual_secret_here"
echo ""
echo "2. Test the fix by trying to delete a profile image"
echo ""
echo "🧪 Test the CORS fix:"
echo "cd /app && node test_cloudinary_cors.js"