# Alternative Hosting Platforms

Se Render.com ha IP bloccati da YouTube, ecco alternative che potrebbero funzionare meglio:

## 🚂 Railway.app (Consigliato)

**Vantaggi:**
- ✅ IP meno bloccati (nuova piattaforma)
- ✅ Setup simile a Render
- ✅ Free tier generoso
- ✅ Deploy automatico da Git

**Setup:**

1. Crea account su [Railway.app](https://railway.app)
2. Connetti repository GitHub
3. Railway rileverà automaticamente `railway.json`
4. Aggiungi variabile d'ambiente:
   - **Key**: `COOKIES_BASE64`
   - **Value**: Contenuto di `cookies_base64.txt`

**File necessari:**
- ✅ `railway.json` (già creato)
- ✅ `start_render.sh` (già presente)
- ✅ `Dockerfile` (opzionale, Railway può usare Nixpacks)

## 🪰 Fly.io

**Vantaggi:**
- ✅ IP dedicati per app
- ✅ Buona distribuzione geografica
- ✅ Free tier disponibile

**Setup:**

1. Installa Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Crea app: `fly launch` (rileva automaticamente `fly.toml`)
4. Aggiungi variabile: `fly secrets set COOKIES_BASE64="<contenuto>"`

**File necessari:**
- ✅ `fly.toml` (già creato)
- ✅ `Dockerfile` (già creato)

## ☁️ DigitalOcean App Platform

**Vantaggi:**
- ✅ IP dedicati
- ✅ Buone performance
- ✅ Facile setup

**Setup:**

1. Crea account su [DigitalOcean](https://www.digitalocean.com)
2. Vai su App Platform → Create App
3. Connetti repository GitHub
4. Configura:
   - **Build Command**: `apt-get update && apt-get install -y ffmpeg && pip install -r requirements.txt`
   - **Run Command**: `chmod +x start_render.sh && ./start_render.sh`
5. Aggiungi variabile `COOKIES_BASE64`

## 🖥️ VPS (DigitalOcean, Linode, Hetzner)

**Vantaggi:**
- ✅ IP dedicato (non condiviso)
- ✅ Controllo completo
- ✅ Costi bassi ($5-10/mese)

**Setup:**

1. Crea droplet/server VPS
2. Installa:
   ```bash
   sudo apt update
   sudo apt install -y python3 python3-pip ffmpeg nginx
   pip3 install -r requirements.txt
   ```
3. Clona repository
4. Configura systemd service o PM2
5. Aggiungi `COOKIES_BASE64` in `.env` o variabili d'ambiente

**Esempio systemd service** (`/etc/systemd/system/ytconverter.service`):
```ini
[Unit]
Description=YTConverter API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ytconverter
Environment="COOKIES_BASE64=<your-base64>"
Environment="PORT=5000"
ExecStart=/usr/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🔄 Comparazione

| Platform | IP Dedicato | Free Tier | Facile Setup | Costo |
|----------|-------------|-----------|--------------|-------|
| **Railway** | ❌ | ✅ | ✅✅✅ | $0-5/mese |
| **Fly.io** | ✅ | ✅ | ✅✅ | $0-5/mese |
| **DigitalOcean App** | ✅ | ❌ | ✅✅ | $5+/mese |
| **VPS** | ✅ | ❌ | ⚠️ | $5-10/mese |
| **Render** | ❌ | ✅ | ✅✅✅ | $0-7/mese |

## 🎯 Raccomandazione

1. **Prova prima Railway** - Setup identico a Render, IP potenzialmente meno bloccati
2. **Se non funziona, prova Fly.io** - IP dedicati, più controllo
3. **Ultima risorsa: VPS** - Massimo controllo, IP dedicato garantito

## 📝 Note Importanti

- **Cookie**: Funzionano su tutte le piattaforme (usa `COOKIES_BASE64`)
- **ffmpeg**: Deve essere installato su tutte (già configurato in Dockerfile/build commands)
- **Porta**: Ogni piattaforma usa una porta diversa (gestita automaticamente)
- **SSL**: Tutte le piattaforme forniscono SSL automatico

## 🚀 Quick Start Railway

```bash
# 1. Installa Railway CLI (opzionale)
npm i -g @railway/cli

# 2. Login
railway login

# 3. Crea nuovo progetto
railway init

# 4. Aggiungi variabili
railway variables set COOKIES_BASE64="<contenuto>"

# 5. Deploy
railway up
```

O semplicemente connetti il repository su Railway Dashboard e configura tutto via web!

