#!/usr/bin/env python3
"""
Script per estrarre cookie YouTube da Firefox su Windows
Esegui questo script da PowerShell o CMD su Windows (non da WSL)
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("=" * 60)
    print("🍪 Estrazione Cookie YouTube (Windows)")
    print("=" * 60)
    print()
    
    # Verifica yt-dlp
    try:
        result = subprocess.run(
            ['yt-dlp', '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        if result.returncode == 0:
            version = result.stdout.decode().strip()
            print(f"✓ yt-dlp trovato: {version}")
        else:
            print("❌ yt-dlp non trovato")
            print("\nInstalla con: pip install yt-dlp")
            input("\nPremi INVIO per uscire...")
            sys.exit(1)
    except FileNotFoundError:
        print("❌ yt-dlp non trovato")
        print("\nInstalla con: pip install yt-dlp")
        input("\nPremi INVIO per uscire...")
        sys.exit(1)
    
    # Determina browser
    browser = 'firefox'
    if len(sys.argv) > 1:
        browser = sys.argv[1].lower()
    
    print(f"\n🔄 Estrazione cookie da {browser}...")
    print()
    
    # Esegui estrazione
    try:
        result = subprocess.run(
            ['yt-dlp', '--cookies-from-browser', browser, '--cookies', 'cookies.txt'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode == 0 and os.path.exists('cookies.txt'):
            file_size = os.path.getsize('cookies.txt')
            file_path = os.path.abspath('cookies.txt')
            
            print("✅ Cookie estratti con successo!")
            print(f"   File: {file_path}")
            print(f"   Dimensione: {file_size} bytes")
            print()
            print("=" * 60)
            print("📋 Prossimi passi:")
            print("=" * 60)
            print()
            print("1. Copia il file in WSL:")
            print(f"   copy cookies.txt \\\\wsl.localhost\\Ubuntu\\home\\fpiumatti\\myProjects\\YTConverter\\")
            print()
            print("2. Oppure usa questo percorso completo:")
            print(f"   {file_path}")
            print()
            print("3. Dopo aver copiato, riavvia il server Flask")
            print()
        else:
            error = result.stderr.strip()
            print(f"❌ Errore: {error}")
            print()
            print("💡 Suggerimenti:")
            print("   - Assicurati che Firefox sia installato")
            print("   - Apri Firefox almeno una volta")
            print("   - Prova con Chrome: python extract_cookies_windows.py chrome")
            
    except Exception as e:
        print(f"❌ Errore: {e}")
    
    input("\nPremi INVIO per uscire...")

if __name__ == '__main__':
    main()

