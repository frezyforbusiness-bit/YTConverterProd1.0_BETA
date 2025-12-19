# Script PowerShell per estrarre e ottimizzare cookie YouTube su Windows
# Funziona anche se Python non è nel PATH

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Estrazione e Ottimizzazione Cookie YouTube" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Prova a trovare Python
$pythonCmd = $null

# Prova python
try {
    $null = Get-Command python -ErrorAction Stop
    $pythonCmd = "python"
    Write-Host "[OK] Python trovato" -ForegroundColor Green
} catch {
    # Prova py
    try {
        $null = Get-Command py -ErrorAction Stop
        $pythonCmd = "py"
        Write-Host "[OK] Python launcher (py) trovato" -ForegroundColor Green
    } catch {
        # Prova percorsi comuni
        $commonPaths = @(
            "C:\Python311\python.exe",
            "C:\Python312\python.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
        )
        
        foreach ($path in $commonPaths) {
            if (Test-Path $path) {
                $pythonCmd = $path
                Write-Host "[OK] Python trovato: $path" -ForegroundColor Green
                break
            }
        }
    }
}

if (-not $pythonCmd) {
    Write-Host "[ERRORE] Python non trovato!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installa Python da: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Durante installazione: seleziona 'Add Python to PATH'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Premi INVIO per uscire"
    exit 1
}

Write-Host ""
Write-Host "Eseguo script Python..." -ForegroundColor Cyan
Write-Host ""

# Esegui lo script
try {
    & $pythonCmd extract_and_optimize_cookies.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "[SUCCESSO] Cookie estratti e ottimizzati!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "File generati:" -ForegroundColor Yellow
        Write-Host "  - cookies.txt (cookie ottimizzati)" -ForegroundColor White
        Write-Host "  - cookies_base64.txt (per Render)" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[ERRORE] Estrazione/ottimizzazione fallita" -ForegroundColor Red
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "[ERRORE] Errore durante esecuzione: $_" -ForegroundColor Red
    Write-Host ""
}

Read-Host "Premi INVIO per uscire"

