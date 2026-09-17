from datetime import UTC, datetime
from uuid import uuid4

from nche.schemas.risk import Decision, Evidence, RiskEvaluation, RiskRequest
from nche.version import MODEL_VERSION

from .rules import rule_score
from .thresholds import classify


def evaluate(request: RiskRequest) -> RiskEvaluation:
    score, reasons = rule_score(request.events)
    level, decision = classify(score)
    ordered_events = sorted(request.events, key=lambda event: event.occurred_at)
    event_weights = {
        "new_device_login": 0.21,
        "password_reset": 0.15,
        "beneficiary_created": 0.17,
        "transfer_initiated": 0.22,
    }
    evidence: list[Evidence] = []
    for reason in reasons:
        matching = next((event for event in ordered_events if event.event_name.value == reason), None)
        if matching is None:
            evidence.append(Evidence(event=reason, weight=event_weights.get(reason)))
            continue
        index = ordered_events.index(matching)
        previous = ordered_events[index - 1] if index else None
        seconds_after_previous = (
            max(0, int((matching.occurred_at - previous.occurred_at).total_seconds()))
            if previous is not None
            else None
        )
        median = matching.metadata.get("customer_median_amount")
        amount_vs_median = (
            round(matching.amount / float(median), 2)
            if matching.amount is not None and isinstance(median, (int, float)) and median > 0
            else None
        )
        observed = matching.channel.value
        if matching.device_ref:
            observed = f"{observed} · {matching.device_ref}"
        if matching.beneficiary_ref:
            observed = f"{observed} · {matching.beneficiary_ref}"
        if matching.amount is not None:
            observed = f"{observed} · amount={matching.amount:g}"
        evidence.append(
            Evidence(
                event=reason,
                weight=event_weights.get(reason),
                seconds_after_previous=seconds_after_previous,
                amount_vs_customer_median=amount_vs_median,
                observed=observed,
                interpretation=_interpretation(reason),
            )
        )
    return RiskEvaluation(
        evaluation_id=f"evaluation_{uuid4().hex[:8]}",
        decision=decision,
        risk_score=score,
        risk_level=level,
        recommended_action=decision.value.lower(),
        policy_rule="ATO_CRITICAL_001" if decision == Decision.BLOCK else "ATO_BASELINE_001",
        primary_reason="account_takeover_sequence" if len(reasons) >= 3 else "behavioural_deviation",
        evidence=evidence,
        model_version=MODEL_VERSION,
        created_at=datetime.now(UTC),
    )


def _interpretation(event_name: str) -> str:
    interpretations = {
        "new_device_login": "Device was not previously associated with the customer session.",
        "password_reset": "Credential state changed during the active sequence.",
        "beneficiary_created": "A destination account was added before the transfer attempt.",
        "transfer_initiated": "A sensitive transfer was attempted after account changes.",
    }
    return interpretations.get(event_name, "Signal observed in the evaluated action sequence.")
