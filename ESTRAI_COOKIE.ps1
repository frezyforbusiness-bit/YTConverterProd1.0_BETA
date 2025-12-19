# Script PowerShell per estrarre cookie da Firefox
# Funziona con percorsi WSL

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Estrazione Cookie YouTube da Firefox" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verifica yt-dlp
$ytdlpFound = $false

# Prova yt-dlp direttamente
try {
    $null = Get-Command yt-dlp -ErrorAction Stop
    Write-Host "[OK] yt-dlp trovato nel PATH" -ForegroundColor Green
    $ytdlpFound = $true
    $ytdlpCmd = "yt-dlp"
} catch {
    # Prova con py launcher
    try {
        $null = Get-Command py -ErrorAction Stop
        Write-Host "[OK] Python launcher trovato, uso yt-dlp via Python" -ForegroundColor Green
        $ytdlpFound = $true
        $ytdlpCmd = "py -m yt_dlp"
    } catch {
        # Prova python
        try {
            $null = Get-Command python -ErrorAction Stop
            Write-Host "[OK] Python trovato, uso yt-dlp via Python" -ForegroundColor Green
            $ytdlpFound = $true
            $ytdlpCmd = "python -m yt_dlp"
        } catch {
            Write-Host "[ERRORE] yt-dlp non trovato!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Installa yt-dlp con uno di questi comandi:" -ForegroundColor Yellow
            Write-Host "  pip install yt-dlp" -ForegroundColor White
            Write-Host "  py -m pip install yt-dlp" -ForegroundColor White
            Write-Host "  python -m pip install yt-dlp" -ForegroundColor White
            Write-Host ""
            Read-Host "Premi INVIO per uscire"
            exit 1
        }
    }
}

if (-not $ytdlpFound) {
    exit 1
}

Write-Host ""
Write-Host "Estraggo cookie da Firefox..." -ForegroundColor Yellow
Write-Host ""

# Determina il percorso di output
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputFile = Join-Path $scriptDir "cookies.txt"

# Esegui estrazione
try {
    if ($ytdlpCmd -eq "yt-dlp") {
        & yt-dlp --cookies-from-browser firefox --cookies $outputFile
    } elseif ($ytdlpCmd -eq "py -m yt_dlp") {
        & py -m yt_dlp --cookies-from-browser firefox --cookies $outputFile
    } else {
        & python -m yt_dlp --cookies-from-browser firefox --cookies $outputFile
    }
    
    if (Test-Path $outputFile) {
        $fileSize = (Get-Item $outputFile).Length
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "[SUCCESSO] Cookie estratti!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "File: $outputFile" -ForegroundColor White
        Write-Host "Dimensione: $fileSize bytes" -ForegroundColor White
        Write-Host ""
        Write-Host "Il file e' pronto. Riavvia il server Flask e riprova." -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[ERRORE] Estrazione fallita" -ForegroundColor Red
        Write-Host ""
        Write-Host "Verifica che:" -ForegroundColor Yellow
        Write-Host "- Firefox sia installato" -ForegroundColor White
        Write-Host "- Firefox sia stato aperto almeno una volta" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "[ERRORE] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Read-Host "Premi INVIO per uscire"

