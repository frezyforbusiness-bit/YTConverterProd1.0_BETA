#!/bin/bash
# Script di startup per Render.com
# Decodifica cookie Base64 se disponibili

# Handle large COOKIES_BASE64 environment variable safely
# Using printf instead of echo to avoid argument list issues
if [ -n "$COOKIES_BASE64" ]; then
    # Strip whitespace and decode base64
    printf '%s' "$COOKIES_BASE64" | tr -d '[:space:]' | base64 -d > /tmp/cookies.txt 2>/dev/null
    if [ $? -eq 0 ] && [ -s /tmp/cookies.txt ]; then
        # Ensure Unix line endings (LF instead of CRLF)
        sed -i 's/\r$//' /tmp/cookies.txt 2>/dev/null || true
        export COOKIES_FILE=/tmp/cookies.txt
        echo "Cookies loaded from COOKIES_BASE64 ($(wc -c < /tmp/cookies.txt) bytes)"
    else
        echo "Warning: Failed to decode COOKIES_BASE64, proceeding without cookies"
    fi
fi

exec python app.py

