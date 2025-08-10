#!/bin/bash

# Build script for Heartbeat@ITER
echo "Starting build process..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Navigate to frontend and install dependencies
echo "Installing frontend dependencies..."
cd frontend
yarn install

# Build the application
echo "Building application..."
yarn build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build artifacts are in frontend/dist/"
    ls -la dist/
else
    echo "❌ Build failed!"
    exit 1
fi