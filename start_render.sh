#!/bin/bash
# Compatibility wrapper for Railway start command overrides that still call
# `./start_render.sh` from the repo root.
set -euo pipefail
exec bash "$(dirname "$0")/scripts/shell/start_render.sh"
