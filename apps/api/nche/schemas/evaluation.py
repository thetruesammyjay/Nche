from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

from .risk import Decision, EvaluationMode, RiskLevel


class BenchmarkMetric(BaseModel):
    model: str
    precision: float = Field(ge=0, le=1)
    recall: float = Field(ge=0, le=1)
    f1: float = Field(ge=0, le=1)
    false_positive_rate: float = Field(ge=0, le=1)


class BenchmarkReport(BaseModel):
    run_id: str
    seed: int
    scenario_count: int = Field(ge=1)
    events_evaluated: int = Field(ge=1)
    generated_at: datetime
    provenance: str = "synthetic"
    metrics: list[BenchmarkMetric] = Field(min_length=1)


class CaseStatus(StrEnum):
    NEW = "NEW"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"


class EvaluationSummary(BaseModel):
    """Safe list representation used by analyst queues."""

    evaluation_id: str
    customer_ref: str
    institution_ref: str | None = None
    decision: Decision
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    recommended_action: str
    policy_rule: str
    primary_reason: str
    model_version: str
    created_at: datetime
    mode: EvaluationMode
    enforced: bool
    case_status: CaseStatus = CaseStatus.NEW
    assigned_to: str | None = None


class CaseUpdate(BaseModel):
    status: CaseStatus
    assigned_to: str | None = Field(default=None, max_length=320)


class EvaluationCase(BaseModel):
    evaluation_id: str
    status: CaseStatus
    assigned_to: str | None = None
    updated_at: datetime


class AuditEntry(BaseModel):
    id: int
    action: str
    actor_ref: str | None = None
    institution_ref: str | None = None
    evaluation_id: str | None = None
    request_id: str | None = None
    occurred_at: datetime
    metadata: dict = Field(default_factory=dict)
