#!/bin/bash
# Script di startup per Render.com
# Decodifica cookie Base64 se disponibili

if [ -n "$COOKIES_BASE64" ]; then
    echo "$COOKIES_BASE64" | base64 -d > /tmp/cookies.txt
    export COOKIES_FILE=/tmp/cookies.txt
    echo "Cookies loaded from COOKIES_BASE64"
fi

python app.py

