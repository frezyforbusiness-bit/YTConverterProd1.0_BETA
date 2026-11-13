# Multi-stage build for Railway deployment
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend-react
COPY frontend-react/package.json frontend-react/package-lock.json ./
RUN npm ci
COPY frontend-react/ .

# Empty = relative API URLs (frontend and backend on same domain)
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---------------------------------------------------------------------------
FROM python:3.11-slim

# ffmpeg + native libs required by librosa / soundfile / numpy at runtime
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    ffmpeg \
    libgomp1 \
    libsndfile1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt

# App source first. frontend-react-dist is excluded via .dockerignore so the
# repo symlink cannot overwrite the real build output copied below.
COPY . .

# Built React assets from the Node stage (real directory, not the git symlink)
COPY --from=frontend-builder /app/frontend-react/dist ./frontend-react-dist

RUN test -f ./frontend-react-dist/index.html || (echo "ERROR: frontend-react-dist/index.html missing" && ls -la ./frontend-react-dist && exit 1)

RUN chmod +x scripts/shell/start_render.sh start_render.sh && mkdir -p /app/temp

# Railway injects PORT at runtime; EXPOSE is documentation only.
EXPOSE 5000

ENV PYTHONUNBUFFERED=1

CMD ["/bin/bash", "scripts/shell/start_render.sh"]
