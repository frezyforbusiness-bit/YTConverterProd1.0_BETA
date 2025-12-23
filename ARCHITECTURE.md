# Clean Architecture - YouTube Audio Converter

Questo progetto è stato refactorizzato seguendo i principi della **Clean Architecture** di Robert C. Martin.

## Struttura del Progetto

```
YTConverter/
├── domain/                    # Enterprise & Application Business Rules
│   ├── entities/             # Entità di business (layer più interno)
│   │   ├── video.py
│   │   ├── conversion.py
│   │   ├── task.py
│   │   └── admin.py
│   ├── use_cases/            # Use Cases - Application Business Rules
│   │   ├── convert_video.py
│   │   ├── get_status.py
│   │   ├── download_file.py
│   │   ├── login_admin.py
│   │   └── get_statistics.py
│   └── repositories/         # Repository Interfaces
│       ├── conversion_repository.py
│       ├── admin_repository.py
│       └── statistics_repository.py
│
├── adapter/                  # Interface Adapters
│   ├── controllers/          # Controllers (Flask routes)
│   │   └── flask_controller.py
│   ├── gateways/             # Gateways (External services)
│   │   ├── youtube_gateway.py
│   │   ├── file_gateway.py
│   │   ├── audio_analyzer_gateway.py
│   │   ├── task_gateway.py
│   │   └── auth_gateway.py
│   └── repositories/         # Repository Implementations
│       ├── mysql_conversion_repository.py
│       ├── mysql_admin_repository.py
│       └── mysql_statistics_repository.py
│
├── framework/                # Frameworks & Drivers
│   └── web/
│       └── flask_app.py      # Flask app factory
│
├── services/                 # Legacy services (mantenuti per compatibilità)
│   ├── converter.py
│   ├── database.py
│   ├── auth.py
│   ├── task_manager.py
│   └── statistics.py
│
├── utils/                    # Utilities
│   ├── logger.py
│   ├── validators.py
│   └── cleanup.py
│
└── app.py                    # Entry point
```

## Layer della Clean Architecture

### 1. Entities (Domain Layer)
**Enterprise Business Rules** - Layer più interno

Le entità rappresentano gli oggetti di business puri, senza dipendenze da framework o librerie esterne.

- `Video`: Rappresenta un video YouTube con i suoi metadati
- `Conversion`: Rappresenta una conversione video-to-audio
- `Task`: Rappresenta un task di conversione con stato
- `Admin`: Rappresenta un utente amministratore

### 2. Use Cases (Domain Layer)
**Application Business Rules** - Secondo layer

I use cases contengono la logica di business specifica dell'applicazione.

- `ConvertVideoUseCase`: Gestisce la conversione di video YouTube in audio
- `GetStatusUseCase`: Recupera lo stato di un task
- `DownloadFileUseCase`: Gestisce il download di file convertiti
- `LoginAdminUseCase`: Gestisce l'autenticazione admin
- `GetStatisticsUseCase`: Recupera statistiche

### 3. Interface Adapters (Adapter Layer)
**Interface Adapters** - Terzo layer

Questo layer adatta i dati tra il domain e i framework esterni.

#### Controllers
- `FlaskController`: Gestisce le richieste HTTP e delega ai use cases

#### Gateways
- `YouTubeGateway`: Adatta le operazioni YouTube
- `FileGateway`: Adatta le operazioni sul file system
- `AudioAnalyzerGateway`: Adatta l'analisi audio
- `TaskGateway`: Adatta la gestione dei task
- `AuthGateway`: Adatta l'autenticazione

#### Repository Implementations
- `MySQLConversionRepository`: Implementazione MySQL per ConversionRepository
- `MySQLAdminRepository`: Implementazione MySQL per AdminRepository
- `MySQLStatisticsRepository`: Implementazione MySQL per StatisticsRepository

### 4. Frameworks & Drivers (Framework Layer)
**Frameworks & Drivers** - Layer più esterno

- `flask_app.py`: Factory per creare e configurare l'applicazione Flask

## Principi della Clean Architecture

### Dependency Rule
Le dipendenze puntano sempre verso l'interno:
- Framework → Adapter → Domain
- Le entità non dipendono da nulla
- I use cases dipendono solo dalle entità e dalle interfacce dei repository
- Gli adapter implementano le interfacce definite nel domain

### Independence
- **Framework Independence**: La logica di business non dipende da Flask
- **UI Independence**: La logica può essere usata con qualsiasi UI
- **Database Independence**: I repository sono interfacce, facilmente sostituibili
- **External Services Independence**: I gateway isolano i servizi esterni

## Flusso di una Richiesta

1. **HTTP Request** → Flask (Framework Layer)
2. **Flask Route** → FlaskController (Adapter Layer - Controller)
3. **Controller** → Use Case (Domain Layer)
4. **Use Case** → Gateway/Repository (Adapter Layer)
5. **Gateway** → Service/Framework (Framework Layer)
6. **Response** ← ritorna attraverso i layer

## Vantaggi della Clean Architecture

1. **Testabilità**: Ogni layer può essere testato indipendentemente
2. **Manutenibilità**: Modifiche a un layer non impattano gli altri
3. **Flessibilità**: Facile cambiare framework, database, o servizi esterni
4. **Scalabilità**: Facile aggiungere nuove funzionalità
5. **Separazione delle Responsabilità**: Ogni layer ha un ruolo chiaro

## Migrazione dal Codice Legacy

Il codice legacy in `services/` è stato mantenuto per compatibilità e viene usato dai gateway. Nel tempo, questi possono essere refactorizzati o sostituiti mantenendo le stesse interfacce.

## Note

- Il file `app_old.py` contiene la versione precedente per riferimento
- I test dovrebbero essere aggiunti per ogni layer
- La documentazione delle API rimane invariata

