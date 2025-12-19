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
RUN chmod +x start_render.sh

# Create temp directory
RUN mkdir -p /app/temp

# Expose port (Railway will set PORT environment variable)
EXPOSE ${PORT:-5000}

# Use start script (handles cookies and starts app)
# Works on: Railway, Render, Fly.io, DigitalOcean, etc.
CMD ["./start_render.sh"]

