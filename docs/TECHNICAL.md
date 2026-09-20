# Nche Technical Guide

This document is the engineering reference for the current Nche implementation. For the product explanation, start with the root [README.md](../README.md).

## Repository structure

| Area | Purpose |
| --- | --- |
| `apps/api` | FastAPI risk service, event schemas, risk fusion, repositories, and API tests |
| `apps/web` | Next.js public demo, analyst workspace, authentication, and API routes |
| `packages/types` | Shared TypeScript request and response types |
| `packages/ui` | Shared React risk, decision, and timeline components |
| `docs` | Architecture, demo instructions, and technical reference |

## Local development

From the repository root, install JavaScript dependencies if needed:

```powershell
pnpm install
```

Start the API in one terminal:

```powershell
cd apps/api
uv sync
uv run uvicorn nche.main:app --reload
```

Start the web app in a second terminal from the repository root:

```powershell
pnpm --filter @nche/web dev
```

The API runs with an in-memory repository when `DATABASE_URL` is not set. The web app uses `NCHE_API_URL`, defaulting to `http://localhost:8000`.

The root `.env.example` documents the shared variables. Analyst credentials are `NCHE_ANALYST_EMAIL` and `NCHE_ANALYST_PASSWORD`; the demo defaults are `analyst@nche.demo` and `demo-analyst`.

## Demo routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/demo` | Public financial-app account view | Public |
| `/demo/transfer` | Seeded takeover transfer story | Public |
| `/login` | Analyst sign-in | Public |
| `/overview` | Nche Command overview | Analyst session |
| `/institutions` | List and add institutions for the running demo | Analyst session |
| `/evaluation/new` | Build and run one analysis from scratch | Analyst session |
| `/investigations/[caseId]` | Review event sequence and evidence | Analyst session |

The analyst workspace is protected by `apps/web/middleware.ts`. The login route sets an HTTP-only session cookie, and the Command shell provides logout. This is a demonstration session mechanism; production should use an established identity provider, signed session tokens, account recovery, MFA, audit logging, and role-based access control.

## API endpoints

The FastAPI application is created in `apps/api/nche/main.py`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness check |
| `GET` | `/health/ready` | Readiness and database state |
| `POST` | `/events/ingest` | Store a normalized event |
| `POST` | `/risk/evaluate` | Run and persist a standard risk evaluation |
| `POST` | `/v1/evaluate_action` | Evaluate a sensitive action before submission |
| `GET` | `/v1/institutions` | List institutions in the demo registry |
| `POST` | `/v1/institutions` | Add an institution to the demo registry |
| `GET` | `/explain/{evaluation_id}` | Retrieve a persisted evaluation |

Interactive OpenAPI documentation is available at `http://localhost:8000/docs` outside production.

### Sensitive-action evaluation

`POST /v1/evaluate_action` accepts a `RiskRequest`:

```json
{
  "customer_ref": "customer_demo",
  "institution_ref": "apex_mfb",
  "events": [
    {
      "event_id": "analysis-1",
      "customer_ref": "customer_demo",
      "event_name": "new_device_login",
      "channel": "web",
      "occurred_at": "2026-09-19T10:00:00Z"
    }
  ]
}
```

Supported event channels are `mobile`, `web`, `ussd`, and `api`. Supported event names are `login`, `new_device_login`, `password_reset`, `pin_change`, `beneficiary_created`, and `transfer_initiated`.

The endpoint accepts:

- `X-Nche-Mode: Observe` for shadow evaluation.
- `X-Nche-Mode: Enforce` when the institution is ready to act on the recommendation.
- `Idempotency-Key` to make retries safe.

The response includes the decision, score, level, recommended action, policy rule, primary reason, institution reference, evidence, model version, mode, enforcement state, latency, and replay state.

