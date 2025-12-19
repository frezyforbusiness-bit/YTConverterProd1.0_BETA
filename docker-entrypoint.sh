#!/bin/sh
# Set default BACKEND_SERVICE_NAME if not provided
export BACKEND_SERVICE_NAME="${BACKEND_SERVICE_NAME:-backend}"

# Execute nginx default entrypoint
exec /docker-entrypoint.sh "$@"

