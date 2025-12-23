# Guida Rapida: Installa Python su Windows per estrarre cookie

## Perché serve Python su Windows?

Per estrarre i cookie da Firefox su Windows, serve yt-dlp che richiede Python.

## Installazione Python (5 minuti)

### 1. Scarica Python

Vai su: https://www.python.org/downloads/

Scarica l'ultima versione (Python 3.11 o 3.12)

### 2. Installa Python

**IMPORTANTE**: Durante l'installazione:
- ✅ Seleziona **"Add Python to PATH"** (in fondo alla finestra)
- ✅ Clicca "Install Now"

### 3. Verifica installazione

Apri un **NUOVO** PowerShell (chiudi e riapri) e esegui:

```powershell
python --version
```

Dovresti vedere la versione di Python.

### 4. Installa yt-dlp

```powershell
pip install yt-dlp
```

### 5. Estrai i cookie

Vai nella directory del progetto:
```powershell
cd \\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter
```

Estrai i cookie:
```powershell
yt-dlp --cookies-from-browser firefox --cookies cookies.txt
```

### 6. Verifica

Il file `cookies.txt` dovrebbe essere stato creato. Riavvia il server Flask.

## Alternativa: Usa Chrome

Se hai Chrome installato, potrebbe essere più semplice:

```powershell
yt-dlp --cookies-from-browser chrome --cookies cookies.txt
```

## Problemi comuni

### "python non è riconosciuto"
- Riapri PowerShell dopo l'installazione
- Verifica che "Add Python to PATH" sia stato selezionato
- Riavvia il computer se necessario

### "pip non è riconosciuto"
- Usa: `python -m pip install yt-dlp`
- Oppure: `py -m pip install yt-dlp`

