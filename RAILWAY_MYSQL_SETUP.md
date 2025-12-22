# 🚂 Setup MySQL su Railway - Guida Completa

Questa guida ti aiuta a configurare MySQL su Railway e collegarlo al backend YTConverter.

## 📋 Prerequisiti

- Account Railway attivo
- Progetto Railway con backend già deployato

## 🔧 Step 1: Aggiungere Servizio MySQL su Railway

1. **Vai al tuo progetto Railway**
   - Accedi a [railway.app](https://railway.app)
   - Apri il progetto che contiene il backend

2. **Aggiungi nuovo servizio MySQL**
   - Clicca su **"New"** nel tuo progetto
   - Seleziona **"Database"** → **"Add MySQL"**
   - Railway creerà automaticamente un nuovo servizio MySQL

3. **Railway genererà automaticamente le variabili d'ambiente**
   - `MYSQL_URL` - URL completo di connessione
   - Oppure variabili separate: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

## 🔗 Step 2: Collegare Backend a MySQL

1. **Vai al servizio Backend** nel tuo progetto Railway

2. **Aggiungi variabili d'ambiente** (se non già presenti):
   
   Se Railway ha generato `MYSQL_URL`, non serve altro. Il backend lo leggerà automaticamente.
   
   Altrimenti, se hai variabili separate, aggiungi:
   - `MYSQL_HOST` - dall'interfaccia MySQL di Railway
   - `MYSQL_PORT` - solitamente `3306`
   - `MYSQL_USER` - username MySQL
   - `MYSQL_PASSWORD` - password MySQL
   - `MYSQL_DATABASE` - nome database (default: `railway`)

3. **Aggiungi variabili per autenticazione admin**:
   - `JWT_SECRET` - Genera una stringa casuale sicura (es. `openssl rand -hex 32`)
   - `ADMIN_USERNAME` - Username per l'admin (default: `admin`)
   - `ADMIN_PASSWORD` - Password per l'admin (usa una password forte!)
   
   **OPPURE**: Dopo il deploy, esegui lo script `create_admin.py` per creare automaticamente un admin con credenziali casuali sicure.

   **⚠️ IMPORTANTE**: Il `JWT_SECRET` deve essere una stringa casuale e sicura. Genera una con:
   ```bash
   openssl rand -hex 32
   ```
   Oppure usa un generatore online di password casuali.

## 🗄️ Step 3: Inizializzazione Database

### Opzione A: Inizializzazione Automatica

Il database viene inizializzato automaticamente al primo avvio del backend se `MYSQL_URL` o le variabili MySQL sono configurate.

### Opzione B: Inizializzazione Manuale (se il database è vuoto)

Se hai già il database ma è vuoto (tabelle non create), puoi inizializzarlo manualmente:

1. **Connettiti al container Railway** (via Railway CLI o terminale web)

2. **Esegui lo script di inizializzazione**:
   ```bash
   python scripts/init_tables.py
   ```
   
   Questo crea le tabelle:
   - `conversions` - traccia le conversioni
   - `errors` - log degli errori
   - `admins` - utenti admin

3. **Crea l'utente admin**:
   ```bash
   python scripts/create_admin.py
   ```
   
   Le credenziali verranno mostrate nell'output - salvale!

### Cosa crea lo script:

- **Tabelle database** (conversions, errors, admins)
- **Indici** per performance
- **Foreign keys** per integrità referenziale

## 🔐 Step 4: Creare Utente Admin

Hai due opzioni:

### Opzione A: Variabili d'ambiente (consigliato per primo setup)

Imposta le variabili d'ambiente `ADMIN_USERNAME` e `ADMIN_PASSWORD` prima del deploy. L'admin verrà creato automaticamente all'avvio.

### Opzione B: Script automatico (consigliato per semplicità)

1. **Dopo il deploy**, connettiti al container Railway (o usa Railway CLI)
2. **Esegui lo script**:
   ```bash
   python scripts/create_admin.py
   ```
3. **Le credenziali verranno mostrate** nell'output - salvale subito!

## 🔐 Step 5: Accesso Admin Dashboard

1. **Deploy il backend** (se non già fatto)

2. **Accedi all'admin dashboard**:
   - URL: `https://your-backend-url.up.railway.app/admin`
   - Usa le credenziali create con lo script o impostate nelle variabili d'ambiente

3. **Dashboard disponibile**:
   - Statistiche generali
   - Grafici conversioni per formato e nel tempo
   - Tabelle conversioni recenti ed errori
   - Profilo admin

## 📊 Variabili d'Ambiente Complete

### Variabili MySQL (automatiche da Railway)
- `MYSQL_URL` - URL completo (formato: `mysql://user:pass@host:port/db`)
- Oppure variabili separate (se non presenti `MYSQL_URL`):
  - `MYSQL_HOST`
  - `MYSQL_PORT` (default: 3306)
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`

### Variabili Admin
- `JWT_SECRET` - **REQUIRED** - Secret key per JWT (genera una stringa casuale sicura)
  - **IMPORTANTE**: Senza questo, l'autenticazione non è sicura!
  - Genera una con: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
  - Oppure usa: `openssl rand -hex 32`
- `ADMIN_USERNAME` - Username admin default (default: `admin`) - Opzionale
- `ADMIN_PASSWORD` - Password admin default - Opzionale (puoi usare lo script `create_admin.py` invece)

### Variabili Opzionali
- `JWT_EXPIRATION_HOURS` - Durata token JWT in ore (default: 24)
- `MYSQL_POOL_SIZE` - Dimensione connection pool (default: 5)
- `MYSQL_MAX_OVERFLOW` - Max overflow connections (default: 10)

## 🔍 Verifica Setup

### Verifica connessione MySQL

1. **Controlla i log del backend** durante il deploy
2. Cerca i messaggi:
   - `✓ MySQL database and statistics initialized` - Connessione OK
   - `Failed to initialize MySQL` - Problema di connessione

### Verifica admin user

1. **Dopo il primo deploy**, controlla i log per:
   - `✓ Admin user 'admin' created successfully` - Admin creato
   - `Admin user 'admin' already exists` - Admin già presente

## 🐛 Troubleshooting

### Problema: "Failed to connect to MySQL"

**Soluzione**:
1. Verifica che il servizio MySQL sia attivo su Railway
2. Controlla che le variabili d'ambiente siano impostate correttamente
3. Verifica che il backend sia collegato al servizio MySQL nello stesso progetto Railway
4. Controlla che `MYSQL_URL` o le variabili separate siano corrette

### Problema: "Database initialization failed"

**Soluzione**:
1. Verifica i permessi dell'utente MySQL
2. Controlla che il database esista
3. Verifica i log MySQL su Railway per errori specifici

### Problema: "Admin user not found" al login

**Soluzione**:
1. Verifica che `ADMIN_USERNAME` e `ADMIN_PASSWORD` siano impostati, OPPURE
2. Esegui lo script per creare l'admin: `python scripts/create_admin.py`
3. Le credenziali verranno mostrate nell'output - salvale subito!
4. Se necessario, esegui manualmente `scripts/init_database.py` o ricrea l'admin

### Problema: "Invalid credentials" al login

**Soluzione**:
1. Verifica di usare esattamente `ADMIN_USERNAME` e `ADMIN_PASSWORD` impostati
2. La password è case-sensitive
3. Se hai perso la password, ricrea l'utente admin aggiornando le variabili e rifacendo il deploy

## 📝 Note Importanti

1. **Sicurezza**:
   - **NON** committare `JWT_SECRET` o password nel codice
   - Usa sempre variabili d'ambiente per credenziali
   - Cambia `JWT_SECRET` e password di default in produzione

2. **Backup**:
   - Railway fa backup automatici del database MySQL
   - Puoi fare backup manuali tramite l'interfaccia Railway

3. **Performance**:
   - Il connection pooling è configurato automaticamente
   - Per alta traffic, considera di aumentare `MYSQL_POOL_SIZE`

4. **Monitoring**:
   - Railway fornisce metriche del database MySQL
   - Monitora l'uso delle connessioni e lo spazio disco

## 🎯 Quick Start

1. Aggiungi MySQL come servizio nel progetto Railway
2. Aggiungi al backend: `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
3. Fai deploy del backend
4. Accedi a `/admin` e fai login

## 📚 Risorse

- [Railway MySQL Documentation](https://docs.railway.app/databases/mysql)
- [PyMySQL Documentation](https://pymysql.readthedocs.io/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

