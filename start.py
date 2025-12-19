#!/usr/bin/env python3
"""
Script per avviare il server Flask e aprire il frontend nel browser
"""

import os
import sys
import time
import subprocess
import webbrowser
from pathlib import Path

def check_ffmpeg():
    """Controlla se ffmpeg è installato"""
    try:
        subprocess.run(['ffmpeg', '-version'], 
                      stdout=subprocess.PIPE, 
                      stderr=subprocess.PIPE, 
                      check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_python_version():
    """Controlla la versione di Python"""
    if sys.version_info < (3, 11):
        print("❌ Python 3.11+ richiesto. Versione attuale:", sys.version)
        return False
    return True

def setup_venv():
    """Crea e attiva il virtual environment se necessario"""
    venv_path = Path('venv')
    
    if not venv_path.exists():
        print("📦 Creazione virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
    
    # Determina il path del Python nel venv
    if sys.platform == 'win32':
        venv_python = venv_path / 'Scripts' / 'python.exe'
        pip_path = venv_path / 'Scripts' / 'pip.exe'
    else:
        venv_python = venv_path / 'bin' / 'python'
        pip_path = venv_path / 'bin' / 'pip'
    
    # Installa dipendenze se necessario
    if not (venv_path / 'lib' / 'site-packages' / 'flask').exists():
        print("📥 Installazione dipendenze...")
        subprocess.run([str(pip_path), 'install', '-r', 'requirements.txt'], check=True)
    
    return str(venv_python)

def start_server(port=5000):
    """Avvia il server Flask"""
    print(f"🌐 Avvio server su http://localhost:{port}...")
    
    # Usa il Python del venv se disponibile, altrimenti quello di sistema
    python_cmd = sys.executable
    if Path('venv').exists():
        if sys.platform == 'win32':
            python_cmd = str(Path('venv') / 'Scripts' / 'python.exe')
        else:
            python_cmd = str(Path('venv') / 'bin' / 'python')
    
    # Avvia il server
    process = subprocess.Popen(
        [python_cmd, 'app.py'],
        env={**os.environ, 'PORT': str(port)},
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    return process

def wait_for_server(url, timeout=10):
    """Attende che il server sia pronto"""
    import urllib.request
    import urllib.error
    
    print("⏳ Attendo che il server sia pronto...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            urllib.request.urlopen(f"{url}/health", timeout=2)
            return True
        except (urllib.error.URLError, OSError):
            time.sleep(0.5)
    
    return False

def is_wsl():
    """Rileva se siamo in WSL (Windows Subsystem for Linux)"""
    try:
        with open('/proc/version', 'r') as f:
            version = f.read().lower()
            return 'microsoft' in version or 'wsl' in version
    except:
        return False

def open_browser(url):
    """Apre il browser"""
    print(f"🌐 Apertura browser su {url}...")
    
    # Se siamo in WSL, usa il browser di Windows
    if is_wsl():
        try:
            # Prova con cmd.exe per aprire il browser di Windows
            subprocess.run(['cmd.exe', '/c', 'start', url], 
                         check=True, 
                         stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"⚠️  Impossibile aprire il browser automaticamente in WSL.")
            print(f"   Apri manualmente: {url}")
            return False
    
    # Altrimenti usa webbrowser standard
    try:
        webbrowser.open(url)
        return True
    except Exception as e:
        print(f"⚠️  Impossibile aprire il browser automaticamente: {e}")
        print(f"   Apri manualmente: {url}")
        return False

def main():
    """Funzione principale"""
    print("🚀 Avvio YouTube Audio Converter...")
    print("")
    
    # Controlla versione Python
    if not check_python_version():
        sys.exit(1)
    
    # Controlla ffmpeg
    if not check_ffmpeg():
        print("⚠️  ffmpeg non trovato. Assicurati che sia installato.")
        print("   Linux: sudo apt-get install ffmpeg")
        print("   macOS: brew install ffmpeg")
        print("   Windows: Scarica da https://ffmpeg.org/download.html")
        print("")
        response = input("Continuare comunque? (s/n): ")
        if response.lower() != 's':
            sys.exit(1)
    
    # Setup virtual environment
    try:
        python_cmd = setup_venv()
    except subprocess.CalledProcessError as e:
        print(f"❌ Errore durante la configurazione: {e}")
        sys.exit(1)
    
    # Porta
    port = int(os.environ.get('PORT', 5000))
    url = f"http://localhost:{port}"
    
    # Avvia server
    try:
        process = start_server(port)
        
        # Attende che il server sia pronto
        if wait_for_server(url):
            print("✅ Server avviato con successo!")
            print("")
            print(f"✨ Pronto! Il server è in esecuzione.")
            print(f"   Frontend: {url}")
            print(f"   API: {url}/api")
            print("")
            print("Per fermare il server, premi Ctrl+C")
            print("")
            
            # Apre il browser
            open_browser(url)
            
            # Attende che il processo termini
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Arresto server...")
                process.terminate()
                process.wait()
                print("✅ Server fermato.")
        else:
            print("❌ Il server non è riuscito ad avviarsi in tempo.")
            process.terminate()
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Arresto server...")
        if 'process' in locals():
            process.terminate()
        print("✅ Server fermato.")
    except Exception as e:
        print(f"❌ Errore: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

