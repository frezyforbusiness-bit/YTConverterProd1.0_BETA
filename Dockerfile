FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x start_render.sh

# Expose port (will be set by platform)
EXPOSE ${PORT:-5000}

# Use start script (handles cookies and starts app)
# Note: start_render.sh works on all platforms (Render, Railway, Fly.io, etc.)
CMD ["./start_render.sh"]

