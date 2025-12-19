#!/bin/bash

# Script per avviare il server e aprire il frontend nel browser

echo "🚀 Avvio YouTube Audio Converter..."

# Controlla se Python è installato
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trovato. Installa Python 3.11+"
    exit 1
fi

# Controlla se ffmpeg è installato
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg non trovato. Assicurati che sia installato."
    echo "   Linux: sudo apt-get install ffmpeg"
    echo "   macOS: brew install ffmpeg"
    echo "   Windows: Scarica da https://ffmpeg.org/download.html"
    echo ""
    echo "Continuo comunque..."
fi

# Attiva virtual environment se esiste
if [ -d "venv" ]; then
    echo "📦 Attivazione virtual environment..."
    source venv/bin/activate
fi

# Installa dipendenze se necessario
if [ ! -d "venv" ] || [ ! -f "venv/bin/activate" ]; then
    echo "📦 Creazione virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📥 Installazione dipendenze..."
    pip install -r requirements.txt
fi

# Porta del server
PORT=${PORT:-5000}
URL="http://localhost:${PORT}"

echo ""
echo "🌐 Server in avvio su ${URL}..."
echo "📂 Frontend disponibile su ${URL}"
echo ""
echo "Premi Ctrl+C per fermare il server"
echo ""

# Avvia il server in background e cattura il PID
python3 app.py &
SERVER_PID=$!

# Aspetta che il server sia pronto
echo "⏳ Attendo che il server sia pronto..."
sleep 3

# Controlla se il server è in esecuzione
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server avviato con successo (PID: $SERVER_PID)"
    
    # Apre il browser
    echo "🌐 Apertura browser..."
    
    # Controlla se siamo in WSL
    if grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null; then
        # WSL: usa il browser di Windows
        if command -v cmd.exe &> /dev/null; then
            cmd.exe /c start "${URL}" 2>/dev/null &
            echo "✅ Browser aperto (Windows)"
        else
            echo "⚠️  Impossibile aprire il browser automaticamente in WSL."
            echo "   Apri manualmente: ${URL}"
        fi
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "${URL}" 2>/dev/null &
    elif command -v open &> /dev/null; then
        # macOS
        open "${URL}" 2>/dev/null &
    elif command -v start &> /dev/null; then
        # Windows (Git Bash)
        start "${URL}" 2>/dev/null &
    else
        echo "⚠️  Impossibile aprire il browser automaticamente."
        echo "   Apri manualmente: ${URL}"
    fi
    
    echo ""
    echo "✨ Pronto! Il server è in esecuzione."
    echo "   Frontend: ${URL}"
    echo "   API: ${URL}/api"
    echo ""
    echo "Per fermare il server, premi Ctrl+C"
    echo ""
    
    # Attende che il processo termini
    wait $SERVER_PID
else
    echo "❌ Errore: Il server non è riuscito ad avviarsi."
    exit 1
fi

