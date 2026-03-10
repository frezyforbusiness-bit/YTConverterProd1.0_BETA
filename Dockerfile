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

# Multi-stage build for Railway deployment
FROM node:20-alpine AS frontend-builder

# Build React frontend
WORKDIR /app/frontend-react
COPY frontend-react/package*.json ./
RUN npm ci --only=production=false
COPY frontend-react/ .

# Set VITE_API_URL for build (empty = relative URLs, same domain)
# In production, frontend and backend are on same domain, so use relative URLs
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend
RUN npm run build

# Python backend stage
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend-react/dist ./frontend-react-dist

# Copy application code
COPY . .

# If frontend-react-dist is missing or empty, build frontend in Python stage
RUN if [ ! -d "./frontend-react-dist" ] || [ -z "$(ls -A ./frontend-react-dist 2>/dev/null)" ]; then \
  apt-get update && \
  apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
  apt-get update && \
  apt-get install -y --no-install-recommends nodejs && \
  cd frontend-react && \
  npm ci --only=production=false && \
  npm run build && \
  cd .. && \
  mv frontend-react/dist frontend-react-dist && \
  rm -rf frontend-react/node_modules frontend-react/.vite && \
  apt-get purge -y curl ca-certificates gnupg && \
  apt-get autoremove -y && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*; \
  fi

# Make start script executable
RUN chmod +x scripts/shell/start_render.sh

# Create temp directory
RUN mkdir -p /app/temp

EXPOSE ${PORT:-5000}

ENV PYTHONUNBUFFERED=1

CMD ["/bin/bash", "scripts/shell/start_render.sh"]
