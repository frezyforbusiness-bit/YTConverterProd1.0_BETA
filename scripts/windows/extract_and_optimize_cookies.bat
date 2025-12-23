@echo off
REM Script batch per estrarre e ottimizzare cookie YouTube su Windows
REM Funziona anche se Python non è nel PATH

echo ============================================================
echo Estrazione e Ottimizzazione Cookie YouTube
echo ============================================================
echo.

REM Prova a trovare Python
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python trovato
    goto :run_script
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python launcher (py) trovato
    set PYTHON_CMD=py
    goto :run_script
)

REM Prova percorsi comuni
if exist "C:\Python311\python.exe" (
    set PYTHON_CMD=C:\Python311\python.exe
    goto :run_script
)

if exist "C:\Python312\python.exe" (
    set PYTHON_CMD=C:\Python312\python.exe
    goto :run_script
)

if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
    goto :run_script
)

if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
    goto :run_script
)

echo [ERRORE] Python non trovato!
echo.
echo Installa Python da: https://www.python.org/downloads/
echo Durante installazione: seleziona "Add Python to PATH"
echo.
pause
exit /b 1

:run_script
echo.
echo Eseguo script Python...
echo.

REM Cambia directory alla root del progetto per trovare i file cookie
cd /d "%~dp0\..\.."

if defined PYTHON_CMD (
    %PYTHON_CMD% scripts\windows\extract_and_optimize_cookies.py
) else (
    python scripts\windows\extract_and_optimize_cookies.py
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo [SUCCESSO] Cookie estratti e ottimizzati!
    echo ============================================================
    echo.
    echo File generati:
    echo   - cookies.txt (cookie ottimizzati)
    echo   - cookies_base64.txt (per Render)
    echo.
) else (
    echo.
    echo [ERRORE] Estrazione/ottimizzazione fallita
    echo.
)

pause

