#!/usr/bin/env bash
set -euo pipefail

# Full production sync from local machine:
# 1) email SMTP env vars
# 2) cookies base64 (if available)
# 3) remote git pull + docker rebuild
#
# Usage:
#   ./scripts/shell/sync_prod_all.sh

SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-89.167.90.22}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-/opt/ytconverter/.env}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_ENV="${PROJECT_ROOT}/.env"
COOKIES_BASE64_FILE="${PROJECT_ROOT}/cookies_base64.txt"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

cd "${PROJECT_ROOT}"

if [ ! -f "${LOCAL_ENV}" ]; then
  echo "Missing ${LOCAL_ENV}"
  exit 1
fi

if ! grep -Eq '^RESEND_API_KEY=.+$' "${LOCAL_ENV}" && ! grep -Eq '^SMTP_PASSWORD=.+$' "${LOCAL_ENV}"; then
  echo "Configure RESEND_API_KEY or SMTP_PASSWORD in .env"
  exit 1
fi

echo "============================================================"
echo "YTConverter production sync"
echo "Target: ${SERVER_USER}@${SERVER_HOST}"
echo "============================================================"

EMAIL_ENV_FILE="$(mktemp)"
trap 'rm -f "${EMAIL_ENV_FILE}"' EXIT
grep -E '^(CONVERSION_NOTIFY_|SMTP_|RESEND_|EMAIL_PROVIDER)' "${LOCAL_ENV}" > "${EMAIL_ENV_FILE}"

echo ">>> [1/4] Upload email env vars..."
scp ${SSH_OPTS} "${EMAIL_ENV_FILE}" "${SERVER_USER}@${SERVER_HOST}:/tmp/ytconverter-email-env.txt"

if [ -s "${COOKIES_BASE64_FILE}" ]; then
  echo ">>> [2/4] Upload cookies_base64..."
  scp ${SSH_OPTS} "${COOKIES_BASE64_FILE}" "${SERVER_USER}@${SERVER_HOST}:/tmp/ytconverter-cookies-base64.txt"
else
  echo ">>> [2/4] Skip cookies upload (cookies_base64.txt missing)"
fi

echo ">>> [3/4] Update remote .env..."
ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_HOST}" "ENV_FILE='${REMOTE_ENV_FILE}' EMAIL_FILE='/tmp/ytconverter-email-env.txt' COOKIES_FILE='/tmp/ytconverter-cookies-base64.txt' bash -s" <<'EOF'
set -euo pipefail

if [ ! -f "${ENV_FILE}" ]; then
  echo "Remote env not found: ${ENV_FILE}"
  exit 1
fi

tmp_env="$(mktemp)"
cp "${ENV_FILE}" "${tmp_env}"

update_key() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "${tmp_env}"; then
    awk -v k="${key}" -v v="${value}" '
      BEGIN { replaced = 0 }
      $0 ~ ("^" k "=") { print k "=" v; replaced = 1; next }
      { print }
      END { if (!replaced) print k "=" v }
    ' "${tmp_env}" > "${tmp_env}.next"
    mv "${tmp_env}.next" "${tmp_env}"
  else
    echo "${key}=${value}" >> "${tmp_env}"
  fi
}

while IFS= read -r line; do
  [ -n "${line}" ] || continue
  key="${line%%=*}"
  value="${line#*=}"
  update_key "${key}" "${value}"
done < "${EMAIL_FILE}"

if [ -f "${COOKIES_FILE}" ] && [ -s "${COOKIES_FILE}" ]; then
  new_value="$(tr -d '\r\n' < "${COOKIES_FILE}")"
  update_key "COOKIES_BASE64" "${new_value}"
  rm -f "${COOKIES_FILE}"
fi

mv "${tmp_env}" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"
rm -f "${EMAIL_FILE}"
echo "Remote .env updated."
EOF

echo ">>> [4/4] Release on server..."
ssh ${SSH_OPTS} "${SERVER_USER}@${SERVER_HOST}" "bash /opt/ytconverter/YTConverterProd1.0_BETA/scripts/shell/release_server.sh master"

echo ""
echo "Done. Test:"
echo "  curl http://${SERVER_HOST}:5000/health"
echo "  then run one conversion and check info.producertools@gmail.com"
