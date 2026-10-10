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

Production startup fails closed when PostgreSQL is missing, even if `DATABASE_REQUIRED` is not set. This prevents a deployment from silently switching to the in-memory repository.

## Runtime endpoints

- `GET /health`: liveness response
- `GET /health/ready`: readiness response, including database state
- `POST /events/ingest`: persist an event
- `POST /risk/evaluate`: evaluate and persist a risk decision
- `POST /v1/evaluate_action`: evaluate a sensitive action before submission; supports `Idempotency-Key` and `X-Nche-Mode: Observe | Enforce`
- `GET /v1/institutions`: list the institutions available to the analyst workspace
- `POST /v1/institutions`: add an institution to the running demo directory
- `GET /v1/institutions/{institution_ref}/policy`: read institution-specific decision bands
- `PUT /v1/institutions/{institution_ref}/policy`: persist institution-specific decision bands
- `POST /v1/auth/login`: authenticate an analyst through the server-only API boundary
- `GET /v1/auth/analysts`: list analyst identities for administrators
- `POST /v1/auth/analysts`: add an analyst identity with a hashed password
- `POST /v1/evaluation/benchmark`: run the deterministic synthetic holdout benchmark
- `GET /v1/evaluations`: list persisted evaluations for analyst queues (`limit`, `institution_ref`, and `decision` filters)
- `GET /v1/evaluations/{evaluation_id}/case`: read assignment and resolution state for a persisted evaluation
- `PUT /v1/evaluations/{evaluation_id}/case`: assign or resolve a case and append an audit record
- `GET /v1/evaluations/{evaluation_id}/audit`: read the traceable activity history for an evaluation
- `GET /explain/{evaluation_id}`: retrieve the persisted decision evidence

The pre-transfer endpoint returns the recommendation and evidence in under the engine's 50 ms budget for the in-memory path. Use `Observe` while shadowing decisions and `Enforce` when the institution is ready to act on the recommendation. Reuse the same `Idempotency-Key` when retrying an action request.

Every evaluation carries the selected `institution_ref` so the same risk path can serve multiple banks, fintechs, wallets, or microfinance institutions. The default demo directory contains Apex MFB, Kuda, OPay, and PalmPay. With `DATABASE_URL` configured, new institutions added through `POST /v1/institutions` are persisted in the `institutions` table; local development without a database uses an in-memory directory.

Each institution has persisted challenge, review, and block thresholds. The risk score is calculated by the shared engine, then classified using the selected institution's policy bands.

The analyst-facing web workspace uses a signed HTTP-only session at `/login`. The Next.js BFF sends credentials to `/v1/auth/login`; the API verifies the hashed password and returns the analyst identity. The first administrator is seeded from `NCHE_ANALYST_EMAIL` and `NCHE_ANALYST_PASSWORD`. Administrators can add more identities from Command settings or the API.

Production service routes require `X-Nche-API-Key`. The Next.js BFF reads `NCHE_API_KEY` on the server and forwards it without exposing the key to the browser. Every response includes an `X-Request-ID` value for tracing a decision across the web and API services.

Sensitive evaluations, event ingestion, analyst authentication, analyst creation, and institution changes write append-only audit records when PostgreSQL is configured. Local development keeps the same records in memory.

OpenAPI docs are available at `/docs` outside production. Production disables the interactive docs by default.
