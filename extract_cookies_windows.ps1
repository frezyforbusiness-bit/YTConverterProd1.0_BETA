# Script PowerShell per estrarre cookie da Firefox su Windows
# Esegui questo script da PowerShell su Windows (non da WSL)

# Installa yt-dlp se non ce l'hai
# pip install yt-dlp

# Estrai cookie da Firefox
yt-dlp --cookies-from-browser firefox --cookies cookies.txt

Write-Host "Cookie estratti! Il file cookies.txt è stato creato."
Write-Host "Copia il file nella directory del progetto WSL:"
Write-Host "  /home/fpiumatti/myProjects/YTConverter/"

