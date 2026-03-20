# Guida Rapida: Configurazione Cookie YouTube

## Perché servono i cookie?

YouTube spesso blocca le richieste che sembrano provenire da bot. I cookie del browser aiutano a:
- Evitare errori "Sign in to confirm you're not a bot"
- Accedere a video che richiedono autenticazione
- Migliorare la stabilità dei download

## Setup Locale

### Se sei su WSL2 (Windows Subsystem for Linux)

I browser sono installati su Windows, non su Linux. **Devi installare Python su Windows** per estrarre i cookie.

#### ⚠️ IMPORTANTE: Installa Python su Windows

Vedi la guida completa: `INSTALLA_PYTHON_WINDOWS.md`

**Quick start:**
1. Scarica Python da: https://www.python.org/downloads/
2. Durante installazione: ✅ **"Add Python to PATH"**
3. Riapri PowerShell
4. Installa yt-dlp: `pip install yt-dlp`
5. Estrai cookie: `yt-dlp --cookies-from-browser firefox --cookies cookies.txt`

#### Metodo alternativo: Script PowerShell

#### Metodo 1: Script PowerShell (CONSIGLIATO per WSL)

1. Apri **PowerShell** su Windows (non WSL)
2. Vai nella directory del progetto:
   ```powershell
   cd \\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter
   ```
3. Esegui lo script PowerShell:
   ```powershell
   .\ESTRAI_COOKIE.ps1
   ```
4. Lo script creerà `cookies.txt` direttamente nella directory corretta

**Nota**: Se ottieni un errore di esecuzione policy, esegui prima:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Metodo 2: Installa yt-dlp e usa direttamente

1. Apri **PowerShell** su Windows
2. Installa yt-dlp:
   ```powershell
   pip install yt-dlp
   # oppure
   py -m pip install yt-dlp
   ```
3. Vai nella directory del progetto:
   ```powershell
   cd \\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter
   ```
4. Estrai i cookie:
   ```powershell
   yt-dlp --cookies-from-browser firefox --cookies cookies.txt
   ```

#### Metodo 2: Script Python

1. Apri **PowerShell** o **CMD** su Windows
2. Vai nella directory del progetto:
   ```powershell
   cd \\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter
   ```
3. Se Python è installato, prova:
   ```powershell
   py extract_cookies_windows.py firefox
   ```
   Oppure:
   ```powershell
   python extract_cookies_windows.py firefox
   ```

#### Metodo 2: Comando diretto

Esegui il comando da **Windows PowerShell o CMD**:

#### Opzione 1: Da Windows PowerShell/CMD

1. Apri **PowerShell** o **CMD** su Windows (non WSL)
2. Installa yt-dlp se necessario:
   ```powershell
   pip install yt-dlp
   ```
3. Vai in una directory temporanea (es: Desktop):
   ```powershell
   cd $env:USERPROFILE\Desktop
   ```
4. Estrai i cookie:
   ```powershell
   yt-dlp --cookies-from-browser firefox --cookies cookies.txt
   ```
5. Copia il file in WSL:
   ```powershell
   # Da Windows, copia in WSL
   copy cookies.txt \\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter\
   ```

#### Opzione 2: Usa lo script batch incluso

1. Apri **PowerShell** o **CMD** su Windows
2. Vai nella directory del progetto (accessibile da Windows):
   ```powershell
   cd \\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter
   ```
3. Esegui lo script:
   ```powershell
   .\extract_cookies_windows.bat
   ```

#### Opzione 3: Da WSL (se hai accesso al browser Windows)

Se yt-dlp può accedere ai cookie di Windows:
```bash
# Da WSL
cd /home/fpiumatti/myProjects/YTConverter
source venv/bin/activate
yt-dlp --cookies-from-browser firefox --cookies cookies.txt
```

### Se sei su Linux/macOS nativo

Esegui direttamente da terminale nella directory del progetto:
```bash
cd /home/fpiumatti/myProjects/YTConverter
yt-dlp --cookies-from-browser firefox --cookies cookies.txt
```

