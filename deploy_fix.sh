#!/bin/bash

# Cloudinary CORS Fix Deployment Script
# This script deploys the fixed edge functions to resolve CORS issues

set -e

PROJECT_REF="ljjyipvvxmduvxoyzvhf"
FRONTEND_DIR="/app/frontend"

echo "🚀 Deploying Cloudinary CORS Fix..."
echo "========================================="

cd "$FRONTEND_DIR"

# Check if logged in to Supabase
echo "🔐 Checking Supabase authentication..."
if ! npx supabase projects list > /dev/null 2>&1; then
    echo "❌ Not logged in to Supabase CLI"
    echo "Please run: npx supabase login"
    echo "Then re-run this script"
    exit 1
fi

echo "✅ Authenticated with Supabase CLI"

# Deploy delete-cloudinary-image function
echo ""
echo "📤 Deploying delete-cloudinary-image function..."
npx supabase functions deploy delete-cloudinary-image --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo "✅ delete-cloudinary-image deployed successfully"
else
    echo "❌ Failed to deploy delete-cloudinary-image"
    exit 1
fi

# Deploy delete-user function
echo ""
echo "📤 Deploying delete-user function..."
npx supabase functions deploy delete-user --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo "✅ delete-user deployed successfully"
else
    echo "❌ Failed to deploy delete-user"
    exit 1
fi

echo ""
echo "🎉 All functions deployed successfully!"
echo "========================================="

# Test the deployment
echo ""
echo "🧪 Testing CORS configuration..."
cd /app
node test_cloudinary_cors.js

echo ""
echo "📋 Next Steps:"
echo "1. Set CLOUDINARY_API_SECRET in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
echo "2. Test image deletion in your app"
echo "3. Verify no CORS errors in browser console"
echo ""
echo "🎯 Your Cloudinary deletion should work now!"