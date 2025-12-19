@echo off
REM Script batch per estrarre cookie da Firefox su Windows
REM Funziona anche se Python non è nel PATH

echo ============================================================
echo Estrazione Cookie YouTube da Firefox
echo ============================================================
echo.

REM Prova a trovare Python
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python trovato
    goto :extract
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python launcher (py) trovato
    set PYTHON_CMD=py
    goto :extract
)

REM Prova percorsi comuni
if exist "C:\Python311\python.exe" (
    set PYTHON_CMD=C:\Python311\python.exe
    goto :extract
)

if exist "C:\Python312\python.exe" (
    set PYTHON_CMD=C:\Python312\python.exe
    goto :extract
)

if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
    goto :extract
)

if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
    goto :extract
)

echo [ERRORE] Python non trovato!
echo.
echo Installa Python da: https://www.python.org/downloads/
echo Oppure usa yt-dlp direttamente (vedi sotto)
echo.
pause
exit /b 1

:extract
echo.
echo Estraggo cookie da Firefox...
echo.

REM Prova prima con yt-dlp direttamente (più semplice)
where yt-dlp >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] yt-dlp trovato, uso direttamente...
    yt-dlp --cookies-from-browser firefox --cookies cookies.txt
    goto :check_result
)

REM Altrimenti usa Python
if defined PYTHON_CMD (
    %PYTHON_CMD% -m yt_dlp --cookies-from-browser firefox --cookies cookies.txt
) else (
    python -m yt_dlp --cookies-from-browser firefox --cookies cookies.txt
)

:check_result
if exist cookies.txt (
    echo.
    echo ============================================================
    echo [SUCCESSO] Cookie estratti!
    echo ============================================================
    echo.
    echo File creato: %CD%\cookies.txt
    echo.
    echo Il file e' gia' nella posizione corretta per WSL.
    echo Riavvia il server Flask e riprova la conversione.
    echo.
) else (
    echo.
    echo ============================================================
    echo [ERRORE] Estrazione fallita
    echo ============================================================
    echo.
    echo Possibili cause:
    echo - Firefox non installato
    echo - Firefox non mai aperto
    echo - yt-dlp non installato
    echo.
    echo Installa yt-dlp con:
    echo   pip install yt-dlp
    echo.
)

pause
