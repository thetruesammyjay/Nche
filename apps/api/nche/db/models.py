from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class InstitutionRecord(Base):
    __tablename__ = "institutions"

    institution_ref: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    institution_type: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InstitutionPolicyRecord(Base):
    __tablename__ = "institution_policies"

    institution_ref: Mapped[str] = mapped_column(String(80), primary_key=True)
    challenge_from: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    review_from: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    block_from: Mapped[int] = mapped_column(Integer, nullable=False, default=80)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_by: Mapped[str | None] = mapped_column(String(320), nullable=True)


class AnalystUserRecord(Base):
    __tablename__ = "analyst_users"

    email: Mapped[str] = mapped_column(String(320), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20), default="Analyst")
    password_hash: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuditRecord(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    actor_ref: Mapped[str | None] = mapped_column(String(320), nullable=True, index=True)
    institution_ref: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
    evaluation_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    request_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    details: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class EvaluationRecord(Base):
    __tablename__ = "risk_evaluations"

    evaluation_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    customer_ref: Mapped[str] = mapped_column(String(160), index=True)
    institution_ref: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
    decision: Mapped[str] = mapped_column(String(20), index=True)
    risk_score: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(160), nullable=True, unique=True, index=True)
    payload: Mapped[dict] = mapped_column(JSONB)
    case_status: Mapped[str] = mapped_column(String(20), nullable=False, default="NEW", server_default="NEW")
    assigned_to: Mapped[str | None] = mapped_column(String(320), nullable=True)
    case_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EventRecord(Base):
    __tablename__ = "events"
    __table_args__ = (UniqueConstraint("event_id", name="uq_events_event_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(160), index=True)
    customer_ref: Mapped[str] = mapped_column(String(160), index=True)
    event_name: Mapped[str] = mapped_column(String(80), index=True)
    channel: Mapped[str] = mapped_column(String(40))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    payload: Mapped[dict] = mapped_column(JSONB)
