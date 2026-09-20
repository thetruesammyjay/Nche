from datetime import UTC, datetime

from fastapi.testclient import TestClient

from nche.db.repositories import InMemoryRepository
from nche.main import app


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
        response = client.post("/risk/evaluate", json=payload)
        assert response.status_code == 200
        evaluation_id = response.json()["evaluation_id"]

        explanation = client.get(f"/explain/{evaluation_id}")
        assert explanation.status_code == 200
        assert explanation.json()["evaluation_id"] == evaluation_id


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
        headers = {"X-Nche-Mode": "Enforce", "Idempotency-Key": "action-test-1"}
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


def test_institutions_can_be_listed_and_added_for_a_demo_workspace() -> None:
    with TestClient(app) as client:
        listed = client.get("/v1/institutions")
        assert listed.status_code == 200
        assert {item["institution_ref"] for item in listed.json()} >= {"apex_mfb", "kuda", "opay"}

        created = client.post(
            "/v1/institutions",
            json={
                "institution_ref": "demo_bank",
                "name": "Demo Commercial Bank",
                "institution_type": "bank",
            },
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
        )
        assert unknown.status_code == 404