```json
{
  "evaluation_id": "evaluation_4b19",
  "institution_ref": "apex_mfb",
  "decision": "BLOCK",
  "risk_score": 100,
  "risk_level": "critical",
  "recommended_action": "block",
  "policy_rule": "ATO_CRITICAL_001",
  "primary_reason": "account_takeover_sequence",
  "mode": "Enforce",
  "enforced": true,
  "idempotent_replay": false,
  "latency_ms": 2.41,
  "fallback": false,
  "evidence": [
    { "event": "new_device_login", "seconds_after_previous": 0 },
    { "event": "password_reset", "seconds_after_previous": 53 },
    { "event": "beneficiary_created", "seconds_after_previous": 18 },
    { "event": "transfer_initiated", "amount_vs_customer_median": 18.4 }
  ],
  "model_version": "nche-risk-v0.3.0"
}
```

If the same idempotency key is submitted again, the stored evaluation is returned with `idempotent_replay: true`. The service also exposes `X-Nche-Latency-Ms`.

## Current risk logic

The current action path uses deterministic rules in `apps/api/nche/engine/rules.py` and classification in `thresholds.py`:

| Signal | Score contribution |
| --- | ---: |
| New device login | 21 |
| Password or PIN reset | 15 |
| New beneficiary | 17 |
| Transfer initiated | 22 |
| Transfer amount anomaly | `min(35, max(0, round((amount / customer_median - 1) * 2)))` |
| Three or more takeover signals | 15 bonus |

The score is capped at 100 and classified as follows:

| Score | Level | Decision |
| ---: | --- | --- |
| 0–29 | Low | Allow |
| 30–59 | Medium | Challenge |
| 60–79 | High | Review |
| 80–100 | Critical | Block |

The amount anomaly contribution is only applied when the transfer event includes a positive `customer_median_amount` metadata value. The same calculation powers the transfer demo's live Current risk preview, so increasing the amount raises the score before submission. The risk fusion layer also adds timing, observed channel, device or beneficiary references, amount-to-median ratio, and a human-readable interpretation to each evidence item. An LLM is not required for the decision.

## Multi-institution support

The default registry in `apps/api/nche/institutions.py` includes:

- `apex_mfb` — Apex Microfinance Bank
- `kuda` — Kuda Microfinance Bank
- `opay` — OPay
- `palmpay` — PalmPay

The analyst can add another institution through the Command page or `POST /v1/institutions`. Evaluations with an unknown `institution_ref` return `404`. The current registry is process-local and resets when the API restarts; the existing risk evaluation table already stores `institution_ref`, but a production institution directory needs its own persistent table and policy configuration.

## Frontend/API boundary

The browser calls same-origin Next.js routes for protected workspace data:

- `POST /api/risk/evaluate-action` forwards to `/v1/evaluate_action`.
- `GET /api/institutions` forwards to `/v1/institutions`.
- `POST /api/institutions` forwards to `/v1/institutions`.

The transfer demo uses a 50 ms upstream window and fails open to local institution rules when Nche is unavailable. Its amount field updates a pre-submit risk preview using the same customer-median anomaly calculation as the API. The from-scratch analyst analysis uses the same action contract and renders the returned institution, decision mode, latency, replay state, score, and evidence. The root layout also includes a lightweight client route-loading overlay for internal page navigation.

## Persistence and migrations

When `DATABASE_URL` is configured, SQLAlchemy uses PostgreSQL and the container applies Alembic migrations before startup. The current migrations are:

- `0001_initial` — events and risk evaluations.
- `0002_add_idempotency_key` — safe retry storage.

Without `DATABASE_URL`, `InMemoryRepository` stores events and evaluations for the current process. Institution records currently use a separate in-memory registry for the demo.

## Validation commands

Run API tests and linting from `apps/api`:

```powershell
$env:UV_CACHE_DIR = "$PWD\.uv-cache"
uv run --no-cache pytest
uv run --no-cache ruff check nche tests
```

Run the web type check from `apps/web`:

```powershell
node ..\..\node_modules\.pnpm\typescript@5.9.3\node_modules\typescript\bin\tsc --noEmit
```

## Production work still required

The demo proves the product flow; it is not a finished production security service. Before production use, the project needs:

- A real identity provider, MFA, signed sessions, roles, and audit trails.
- Persistent institution records and institution-specific risk policies.
- Secret management and environment separation.
- Rate limits, request authentication, structured logging, monitoring, and alerting.
- Real institution event data and validation against held-out production-like sequences.
- A reviewed fail-open or fail-closed policy for each institution and action type.
