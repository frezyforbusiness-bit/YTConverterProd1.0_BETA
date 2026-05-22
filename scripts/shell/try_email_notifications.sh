#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${PROJECT_ROOT}"

if [ ! -f ".env" ]; then
  echo "Missing .env in ${PROJECT_ROOT}"
  exit 1
fi

if ! grep -Eq '^RESEND_API_KEY=.+$' .env && ! grep -Eq '^SMTP_PASSWORD=.+$' .env; then
  echo "Configure RESEND_API_KEY (Railway) or SMTP_PASSWORD (VPS) in .env first."
  echo "Guide: docs/CONVERSION_EMAIL_SETUP.md"
  exit 1
fi

PYTHON_BIN="python3"
if [ -x "venv/bin/python" ]; then
  PYTHON_BIN="venv/bin/python"
fi

echo ">>> Sending test conversion emails..."
"${PYTHON_BIN}" scripts/test_conversion_email.py

echo ""
echo ">>> If emails arrived, start app and test a real conversion:"
echo "    ${PYTHON_BIN} start.py"
echo "    Then open frontend and convert one YouTube URL."
