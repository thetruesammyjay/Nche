from datetime import UTC, datetime

from fastapi.testclient import TestClient

from nche.db.repositories import InMemoryRepository
from nche.main import app, settings


def service_headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    headers = {"X-Nche-API-Key": settings.nche_api_key} if settings.api_auth_required and settings.nche_api_key else {}
    headers.update(extra or {})
    return headers


def test_risk_endpoint_persists_explanation_in_local_repository() -> None:
    payload = {
        "customer_ref": "customer_route_test",
        "events": [
            {
                "event_id": "route-event-1",
                "customer_ref": "customer_route_test",
                "event_name": "login",
                "channel": "web",
                "occurred_at": datetime.now(UTC).isoformat(),
            }
        ],
    }
    with TestClient(app) as client:
        app.state.repository = InMemoryRepository()
        response = client.post("/risk/evaluate", json=payload, headers=service_headers())
        assert response.status_code == 200
        evaluation_id = response.json()["evaluation_id"]

        explanation = client.get(f"/explain/{evaluation_id}", headers=service_headers())
        assert explanation.status_code == 200
        assert explanation.json()["evaluation_id"] == evaluation_id
        assert any(audit["action"] == "risk_evaluation" for audit in app.state.repository.audits)


def test_evaluate_action_supports_mode_and_idempotency() -> None:
    payload = {
        "customer_ref": "customer_action_test",
        "institution_ref": "apex_mfb",
        "events": [
            {
                "event_id": "action-event-1",
                "customer_ref": "customer_action_test",
                "event_name": "new_device_login",
                "channel": "web",
                "occurred_at": datetime.now(UTC).isoformat(),
            },
            {
                "event_id": "action-event-2",
                "customer_ref": "customer_action_test",
                "event_name": "transfer_initiated",
                "channel": "web",
                "occurred_at": datetime.now(UTC).isoformat(),
                "amount": 650000,
                "metadata": {"customer_median_amount": 35000},
            },
        ],
    }
    with TestClient(app) as client:
        app.state.repository = InMemoryRepository()
        headers = service_headers({"X-Nche-Mode": "Enforce", "Idempotency-Key": "action-test-1"})
        first = client.post("/v1/evaluate_action", json=payload, headers=headers)
        second = client.post("/v1/evaluate_action", json=payload, headers=headers)

        assert first.status_code == 200
        assert first.json()["mode"] == "Enforce"
        assert first.json()["enforced"] is True
        assert first.json()["institution_ref"] == "apex_mfb"
        assert first.headers["x-nche-latency-ms"]
        assert second.status_code == 200
        assert second.json()["evaluation_id"] == first.json()["evaluation_id"]
        assert second.json()["idempotent_replay"] is True
        assert any(audit["action"] == "action_evaluation" for audit in app.state.repository.audits)
        assert any(audit["action"] == "action_evaluation_replay" for audit in app.state.repository.audits)


def test_institutions_can_be_listed_and_added_for_a_demo_workspace() -> None:
    with TestClient(app) as client:
        listed = client.get("/v1/institutions", headers=service_headers())
        assert listed.status_code == 200
        assert {item["institution_ref"] for item in listed.json()} >= {"apex_mfb", "kuda", "opay"}

        created = client.post(
            "/v1/institutions",
            json={
                "institution_ref": "demo_bank",
                "name": "Demo Commercial Bank",
                "institution_type": "bank",
            },
            headers=service_headers(),
        )
        assert created.status_code == 201
        assert created.json()["name"] == "Demo Commercial Bank"

        duplicate = client.post(
            "/v1/institutions",
            json={
                "institution_ref": "demo_bank",
                "name": "Duplicate Bank",
                "institution_type": "bank",
            },
            headers=service_headers(),
        )
        assert duplicate.status_code == 409

        unknown = client.post(
            "/v1/evaluate_action",
            json={
                "customer_ref": "customer_unknown_institution",
                "institution_ref": "not_registered",
                "events": [{
                    "event_id": "unknown-institution-event",
                    "customer_ref": "customer_unknown_institution",
                    "event_name": "login",
                    "channel": "web",
                    "occurred_at": datetime.now(UTC).isoformat(),
                }],
            },
            headers=service_headers(),
        )
        assert unknown.status_code == 404


def test_service_routes_require_configured_api_key() -> None:
    original_key = settings.nche_api_key
    settings.nche_api_key = "test-service-key"
    try:
        payload = {
            "customer_ref": "customer_key_test",
            "events": [{
                "event_id": "key-event-1",
                "customer_ref": "customer_key_test",
                "event_name": "login",
                "channel": "web",
                "occurred_at": datetime.now(UTC).isoformat(),
            }],
        }
        with TestClient(app) as client:
            denied = client.post("/risk/evaluate", json=payload)
            allowed = client.post("/risk/evaluate", json=payload, headers={"X-Nche-API-Key": "test-service-key"})
        assert denied.status_code == 401
        assert allowed.status_code == 200
    finally:
        settings.nche_api_key = original_key


def test_analyst_login_uses_persistent_directory_seed() -> None:
    headers = {"X-Nche-API-Key": settings.nche_api_key} if settings.api_auth_required and settings.nche_api_key else {}
    with TestClient(app) as client:
        valid = client.post(
            "/v1/auth/login",
            json={"email": settings.nche_analyst_email or "analyst@nche.demo", "password": settings.nche_analyst_password or "demo-analyst"},
            headers=headers,
        )
        invalid = client.post(
            "/v1/auth/login",
            json={"email": "analyst@nche.demo", "password": "wrong-password"},
            headers=headers,
        )

    assert valid.status_code == 200
    assert valid.json()["role"] == "Admin"
    assert invalid.status_code == 401


