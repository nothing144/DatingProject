#!/bin/bash

# Build script for Heartbeat@ITER
set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting build process..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Install root dependencies if needed
if [ -f "package.json" ]; then
    echo "📦 Installing root dependencies..."
    yarn install --frozen-lockfile --non-interactive
fi

# Navigate to frontend and install dependencies
echo "📦 Installing frontend dependencies..."
cd frontend

# Install dependencies using yarn
echo "🧶 Running yarn install..."
yarn install --frozen-lockfile --non-interactive

# Run build
echo "🏗️ Building application..."
yarn build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build artifacts are in frontend/dist/"
    
    # Show build output summary
    echo "📊 Build summary:"
    ls -la dist/ | head -10
    
    # Check if critical files exist
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html found"
    else
        echo "❌ index.html not found!"
        exit 1
    fi
    
    if [ -d "dist/assets" ]; then
        echo "✅ Assets directory found"
    else
        echo "❌ Assets directory not found!"
        exit 1
    fi
    
    echo "🎉 Build verification passed!"
else
    echo "❌ Build failed - dist directory not found!"
    exit 1
fi

echo "✨ Build process completed successfully!"