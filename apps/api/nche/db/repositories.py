from __future__ import annotations

from typing import Protocol

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from nche.schemas.events import NcheEvent
from nche.schemas.risk import RiskEvaluation

from .database import Database
from .models import EvaluationRecord, EventRecord


class EvaluationRepository(Protocol):
    async def save_evaluation(self, customer_ref: str, institution_ref: str | None, evaluation: RiskEvaluation) -> None: ...
    async def get_evaluation(self, evaluation_id: str) -> RiskEvaluation | None: ...
    async def save_event(self, event: NcheEvent) -> None: ...


class InMemoryRepository:
    def __init__(self) -> None:
        self.evaluations: dict[str, RiskEvaluation] = {}
        self.events: dict[str, NcheEvent] = {}

    async def save_evaluation(self, customer_ref: str, institution_ref: str | None, evaluation: RiskEvaluation) -> None:
        self.evaluations[evaluation.evaluation_id] = evaluation

    async def get_evaluation(self, evaluation_id: str) -> RiskEvaluation | None:
        return self.evaluations.get(evaluation_id)

    async def save_event(self, event: NcheEvent) -> None:
        self.events[event.event_id] = event


class PostgresRepository:
    def __init__(self, database: Database) -> None:
        self.database = database

    async def save_evaluation(self, customer_ref: str, institution_ref: str | None, evaluation: RiskEvaluation) -> None:
        async with self.database.session() as session:
            record = EvaluationRecord(
                evaluation_id=evaluation.evaluation_id,
                customer_ref=customer_ref,
                institution_ref=institution_ref,
                decision=evaluation.decision.value,
                risk_score=evaluation.risk_score,
                created_at=evaluation.created_at,
                payload=evaluation.model_dump(mode="json"),
            )
            session.add(record)
            await session.commit()

    async def get_evaluation(self, evaluation_id: str) -> RiskEvaluation | None:
        async with self.database.session() as session:
            record = await session.scalar(select(EvaluationRecord).where(EvaluationRecord.evaluation_id == evaluation_id))
            return RiskEvaluation.model_validate(record.payload) if record else None

    async def save_event(self, event: NcheEvent) -> None:
        async with self.database.session() as session:
            session.add(EventRecord(
                event_id=event.event_id,
                customer_ref=event.customer_ref,
                event_name=event.event_name.value,
                channel=event.channel.value,
                occurred_at=event.occurred_at,
                payload=event.model_dump(mode="json"),
            ))
            try:
                await session.commit()
            except IntegrityError:
                await session.rollback()