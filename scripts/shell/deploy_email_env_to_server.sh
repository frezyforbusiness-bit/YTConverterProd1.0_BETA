#!/usr/bin/env bash
set -euo pipefail

# Sync email-related env vars from local .env to remote server .env.
#
# Usage:
#   SERVER_USER=root SERVER_HOST=89.167.90.22 ./scripts/shell/deploy_email_env_to_server.sh

SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-89.167.90.22}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-/opt/ytconverter/.env}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_ENV="${PROJECT_ROOT}/.env"

if [ ! -f "${LOCAL_ENV}" ]; then
  echo "Missing local .env: ${LOCAL_ENV}"
  exit 1
fi

if ! grep -Eq '^SMTP_PASSWORD=.+$' "${LOCAL_ENV}"; then
  echo "SMTP_PASSWORD is empty in local .env. Configure it before deploy."
  exit 1
fi

TMP_FILE="$(mktemp)"
trap 'rm -f "${TMP_FILE}"' EXIT

grep -E '^(CONVERSION_NOTIFY_|SMTP_|RESEND_|EMAIL_PROVIDER)' "${LOCAL_ENV}" > "${TMP_FILE}" || true
if [ ! -s "${TMP_FILE}" ]; then
  echo "No email env vars found in local .env"
  exit 1
fi

echo ">>> Uploading email env vars to ${SERVER_USER}@${SERVER_HOST}:${REMOTE_ENV_FILE}"
scp "${TMP_FILE}" "${SERVER_USER}@${SERVER_HOST}:/tmp/ytconverter-email-env.txt"

ssh "${SERVER_USER}@${SERVER_HOST}" "ENV_FILE='${REMOTE_ENV_FILE}' BASE_FILE='/tmp/ytconverter-email-env.txt' bash -s" <<'EOF'
set -euo pipefail

if [ ! -f "${ENV_FILE}" ]; then
  echo "Remote env file not found: ${ENV_FILE}"
  exit 1
fi

tmp_env="$(mktemp)"
cp "${ENV_FILE}" "${tmp_env}"

while IFS= read -r line; do
  [ -n "${line}" ] || continue
  key="${line%%=*}"
  value="${line#*=}"
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
done < "${BASE_FILE}"

mv "${tmp_env}" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"
rm -f "${BASE_FILE}"
echo "Remote email env updated."
EOF

echo ">>> Restarting remote container..."
ssh "${SERVER_USER}@${SERVER_HOST}" "cd /opt/ytconverter && docker compose up -d --force-recreate"
echo "Done."
