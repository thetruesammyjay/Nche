# Nche API

FastAPI service for explainable account-takeover risk decisions.

## Local development

The API runs with an in-memory repository when `DATABASE_URL` is not set:

```powershell
uv sync
uv run uvicorn nche.main:app --reload
```

For a production-like local run, copy the root `.env.example` into `apps/api/.env` and set `DATABASE_URL` to the connection string from Neon. From `apps/api`, run `Copy-Item ..\..\.env.example .env`. The URL should include `sslmode=require`.

## Neon PostgreSQL

Set these environment variables in Render (never commit the value):

- `DATABASE_URL`: Neon pooled or direct PostgreSQL connection string
- `DATABASE_REQUIRED=true`
- `NCHE_ENV=production`
- `CORS_ORIGINS=https://your-vercel-domain.example`

The container runs `alembic upgrade head` before Uvicorn starts. To apply migrations locally:

```powershell
uv run alembic upgrade head
```

## Runtime endpoints

- `GET /health`: liveness response
- `GET /health/ready`: readiness response, including database state
- `POST /events/ingest`: persist an event
- `POST /risk/evaluate`: evaluate and persist a risk decision
- `POST /v1/evaluate_action`: evaluate a sensitive action before submission; supports `Idempotency-Key` and `X-Nche-Mode: Observe | Enforce`
- `GET /explain/{evaluation_id}`: retrieve the persisted decision evidence

The pre-transfer endpoint returns the recommendation and evidence in under the engine's 50 ms budget for the in-memory path. Use `Observe` while shadowing decisions and `Enforce` when the institution is ready to act on the recommendation. Reuse the same `Idempotency-Key` when retrying an action request.

OpenAPI docs are available at `/docs` outside production. Production disables the interactive docs by default.
