from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


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
