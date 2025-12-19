# 🚂 Setup Railway.app

## Configurazione Automatica

Railway rileva automaticamente:
- ✅ `railway.json` → Usa Dockerfile
- ✅ `Dockerfile` → Build automatico
- ✅ `start_render.sh` → Gestisce cookie e avvia app

## Setup Step-by-Step

### 1. Crea Account Railway

Vai su [railway.app](https://railway.app) e crea account (gratis con GitHub)

### 2. Crea Nuovo Progetto

1. Dashboard → **"New Project"**
2. **"Deploy from GitHub repo"**
3. Seleziona il repository `YTConverterProd1.0_BETA`
4. Railway rileverà automaticamente la configurazione

### 3. Configura Variabili d'Ambiente

Vai su **Variables** nel progetto Railway e aggiungi:

| Key | Value | Note |
|-----|-------|------|
| `COOKIES_BASE64` | *(vedi sotto)* | **IMPORTANTE** - Cookie YouTube |
| `FLASK_ENV` | `production` | Ambiente produzione |
| `TASK_TIMEOUT` | `1800` | 30 minuti |
| `CLEANUP_INTERVAL` | `3600` | 1 ora |
| `LOG_LEVEL` | `INFO` | Livello log |

**NOTA**: `PORT` è impostato automaticamente da Railway - **NON aggiungerlo manualmente!**

### 4. Aggiungi Cookie (COOKIES_BASE64)

1. Apri `cookies_base64.txt` localmente
2. Copia **tutto il contenuto** (una lunga stringa Base64)
3. In Railway → Variables → Add Variable:
   - **Key**: `COOKIES_BASE64`
   - **Value**: Incolla tutto il contenuto

### 5. Deploy

Railway farà automaticamente:
- ✅ Build usando Dockerfile
- ✅ Installa ffmpeg
- ✅ Installa dipendenze Python
- ✅ Avvia con `start_render.sh`

## ⚠️ IMPORTANTE: Start Command

**NON impostare manualmente lo Start Command su Railway!**

Railway userà automaticamente:
- Il `CMD` dal Dockerfile: `["./start_render.sh"]`
- Oppure il `startCommand` da `railway.json` (se presente)

Se imposti manualmente `chmod +x start_render.sh && ./start_render.sh`:
- ✅ Funziona, ma è ridondante
- ⚠️ Potrebbe sovrascrivere il CMD del Dockerfile

## Verifica Deploy

Dopo il deploy, nei log dovresti vedere:

```
🚀 Render Startup Script
============================================================
📋 Cookie Configuration:
   ✅ Cookies loaded from COOKIES_BASE64...
🐍 Starting Python Application
📊 Final Configuration:
   Cookies: ✅ Enabled
🚀 Launching application...
```

## Troubleshooting

### Problema: "Command not found: start_render.sh"
**Soluzione**: Assicurati che Railway usi Dockerfile (controlla `railway.json`)

### Problema: "ffmpeg not found"
**Soluzione**: Verifica che Dockerfile installi ffmpeg (già configurato)

### Problema: "Port already in use"
**Soluzione**: Railway imposta automaticamente PORT - non aggiungerlo manualmente

### Problema: Cookie non caricati
**Soluzione**: 
1. Verifica che `COOKIES_BASE64` sia impostato
2. Controlla i log di avvio per vedere se i cookie vengono decodificati

## Differenze con Render

| Feature | Render | Railway |
|---------|--------|---------|
| Start Command | Manuale in `render.yaml` | Automatico da Dockerfile |
| Build | `buildCommand` in yaml | Dockerfile |
| Port | Auto-set | Auto-set |
| Cookie | `COOKIES_BASE64` | `COOKIES_BASE64` |

## Costi

- **Free Tier**: $5 crediti/mese (sufficiente per test)
- **Pro**: $20/mese (per produzione)

## URL

Dopo il deploy, Railway fornisce un URL tipo:
- `https://ytconverter-production.up.railway.app`

Puoi anche configurare un dominio personalizzato.

