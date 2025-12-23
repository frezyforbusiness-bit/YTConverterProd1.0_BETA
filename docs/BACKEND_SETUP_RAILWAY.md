# 🔧 Configurazione Backend su Railway

Guida rapida per configurare il backend con MySQL su Railway.

## ✅ Variabili d'Ambiente Obbligatorie

### 1. JWT_SECRET (OBBLIGATORIO)

**PERCHÉ**: Serve per firmare i token JWT dell'admin. Senza questo, l'autenticazione non è sicura!

**COME AGGIUNGERLO**:
1. Vai al servizio **Backend** su Railway
2. Vai in **Variables** 
3. Aggiungi nuova variabile:
   - **Name**: `JWT_SECRET`
   - **Value**: `n4iEylbG1gqq9QYGLpU25rFq-7CAnGynZWfN4qO66ww` (o genera uno nuovo)

**Generare un nuovo JWT_SECRET**:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 🔗 Variabili MySQL (Automatiche se MySQL è nello stesso progetto)

Se hai aggiunto MySQL nello **stesso progetto Railway**, Railway genera automaticamente:
- `MYSQL_URL` ← Il backend lo usa automaticamente!

**Non devi fare nulla!** Il backend si connette automaticamente.

---

### ⚠️ Se MySQL è in un progetto diverso:

Se MySQL è in un altro progetto Railway, devi copiare manualmente le variabili:

1. Vai al servizio **MySQL** → **Variables**
2. Copia questi valori:
   - `MYSQL_HOST`
   - `MYSQL_PORT` (solitamente `3306`)
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

3. Vai al servizio **Backend** → **Variables**
4. Aggiungi tutte le variabili copiate

---

## 📝 Variabili Opzionali (per creare admin automaticamente)

Se vuoi che l'admin venga creato automaticamente al deploy:

- `ADMIN_USERNAME` = `admin` (opzionale, default: `admin`)
- `ADMIN_PASSWORD` = `E&U1f!#IqPi&f$qX` (o una password sicura)

**OPPURE** (consigliato): Dopo il deploy, esegui:
```bash
python scripts/create_admin.py
```

Le credenziali verranno mostrate nell'output.

---

## 📋 Checklist Configurazione Backend

- [ ] ✅ **JWT_SECRET** aggiunto (OBBLIGATORIO!)
- [ ] ✅ MySQL nello stesso progetto Railway (o variabili MySQL copiate manualmente)
- [ ] ✅ Backend collegato al servizio MySQL (se non automatico)
- [ ] ⚠️ Opzionale: `ADMIN_USERNAME` e `ADMIN_PASSWORD` (o usa lo script dopo)

---

## 🔍 Come Verificare

1. **Deploy il backend**
2. **Controlla i log** - dovresti vedere:
   ```
   ✓ MySQL database and statistics initialized
   ```
3. **Se vedi errori MySQL** → controlla che le variabili siano configurate
4. **Se il database è vuoto** → le tabelle vengono create automaticamente all'avvio

---

## 🚀 Dopo la Configurazione

1. **Riavvia il backend** (se necessario)
2. **Verifica le tabelle** nel database MySQL
3. **Crea l'admin** (se non l'hai fatto con variabili):
   ```bash
   python scripts/create_admin.py
   ```
4. **Accedi a** `/admin` con le credenziali

---

## ❓ Troubleshooting

### "MySQL connection failed"
→ Controlla che `MYSQL_URL` o le variabili MySQL siano configurate

### "Statistics not available"
→ MySQL non è configurato o non è connesso

### "Invalid or expired token"
→ `JWT_SECRET` non è configurato correttamente

### Database vuoto dopo deploy
→ Riavvia il backend - le tabelle vengono create automaticamente

