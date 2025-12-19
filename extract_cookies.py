#!/usr/bin/env python3
"""
Script per estrarre cookie YouTube da Firefox
Funziona su Windows, Linux e macOS
"""

import os
import sys
import subprocess
from pathlib import Path

def check_yt_dlp():
    """Verifica se yt-dlp è installato"""
    try:
        result = subprocess.run(
            ['yt-dlp', '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        if result.returncode == 0:
            version = result.stdout.decode().strip()
            print(f"✓ yt-dlp trovato: {version}")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ yt-dlp non trovato")
    print("\nInstalla yt-dlp con:")
    print("  pip install yt-dlp")
    print("  oppure")
    print("  pip install -r requirements.txt")
    return False

def extract_cookies(browser='firefox', output_file='cookies.txt'):
    """
    Estrae i cookie dal browser specificato
    
    Args:
        browser: Browser da usare (firefox, chrome, edge, etc.)
        output_file: Nome del file di output
    """
    print(f"\n🔄 Estrazione cookie da {browser}...")
    print(f"   Output: {output_file}")
    print()
    
    try:
        # Esegui yt-dlp per estrarre i cookie
        result = subprocess.run(
            ['yt-dlp', '--cookies-from-browser', browser, '--cookies', output_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode == 0:
            # Verifica che il file sia stato creato
            if os.path.exists(output_file):
                file_size = os.path.getsize(output_file)
                print(f"✅ Cookie estratti con successo!")
                print(f"   File: {os.path.abspath(output_file)}")
                print(f"   Dimensione: {file_size} bytes")
                print()
                print("🎉 Pronto! Il server userà automaticamente questi cookie al prossimo riavvio.")
                return True
            else:
                print("⚠️  Comando completato ma il file non è stato creato")
                return False
        else:
            # Mostra l'errore
            error_msg = result.stderr.strip()
            print(f"❌ Errore durante l'estrazione:")
            print(f"   {error_msg}")
            print()
            
            # Suggerimenti basati sull'errore
            if 'could not find' in error_msg.lower():
                print("💡 Suggerimenti:")
                print("   1. Assicurati che il browser sia installato")
                print("   2. Apri il browser almeno una volta")
                print("   3. Se sei su WSL, esegui questo script da Windows PowerShell")
                print()
                print("   Browser supportati: firefox, chrome, edge, safari, opera, brave")
                print("   Prova con un altro browser:")
                print("     python extract_cookies.py chrome")
            
            return False
            
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False

def main():
    """Funzione principale"""
    print("=" * 60)
    print("🍪 Estrazione Cookie YouTube")
    print("=" * 60)
    print()
    
    # Verifica yt-dlp
    if not check_yt_dlp():
        sys.exit(1)
    
    # Determina il browser da usare
    browser = 'firefox'  # Default
    if len(sys.argv) > 1:
        browser = sys.argv[1].lower()
    
    # Lista browser supportati
    supported_browsers = ['firefox', 'chrome', 'edge', 'safari', 'opera', 'brave']
    
    if browser not in supported_browsers:
        print(f"⚠️  Browser '{browser}' potrebbe non essere supportato")
        print(f"   Browser supportati: {', '.join(supported_browsers)}")
        print()
        response = input(f"Continuare comunque con {browser}? (s/n): ")
        if response.lower() != 's':
            print("Operazione annullata.")
            sys.exit(0)
    
    # Determina il percorso di output
    script_dir = Path(__file__).parent
    output_file = script_dir / 'cookies.txt'
    
    # Estrai i cookie
    success = extract_cookies(browser, str(output_file))
    
    if success:
        print("=" * 60)
        print("✅ Completato!")
        print("=" * 60)
        print()
        print("Prossimi passi:")
        print("1. Riavvia il server Flask")
        print("2. Nei log vedrai: 'Cookies file found: ...'")
        print("3. Riprova la conversione")
        sys.exit(0)
    else:
        print("=" * 60)
        print("❌ Estrazione fallita")
        print("=" * 60)
        print()
        print("Se sei su WSL e il browser è su Windows:")
        print("1. Apri PowerShell su Windows")
        print("2. Installa yt-dlp: pip install yt-dlp")
        print("3. Esegui: yt-dlp --cookies-from-browser firefox --cookies cookies.txt")
        print("4. Copia il file in WSL:")
        print("   copy cookies.txt \\\\wsl.localhost\\Ubuntu\\home\\fpiumatti\\myProjects\\YTConverter\\")
        sys.exit(1)

if __name__ == '__main__':
    main()

