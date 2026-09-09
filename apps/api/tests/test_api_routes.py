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