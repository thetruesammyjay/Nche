#!/bin/sh
set -eu

if { [ "${DATABASE_REQUIRED:-false}" = "true" ] || [ "${NCHE_ENV:-development}" = "production" ]; } && [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL must be configured for a production or database-required deployment" >&2
  exit 1
fi

if [ -n "${DATABASE_URL:-}" ]; then
  /app/.venv/bin/alembic upgrade head
fi

exec /app/.venv/bin/uvicorn nche.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --proxy-headers \
  --forwarded-allow-ips="*"
