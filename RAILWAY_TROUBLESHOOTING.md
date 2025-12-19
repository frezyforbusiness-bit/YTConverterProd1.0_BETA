# 🔧 Railway Troubleshooting

## Errore: "There was an error deploying from source"

### Soluzione 1: Verifica Dockerfile nella root

Railway cerca il Dockerfile nella root del repository. Verifica che:
- ✅ `Dockerfile` esiste nella root (non in sottocartelle)
- ✅ Il file non ha estensioni (non `Dockerfile.txt`)
- ✅ Il file è committato su Git

### Soluzione 2: Rimuovi railway.json (Auto-detect)

Railway può rilevare automaticamente il Dockerfile. Prova a:

1. **Elimina** `railway.json` temporaneamente
2. Railway rileverà automaticamente:
   - Dockerfile nella root
   - Build automatico
   - CMD dal Dockerfile

### Soluzione 3: Verifica Build Context

Railway usa la root del repository come build context. Assicurati che:
- ✅ `requirements.txt` sia nella root
- ✅ `app.py` sia nella root
- ✅ `start_render.sh` sia nella root

### Soluzione 4: Usa Nixpacks (Alternativa)

Se Dockerfile non funziona, Railway può usare Nixpacks:

1. **Elimina** `railway.json`
2. Railway userà `nixpacks.toml` (se presente)
3. Oppure rileverà automaticamente Python e installerà dipendenze

### Soluzione 5: Verifica Logs Railway

Controlla i log di build su Railway Dashboard:
- Vai su **Deployments** → Clicca sul deploy fallito
- Guarda i log per vedere l'errore esatto

Errori comuni:
- `Dockerfile not found` → Verifica che sia nella root
- `COPY failed` → Verifica che i file esistano
- `RUN failed` → Errore durante installazione dipendenze

### Soluzione 6: Test Locale Docker

Testa il Dockerfile localmente:

```bash
docker build -t ytconverter .
docker run -p 5000:5000 ytconverter
```

Se funziona localmente ma non su Railway, potrebbe essere un problema di configurazione Railway.

### Soluzione 7: Configurazione Manuale Railway

Se l'auto-detect non funziona:

1. Railway Dashboard → **Settings** → **Build**
2. Seleziona **Dockerfile** come builder
3. Lascia **Dockerfile Path** vuoto (usa root)
4. Salva e riprova deploy

## Verifica File Necessari

Assicurati che questi file siano nella root:

```
✅ Dockerfile
✅ requirements.txt
✅ app.py
✅ start_render.sh
✅ railway.json (opzionale)
```

## Contatti

Se nessuna soluzione funziona:
1. Controlla i log completi su Railway
2. Verifica che il repository sia pubblico o che Railway abbia accesso
3. Prova a creare un nuovo progetto Railway da zero

