# 🚀 Quick Start - Deploy su Railway

## ✅ Pronto per il Deploy!

L'applicazione è completamente configurata per Railway. Basta seguire questi passaggi:

### 1. Push su GitHub

```bash
git add .
git commit -m "Add React frontend and Railway configuration"
git push origin main
```

### 2. Crea Progetto Railway

1. Vai su [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Seleziona il tuo repository

### 3. Configura Variabili

In Railway → **Variables**, aggiungi:

```
COOKIES_BASE64=<contenuto di cookies_base64.txt>
FLASK_ENV=production
TASK_TIMEOUT=1800
CLEANUP_INTERVAL=3600
LOG_LEVEL=INFO
```

**OPZIONALE** (solo se backend e frontend sono separati):
```
VITE_API_URL=https://tuo-backend.up.railway.app
```

### 4. Deploy Automatico

Railway:
- ✅ Builda automaticamente il frontend React
- ✅ Builda il backend Python
- ✅ Avvia tutto insieme

### 5. Fatto! 🎉

L'applicazione sarà disponibile su `https://tuo-progetto.up.railway.app`

## 📝 Note

- **Port**: Railway imposta automaticamente `PORT` - non aggiungerlo manualmente
- **Build Time**: Il primo build può richiedere 5-10 minuti
- **Frontend**: Viene buildato automaticamente durante il deploy
- **Routing**: React Router funziona automaticamente

## 🐛 Problemi?

Vedi `RAILWAY_DEPLOY.md` per troubleshooting dettagliato.

