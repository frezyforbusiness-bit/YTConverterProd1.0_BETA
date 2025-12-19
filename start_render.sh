#!/bin/bash
# Script di startup per Render.com
# Decodifica cookie Base64 se disponibili

echo "=== Render Startup Script ==="
echo "Checking for COOKIES_BASE64..."

# Handle large COOKIES_BASE64 environment variable safely
# Using printf instead of echo to avoid argument list issues
if [ -n "$COOKIES_BASE64" ]; then
    echo "COOKIES_BASE64 found (length: ${#COOKIES_BASE64} chars)"
    # Strip whitespace and decode base64
    printf '%s' "$COOKIES_BASE64" | tr -d '[:space:]' | base64 -d > /tmp/cookies.txt 2>/dev/null
    decode_status=$?
    
    if [ $decode_status -eq 0 ] && [ -s /tmp/cookies.txt ]; then
        # Ensure Unix line endings (LF instead of CRLF)
        sed -i 's/\r$//' /tmp/cookies.txt 2>/dev/null || true
        export COOKIES_FILE=/tmp/cookies.txt
        file_size=$(wc -c < /tmp/cookies.txt)
        echo "✅ Cookies loaded from COOKIES_BASE64 ($file_size bytes)"
        echo "✅ COOKIES_FILE set to: $COOKIES_FILE"
        # Verify file exists and is readable
        if [ -f "$COOKIES_FILE" ] && [ -r "$COOKIES_FILE" ]; then
            echo "✅ Cookie file verified: exists and readable"
        else
            echo "❌ ERROR: Cookie file not accessible!"
        fi
    else
        echo "❌ Warning: Failed to decode COOKIES_BASE64 (status: $decode_status)"
        if [ -f /tmp/cookies.txt ]; then
            echo "   File exists but is empty or invalid"
        else
            echo "   File was not created"
        fi
    fi
else
    echo "⚠️  COOKIES_BASE64 not set - proceeding without cookies"
fi

echo "Starting Python application..."
echo "================================"

exec python app.py

