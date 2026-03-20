param(
    [string]$Browser = "chrome",
    [string]$ServerUser = "root",
    [string]$ServerHost = "89.167.90.22",
    [string]$ServerEnvFile = "/opt/ytconverter/.env",
    [string]$ServerReleaseScript = "/opt/ytconverter/scripts/shell/release_server.sh",
    [string]$HealthUrl = "",
    [string]$YouTubeTestUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($HealthUrl)) {
    $HealthUrl = "http://$ServerHost:5000/health"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "../..")
$CookiesFile = Join-Path $ProjectRoot "cookies.txt"
$CookiesBase64File = Join-Path $ProjectRoot "cookies_base64.txt"

Write-Host "============================================================"
Write-Host "Cookie refresh + deploy (Windows)"
Write-Host "============================================================"
Write-Host "Browser      : $Browser"
Write-Host "Server       : $ServerUser@$ServerHost"
Write-Host "Remote .env  : $ServerEnvFile"
Write-Host "Health URL   : $HealthUrl"
Write-Host ""

if (-not (Get-Command yt-dlp -ErrorAction SilentlyContinue)) {
    throw "yt-dlp not found in PATH."
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    throw "ssh not found in PATH."
}

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    throw "scp not found in PATH."
}

Write-Host ">>> Extracting cookies from browser..."
if (Test-Path $CookiesFile) { Remove-Item $CookiesFile -Force }
if (Test-Path $CookiesBase64File) { Remove-Item $CookiesBase64File -Force }

yt-dlp --cookies-from-browser $Browser --cookies $CookiesFile --no-download $YouTubeTestUrl

if (-not (Test-Path $CookiesFile) -or ((Get-Item $CookiesFile).Length -eq 0)) {
    throw "cookies.txt was not created."
}

$firstLine = Get-Content $CookiesFile -TotalCount 1
if ($firstLine -ne "# Netscape HTTP Cookie File" -and $firstLine -ne "# HTTP Cookie File") {
    throw "cookies.txt is not in Netscape format."
}

$cookieMatches = (Select-String -Path $CookiesFile -Pattern "youtube\.com|google\.com|accounts\.google\.com").Count
if ($cookieMatches -lt 3) {
    throw "Too few YouTube/Google cookies found ($cookieMatches)."
}

Write-Host ">>> Converting cookies to base64..."
$bytes = [System.IO.File]::ReadAllBytes($CookiesFile)
$b64 = [Convert]::ToBase64String($bytes)
[System.IO.File]::WriteAllText($CookiesBase64File, $b64)

if (-not (Test-Path $CookiesBase64File) -or ((Get-Item $CookiesBase64File).Length -eq 0)) {
    throw "cookies_base64.txt is empty."
}

Write-Host ">>> Uploading base64 payload..."
scp $CookiesBase64File "$ServerUser@$ServerHost:/tmp/ytconverter-cookies-base64.txt"

Write-Host ">>> Updating remote .env atomically..."
$remoteScript = @'
set -euo pipefail
ENV_FILE="${1}"
BASE64_FILE="/tmp/ytconverter-cookies-base64.txt"

if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: env file not found: ${ENV_FILE}"
  exit 1
fi

if [ ! -s "${BASE64_FILE}" ]; then
  echo "ERROR: base64 payload missing: ${BASE64_FILE}"
  exit 1
fi

tmp_env="$(mktemp)"
new_value="$(tr -d '\r\n' < "${BASE64_FILE}")"

if rg -q '^COOKIES_BASE64=' "${ENV_FILE}"; then
  awk -v val="${new_value}" '
    BEGIN { replaced = 0 }
    /^COOKIES_BASE64=/ { print "COOKIES_BASE64=" val; replaced = 1; next }
    { print }
    END { if (!replaced) print "COOKIES_BASE64=" val }
  ' "${ENV_FILE}" > "${tmp_env}"
else
  cp "${ENV_FILE}" "${tmp_env}"
  echo "COOKIES_BASE64=${new_value}" >> "${tmp_env}"
fi

mv "${tmp_env}" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"
rm -f "${BASE64_FILE}"
echo "Remote .env updated."
'@

ssh "$ServerUser@$ServerHost" "bash -s -- '$ServerEnvFile'" <<< $remoteScript

Write-Host ">>> Running remote release script..."
ssh "$ServerUser@$ServerHost" "bash '$ServerReleaseScript'"

Write-Host ">>> Health check..."
try {
    $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 20
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
        Write-Host "Health check passed:"
        Write-Host $resp.Content
    } else {
        throw "Health check returned status code $($resp.StatusCode)"
    }
}
catch {
    throw "Health check failed: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Done. Cookies refreshed and deployment completed."
