# Struttura del Progetto

Questo documento descrive l'organizzazione del progetto YouTube Audio Converter.

## 📁 Struttura delle Cartelle

```
YTConverter/
├── 📄 README.md                    # Documentazione principale
├── 📄 requirements.txt             # Dipendenze Python
├── 📄 runtime.txt                  # Versione Python per deployment
│
├── 📁 domain/                      # Clean Architecture - Domain Layer
│   ├── entities/                   # Entità di business
│   ├── use_cases/                  # Use cases (logica applicativa)
│   └── repositories/               # Interfacce repository
│
├── 📁 adapter/                     # Clean Architecture - Adapter Layer
│   ├── controllers/                 # Controller Flask (routes HTTP)
│   ├── gateways/                   # Gateway per servizi esterni
│   └── repositories/               # Implementazioni repository (MySQL)
│
├── 📁 framework/                   # Clean Architecture - Framework Layer
│   └── web/                        # Flask app factory
│
├── 📁 services/                    # Servizi legacy (mantenuti per compatibilità)
│   ├── converter.py                # Convertitore YouTube
│   ├── database.py                 # Gestione database
│   ├── auth.py                     # Autenticazione
│   ├── task_manager.py              # Gestione task
│   └── statistics.py               # Statistiche
│
├── 📁 utils/                       # Utility
│   ├── logger.py                   # Logging
│   ├── validators.py               # Validazione
│   └── cleanup.py                  # Pulizia file temporanei
│
├── 📁 scripts/                     # Script vari
│   ├── shell/                      # Script per Linux/macOS
│   │   ├── start.sh
│   │   ├── start_render.sh
│   │   └── docker-entrypoint.sh
│   ├── windows/                    # Script per Windows
│   │   ├── extract_and_optimize_cookies.bat
│   │   ├── extract_and_optimize_cookies.ps1
│   │   └── extract_and_optimize_cookies.py
│   ├── init_database.py            # Inizializza database
│   ├── init_tables.py              # Crea tabelle
│   └── create_admin.py             # Crea admin
│
├── 📁 docs/                        # Documentazione
│   ├── ARCHITECTURE.md             # Documentazione Clean Architecture
│   ├── RAILWAY_*.md                # Guide Railway
│   ├── RENDER_*.md                 # Guide Render
│   └── ...                         # Altri documenti
│
├── 📁 config/                      # File di configurazione
│   ├── docker/                     # File Docker
│   │   ├── Dockerfile
│   │   ├── Dockerfile.frontend
│   │   └── docker-compose.yml
│   ├── deployment/                 # Configurazioni deployment
│   │   ├── railway.json
│   │   ├── render.yaml
│   │   ├── fly.toml
│   │   └── Procfile
│   ├── nginx.conf                  # Configurazione Nginx
│   └── nginx.conf.template         # Template Nginx
│
├── 📁 frontend/                    # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── admin.html
│   ├── style.css
│   └── ...
│
├── 📁 temp/                        # File temporanei (gitignored)
└── 📁 venv/                        # Virtual environment (gitignored)
```

## 🎯 Organizzazione per Tipo

### Codice Applicativo
- **domain/**: Logica di business pura (senza dipendenze esterne)
- **adapter/**: Adattatori per framework e servizi esterni
- **framework/**: Setup framework (Flask)
- **services/**: Servizi legacy (in fase di migrazione)

### Scripts
- **scripts/shell/**: Script per sistemi Unix/Linux/macOS
- **scripts/windows/**: Script per Windows
- **scripts/**: Script Python per database e amministrazione

### Documentazione
- **docs/**: Tutta la documentazione del progetto
- **README.md**: Documentazione principale (root)

### Configurazione
- **config/docker/**: File Docker e docker-compose
- **config/deployment/**: Configurazioni per varie piattaforme
- **config/**: File di configurazione server (nginx)

## 📝 Note

- I file nella root sono solo quelli essenziali per il funzionamento
- Tutti i file di documentazione sono in `docs/`
- Tutti gli script sono organizzati in `scripts/`
- Tutti i file di configurazione sono in `config/`
- La struttura segue i principi della Clean Architecture

## 🔄 Migrazione

Se stai migrando da una versione precedente:
- Gli script ora sono in `scripts/` invece della root
- La documentazione è in `docs/` invece della root
- I file Docker sono in `config/docker/` invece della root
- I file di configurazione deployment sono in `config/deployment/`


