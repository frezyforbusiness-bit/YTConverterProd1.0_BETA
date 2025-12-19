# 🚀 Guida Rapida: Deploy su Render.com

## ✅ Checklist Pre-Deploy

- [x] Repository Git configurato
- [x] Cookie convertiti in Base64 (`cookies_base64.txt` creato)
- [x] `render.yaml` configurato
- [x] `Procfile` presente
- [x] `runtime.txt` presente
- [x] Codice supporta `COOKIES_BASE64`

## 📋 Passi per il Deploy

### 1. Push del codice su GitHub

```bash
# Assicurati che tutto sia committato
git add .
git commit -m "Ready for Render deployment"
git push origin master
```

### 2. Crea servizio su Render

1. Vai su [Render Dashboard](https://dashboard.render.com)
2. Clicca **"New +"** → **"Blueprint"** (se hai `render.yaml`) oppure **"Web Service"**
3. Connetti il tuo repository GitHub
4. Render rileverà automaticamente `render.yaml` e configurerà tutto

**Oppure configura manualmente:**
- **Name**: `ytconverter` (o nome a scelta)
- **Environment**: `Python 3`
- **Build Command**: 
  ```bash
  apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
  pip install -r requirements.txt
  ```
- **Start Command**: `python app.py`
- **Plan**: Free (per test) o Paid (per produzione)

### 3. Configura Variabili d'Ambiente

Vai su **Environment** nel dashboard Render e aggiungi:

| Key | Value | Note |
|-----|-------|------|
| `PORT` | (auto) | Render lo imposta automaticamente |
| `FLASK_ENV` | `production` | Ambiente produzione |
| `TASK_TIMEOUT` | `1800` | 30 minuti |
| `CLEANUP_INTERVAL` | `3600` | 1 ora |
| `LOG_LEVEL` | `INFO` | Livello log |
| `COOKIES_BASE64` | *(vedi sotto)* | **IMPORTANTE per evitare bot detection** |

#### Aggiungi Cookie (COOKIES_BASE64)

1. Apri il file `cookies_base64.txt` (già creato)
2. Copia **tutto il contenuto** (è una lunga stringa Base64)
3. Nel dashboard Render, aggiungi variabile:
   - **Key**: `COOKIES_BASE64`
   - **Value**: Incolla tutto il contenuto di `cookies_base64.txt`

### 4. Deploy

1. Clicca **"Save Changes"**
2. Render inizierà automaticamente il build
3. Attendi che il deploy completi (5-10 minuti)

## 🧪 Test del Deploy

Dopo il deploy, verifica:

1. **Health Check**:
   ```
   https://your-app.onrender.com/health
   ```
   Dovrebbe ritornare: `{"status": "ok"}`

2. **API Info**:
   ```
   https://your-app.onrender.com/api
   ```
   Dovrebbe mostrare gli endpoint disponibili

3. **Frontend**:
   ```
   https://your-app.onrender.com/
   ```
   Dovrebbe mostrare l'interfaccia web

4. **Test Conversione**:
   - Apri il frontend
   - Inserisci un URL YouTube
   - Verifica che la conversione funzioni

## 📝 Verifica Log

Nei log di Render dovresti vedere:

```
Cookies loaded from COOKIES_BASE64 environment variable
Cookies file found: /tmp/cookies.txt (XXXX bytes)
✓ ffmpeg found
Server starting on http://0.0.0.0:XXXX
```

## ⚠️ Note Importanti

### Render Free Plan
- **Timeout**: 15 minuti di inattività → servizio si ferma
- **Risorse**: Limitato, potrebbe essere lento per video lunghi
- **Consiglio**: Usa per test, considera Paid per produzione

### Cookie
- I cookie scadono dopo qualche settimana
- Se vedi errori "bot detection", aggiorna i cookie:
  1. Estrai nuovi: `yt-dlp --cookies-from-browser firefox --cookies cookies.txt`
  2. Converti: `base64 -w 0 cookies.txt > cookies_base64.txt`
  3. Aggiorna `COOKIES_BASE64` su Render
  4. Riavvia il servizio

### ffmpeg
- È installato automaticamente nel build command
- Se vedi errori "ffmpeg not found", verifica i log di build

## 🔧 Troubleshooting

### Errore: "ffmpeg not found"
- Verifica che il build command includa: `apt-get install -y ffmpeg`
- Controlla i log di build su Render

### Errore: "YouTube is blocking the request"
- Aggiungi/aggiorna `COOKIES_BASE64`
- I cookie potrebbero essere scaduti

### Errore: "Task timeout"
- Aumenta `TASK_TIMEOUT` (es: 3600 per 1 ora)
- Render Free ha limiti, considera Paid plan

### Servizio si ferma dopo 15 minuti
- Comportamento normale su Render Free
- Il servizio si riavvia automaticamente alla prima richiesta
- Considera Paid plan per servizio sempre attivo

## 🎉 Fatto!

Il tuo servizio è live su Render! 

**URL**: `https://your-app.onrender.com`

Ricorda di aggiornare i cookie periodicamente per evitare problemi con YouTube.

