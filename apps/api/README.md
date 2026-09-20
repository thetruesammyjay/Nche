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
- `GET /v1/institutions`: list the institutions available to the analyst workspace
- `POST /v1/institutions`: add an institution to the running demo directory
- `GET /explain/{evaluation_id}`: retrieve the persisted decision evidence

The pre-transfer endpoint returns the recommendation and evidence in under the engine's 50 ms budget for the in-memory path. Use `Observe` while shadowing decisions and `Enforce` when the institution is ready to act on the recommendation. Reuse the same `Idempotency-Key` when retrying an action request.

Every evaluation carries the selected `institution_ref` so the same risk path can serve multiple banks, fintechs, wallets, or microfinance institutions. The default demo directory contains Apex MFB, Kuda, OPay, and PalmPay. New institutions added through `POST /v1/institutions` live in the in-memory directory for the current API process; production persistence should move that registry into its own database table.

The analyst-facing web workspace uses a protected session at `/login`. The from-scratch analysis page at `/evaluation/new` loads the directory, builds a customer event sequence, and submits it to `/v1/evaluate_action` through the web BFF. The demo credentials are controlled by `NCHE_ANALYST_EMAIL` and `NCHE_ANALYST_PASSWORD` in the root environment file.

OpenAPI docs are available at `/docs` outside production. Production disables the interactive docs by default.
