FROM python:3.11-slim

# Legacy v1 image: Flask backend + legacy HTML/CSS/JS frontend

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

# Copy application code (includes legacy frontend in /frontend)
COPY . .

# Make start script executable
RUN chmod +x scripts/shell/start_render.sh

# Create temp directory
RUN mkdir -p /app/temp

# Expose port (Railway will set PORT environment variable)
EXPOSE ${PORT:-5000}

# Set Python to unbuffered mode for real-time logs
ENV PYTHONUNBUFFERED=1

# Start legacy app
CMD ["/bin/bash", "scripts/shell/start_render.sh"]

