# Scripts

Questa cartella contiene tutti gli script del progetto.

## Struttura

### `shell/`
Script per sistemi Unix/Linux/macOS:
- **start.sh** - Avvia il server Flask
- **start_render.sh** - Script per avviare su Render
- **docker-entrypoint.sh** - Entrypoint per container Docker

### `windows/`
Script per Windows:
- **extract_and_optimize_cookies.bat** - Estrae e ottimizza cookie YouTube (Batch)
- **extract_and_optimize_cookies.ps1** - Estrae e ottimizza cookie YouTube (PowerShell)
- **extract_and_optimize_cookies.py** - Script Python per estrazione cookie

### Root `scripts/`
Script Python per database e amministrazione:
- **init_database.py** - Inizializza il database
- **init_tables.py** - Crea le tabelle del database
- **create_admin.py** - Crea un utente amministratore

## Utilizzo

### Estrazione Cookie (Windows)
```bash
# Batch
scripts\windows\extract_and_optimize_cookies.bat

# PowerShell
.\scripts\windows\extract_and_optimize_cookies.ps1
```

### Avvio Server (Linux/macOS)
```bash
./scripts/shell/start.sh
```

### Setup Database
```bash
python scripts/init_database.py
python scripts/create_admin.py
```


