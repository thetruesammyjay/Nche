from datetime import datetime, timezone
from uuid import uuid4

from nche.schemas.risk import Decision, Evidence, RiskEvaluation, RiskLevel, RiskRequest

from .rules import rule_score


def evaluate(request: RiskRequest) -> RiskEvaluation:
    score, reasons = rule_score(request.events)
    level = RiskLevel.LOW if score < 30 else RiskLevel.MEDIUM if score < 60 else RiskLevel.HIGH if score < 80 else RiskLevel.CRITICAL
    decision = Decision.ALLOW if score < 30 else Decision.CHALLENGE if score < 60 else Decision.REVIEW if score < 80 else Decision.BLOCK
    evidence = [Evidence(event=reason, weight=round(1 / max(len(reasons), 1), 2)) for reason in reasons]
    return RiskEvaluation(
        evaluation_id=f"evaluation_{uuid4().hex[:8]}",
        decision=decision,
        risk_score=score,
        risk_level=level,
        recommended_action=decision.value.lower(),
        policy_rule="ATO_CRITICAL_001" if decision == Decision.BLOCK else "ATO_BASELINE_001",
        primary_reason="account_takeover_sequence" if len(reasons) >= 3 else "behavioural_deviation",
        evidence=evidence,
        model_version="nche-risk-v0.1.0",
        created_at=datetime.now(timezone.utc),
    )
