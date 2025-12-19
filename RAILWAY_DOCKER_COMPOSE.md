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
- **Variabili d'Ambiente** (da aggiungere):
  - `BACKEND_SERVICE_NAME=backend` (nome del servizio backend su Railway)
  - `PORT=80`

**IMPORTANTE**: Railway usa il nome del servizio per la risoluzione DNS interna. 
Se il servizio backend si chiama `backend`, il frontend può raggiungerlo via `http://backend:5000`.

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
| `BACKEND_SERVICE_NAME` | `backend` (deve corrispondere al nome del servizio backend) |
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

- **Nome Servizi**: I nomi dei servizi su Railway devono corrispondere alla variabile `BACKEND_SERVICE_NAME` nel frontend
- **Rete Interna**: Railway mette automaticamente i servizi nella stessa rete interna
- **DNS Interno**: I servizi possono comunicare usando `http://<nome-servizio>:<porta>`
- **Cookie**: Assicurati di aver aggiunto `COOKIES_BASE64` nel servizio backend

## 🔍 Troubleshooting

### Problema: Frontend non riesce a raggiungere il backend

**Soluzione**: 
1. Verifica che il nome del servizio backend corrisponda a `BACKEND_SERVICE_NAME`
2. Controlla i log del frontend per errori di connessione
3. Verifica che il backend sia in esecuzione (controlla i log)

### Problema: 502 Bad Gateway

**Soluzione**:
1. Verifica che il backend sia attivo
2. Controlla che il backend ascolti sulla porta corretta (5000)
3. Verifica la variabile `BACKEND_SERVICE_NAME` nel frontend

### Problema: Cookie non funzionano

**Soluzione**:
1. Verifica che `COOKIES_BASE64` sia impostato nel servizio backend
2. Controlla i log del backend per messaggi sui cookie

## 🌐 Alternative: Usa un Solo Servizio

Se preferisci un setup più semplice, puoi usare un solo servizio che serve sia frontend che backend.
In questo caso, usa il `Dockerfile` originale e configura Flask per servire anche il frontend (già configurato).

