from datetime import UTC, datetime, timedelta
from uuid import uuid4

from nche.engine.features import extract_features
from nche.engine.isolation_forest import anomaly_score
from nche.engine.risk_fusion import evaluate
from nche.engine.rules import rule_score
from nche.evaluation.metrics import binary_metrics
from nche.schemas.evaluation import BenchmarkMetric, BenchmarkReport
from nche.schemas.events import EventChannel, EventName, NcheEvent
from nche.schemas.risk import RiskRequest
from nche.simulator.generator import takeover_sequence

SEED = 42


def _event(customer_ref: str, event_id: str, name: EventName, offset: int, *, amount: float | None = None, metadata: dict[str, float] | None = None) -> NcheEvent:
    return NcheEvent(
        event_id=event_id,
        customer_ref=customer_ref,
        event_name=name,
        channel=EventChannel.WEB,
        occurred_at=datetime(2026, 1, 1, tzinfo=UTC) + timedelta(seconds=offset),
        amount=amount,
        metadata=metadata or {},
    )


def benchmark_scenarios() -> list[tuple[str, bool, list[NcheEvent]]]:
    """Return a small deterministic holdout set for a reproducible demo run."""

    normal_metadata = {"customer_median_amount": 35326, "account_balance": 1_284_500}
    return [
        (
            "takeover_sequence",
            True,
            [
                _event("holdout_attack_1", "attack-1-1", EventName.NEW_DEVICE_LOGIN, 0),
                _event("holdout_attack_1", "attack-1-2", EventName.PASSWORD_RESET, 53),
                _event("holdout_attack_1", "attack-1-3", EventName.BENEFICIARY_CREATED, 71),
                _event("holdout_attack_1", "attack-1-4", EventName.TRANSFER_INITIATED, 114, amount=650000, metadata=normal_metadata),
            ],
        ),
        (
            "new_device_pin_takeover",
            True,
            [
                _event("holdout_attack_2", "attack-2-1", EventName.NEW_DEVICE_LOGIN, 0),
                _event("holdout_attack_2", "attack-2-2", EventName.PIN_CHANGE, 41),
                _event("holdout_attack_2", "attack-2-3", EventName.BENEFICIARY_CREATED, 70),
                _event("holdout_attack_2", "attack-2-4", EventName.TRANSFER_INITIATED, 108, amount=600000, metadata=normal_metadata),
            ],
        ),
        (
            "ordinary_transfer",
            False,
            [
                _event("holdout_legitimate_1", "legit-1-1", EventName.LOGIN, 0),
                _event("holdout_legitimate_1", "legit-1-2", EventName.TRANSFER_INITIATED, 95, amount=25000, metadata=normal_metadata),
            ],
        ),
        (
            "ordinary_pin_change",
            False,
            [
                _event("holdout_legitimate_2", "legit-2-1", EventName.LOGIN, 0),
                _event("holdout_legitimate_2", "legit-2-2", EventName.PIN_CHANGE, 120),
            ],
        ),
        (
            "authorized_new_device_transfer",
            False,
            [
                _event("holdout_legitimate_3", "legit-3-1", EventName.NEW_DEVICE_LOGIN, 0),
                _event("holdout_legitimate_3", "legit-3-2", EventName.TRANSFER_INITIATED, 80, amount=300000, metadata=normal_metadata),
            ],
        ),
    ]


def _metric(name: str, predictions: list[tuple[bool, bool]]) -> BenchmarkMetric:
    true_positive = sum(actual and predicted for actual, predicted in predictions)
    false_positive = sum(not actual and predicted for actual, predicted in predictions)
    false_negative = sum(actual and not predicted for actual, predicted in predictions)
    true_negative = sum(not actual and not predicted for actual, predicted in predictions)
    values = binary_metrics(true_positive, false_positive, false_negative, true_negative)
    return BenchmarkMetric(model=name, **values)


def run_benchmark() -> BenchmarkReport:
    scenarios = benchmark_scenarios()
    rule_predictions: list[tuple[bool, bool]] = []
    behaviour_predictions: list[tuple[bool, bool]] = []
    hybrid_predictions: list[tuple[bool, bool]] = []
    for _name, actual, events in scenarios:
        rule_value, _reasons = rule_score(events)
        behaviour_value = anomaly_score(extract_features(events))
        hybrid_value = evaluate(RiskRequest(customer_ref=events[0].customer_ref, events=events)).risk_score
        # The rules-only baseline flags any score that needs a challenge or review.
        rule_predictions.append((actual, rule_value >= 30))
        behaviour_predictions.append((actual, behaviour_value >= 0.75))
        hybrid_predictions.append((actual, hybrid_value >= 60))

    return BenchmarkReport(
        run_id=f"benchmark_{uuid4().hex[:8]}",
        seed=SEED,
        scenario_count=len(scenarios),
        events_evaluated=sum(len(events) for _name, _actual, events in scenarios),
        generated_at=datetime.now(UTC),
        metrics=[
            _metric("Rules only", rule_predictions),
            _metric("Behaviour model", behaviour_predictions),
            _metric("Nche hybrid", hybrid_predictions),
        ],
    )


def run() -> dict[str, int | str]:
    result = evaluate(RiskRequest(customer_ref="customer_demo", events=takeover_sequence()))
    return {"engine": "nche-hybrid-mvp", "decision": result.decision.value, "risk_score": result.risk_score}


if __name__ == "__main__":
    print(run())
