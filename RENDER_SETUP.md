# Guida Deploy su Render.com

## Prerequisiti

1. Account Render.com
2. Repository Git (GitHub, GitLab, etc.)
3. ffmpeg installato (vedi sotto)

## Setup Base

### 1. Push del codice su Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Creare Web Service su Render

1. Vai su [Render Dashboard](https://dashboard.render.com)
2. Clicca "New +" → "Web Service"
3. Connetti il tuo repository
4. Configura:
   - **Name**: `ytconverter` (o il nome che preferisci)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Plan**: Free o Paid (consigliato Paid per più risorse)

### 3. Installare ffmpeg

Render non ha ffmpeg preinstallato. Hai due opzioni:

#### Opzione A: Buildpack (Consigliato)

Aggiungi un file `render.yaml` nella root del progetto:

```yaml
services:
  - type: web
    name: ytconverter
    env: python
    buildCommand: |
      apt-get update && apt-get install -y ffmpeg
      pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: PORT
        sync: false
      - key: FLASK_ENV
        value: production
      - key: TASK_TIMEOUT
        value: 1800
      - key: CLEANUP_INTERVAL
        value: 3600
      - key: LOG_LEVEL
        value: INFO
```

#### Opzione B: Dockerfile (Alternativa)

Crea un `Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run application
CMD ["python", "app.py"]
```

E un `render.yaml`:

```yaml
services:
  - type: web
    name: ytconverter
    dockerfilePath: ./Dockerfile
    envVars:
      - key: PORT
        sync: false
      - key: FLASK_ENV
        value: production
```

## Configurazione Cookie YouTube (Opzionale ma Consigliato)

I cookie aiutano a evitare errori di bot detection di YouTube. Su Render, devi fornirli tramite variabile d'ambiente.

### 1. Estrai i cookie dal tuo browser

**Su Windows (Chrome):**
```bash
yt-dlp --cookies-from-browser chrome --cookies cookies.txt
```

**Su Linux/macOS:**
```bash
yt-dlp --cookies-from-browser chrome --cookies cookies.txt
```

Questo crea un file `cookies.txt` nella directory corrente.

### 2. Converti in Base64 per Render

Render accetta variabili d'ambiente come stringhe. Converti il file cookie in Base64:

**Linux/macOS/WSL:**
```bash
base64 -w 0 cookies.txt > cookies_base64.txt
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cookies.txt")) | Out-File -Encoding ASCII cookies_base64.txt
```

### 3. Aggiungi variabile d'ambiente su Render

1. Vai su Render Dashboard → Il tuo servizio → Environment
2. Aggiungi nuova variabile:
   - **Key**: `COOKIES_BASE64`
   - **Value**: Incolla il contenuto di `cookies_base64.txt`

### 4. Modifica il codice per leggere cookie da Base64

Il codice è già configurato per leggere `COOKIES_FILE`, ma dobbiamo supportare anche Base64. 

**Nota**: Il codice attuale legge da file. Per usare Base64 su Render, puoi:

**Opzione 1**: Usare un script di startup che decodifica Base64

Crea `start_render.sh`:

```bash
#!/bin/bash
if [ -n "$COOKIES_BASE64" ]; then
    echo "$COOKIES_BASE64" | base64 -d > /tmp/cookies.txt
    export COOKIES_FILE=/tmp/cookies.txt
fi
python app.py
```

E modifica `Procfile`:
```
web: chmod +x start_render.sh && ./start_render.sh
```

**Opzione 2**: Modificare il converter per supportare Base64 direttamente (vedi sotto)

## Variabili d'Ambiente su Render

Configura queste variabili nel dashboard Render:

| Variabile | Valore | Descrizione |
|-----------|--------|-------------|
| `PORT` | (auto) | Porta (impostata automaticamente da Render) |
| `FLASK_ENV` | `production` | Ambiente Flask |
| `TASK_TIMEOUT` | `1800` | Timeout task in secondi (30 min) |
| `CLEANUP_INTERVAL` | `3600` | Intervallo cleanup in secondi (1 ora) |
| `LOG_LEVEL` | `INFO` | Livello di log |
| `COOKIES_BASE64` | (opzionale) | Cookie YouTube in Base64 |
| `TEMP_DIR` | `/tmp` | Directory file temporanei |

## Test del Deploy

1. Dopo il deploy, verifica:
   - `https://your-app.onrender.com/health` → dovrebbe ritornare `{"status": "ok"}`
   - `https://your-app.onrender.com/api` → dovrebbe mostrare gli endpoint API
   - `https://your-app.onrender.com/` → dovrebbe mostrare il frontend

2. Prova una conversione:
   - Apri il frontend
   - Inserisci un URL YouTube
   - Verifica che la conversione funzioni

## Troubleshooting

### Errore: "ffmpeg not found"
- Assicurati che ffmpeg sia installato nel build command o nel Dockerfile
- Verifica i log di build su Render

### Errore: "YouTube is blocking the request"
- Aggiungi i cookie YouTube tramite `COOKIES_BASE64`
- I cookie scadono dopo qualche settimana, aggiornali periodicamente

### Errore: "Task timeout"
- Aumenta `TASK_TIMEOUT` se i video sono molto lunghi
- Render Free ha limiti di tempo, considera un piano Paid

### Errore: "No downloadable formats available"
- YouTube potrebbe aver cambiato le API
- Prova ad aggiornare yt-dlp: `pip install --upgrade yt-dlp`
- Aggiungi cookie freschi

## Aggiornare i Cookie

I cookie YouTube scadono periodicamente. Per aggiornarli:

1. Estrai nuovi cookie: `yt-dlp --cookies-from-browser chrome --cookies cookies.txt`
2. Converti in Base64: `base64 -w 0 cookies.txt > cookies_base64.txt`
3. Aggiorna la variabile `COOKIES_BASE64` su Render Dashboard
4. Riavvia il servizio

## Note Importanti

- **Render Free**: Ha limiti di tempo (15 minuti di inattività), considera Paid per produzione
- **Cookie**: Non sono obbligatori ma aiutano molto. Il sistema funziona anche senza (usa client iOS/Android)
- **ffmpeg**: Obbligatorio, deve essere installato nel build
- **Timeout**: I video molto lunghi potrebbero superare i timeout, considera di aumentare `TASK_TIMEOUT`

