#!/bin/bash
# Startup script for cloud hosts (Railway, Render, Fly, etc.).
# Keep this fast: Railway returns 502 until the process listens on $PORT.

export PYTHONUNBUFFERED=1

echo "============================================================"
echo "Startup"
echo "============================================================"

COOKIES_FILE_PATH="/tmp/cookies.txt"

echo "Cookie configuration:"
if [ -n "$COOKIES_FILE" ] && [ -f "$COOKIES_FILE" ]; then
    export COOKIES_FILE="$COOKIES_FILE"
    echo "  COOKIES_FILE: $COOKIES_FILE ($(wc -c < "$COOKIES_FILE") bytes)"
elif [ -n "$COOKIES_BASE64" ]; then
    echo "  Decoding COOKIES_BASE64 (${#COOKIES_BASE64} chars)"
    if printf '%s' "$COOKIES_BASE64" | tr -d '[:space:]' | base64 -d > "$COOKIES_FILE_PATH" 2>/dev/null \
        && [ -s "$COOKIES_FILE_PATH" ]; then
        sed -i 's/\r$//' "$COOKIES_FILE_PATH" 2>/dev/null || true
        export COOKIES_FILE="$COOKIES_FILE_PATH"
        echo "  Cookies ready: $COOKIES_FILE ($(wc -c < "$COOKIES_FILE_PATH") bytes)"
    else
        echo "  Failed to decode COOKIES_BASE64; continuing without cookies"
        rm -f "$COOKIES_FILE_PATH"
        unset COOKIES_FILE
    fi
else
    echo "  No cookies configured; continuing without cookies"
    unset COOKIES_FILE
fi

if ! command -v python >/dev/null 2>&1; then
    echo "ERROR: python not found"
    exit 1
fi

if [ ! -f "app.py" ]; then
    echo "ERROR: app.py not found in $(pwd)"
    ls -la
    exit 1
fi

echo "Python: $(python --version 2>&1)"
echo "PORT: ${PORT:-5000}"
echo "Working directory: $(pwd)"

# Fail fast with a clear message if native audio deps are missing.
if ! python -c "import flask; import librosa; import soundfile; print('imports ok')" 2>&1; then
    echo "ERROR: required Python packages failed to import"
    exit 1
fi

# Optional DB bootstrap. Never block app start on DB failure.
if [ -n "$MYSQL_URL" ] || [ -n "$MYSQL_HOST" ] || [ -n "$DATABASE_URL" ]; then
    echo "Initializing MySQL schema (best-effort)..."
    python scripts/init_database.py || echo "WARNING: database init failed; continuing without DB"
fi

echo "Starting Flask on 0.0.0.0:${PORT:-5000}"
exec python -u app.py
