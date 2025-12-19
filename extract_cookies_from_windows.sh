#!/bin/bash
# Script per estrarre cookie da Firefox Windows usando yt-dlp da WSL
# Accede ai cookie di Firefox installato su Windows

echo "============================================================"
echo "Estrazione Cookie YouTube da Firefox (Windows)"
echo "============================================================"
echo ""

# Attiva venv se esiste
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Percorsi possibili per Firefox su Windows (da WSL)
# WSL monta Windows in /mnt/c
WINDOWS_PROFILES=(
    "/mnt/c/Users/$USER/AppData/Roaming/Mozilla/Firefox/Profiles"
    "/mnt/c/Users/$USER/AppData/Local/Mozilla/Firefox/Profiles"
)

# Cerca il profilo Firefox
FIREFOX_PROFILE=""
for profile_dir in "${WINDOWS_PROFILES[@]}"; do
    if [ -d "$profile_dir" ]; then
        # Trova la prima cartella profilo
        PROFILE=$(find "$profile_dir" -maxdepth 1 -type d -name "*.default*" -o -name "*.default-release*" | head -1)
        if [ -n "$PROFILE" ]; then
            FIREFOX_PROFILE="$PROFILE"
            echo "[OK] Profilo Firefox trovato: $FIREFOX_PROFILE"
            break
        fi
    fi
done

if [ -z "$FIREFOX_PROFILE" ]; then
    echo "[ERRORE] Profilo Firefox non trovato su Windows"
    echo ""
    echo "Soluzioni alternative:"
    echo "1. Installa Python su Windows e usa lo script PowerShell"
    echo "2. Usa Chrome invece di Firefox"
    echo "3. Estrai manualmente i cookie (vedi documentazione)"
    exit 1
fi

# Prova a estrarre i cookie usando il percorso diretto
echo ""
echo "Tento estrazione usando percorso diretto..."
echo ""

# yt-dlp può accedere ai cookie di Windows Firefox se specifichiamo il percorso
# Ma yt-dlp di solito non supporta percorsi personalizzati per cookiesfrombrowser
# Quindi proviamo un approccio diverso: usiamo cookiefile se riusciamo a trovare cookies.sqlite

COOKIES_DB="$FIREFOX_PROFILE/cookies.sqlite"
if [ -f "$COOKIES_DB" ]; then
    echo "[OK] Database cookie trovato: $COOKIES_DB"
    echo ""
    echo "⚠️  yt-dlp non può leggere direttamente cookies.sqlite"
    echo "   Devi estrarre i cookie da Windows PowerShell"
    echo ""
    echo "Soluzione:"
    echo "1. Installa Python su Windows (da python.org)"
    echo "2. Installa yt-dlp: pip install yt-dlp"
    echo "3. Esegui: yt-dlp --cookies-from-browser firefox --cookies cookies.txt"
    echo ""
    exit 1
else
    echo "[INFO] Database cookie non trovato nel percorso standard"
    echo ""
    echo "Provo con yt-dlp standard (potrebbe non funzionare da WSL)..."
    
    # Prova comunque
    yt-dlp --cookies-from-browser firefox --cookies cookies.txt 2>&1
    
    if [ -f "cookies.txt" ]; then
        echo ""
        echo "============================================================"
        echo "[SUCCESSO] Cookie estratti!"
        echo "============================================================"
        echo ""
        echo "File: $(pwd)/cookies.txt"
        echo ""
        exit 0
    else
        echo ""
        echo "[ERRORE] Estrazione fallita"
        echo ""
        echo "Firefox su Windows non è accessibile da WSL."
        echo ""
        echo "SOLUZIONE: Installa Python su Windows"
        echo "1. Scarica Python da: https://www.python.org/downloads/"
        echo "2. Durante installazione, seleziona 'Add Python to PATH'"
        echo "3. Riapri PowerShell e esegui: pip install yt-dlp"
        echo "4. Poi: yt-dlp --cookies-from-browser firefox --cookies cookies.txt"
        echo ""
        exit 1
    fi
fi

