#!/usr/bin/env bash

set -euo pipefail

# One-shot release script for VPS/server usage.
# Usage examples:
#   ./scripts/shell/release_server.sh
#   ./scripts/shell/release_server.sh master

BRANCH="${1:-master}"
PROJECT_DIR="${PROJECT_DIR:-/opt/ytconverter/YTConverterProd1.0_BETA}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/ytconverter/docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:5000/health}"

echo "============================================================"
echo "YTConverter Server Release"
echo "============================================================"
echo "Project dir : ${PROJECT_DIR}"
echo "Branch      : ${BRANCH}"
echo "Compose file: ${COMPOSE_FILE}"
echo "Health URL  : ${HEALTH_URL}"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin is not available."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is not installed."
  exit 1
fi

cd "${PROJECT_DIR}"

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "ERROR: ${COMPOSE_FILE} not found in ${PROJECT_DIR}"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "ERROR: .env not found in ${PROJECT_DIR}"
  exit 1
fi

echo ">>> Updating repository..."
git fetch origin
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo ""
echo ">>> Building and starting containers..."
docker compose -f "${COMPOSE_FILE}" down --remove-orphans
docker compose -f "${COMPOSE_FILE}" build --pull
docker compose -f "${COMPOSE_FILE}" up -d

echo ""
echo ">>> Waiting for service startup..."
sleep 5

echo ">>> Health check: ${HEALTH_URL}"
if curl -fsS "${HEALTH_URL}" >/tmp/ytconverter-health.json; then
  echo "Health check passed:"
  cat /tmp/ytconverter-health.json
  echo ""
else
  echo "ERROR: health check failed."
  echo "Recent logs:"
  docker compose -f "${COMPOSE_FILE}" logs --tail=120
  exit 1
fi

echo ""
echo ">>> Recent ytconverter logs (cookie/bot focus):"
docker compose -f "${COMPOSE_FILE}" logs --tail=200 | grep -Ei "cookie|yt-dlp|bot|youtube|error" || true

echo ""
echo "Release completed successfully."
