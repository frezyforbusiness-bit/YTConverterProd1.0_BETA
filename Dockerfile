# Multi-stage build for Railway deployment
FROM node:20-alpine AS frontend-builder

# Build React frontend
WORKDIR /app/frontend-react
COPY frontend-react/package*.json ./
RUN npm ci --only=production=false
COPY frontend-react/ .

# Set VITE_API_URL for build (can be overridden at build time)
# If not set, will use default from api.ts (http://localhost:5000)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

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

# Copy application code
COPY . .

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend-react/dist ./frontend-react-dist

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

