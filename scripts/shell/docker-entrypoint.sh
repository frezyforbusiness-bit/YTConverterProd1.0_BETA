#!/bin/sh
# Set default BACKEND_URL if not provided
# For Railway: use the backend service URL
# For docker-compose: use http://backend:5000
if [ -z "$BACKEND_URL" ]; then
    # If BACKEND_SERVICE_NAME is set, use it (for Railway internal DNS)
    if [ -n "$BACKEND_SERVICE_NAME" ]; then
        export BACKEND_URL="http://${BACKEND_SERVICE_NAME}:5000"
    else
        # Default for docker-compose
        export BACKEND_URL="http://backend:5000"
    fi
fi

# Execute nginx default entrypoint
exec /docker-entrypoint.sh "$@"
