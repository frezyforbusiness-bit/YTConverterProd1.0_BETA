#!/bin/bash
# Build script for React frontend

set -e

echo "🔨 Building React frontend..."

cd frontend-react

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the frontend
echo "🏗️  Building production bundle..."
npm run build

# Copy build output to frontend directory
echo "📋 Copying build files..."
rm -rf ../frontend-react-dist
mkdir -p ../frontend-react-dist
cp -r dist/* ../frontend-react-dist/

echo "✅ Frontend build completed!"

