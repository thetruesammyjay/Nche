# Nche Hackathon Submission Brief

## Chosen track

Nche fits **Combating Digital Fraud and Financial Crime**. It helps a financial institution detect a suspicious account-takeover sequence before a transfer is completed.

## Problem

A valid password and one-time code do not prove that the legitimate customer controls an account. After access, an attacker can change a credential, add a new beneficiary, and attempt a large transfer within minutes. A single-event rule misses the relationship between those actions. A manual review that starts after settlement cannot prevent the loss.

## Solution

Nche receives normalized events from an institution's digital channels. It evaluates the sequence, timing, device, recipient, transfer amount, customer history, and available balance. It returns a risk score, a recommendation, and evidence that an analyst can inspect.

The institution keeps final authority. It can allow the action, challenge the customer, send the case to review, or block the transfer. Nche is decision support beside the payment flow; it does not move money.

## What the demo proves

1. A customer begins in a simulated financial application.
2. The customer enters a transfer amount against an available balance.
3. The Current risk value updates as the amount becomes unusual or consumes more of the balance.
4. Nche evaluates a new device, credential reset, new beneficiary, and transfer as one sequence.
5. Nche Command shows the recommendation, evidence, institution, latency, enforcement mode, and a case workflow where an analyst can assign or resolve the evaluation.
6. An administrator can add an analyst or institution, then run a new analysis from scratch.
7. The evaluation workspace runs a fixed-seed synthetic holdout and shows measured baseline metrics.

The demo uses simulated events and never submits a real payment. It supports Apex MFB, Kuda, OPay, PalmPay, and additional institution workspaces.

## Measurable value

The prototype makes four outcomes visible during a live presentation:

- Earlier intervention: the score is available before the transfer is submitted.
- Fewer unexplained blocks: each recommendation includes the event sequence and calculation evidence.
- Lower integration cost: institutions send one normalized action request instead of building a separate decision flow for every channel.
- Multi-institution scale: the same service contract carries an institution reference and persistent workspace directory.

The repository now includes a fixed-seed synthetic holdout run that measures recall, precision, F1, false-positive rate, and event coverage. The next evaluation stage should repeat those measures on institution-approved fraud and legitimate-action scenarios and add analyst review time.

## Implementation path

The API is a FastAPI service with deterministic, bounded risk rules and explainable evidence. PostgreSQL stores events, evaluations, idempotency keys, institution workspaces, hashed analyst identities, and an append-only audit trail. The Next.js application provides the customer demo, API-backed analyst authentication, analyst management, institution management, evaluation, and investigation views. A server-side API key protects service-to-service traffic. Signed analyst cookies, request IDs, health checks, database migrations, audit records, and a local fallback make the prototype safer to operate during a live demo.

The scoring engine is intentionally replaceable. A production model can add recipient reputation, transaction-graph features, mule-account relationships, SIM-swap intelligence, and institution-specific policies while keeping the same evidence contract.

## Production controls for the prototype

- Set `NCHE_API_KEY` on the API and web deployments.
- Set a long random `NCHE_SESSION_SECRET` on the web deployment.
- Set `DATABASE_URL`, `DATABASE_REQUIRED=true`, and the production CORS origin on the API.
- Apply Alembic migrations before the API accepts traffic.
- Keep simulated data and credentials separate from any live banking environment.
- Review fail-open or fail-closed behavior with the participating institution before connecting a real action flow.

## Presentation sequence

Open the public demo, enter a high-value transfer, show the risk change, submit it, and open the resulting decision evidence. Then sign in to Nche Command, select an institution, and run the same sequence from the new-analysis page. Close by showing the API contract, persistence, and the path from the prototype to graph-based fraud intelligence.

The event page lists problem, solution, impact, target-user, implementation, and team information as submission requirements. This brief covers the product sections; add the team members and roles before submitting the pitch deck.

Reference: [Zenith Bank Zecathon 6.0](https://beyondlimits.global/zecathonhackathon/)
