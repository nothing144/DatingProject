#!/bin/bash

# Fix for JSON parsing bug in edge functions
# This script deploys the updated edge functions that handle OPTIONS requests properly

set -e

PROJECT_REF="ljjyipvvxmduvxoyzvhf"
FRONTEND_DIR="/app/frontend"

echo "🛠️  Fixing JSON Parsing Bug in Supabase Edge Functions"
echo "======================================================"
echo ""
echo "🐛 Issue: SyntaxError: Unexpected end of JSON input"
echo "🔧 Fix: Handle OPTIONS requests before JSON parsing"
echo ""

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

# Deploy delete-cloudinary-image function with fix
echo ""
echo "📤 Deploying FIXED delete-cloudinary-image function..."
npx supabase functions deploy delete-cloudinary-image --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo "✅ delete-cloudinary-image deployed successfully with JSON parsing fix"
else
    echo "❌ Failed to deploy delete-cloudinary-image"
    exit 1
fi

# Deploy delete-user function with fix
echo ""
echo "📤 Deploying FIXED delete-user function..."
npx supabase functions deploy delete-user --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo "✅ delete-user deployed successfully with JSON parsing fix"
else
    echo "❌ Failed to deploy delete-user"
    exit 1
fi

echo ""
echo "🎉 Bug Fix Deployed Successfully!"
echo "================================="

# Test the fix
echo ""
echo "🧪 Testing CORS configuration..."
sleep 3  # Give it a moment to propagate
cd /app
node test_cloudinary_cors.js

echo ""
echo "🔍 What was fixed:"
echo "  - OPTIONS requests now handled BEFORE JSON parsing"
echo "  - CORS headers properly returned for preflight requests"
echo "  - JSON parsing only happens for POST requests with body"
echo ""
echo "📋 Final Steps:"
echo "1. Verify test shows: ✅ CORS Configuration: ✅ WORKING"
echo "2. Set CLOUDINARY_API_SECRET in Supabase Dashboard (if not already set)"
echo "3. Test image deletion in your app"
echo ""
echo "🎯 The JSON parsing bug should now be FIXED!"