def test_admin_can_add_and_authenticate_another_analyst() -> None:
    headers = service_headers()
    with TestClient(app) as client:
        created = client.post(
            "/v1/auth/analysts",
            json={"email": "new.analyst@example.com", "name": "New Analyst", "role": "Analyst", "password": "safe-demo-password"},
            headers=headers,
        )
        login = client.post(
            "/v1/auth/login",
            json={"email": "new.analyst@example.com", "password": "safe-demo-password"},
            headers=headers,
        )

    assert created.status_code == 201
    assert created.json()["role"] == "Analyst"
    assert login.status_code == 200
    assert login.json()["name"] == "New Analyst"


def test_benchmark_endpoint_returns_reproducible_metrics() -> None:
    with TestClient(app) as client:
        response = client.post("/v1/evaluation/benchmark", headers=service_headers())

    body = response.json()
    assert response.status_code == 200
    assert body["seed"] == 42
    assert body["scenario_count"] == 5
    assert body["events_evaluated"] == 14
    assert {metric["model"] for metric in body["metrics"]} == {"Rules only", "Behaviour model", "Nche hybrid"}


def test_evaluation_index_returns_persisted_decisions_for_analyst_queue() -> None:
    payload = {
        "customer_ref": "customer_index_test",
        "institution_ref": "apex_mfb",
        "events": [{
            "event_id": "index-event-1",
            "customer_ref": "customer_index_test",
            "event_name": "login",
            "channel": "web",
            "occurred_at": datetime.now(UTC).isoformat(),
        }],
    }
    with TestClient(app) as client:
        app.state.repository = InMemoryRepository()
        created = client.post("/v1/evaluate_action", json=payload, headers=service_headers())
        listed = client.get("/v1/evaluations?limit=10&decision=ALLOW", headers=service_headers())

    assert created.status_code == 200
    assert listed.status_code == 200
    assert listed.json()[0]["evaluation_id"] == created.json()["evaluation_id"]
    assert listed.json()[0]["customer_ref"] == "customer_index_test"
    assert listed.json()[0]["institution_ref"] == "apex_mfb"


def test_institution_policy_bands_are_persisted_and_used_for_classification() -> None:
    with TestClient(app) as client:
        updated = client.put(
            "/v1/institutions/apex_mfb/policy",
            json={"challenge_from": 10, "review_from": 40, "block_from": 70},
            headers=service_headers({"X-Actor-Ref": "admin@nche.demo"}),
        )
        response = client.post(
            "/v1/evaluate_action",
            json={
                "customer_ref": "customer_policy_test",
                "institution_ref": "apex_mfb",
                "events": [{
                    "event_id": "policy-event-1",
                    "customer_ref": "customer_policy_test",
                    "event_name": "new_device_login",
                    "channel": "web",
                    "occurred_at": datetime.now(UTC).isoformat(),
                }],
            },
            headers=service_headers(),
        )
        invalid = client.put(
            "/v1/institutions/apex_mfb/policy",
            json={"challenge_from": 80, "review_from": 40, "block_from": 90},
            headers=service_headers(),
        )

    assert updated.status_code == 200
    assert updated.json()["updated_by"] == "admin@nche.demo"
    assert response.status_code == 200
    assert response.json()["risk_score"] == 21
    assert response.json()["decision"] == "CHALLENGE"
    assert invalid.status_code == 422


def test_analyst_can_assign_and_resolve_an_evaluation_case() -> None:
    payload = {
        "customer_ref": "customer_case_workflow",
        "institution_ref": "apex_mfb",
        "events": [{
            "event_id": "case-workflow-event-1",
            "customer_ref": "customer_case_workflow",
            "event_name": "login",
            "channel": "web",
            "occurred_at": datetime.now(UTC).isoformat(),
        }],
    }
    with TestClient(app) as client:
        app.state.repository = InMemoryRepository()
        created = client.post("/v1/evaluate_action", json=payload, headers=service_headers())
        evaluation_id = created.json()["evaluation_id"]
        initial = client.get(f"/v1/evaluations/{evaluation_id}/case", headers=service_headers())
        assigned = client.put(
            f"/v1/evaluations/{evaluation_id}/case",
            json={"status": "IN_REVIEW", "assigned_to": "analyst@nche.demo"},
            headers=service_headers({"X-Actor-Ref": "analyst@nche.demo"}),
        )
        resolved = client.put(
            f"/v1/evaluations/{evaluation_id}/case",
            json={"status": "RESOLVED", "assigned_to": "analyst@nche.demo"},
            headers=service_headers({"X-Actor-Ref": "analyst@nche.demo"}),
        )
        audit = client.get(f"/v1/evaluations/{evaluation_id}/audit", headers=service_headers())
        listed = client.get("/v1/evaluations?limit=10", headers=service_headers())

    assert created.status_code == 200
    assert initial.status_code == 200
    assert initial.json()["status"] == "NEW"
    assert assigned.status_code == 200
    assert assigned.json()["status"] == "IN_REVIEW"
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "RESOLVED"
    assert audit.status_code == 200
    assert [entry["action"] for entry in audit.json()] == ["case_updated", "case_updated", "action_evaluation"]
    summary = next(item for item in listed.json() if item["evaluation_id"] == evaluation_id)
    assert summary["case_status"] == "RESOLVED"
    assert summary["assigned_to"] == "analyst@nche.demo"
    assert sum(audit["action"] == "case_updated" for audit in app.state.repository.audits) == 2