### 3. Verifica

Riavvia il server. Nei log dovresti vedere:
```
Cookies file found: /path/to/cookies.txt (XXXX bytes)
```

## Setup Render.com (Produzione)

### 1. Estrai i cookie (come sopra)

### 2. Converti in Base64

**Linux/macOS/WSL:**
```bash
base64 -w 0 cookies.txt > cookies_base64.txt
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cookies.txt")) | Out-File -Encoding ASCII cookies_base64.txt
```

### 3. Aggiungi su Render

1. Vai su Render Dashboard → Il tuo servizio → Environment
2. Aggiungi nuova variabile:
   - **Key**: `COOKIES_BASE64`
   - **Value**: Incolla il contenuto di `cookies_base64.txt`

### 4. Riavvia il servizio

Render leggerà automaticamente i cookie dalla variabile d'ambiente.

## Aggiornare i Cookie

I cookie scadono dopo qualche settimana. Per aggiornarli:

1. Estrai nuovi cookie: `yt-dlp --cookies-from-browser chrome --cookies cookies.txt`
2. **Locale**: Sostituisci il file `cookies.txt`
3. **Render**: Converti in Base64 e aggiorna la variabile `COOKIES_BASE64`

## Refresh automatico + deploy (consigliato)

Per evitare aggiornamenti manuali, usa gli script inclusi:

- Linux/macOS/WSL: `scripts/shell/refresh_cookies_and_deploy.sh`
- Windows: `scripts/windows/refresh_cookies_and_deploy.ps1`

Questi script fanno in automatico:

1. Estrazione cookie da browser (`--cookies-from-browser`)
2. Validazione minima (`Netscape header` + cookie YouTube/Google)
3. Conversione in Base64
4. Aggiornamento atomico di `COOKIES_BASE64` in `/opt/ytconverter/.env` sul server
5. Esecuzione release remoto (`/opt/ytconverter/scripts/shell/release_server.sh`)
6. Health check finale

### Esempio Linux/macOS/WSL

```bash
cd /home/fpiumatti/myProjects/YTConverter
./scripts/shell/refresh_cookies_and_deploy.sh
```

Con variabili custom:

```bash
BROWSER=firefox SERVER_HOST=89.167.90.22 SERVER_USER=root ./scripts/shell/refresh_cookies_and_deploy.sh
```

### Esempio Windows PowerShell

```powershell
cd \\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter
.\scripts\windows\refresh_cookies_and_deploy.ps1 -Browser chrome -ServerHost 89.167.90.22 -ServerUser root
```

## Scheduling

### Cron (Linux/macOS/WSL)

Esempio refresh ogni giorno alle 06:30:

```bash
crontab -e
```

Aggiungi:

```cron
30 6 * * * cd /home/fpiumatti/myProjects/YTConverter && /home/fpiumatti/myProjects/YTConverter/scripts/shell/refresh_cookies_and_deploy.sh >> /home/fpiumatti/myProjects/YTConverter/logs/cookie-refresh.log 2>&1
```

### Task Scheduler (Windows)

1. Crea nuova attività pianificata (giornaliera)
2. Programma/script: `powershell.exe`
3. Argomenti:
   `-ExecutionPolicy Bypass -File "\\wsl.localhost\Ubuntu\home\fpiumatti\myProjects\YTConverter\scripts\windows\refresh_cookies_and_deploy.ps1"`
4. Imposta "Run whether user is logged on or not" se necessario

## Troubleshooting rapido

- `Sign in to confirm you’re not a bot`: cookie scaduti o account non loggato nel browser sorgente
- `HTTP 400` con `--cookies`: formato newline non valido o file cookie corrotto
- `COOKIES_BASE64 not set` nei log server: update `.env` non riuscito
- `yt-dlp not found`: installa `yt-dlp` sulla macchina che esegue lo script di refresh

## Note

- I cookie sono opzionali ma **fortemente consigliati**
- Senza cookie, il sistema funziona ma può avere più errori di bot detection
- I cookie non vengono committati su Git (sono in `.gitignore`)

