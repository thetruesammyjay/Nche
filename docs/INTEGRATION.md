# Nche integration guide

This guide shows how a financial institution can call Nche before it submits a sensitive action. The API returns a recommendation and evidence. The institution remains responsible for the final authorization decision and for moving money.

## 1. Configure the service

Set these values on the API deployment:

```text
NCHE_ENV=production
NCHE_API_KEY=<long random service secret>
DATABASE_URL=<PostgreSQL connection string>
DATABASE_REQUIRED=true
CORS_ORIGINS=https://your-command.example
```

Set the same `NCHE_API_KEY` and the API origin in the server-side web deployment. The key must never be exposed in a browser bundle or a `NEXT_PUBLIC_` variable. The API container applies the Alembic migrations before it accepts traffic.

## 2. Register an institution

Each request can carry an institution reference. Register it once through an authenticated service call:

```bash
curl -X POST "$NCHE_API_URL/v1/institutions" \
  -H "X-Nche-API-Key: $NCHE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"institution_ref":"demo_bank","name":"Demo Bank","institution_type":"bank"}'
```

The reference is stable and pseudonymous. Use it on every evaluation so Nche can apply that institution's policy bands and keep its analyst workspace separate.

## 3. Evaluate before submitting a transfer

Send the normalized event sequence to `POST /v1/evaluate_action`:

```bash
curl -X POST "$NCHE_API_URL/v1/evaluate_action" \
  -H "X-Nche-API-Key: $NCHE_API_KEY" \
  -H "X-Nche-Mode: Enforce" \
  -H "Idempotency-Key: transfer_01JY8Q7P3H" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_ref":"customer_123",
    "institution_ref":"demo_bank",
    "events":[
      {"event_id":"evt_login","customer_ref":"customer_123","event_name":"new_device_login","channel":"mobile","occurred_at":"2026-10-10T15:00:00Z","device_ref":"device_abc"},
      {"event_id":"evt_beneficiary","customer_ref":"customer_123","event_name":"beneficiary_created","channel":"mobile","occurred_at":"2026-10-10T15:01:00Z","beneficiary_ref":"beneficiary_new"},
      {"event_id":"evt_transfer","customer_ref":"customer_123","event_name":"transfer_initiated","channel":"mobile","occurred_at":"2026-10-10T15:02:00Z","amount":1000000,"metadata":{"customer_median_amount":35000,"account_balance":1284500}}
    ]
  }'
```

The response contains `evaluation_id`, `decision`, `risk_score`, `recommended_action`, `evidence`, `mode`, `enforced`, and `latency_ms`. A retry with the same idempotency key returns the original evaluation with `idempotent_replay: true`; use a new key for a new action.

Apply the recommendation inside the institution's own authorization flow:

| Response | Suggested institution behavior |
| --- | --- |
| `ALLOW` | Continue the institution's normal authorization checks. |
| `CHALLENGE` | Request an additional verification step. |
| `REVIEW` | Hold the action and send the evaluation to an analyst. |
| `BLOCK` | Stop the action and follow the institution's fraud procedure. |

`Observe` mode records and measures the recommendation without treating it as an enforced decision. Use it while comparing Nche with existing controls. Move to `Enforce` only after the institution approves the action policy.

## 4. Handle failures safely

The API uses standard status codes:

- `401`: missing or invalid service key.
- `404`: institution reference does not exist.
- `422`: event schema or field validation failed.
- `503`: service or database is unavailable.

Set a client timeout appropriate for the action. If Nche is unavailable, the institution must apply its pre-agreed fail-open or fail-closed rule. Do not silently authorize a high-value action without an explicit fallback policy. Log the returned `X-Request-ID` and `X-Nche-Latency-Ms` with the institution's trace identifier.

## 5. Analyst handoff

The Command application reads persisted evaluations from `GET /v1/evaluations`. Analysts can inspect evidence with `GET /explain/{evaluation_id}` and manage the case with:

```text
GET /v1/evaluations/{evaluation_id}/case
PUT /v1/evaluations/{evaluation_id}/case
GET /v1/evaluations/{evaluation_id}/audit
```

Case updates record the analyst, evaluation, request ID, and new status in the append-only audit log when PostgreSQL is configured.

## Data handling

Use pseudonymous customer, device, and beneficiary references. Send only the event fields required for the decision. Do not include passwords, one-time codes, full account numbers, or unredacted identity documents in event metadata. Retention, deletion, access review, and analyst MFA remain responsibilities of the institution's production deployment.
