#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  /app/.venv/bin/alembic upgrade head
fi

exec /app/.venv/bin/uvicorn nche.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --proxy-headers \
  --forwarded-allow-ips="*"