#!/bin/bash
# Script di startup universale per hosting cloud
# Supporta: Render.com, Railway.app, Fly.io, DigitalOcean, Heroku, etc.
# Gestisce completamente i cookie e avvia l'applicazione Python

# Disabilita buffering per vedere output in tempo reale
export PYTHONUNBUFFERED=1

# Non usare set -e perché i cookie sono opzionali e non devono bloccare l'avvio

echo "============================================================"
echo "🚀 Render Startup Script"
echo "============================================================"
echo ""

# ============================================================
# GESTIONE COOKIE
# ============================================================
COOKIES_FILE_PATH="/tmp/cookies.txt"

echo "📋 Cookie Configuration:"
echo "   Checking for COOKIES_BASE64..."

# Priorità: COOKIES_FILE > COOKIES_BASE64 > Nessun cookie
if [ -n "$COOKIES_FILE" ] && [ -f "$COOKIES_FILE" ]; then
    # COOKIES_FILE già impostato e file esiste
    echo "   ✅ COOKIES_FILE already set: $COOKIES_FILE"
    export COOKIES_FILE="$COOKIES_FILE"
    file_size=$(wc -c < "$COOKIES_FILE" 2>/dev/null || echo "0")
    echo "   ✅ Cookie file size: $file_size bytes"
    
elif [ -n "$COOKIES_BASE64" ]; then
    # Decodifica COOKIES_BASE64
    echo "   📥 COOKIES_BASE64 found (length: ${#COOKIES_BASE64} chars)"
    
    # Strip whitespace and decode base64
    printf '%s' "$COOKIES_BASE64" | tr -d '[:space:]' | base64 -d > "$COOKIES_FILE_PATH" 2>/dev/null
    decode_status=$?
    
    if [ $decode_status -eq 0 ] && [ -s "$COOKIES_FILE_PATH" ]; then
        # Ensure Unix line endings (LF instead of CRLF)
        sed -i 's/\r$//' "$COOKIES_FILE_PATH" 2>/dev/null || true
        
        # Verify Netscape format
        if head -n 1 "$COOKIES_FILE_PATH" | grep -q "^# Netscape"; then
            echo "   ✅ Cookie file format verified (Netscape)"
        else
            echo "   ⚠️  Warning: Cookie file may not be in Netscape format"
        fi
        
        # Count YouTube/Google cookies
        youtube_count=$(grep -c "youtube.com\|google.com" "$COOKIES_FILE_PATH" 2>/dev/null || echo "0")
        
        export COOKIES_FILE="$COOKIES_FILE_PATH"
        file_size=$(wc -c < "$COOKIES_FILE_PATH")
        
        echo "   ✅ Cookies decoded successfully"
        echo "   ✅ File: $COOKIES_FILE ($file_size bytes)"
        echo "   ✅ YouTube/Google cookies: $youtube_count"
        echo "   ✅ COOKIES_FILE exported: $COOKIES_FILE"
        
        # Verify file is readable
        if [ -f "$COOKIES_FILE" ] && [ -r "$COOKIES_FILE" ]; then
            echo "   ✅ Cookie file verified: exists and readable"
        else
            echo "   ❌ ERROR: Cookie file not accessible!"
            unset COOKIES_FILE
        fi
    else
        echo "   ❌ ERROR: Failed to decode COOKIES_BASE64 (status: $decode_status)"
        if [ -f "$COOKIES_FILE_PATH" ]; then
            echo "   ⚠️  File exists but is empty or invalid"
            rm -f "$COOKIES_FILE_PATH"
        else
            echo "   ⚠️  File was not created"
        fi
        unset COOKIES_FILE
    fi
else
    echo "   ⚠️  No cookies configured (COOKIES_BASE64 not set)"
    echo "   ℹ️  Proceeding without cookies - may encounter bot detection"
    unset COOKIES_FILE
fi

echo ""
echo "============================================================"
echo "🐍 Starting Python Application"
echo "============================================================"
echo ""

# Verifica che Python sia disponibile
if ! command -v python &> /dev/null; then
    echo "❌ ERROR: Python not found!"
    exit 1
fi

# Verifica che app.py esista
if [ ! -f "app.py" ]; then
    echo "❌ ERROR: app.py not found!"
    exit 1
fi

# Mostra configurazione finale
echo "📊 Final Configuration:"
echo "   Python: $(python --version 2>&1)"
echo "   Working directory: $(pwd)"
if [ -n "$COOKIES_FILE" ]; then
    echo "   Cookies: ✅ Enabled ($COOKIES_FILE)"
else
    echo "   Cookies: ❌ Disabled"
fi
echo ""

# Avvia l'applicazione
echo "🚀 Launching application..."
echo ""

# Verifica che tutto sia pronto
if [ ! -f "app.py" ]; then
    echo "❌ FATAL ERROR: app.py not found in $(pwd)"
    echo "   Current directory contents:"
    ls -la
    exit 1
fi

# Verifica che Python possa importare le dipendenze
echo "🔍 Verifying Python environment..."
if ! python -c "import flask; import yt_dlp; print('✅ All imports OK')" 2>&1; then
    echo "❌ ERROR: Python dependencies not available"
    echo "   Trying to install requirements..."
    pip install -r requirements.txt || {
        echo "❌ Failed to install requirements"
        exit 1
    }
fi

echo ""
echo "✅ All checks passed, starting Flask application..."
echo ""

# Avvia Python con output non buffered
# Usa exec per sostituire il processo shell con Python
# Questo mantiene il processo attivo e Railway può vedere i log
exec python -u app.py

