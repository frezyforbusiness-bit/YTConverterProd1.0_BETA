#!/usr/bin/env bash

set -euo pipefail

# Refresh YouTube cookies from browser and deploy to remote server.
#
# Usage:
#   ./scripts/shell/refresh_cookies_and_deploy.sh
#   BROWSER=firefox SERVER_USER=root SERVER_HOST=1.2.3.4 ./scripts/shell/refresh_cookies_and_deploy.sh
#
# Optional env vars:
#   BROWSER=chrome
#   BROWSER_PROFILE=""              # e.g. "Profile 1" if needed by yt-dlp
#   SERVER_USER=root
#   SERVER_HOST=89.167.90.22
#   SERVER_ENV_FILE=/opt/ytconverter/.env
#   SERVER_RELEASE_SCRIPT=/opt/ytconverter/scripts/shell/release_server.sh
#   HEALTH_URL=http://89.167.90.22:5000/health
#   YT_TEST_URL=https://www.youtube.com/watch?v=dQw4w9WgXcQ
#   SSH_OPTS="-o StrictHostKeyChecking=accept-new"

BROWSER="${BROWSER:-chrome}"
BROWSER_PROFILE="${BROWSER_PROFILE:-}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-89.167.90.22}"
SERVER_ENV_FILE="${SERVER_ENV_FILE:-/opt/ytconverter/.env}"
SERVER_RELEASE_SCRIPT="${SERVER_RELEASE_SCRIPT:-/opt/ytconverter/scripts/shell/release_server.sh}"
HEALTH_URL="${HEALTH_URL:-http://${SERVER_HOST}:5000/health}"
YT_TEST_URL="${YT_TEST_URL:-https://www.youtube.com/watch?v=dQw4w9WgXcQ}"
SSH_OPTS="${SSH_OPTS:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COOKIES_FILE="${PROJECT_ROOT}/cookies.txt"
COOKIES_BASE64_FILE="${PROJECT_ROOT}/cookies_base64.txt"

echo "============================================================"
echo "Cookie refresh + deploy"
echo "============================================================"
echo "Browser      : ${BROWSER}"
echo "Server       : ${SERVER_USER}@${SERVER_HOST}"
echo "Remote .env  : ${SERVER_ENV_FILE}"
echo "Health URL   : ${HEALTH_URL}"
echo ""

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "ERROR: yt-dlp is not installed."
  exit 1
fi

if ! command -v base64 >/dev/null 2>&1; then
  echo "ERROR: base64 command is not available."
  exit 1
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "ERROR: ssh is not installed."
  exit 1
fi

if ! command -v scp >/dev/null 2>&1; then
  echo "ERROR: scp is not installed."
  exit 1
fi

echo ">>> Extracting cookies from browser..."
rm -f "${COOKIES_FILE}" "${COOKIES_BASE64_FILE}"

if [ -n "${BROWSER_PROFILE}" ]; then
  yt-dlp --cookies-from-browser "${BROWSER}:${BROWSER_PROFILE}" --cookies "${COOKIES_FILE}" --no-download "${YT_TEST_URL}"
else
  yt-dlp --cookies-from-browser "${BROWSER}" --cookies "${COOKIES_FILE}" --no-download "${YT_TEST_URL}"
fi

if [ ! -s "${COOKIES_FILE}" ]; then
  echo "ERROR: cookies file was not created."
  exit 1
fi

first_line="$(awk 'NR==1 {print; exit}' "${COOKIES_FILE}")"
if [ "${first_line}" != "# Netscape HTTP Cookie File" ] && [ "${first_line}" != "# HTTP Cookie File" ]; then
  echo "ERROR: cookies file is not in Netscape format."
  exit 1
fi

youtube_cookie_count="$(rg -n "youtube\\.com|google\\.com|accounts\\.google\\.com" "${COOKIES_FILE}" | wc -l | tr -d ' ')"
if [ "${youtube_cookie_count}" -lt 3 ]; then
  echo "ERROR: too few YouTube/Google cookies found (${youtube_cookie_count})."
  exit 1
fi

echo ">>> Converting cookies to base64..."
base64 -w 0 "${COOKIES_FILE}" > "${COOKIES_BASE64_FILE}"
if [ ! -s "${COOKIES_BASE64_FILE}" ]; then
  echo "ERROR: cookies_base64 file is empty."
  exit 1
fi

echo ">>> Uploading base64 payload to remote temp file..."
scp ${SSH_OPTS} "${COOKIES_BASE64_FILE}" "${SERVER_USER}@${SERVER_HOST}:/tmp/ytconverter-cookies-base64.txt"

echo ">>> Updating remote .env atomically..."
ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_HOST}" "ENV_FILE='${SERVER_ENV_FILE}' BASE64_FILE='/tmp/ytconverter-cookies-base64.txt' bash -s" <<'EOF'
set -euo pipefail

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
EOF

echo ">>> Running remote release script..."
ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_HOST}" "bash '${SERVER_RELEASE_SCRIPT}'"

echo ">>> Verifying health endpoint..."
if curl -fsS "${HEALTH_URL}" >/tmp/ytconverter-health-check.json; then
  echo "Health check passed:"
  cat /tmp/ytconverter-health-check.json
  echo ""
else
  echo "ERROR: health check failed at ${HEALTH_URL}"
  exit 1
fi

echo ""
echo "Done. Cookies refreshed and deployment completed."
