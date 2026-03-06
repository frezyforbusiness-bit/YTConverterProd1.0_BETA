# 🚂 Deploy su Railway - Guida Completa

## ✅ Cosa è già configurato

L'applicazione è già pronta per Railway con:
- ✅ Dockerfile multi-stage che builda il frontend React
- ✅ Flask serve automaticamente il frontend React buildato
- ✅ Supporto per React Router (SPA)
- ✅ Gestione variabili d'ambiente
- ✅ Script di avvio automatico

## 📋 Setup Step-by-Step

### 1. Prepara il Repository

Assicurati che il repository contenga:
- ✅ `Dockerfile` (nella root)
- ✅ `railway.json` (opzionale, per configurazione avanzata)
- ✅ `requirements.txt`
- ✅ `frontend-react/` con `package.json`

### 2. Crea Progetto su Railway

1. Vai su [railway.app](https://railway.app)
2. Clicca **"New Project"**
3. Seleziona **"Deploy from GitHub repo"**
4. Connetti il tuo repository GitHub
5. Railway rileverà automaticamente il Dockerfile

### 3. Configura Variabili d'Ambiente

Vai su **Variables** nel progetto Railway e aggiungi:

| Key | Value | Note |
|-----|-------|------|
| `COOKIES_BASE64` | *(vedi sotto)* | **IMPORTANTE** - Cookie YouTube |
| `FLASK_ENV` | `production` | Ambiente produzione |
| `TASK_TIMEOUT` | `1800` | 30 minuti |
| `CLEANUP_INTERVAL` | `3600` | 1 ora |
| `LOG_LEVEL` | `INFO` | Livello log |
| `VITE_API_URL` | *(vedi sotto)* | URL API per frontend React |

**NOTA**: `PORT` è impostato automaticamente da Railway - **NON aggiungerlo manualmente!**

#### Variabile `VITE_API_URL`

Per il frontend React, devi impostare `VITE_API_URL` con l'URL del tuo backend Railway:

- Se backend e frontend sono nello stesso servizio: `VITE_API_URL` può essere omessa (usa URL relativo)
- Se backend è separato: `VITE_API_URL=https://tuo-backend.up.railway.app`

**IMPORTANTE**: La variabile `VITE_API_URL` deve essere impostata **PRIMA** del build del frontend nel Dockerfile. Il Dockerfile già gestisce questo correttamente.

#### Variabile `COOKIES_BASE64`

1. Apri `cookies_base64.txt` localmente
2. Copia **tutto il contenuto** (una lunga stringa Base64)
3. In Railway → Variables → Add Variable:
   - **Key**: `COOKIES_BASE64`
   - **Value**: Incolla tutto il contenuto

### 4. Deploy

Railway farà automaticamente:
- ✅ Build del frontend React (stage 1: Node.js)
- ✅ Build del backend Python (stage 2: Python)
- ✅ Copia del frontend buildato nella directory corretta
- ✅ Installazione di ffmpeg
- ✅ Installazione dipendenze Python
- ✅ Avvio con `start_render.sh`

### 5. Verifica Deploy

Dopo il deploy, nei log dovresti vedere:

```
🔨 Building React frontend...
📦 Installing dependencies...
🏗️  Building production bundle...
✅ Frontend build completed!
🐍 Starting Python Application
📊 Final Configuration:
   Cookies: ✅ Enabled
🚀 Launching application...
Server starting on http://0.0.0.0:XXXX
```

## 🔧 Come Funziona

### Build Multi-Stage

Il Dockerfile usa un build multi-stage:

1. **Stage 1 (frontend-builder)**: 
   - Usa Node.js per buildare il frontend React
   - Output in `/app/frontend-react/dist`

2. **Stage 2 (backend)**:
   - Usa Python per il backend Flask
   - Copia il frontend buildato in `frontend-react-dist/`
   - Flask serve automaticamente il frontend React

### Routing React Router

Flask è configurato per supportare React Router:
- Tutte le route (`/`, `/converter`, `/mixmaster`, `/admin`) servono `index.html`
- Gli asset statici (JS, CSS) sono serviti normalmente
- Le route API (`/api/*`) sono gestite separatamente

### Variabili d'Ambiente Frontend

Il frontend React legge `VITE_API_URL` da:
- Variabile d'ambiente durante il build (nel Dockerfile)
- Fallback a `http://localhost:5000` se non impostata

## 🐛 Troubleshooting

### Problema: Frontend non si carica

**Soluzione**: 
1. Verifica che il build del frontend sia completato nei log
2. Controlla che `frontend-react-dist/` contenga i file buildati
3. Verifica che Flask stia servendo dalla directory corretta

### Problema: "Cannot GET /converter" o altre route React

**Soluzione**: 
- Verifica che le route React Router siano configurate in `flask_controller.py`
- Controlla che `index.html` sia servito per tutte le route SPA

### Problema: API non funziona

**Soluzione**:
1. Verifica che `VITE_API_URL` sia impostata correttamente
2. Controlla i log del backend per errori CORS
3. Verifica che le route API inizino con `/api/`

### Problema: Build fallisce

**Soluzione**:
1. Controlla i log del build per errori Node.js o Python
2. Verifica che `package.json` e `requirements.txt` siano corretti
3. Assicurati che tutte le dipendenze siano specificate

## 📝 Note Importanti

1. **Build Time**: Il build può richiedere 5-10 minuti a causa del build del frontend React
2. **Cache**: Railway cachea i layer Docker, quindi rebuild successivi sono più veloci
3. **Port**: Railway imposta automaticamente `PORT` - non sovrascriverlo
4. **Frontend Build**: Il frontend viene buildato durante il deploy, non serve buildarlo manualmente

## 🔄 Aggiornamenti

Per aggiornare l'applicazione:
1. Push delle modifiche su GitHub
2. Railway rileva automaticamente i cambiamenti
3. Avvia un nuovo deploy
4. Il build include automaticamente il frontend React aggiornato

## 💰 Costi

- **Free Tier**: $5 crediti/mese (sufficiente per test)
- **Pro**: $20/mese (per produzione)

## 🌐 URL

Dopo il deploy, Railway fornisce un URL tipo:
- `https://ytconverter-production.up.railway.app`

Puoi anche configurare un dominio personalizzato nelle impostazioni del progetto.

