# 🚂 Deploy su Railway con Docker Compose (Backend + Frontend)

Railway non supporta docker-compose direttamente, ma puoi deployare i due servizi separatamente.

## 📋 Setup Railway - Due Servizi

### 1. Crea il Progetto Railway

1. Vai su [railway.app](https://railway.app)
2. Crea un nuovo progetto
3. Seleziona "Empty Project"

### 2. Aggiungi Servizio Backend

1. Nel progetto Railway, clicca **"New"** → **"GitHub Repo"**
2. Seleziona il repository `YTConverter`
3. Railway rileverà automaticamente il `Dockerfile`
4. **Rinomina il servizio in `backend`** (importante per la comunicazione tra servizi)

**Configurazione Backend:**
- **Dockerfile**: `Dockerfile` (automatico)
- **Porta**: Railway imposta automaticamente `PORT` (interno 5000)
- **Variabili d'Ambiente** (da aggiungere):
  - `PORT=5000`
  - `FLASK_ENV=production`
  - `TASK_TIMEOUT=1800`
  - `CLEANUP_INTERVAL=3600`
  - `LOG_LEVEL=INFO`
  - `COOKIES_BASE64=<tue-cookie-base64>`

### 3. Aggiungi Servizio Frontend

1. Nel **stesso progetto Railway**, clicca **"New"** → **"GitHub Repo"**
2. Seleziona lo **stesso repository** `YTConverter`
3. **Rinomina il servizio in `frontend`**

**Configurazione Frontend:**
- **Dockerfile**: `Dockerfile.frontend`
- **Porta**: Railway imposta automaticamente `PORT` (nginx usa 80 internamente)
- **Genera un dominio pubblico per il backend** (necessario per la comunicazione):
  1. Vai al servizio backend → Settings → Generate Domain
  2. Railway genererà un URL tipo: `https://backend-production-xxxx.up.railway.app`
- **Variabili d'Ambiente** (da aggiungere):
  - `BACKEND_URL=https://backend-production-xxxx.up.railway.app` (usa l'URL generato per il backend)
  - `PORT=80`

**IMPORTANTE**: Su Railway, il modo più affidabile per far comunicare i servizi è usare gli URL pubblici.
Genera un dominio pubblico per il backend e usalo nella variabile `BACKEND_URL` del frontend.

### 4. Configura il Dominio Pubblico

1. Vai al servizio **Frontend** su Railway
2. Clicca su **"Settings"** → **"Generate Domain"**
3. Railway genererà un URL pubblico tipo: `https://frontend-production.up.railway.app`

Il backend non ha bisogno di un dominio pubblico (è accessibile solo internamente).

## 🔧 Configurazione Variabili d'Ambiente

### Backend Service

Aggiungi queste variabili nel servizio backend:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `FLASK_ENV` | `production` |
| `TASK_TIMEOUT` | `1800` |
| `CLEANUP_INTERVAL` | `3600` |
| `LOG_LEVEL` | `INFO` |
| `COOKIES_BASE64` | *(contenuto di cookies_base64.txt)* |

### Frontend Service

Aggiungi queste variabili nel servizio frontend:

| Key | Value |
|-----|-------|
| `BACKEND_URL` | `https://backend-production-xxxx.up.railway.app` (URL pubblico del backend - vedi sopra) |
| `PORT` | `80` |

## 🚀 Deploy

1. Railway rileverà automaticamente i cambiamenti nel repository
2. Farà il build di entrambi i servizi
3. Il frontend sarà disponibile sull'URL pubblico generato

## 🧪 Test

Dopo il deploy:

1. Vai all'URL pubblico del frontend
2. Verifica che il frontend carichi correttamente
3. Prova a convertire un video YouTube
4. Controlla i log su Railway per eventuali errori

## 📝 Note Importanti

- **BACKEND_URL**: Devi generare un dominio pubblico per il backend e usarlo come `BACKEND_URL` nel frontend
- **Rete Interna**: Railway supporta la comunicazione tra servizi tramite URL pubblici (consigliato) o tramite nome servizio
- **DNS Interno**: Se preferisci usare il nome del servizio, imposta `BACKEND_SERVICE_NAME=backend` invece di `BACKEND_URL`
- **Cookie**: Assicurati di aver aggiunto `COOKIES_BASE64` nel servizio backend

## 🔍 Troubleshooting

### Problema: Frontend non riesce a raggiungere il backend

**Soluzione**: 
1. Verifica che `BACKEND_URL` sia impostato correttamente con l'URL pubblico del backend
2. Assicurati di aver generato un dominio pubblico per il backend
3. Controlla i log del frontend per errori di connessione
4. Verifica che il backend sia in esecuzione e risponda alle richieste (controlla i log)

### Problema: 502 Bad Gateway o Timeout

**Soluzione**:
1. Verifica che il backend sia attivo e risponda a `https://backend-production-xxxx.up.railway.app/health`
2. Controlla che `BACKEND_URL` sia impostato correttamente nel frontend
3. Verifica che il backend ascolti sulla porta corretta (5000 internamente)
4. Assicurati che entrambi i servizi siano nello stesso progetto Railway

### Problema: Cookie non funzionano

**Soluzione**:
1. Verifica che `COOKIES_BASE64` sia impostato nel servizio backend
2. Controlla i log del backend per messaggi sui cookie

## 🌐 Alternative: Usa un Solo Servizio

Se preferisci un setup più semplice, puoi usare un solo servizio che serve sia frontend che backend.
In questo caso, usa il `Dockerfile` originale e configura Flask per servire anche il frontend (già configurato).

