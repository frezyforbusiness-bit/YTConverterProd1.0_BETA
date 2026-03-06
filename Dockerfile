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
  echo "Node version: $(node --version)" && \
  echo "NPM version: $(npm --version)" && \
  echo "Current directory: $(pwd)" && \
  echo "Files in current directory:" && \
  ls -la && \
  echo "" && \
  echo "Running npm run build..." && \
  npm run build 2>&1 | tee /tmp/build.log || (echo "❌ Frontend build failed! Build log:" && cat /tmp/build.log && exit 1) && \
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

# Try to copy built frontend from builder stage
# Note: If this fails, the build will continue and we'll build frontend in Python stage
RUN echo "🔍 Attempting to copy frontend from builder stage..." && \
  echo "Source: /app/frontend-react/dist (in builder stage)" && \
  echo "Destination: ./frontend-react-dist (in final stage)"

# Copy built frontend - if this fails silently, we'll detect it after COPY . .
COPY --from=frontend-builder /app/frontend-react/dist ./frontend-react-dist

# Copy application code
COPY . .

# Check if frontend-react-dist exists and has content, if not build it here
RUN echo "🔍 Checking frontend-react-dist after COPY operations..." && \
  if [ ! -d "./frontend-react-dist" ] || [ -z "$(ls -A ./frontend-react-dist 2>/dev/null)" ]; then \
    echo "⚠️  frontend-react-dist is missing or empty - building frontend in Python stage..." && \
    echo "Installing Node.js..." && \
    apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Checking frontend-react directory..." && \
    ls -la frontend-react/ | head -10 && \
    cd frontend-react && \
    echo "Installing dependencies..." && \
    npm ci --only=production=false && \
    echo "Building frontend..." && \
    npm run build && \
    echo "Verifying build..." && \
    ls -la dist/ && \
    test -f dist/index.html && echo "✅ Build successful!" || (echo "❌ Build failed - index.html missing" && exit 1) && \
    cd .. && \
    echo "Moving build to frontend-react-dist..." && \
    mv frontend-react/dist frontend-react-dist && \
    echo "✅ Frontend built successfully in Python stage" && \
    rm -rf frontend-react/node_modules frontend-react/.vite && \
    apt-get purge -y curl ca-certificates gnupg && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*; \
  else \
    echo "✅ Using frontend from builder stage" && \
    echo "Contents of frontend-react-dist:" && \
    ls -la ./frontend-react-dist/ | head -10; \
  fi

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

