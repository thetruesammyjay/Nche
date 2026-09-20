from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

from .events import NcheEvent


class Decision(StrEnum):
    ALLOW = "ALLOW"
    CHALLENGE = "CHALLENGE"
    BLOCK = "BLOCK"
    REVIEW = "REVIEW"


class EvaluationMode(StrEnum):
    """Controls whether the recommendation is shadowed or enforced."""

    OBSERVE = "Observe"
    ENFORCE = "Enforce"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Evidence(BaseModel):
    event: str
    weight: float | None = None
    seconds_after_previous: int | None = None
    amount_vs_customer_median: float | None = None
    balance_usage_ratio: float | None = None
    observed: str | None = None
    interpretation: str | None = None


class RiskRequest(BaseModel):
    customer_ref: str
    events: list[NcheEvent] = Field(min_length=1)
    institution_ref: str | None = None


class RiskEvaluation(BaseModel):
    evaluation_id: str
    decision: Decision
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    recommended_action: str
    policy_rule: str
    primary_reason: str
    evidence: list[Evidence]
    model_version: str
    created_at: datetime
    institution_ref: str | None = None
    mode: EvaluationMode = EvaluationMode.OBSERVE
    enforced: bool = False
    idempotent_replay: bool = False
    latency_ms: float | None = Field(default=None, ge=0)
    fallback: bool = False
