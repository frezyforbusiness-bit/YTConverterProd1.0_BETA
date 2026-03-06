# Multi-stage build for Railway deployment
FROM node:20-alpine AS frontend-builder

# Build React frontend
WORKDIR /app/frontend-react
COPY frontend-react/package*.json ./
RUN npm ci --only=production=false || (echo "npm ci failed" && exit 1)
COPY frontend-react/ .

# Set VITE_API_URL for build (can be overridden at build time)
# If not set, will use default from api.ts (http://localhost:5000)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend and verify build succeeded
RUN echo "🔨 Starting frontend build..." && \
    npm run build || (echo "❌ Frontend build failed!" && exit 1) && \
    echo "✅ Frontend build completed"

RUN echo "🔍 Verifying build output..." && \
    echo "Current directory: $(pwd)" && \
    echo "Listing current directory:" && \
    ls -la && \
    echo "" && \
    echo "Checking dist directory:" && \
    test -d dist && echo "✓ dist directory EXISTS" || (echo "✗ dist directory DOES NOT EXIST!" && exit 1) && \
    echo "dist directory contents:" && \
    ls -la dist/ && \
    echo "" && \
    test -f dist/index.html && echo "✓ index.html found in dist" || (echo "✗ index.html NOT found in dist" && exit 1) && \
    echo "index.html size:" && \
    ls -lh dist/index.html && \
    echo "" && \
    echo "📊 Total files in dist:" && \
    find dist -type f | wc -l && \
    echo "" && \
    echo "✅ Build verification complete - ready to copy to final stage"

# Python backend stage
FROM python:3.11-slim

# Install system dependencies (ffmpeg required for audio conversion)
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt

# Copy built frontend from builder stage FIRST (before copying app code)
# This copies from /app/frontend-react/dist (in builder stage) to ./frontend-react-dist (in final stage)
RUN echo "🔍 About to copy frontend from builder stage..." && \
    echo "Source: /app/frontend-react/dist (in builder stage)" && \
    echo "Destination: ./frontend-react-dist (in final stage)"

COPY --from=frontend-builder /app/frontend-react/dist ./frontend-react-dist

# Immediately verify the copy worked
RUN echo "🔍 Immediately after COPY --from:" && \
    echo "Current directory: $(pwd)" && \
    echo "Working directory contents:" && \
    ls -la . | head -20 && \
    echo "" && \
    echo "Checking if frontend-react-dist exists:" && \
    test -d ./frontend-react-dist && \
    (echo "✅ frontend-react-dist EXISTS!" && \
     echo "Contents:" && \
     ls -la ./frontend-react-dist/ && \
     echo "index.html check:" && \
     test -f ./frontend-react-dist/index.html && echo "✅ index.html found" || echo "❌ index.html missing") || \
    (echo "❌ frontend-react-dist DOES NOT EXIST!" && \
     echo "Available directories:" && \
     ls -la . | grep -E "^d" && \
     exit 1)

# Copy application code (this will NOT overwrite frontend-react-dist because it's already there)
COPY . .

# Verify again after copying app code
RUN echo "🔍 After COPY . .:" && \
    echo "Checking if frontend-react-dist still exists:" && \
    test -d ./frontend-react-dist && echo "✅ frontend-react-dist STILL EXISTS" || echo "❌ frontend-react-dist WAS REMOVED" && \
    echo "Listing frontend-react-dist:" && \
    ls -la ./frontend-react-dist/ 2>&1 || echo "Cannot list frontend-react-dist"

# Verify frontend was copied correctly with detailed logging
RUN echo "🔍 Verifying frontend-react-dist:" && \
  echo "📁 Checking if directory exists:" && \
  test -d frontend-react-dist && echo "✓ Directory exists" || (echo "✗ Directory does NOT exist!" && exit 1) && \
  echo "" && \
  echo "📋 Listing directory contents:" && \
  ls -la frontend-react-dist/ && \
  echo "" && \
  echo "📄 Checking index.html:" && \
  test -f frontend-react-dist/index.html && \
  ls -lh frontend-react-dist/index.html && \
  echo "✓ index.html found" || \
  (echo "✗ index.html NOT found!" && exit 1) && \
  echo "" && \
  echo "📊 Directory structure (first 20 files):" && \
  find frontend-react-dist -type f | head -20 && \
  echo "" && \
  echo "✅ Frontend React build verified successfully!"

# Make start script executable
RUN chmod +x scripts/shell/start_render.sh

# Create temp directory
RUN mkdir -p /app/temp

# Expose port (Railway will set PORT environment variable)
EXPOSE ${PORT:-5000}

# Set Python to unbuffered mode for real-time logs
ENV PYTHONUNBUFFERED=1

# Use start script (handles cookies and starts app)
# Works on: Railway, Render, Fly.io, DigitalOcean, etc.
# Use explicit bash call for Railway compatibility
CMD ["/bin/bash", "scripts/shell/start_render.sh"]

