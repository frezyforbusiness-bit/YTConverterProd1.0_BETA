# Configurazione

Questa cartella contiene tutti i file di configurazione del progetto.

## Struttura

### `docker/`
File Docker e containerizzazione:
- **Dockerfile** - Immagine Docker per l'applicazione
- **Dockerfile.frontend** - Immagine Docker per il frontend
- **docker-compose.yml** - Compose file per sviluppo locale

### `deployment/`
File di configurazione per deployment su varie piattaforme:
- **railway.json** - Configurazione Railway
- **render.yaml** - Configurazione Render
- **fly.toml** - Configurazione Fly.io
- **nixpacks.toml** - Configurazione Nixpacks
- **Procfile** - Process file per Heroku/Render

### Root `config/`
File di configurazione server:
- **nginx.conf** - Configurazione Nginx
- **nginx.conf.template** - Template configurazione Nginx

## Note

I file di configurazione sono organizzati per tipo e piattaforma per facilitare la manutenzione e il deployment.


