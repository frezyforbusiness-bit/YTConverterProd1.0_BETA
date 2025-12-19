# 🚀 Railway Quick Start - Deploy Automatico

## ✅ Configurazione Completa

Il repository è già configurato per il deploy automatico su Railway. Basta collegare il repo!

## 📋 Step 1: Collega Repository

1. Vai su [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Seleziona il repository `YTConverterProd1.0_BETA`
4. Railway rileverà automaticamente:
   - ✅ `railway.json` → Usa Dockerfile
   - ✅ `Dockerfile` → Build automatico
   - ✅ `start_render.sh` → Avvio automatico

## 🔧 Step 2: Variabili d'Ambiente (Opzionali ma Consigliate)

Vai su **Variables** e aggiungi:

| Key | Value | Note |
|-----|-------|------|
| `COOKIES_BASE64` | *(vedi sotto)* | Cookie YouTube (Base64) |
| `FLASK_ENV` | `production` | Ambiente produzione |
| `TASK_TIMEOUT` | `1800` | Timeout task (30 min) |
| `CLEANUP_INTERVAL` | `3600` | Intervallo cleanup (1 ora) |
| `LOG_LEVEL` | `INFO` | Livello logging |

**NOTA**: `PORT` è impostato automaticamente da Railway - **NON aggiungerlo!**

### Come ottenere COOKIES_BASE64:

1. Esegui localmente: `python extract_and_optimize_cookies.py`
2. Apri `cookies_base64.txt`
3. Copia tutto il contenuto (una lunga stringa Base64)
4. Incolla in Railway → Variables → `COOKIES_BASE64`

## 🚀 Step 3: Deploy Automatico

Railway farà automaticamente:
- ✅ Build usando Dockerfile
- ✅ Installa ffmpeg e dipendenze
- ✅ Avvia con `start_render.sh`
- ✅ Gestisce cookie da `COOKIES_BASE64`

**NON serve configurare:**
- ❌ Start Command (usa CMD dal Dockerfile)
- ❌ Build Command (usa Dockerfile)
- ❌ Port (impostato automaticamente)

## ✅ Verifica Deploy

Nei log dovresti vedere:

```
🚀 Render Startup Script
============================================================
📋 Cookie Configuration:
   ✅ Cookies loaded from COOKIES_BASE64...
🐍 Starting Python Application
📊 Final Configuration:
   Cookies: ✅ Enabled
🚀 Launching application...
Server starting on http://0.0.0.0:XXXX
Ready to accept requests...
```

## 🔗 URL

Railway fornisce automaticamente un URL tipo:
- `https://ytconverter-production.up.railway.app`

Puoi configurare un dominio personalizzato in **Settings → Domains**.

## 📚 Documentazione Completa

Per dettagli, vedi [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)

