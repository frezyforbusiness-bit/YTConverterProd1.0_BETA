#!/usr/bin/env python3
"""
Script per ottimizzare il file cookies.txt rimuovendo cookie non necessari.
Questo riduce la dimensione del file e risolve il problema "argument list too long" su Render.
"""

import os
import sys
from pathlib import Path

def optimize_cookies(input_file='cookies.txt', output_file='cookies_optimized.txt'):
    """
    Ottimizza il file cookies.txt mantenendo solo i cookie di YouTube.
    """
    input_path = Path(input_file)
    output_path = Path(output_file)
    
    if not input_path.exists():
        print(f"❌ File non trovato: {input_file}")
        return False
    
    # Domini YouTube da mantenere
    youtube_domains = [
        'youtube.com',
        '.youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
        'google.com',  # Alcuni cookie Google sono necessari
        '.google.com',
    ]
    
    kept_lines = []
    removed_count = 0
    
    with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            
            # Mantieni commenti e righe vuote
            if not line or line.startswith('#'):
                kept_lines.append(line)
                continue
            
            # Parse della riga cookie (formato Netscape)
            parts = line.split('\t')
            if len(parts) >= 4:
                domain = parts[0]
                
                # Mantieni solo cookie di YouTube/Google
                should_keep = False
                for youtube_domain in youtube_domains:
                    if domain == youtube_domain or domain.endswith(youtube_domain):
                        should_keep = True
                        break
                
                if should_keep:
                    kept_lines.append(line)
                else:
                    removed_count += 1
            else:
                # Mantieni righe non standard (potrebbero essere importanti)
                kept_lines.append(line)
    
    # Scrivi il file ottimizzato
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(kept_lines))
        if not kept_lines[-1]:  # Aggiungi newline finale se mancante
            f.write('\n')
    
    original_size = input_path.stat().st_size
    new_size = output_path.stat().st_size
    reduction = ((original_size - new_size) / original_size) * 100
    
    print(f"✅ File ottimizzato creato: {output_file}")
    print(f"   Dimensione originale: {original_size:,} bytes ({original_size/1024:.1f} KB)")
    print(f"   Dimensione ottimizzata: {new_size:,} bytes ({new_size/1024:.1f} KB)")
    print(f"   Riduzione: {reduction:.1f}%")
    print(f"   Cookie rimossi: {removed_count}")
    
    return True

def main():
    """Funzione principale"""
    print("=" * 60)
    print("🔧 Ottimizzazione Cookie YouTube")
    print("=" * 60)
    print()
    
    script_dir = Path(__file__).parent
    input_file = script_dir / 'cookies.txt'
    output_file = script_dir / 'cookies_optimized.txt'
    
    if not input_file.exists():
        print(f"❌ File non trovato: {input_file}")
        print("   Esegui prima: yt-dlp --cookies-from-browser firefox --cookies cookies.txt")
        sys.exit(1)
    
    success = optimize_cookies(str(input_file), str(output_file))
    
    if success:
        print()
        print("=" * 60)
        print("✅ Completato!")
        print("=" * 60)
        print()
        print("Prossimi passi:")
        print("1. Verifica il file ottimizzato:")
        print(f"   {output_file}")
        print()
        print("2. Se va bene, sostituisci il file originale:")
        print(f"   mv {output_file} {input_file}")
        print()
        print("3. Rigenera cookies_base64.txt:")
        print("   base64 -w 0 cookies.txt > cookies_base64.txt")
        print()
        print("4. Aggiorna COOKIES_BASE64 su Render Dashboard")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()

