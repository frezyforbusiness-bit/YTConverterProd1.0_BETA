@echo off
REM Script semplificato - estrae cookie usando yt-dlp direttamente
REM Funziona se yt-dlp è installato (pip install yt-dlp)

echo ============================================================
echo Estrazione Cookie YouTube
echo ============================================================
echo.

REM Prova yt-dlp direttamente
where yt-dlp >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] yt-dlp trovato
    echo.
    echo Estraggo cookie da Firefox...
    yt-dlp --cookies-from-browser firefox --cookies cookies.txt
    
    if exist cookies.txt (
        echo.
        echo ============================================================
        echo [SUCCESSO] Cookie estratti!
        echo ============================================================
        echo.
        echo File: %CD%\cookies.txt
        echo.
        echo Il file e' pronto. Riavvia il server Flask.
        echo.
    ) else (
        echo.
        echo [ERRORE] Estrazione fallita
        echo.
        echo Verifica che:
        echo - Firefox sia installato
        echo - Firefox sia stato aperto almeno una volta
        echo.
    )
    goto :end
)

REM Se yt-dlp non è nel PATH, prova con Python
echo [INFO] yt-dlp non trovato nel PATH, provo con Python...
echo.

REM Prova py launcher
py -m yt_dlp --cookies-from-browser firefox --cookies cookies.txt 2>nul
if exist cookies.txt goto :success

REM Prova python
python -m yt_dlp --cookies-from-browser firefox --cookies cookies.txt 2>nul
if exist cookies.txt goto :success

REM Prova python3
python3 -m yt_dlp --cookies-from-browser firefox --cookies cookies.txt 2>nul
if exist cookies.txt goto :success

echo.
echo [ERRORE] yt-dlp non trovato!
echo.
echo Installa yt-dlp con uno di questi comandi:
echo   pip install yt-dlp
echo   py -m pip install yt-dlp
echo   python -m pip install yt-dlp
echo.
goto :end

:success
echo.
echo ============================================================
echo [SUCCESSO] Cookie estratti!
echo ============================================================
echo.
echo File: %CD%\cookies.txt
echo.
echo Il file e' pronto. Riavvia il server Flask.
echo.

:end
pause

