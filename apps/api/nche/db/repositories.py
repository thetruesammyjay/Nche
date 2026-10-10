from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import bindparam, desc, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import IntegrityError, ProgrammingError

from nche.schemas.evaluation import (
    AuditEntry,
    CaseStatus,
    CaseUpdate,
    EvaluationCase,
    EvaluationSummary,
)
from nche.schemas.events import NcheEvent
from nche.schemas.risk import RiskEvaluation

from .database import Database
from .models import AuditRecord, EvaluationRecord, EventRecord

logger = logging.getLogger("nche.api.audit")


class EvaluationRepository(Protocol):
    async def save_evaluation(
        self,
        customer_ref: str,
        institution_ref: str | None,
        evaluation: RiskEvaluation,
        idempotency_key: str | None = None,
    ) -> None: ...
    async def get_evaluation(self, evaluation_id: str) -> RiskEvaluation | None: ...
    async def get_evaluation_by_idempotency_key(self, idempotency_key: str) -> RiskEvaluation | None: ...
    async def list_evaluations(
        self,
        *,
        limit: int = 50,
        institution_ref: str | None = None,
        decision: str | None = None,
    ) -> list[EvaluationSummary]: ...
    async def get_case(self, evaluation_id: str) -> EvaluationCase | None: ...
    async def update_case(self, evaluation_id: str, update: CaseUpdate) -> EvaluationCase | None: ...
    async def list_audit(self, evaluation_id: str, *, limit: int = 50) -> list[AuditEntry]: ...
    async def save_event(self, event: NcheEvent) -> None: ...
    async def save_audit(
        self,
        action: str,
        *,
        actor_ref: str | None = None,
        institution_ref: str | None = None,
        evaluation_id: str | None = None,
        request_id: str | None = None,
        metadata: dict | None = None,
    ) -> None: ...


class InMemoryRepository:
    def __init__(self) -> None:
        self.evaluations: dict[str, RiskEvaluation] = {}
        self.evaluation_context: dict[str, tuple[str, str | None]] = {}
        self.cases: dict[str, EvaluationCase] = {}
        self.idempotency_keys: dict[str, RiskEvaluation] = {}
        self.events: dict[str, NcheEvent] = {}
        self.audits: list[dict] = []

    async def save_evaluation(
        self,
        customer_ref: str,
        institution_ref: str | None,
        evaluation: RiskEvaluation,
        idempotency_key: str | None = None,
    ) -> None:
        self.evaluations[evaluation.evaluation_id] = evaluation
        self.evaluation_context[evaluation.evaluation_id] = (customer_ref, institution_ref)
        self.cases.setdefault(
            evaluation.evaluation_id,
            EvaluationCase(evaluation_id=evaluation.evaluation_id, status=CaseStatus.NEW, updated_at=evaluation.created_at),
        )
        if idempotency_key:
            self.idempotency_keys[idempotency_key] = evaluation

    async def get_evaluation(self, evaluation_id: str) -> RiskEvaluation | None:
        return self.evaluations.get(evaluation_id)

    async def get_evaluation_by_idempotency_key(self, idempotency_key: str) -> RiskEvaluation | None:
        return self.idempotency_keys.get(idempotency_key)

    async def list_evaluations(
        self,
        *,
        limit: int = 50,
        institution_ref: str | None = None,
        decision: str | None = None,
    ) -> list[EvaluationSummary]:
        items = sorted(self.evaluations.values(), key=lambda item: item.created_at, reverse=True)
        summaries: list[EvaluationSummary] = []
        for evaluation in items:
            customer_ref, stored_institution_ref = self.evaluation_context.get(
                evaluation.evaluation_id,
                ("unknown", evaluation.institution_ref),
            )
            if institution_ref and stored_institution_ref != institution_ref:
                continue
            if decision and evaluation.decision.value != decision:
                continue
            case = self.cases.get(evaluation.evaluation_id)
            summaries.append(_summary(evaluation, customer_ref, stored_institution_ref, case))
            if len(summaries) >= limit:
                break
        return summaries

    async def get_case(self, evaluation_id: str) -> EvaluationCase | None:
        return self.cases.get(evaluation_id)

    async def update_case(self, evaluation_id: str, update: CaseUpdate) -> EvaluationCase | None:
        if evaluation_id not in self.evaluations:
            return None
        case = EvaluationCase(evaluation_id=evaluation_id, status=update.status, assigned_to=update.assigned_to, updated_at=datetime.now(UTC))
        self.cases[evaluation_id] = case
        return case

    async def save_event(self, event: NcheEvent) -> None:
        self.events[event.event_id] = event

    async def save_audit(
        self,
        action: str,
        *,
        actor_ref: str | None = None,
        institution_ref: str | None = None,
        evaluation_id: str | None = None,
        request_id: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        self.audits.append({
            "id": len(self.audits) + 1,
            "action": action,
            "actor_ref": actor_ref,
            "institution_ref": institution_ref,
            "evaluation_id": evaluation_id,
            "request_id": request_id,
            "metadata": metadata or {},
            "occurred_at": datetime.now(UTC),
        })

    async def list_audit(self, evaluation_id: str, *, limit: int = 50) -> list[AuditEntry]:
        entries = [item for item in self.audits if item.get("evaluation_id") == evaluation_id]
        entries.sort(key=lambda item: item["id"], reverse=True)
        return [AuditEntry.model_validate(item) for item in entries[:limit]]


class PostgresRepository:
    def __init__(self, database: Database) -> None:
        self.database = database
        self.case_workflow_available: bool | None = None
        self.legacy_cases: dict[str, EvaluationCase] = {}

    async def save_evaluation(
        self,
        customer_ref: str,
        institution_ref: str | None,
        evaluation: RiskEvaluation,
        idempotency_key: str | None = None,
    ) -> None:
        if self.case_workflow_available is False:
            await self._save_evaluation_legacy(customer_ref, institution_ref, evaluation, idempotency_key)
            return
        async with self.database.session() as session:
            record = EvaluationRecord(
                evaluation_id=evaluation.evaluation_id,
                customer_ref=customer_ref,
                institution_ref=institution_ref,
                decision=evaluation.decision.value,
                risk_score=evaluation.risk_score,
                created_at=evaluation.created_at,
                idempotency_key=idempotency_key,
                payload=evaluation.model_dump(mode="json"),
                case_updated_at=evaluation.created_at,
            )
            session.add(record)
            try:
                await session.commit()
                self.case_workflow_available = True
            except IntegrityError:
                await session.rollback()
                if not idempotency_key:
                    raise
                existing = await session.scalar(
                    select(EvaluationRecord).where(EvaluationRecord.idempotency_key == idempotency_key)
                )
                if existing is None:
                    raise
            except ProgrammingError as error:
                await session.rollback()
                message = str(error).lower()
                if "case_status" not in message and "case_updated_at" not in message:
                    raise
                self.case_workflow_available = False
                await self._save_evaluation_legacy(customer_ref, institution_ref, evaluation, idempotency_key)

    async def _save_evaluation_legacy(
        self,
        customer_ref: str,
        institution_ref: str | None,
        evaluation: RiskEvaluation,
        idempotency_key: str | None,
    ) -> None:
        statement = text(
            """
            INSERT INTO risk_evaluations
                (evaluation_id, customer_ref, institution_ref, decision, risk_score, created_at, idempotency_key, payload)
            VALUES (:evaluation_id, :customer_ref, :institution_ref, :decision, :risk_score, :created_at, :idempotency_key, :payload)
            """
        ).bindparams(bindparam("payload", type_=JSONB))
        async with self.database.session() as session:
            try:
                await session.execute(statement, {
                    "evaluation_id": evaluation.evaluation_id,
                    "customer_ref": customer_ref,
                    "institution_ref": institution_ref,
                    "decision": evaluation.decision.value,
                    "risk_score": evaluation.risk_score,
                    "created_at": evaluation.created_at,
                    "idempotency_key": idempotency_key,
                    "payload": evaluation.model_dump(mode="json"),
                })
                await session.commit()
            except IntegrityError:
                await session.rollback()
                if not idempotency_key:
                    raise

    async def get_evaluation(self, evaluation_id: str) -> RiskEvaluation | None:
        async with self.database.session() as session:
            payload = await session.scalar(select(EvaluationRecord.payload).where(EvaluationRecord.evaluation_id == evaluation_id))
            return RiskEvaluation.model_validate(payload) if payload else None

    async def get_evaluation_by_idempotency_key(self, idempotency_key: str) -> RiskEvaluation | None:
        async with self.database.session() as session:
            payload = await session.scalar(
                select(EvaluationRecord.payload).where(EvaluationRecord.idempotency_key == idempotency_key)
            )
            return RiskEvaluation.model_validate(payload) if payload else None

    async def list_evaluations(
        self,
        *,
        limit: int = 50,
        institution_ref: str | None = None,
        decision: str | None = None,
    ) -> list[EvaluationSummary]:
        async with self.database.session() as session:
            base_columns = (
                EvaluationRecord.evaluation_id,
                EvaluationRecord.customer_ref,
                EvaluationRecord.institution_ref,
                EvaluationRecord.payload,
                EvaluationRecord.created_at,
            )
            query = select(*base_columns, EvaluationRecord.case_status, EvaluationRecord.assigned_to, EvaluationRecord.case_updated_at)
            if institution_ref:
                query = query.where(EvaluationRecord.institution_ref == institution_ref)
            if decision:
                query = query.where(EvaluationRecord.decision == decision)
            query = query.order_by(desc(EvaluationRecord.created_at)).limit(limit)
            try:
                rows = (await session.execute(query)).all()
                self.case_workflow_available = True
                return [
                    _summary(
                        RiskEvaluation.model_validate(row.payload),
                        row.customer_ref,
                        row.institution_ref,
                        EvaluationCase(
                            evaluation_id=row.evaluation_id,
                            status=CaseStatus(row.case_status),
                            assigned_to=row.assigned_to,
                            updated_at=row.case_updated_at,
                        ),
                    )
                    for row in rows
                ]
            except ProgrammingError as error:
                await session.rollback()
                if "case_status" not in str(error).lower() and "case_updated_at" not in str(error).lower():
                    raise
                self.case_workflow_available = False
                legacy_query = select(*base_columns)
                if institution_ref:
                    legacy_query = legacy_query.where(EvaluationRecord.institution_ref == institution_ref)
                if decision:
                    legacy_query = legacy_query.where(EvaluationRecord.decision == decision)
                legacy_query = legacy_query.order_by(desc(EvaluationRecord.created_at)).limit(limit)
                rows = (await session.execute(legacy_query)).all()
                return [
                    _summary(
                        RiskEvaluation.model_validate(row.payload),
                        row.customer_ref,
                        row.institution_ref,
                        self.legacy_cases.get(row.evaluation_id),
                    )
                    for row in rows
                ]

    async def get_case(self, evaluation_id: str) -> EvaluationCase | None:
        if self.case_workflow_available is False:
            return self.legacy_cases.get(evaluation_id)
        async with self.database.session() as session:
            try:
                row = await session.execute(
                    select(EvaluationRecord.evaluation_id, EvaluationRecord.case_status, EvaluationRecord.assigned_to, EvaluationRecord.case_updated_at)
                    .where(EvaluationRecord.evaluation_id == evaluation_id)
                )
                record = row.first()
            except ProgrammingError as error:
                await session.rollback()
                if "case_status" not in str(error).lower() and "case_updated_at" not in str(error).lower():
                    raise
                self.case_workflow_available = False
                return self.legacy_cases.get(evaluation_id)
            if record is None:
                return None
            self.case_workflow_available = True
            return EvaluationCase(
                evaluation_id=record.evaluation_id, status=CaseStatus(record.case_status), assigned_to=record.assigned_to, updated_at=record.case_updated_at,
            )

    async def update_case(self, evaluation_id: str, update: CaseUpdate) -> EvaluationCase | None:
        if self.case_workflow_available is False:
            if await self.get_evaluation(evaluation_id) is None:
                return None
            case = EvaluationCase(evaluation_id=evaluation_id, status=update.status, assigned_to=update.assigned_to, updated_at=datetime.now(UTC))
            self.legacy_cases[evaluation_id] = case
            return case
        async with self.database.session() as session:
            try:
                result = await session.execute(select(EvaluationRecord).where(EvaluationRecord.evaluation_id == evaluation_id))
                record = result.scalar_one_or_none()
                if record is None:
                    return None
                now = datetime.now(UTC)
                record.case_status = update.status.value
                record.assigned_to = update.assigned_to
                record.case_updated_at = now
                await session.commit()
                self.case_workflow_available = True
                return EvaluationCase(evaluation_id=evaluation_id, status=update.status, assigned_to=update.assigned_to, updated_at=now)
            except ProgrammingError as error:
                await session.rollback()
                if "case_status" not in str(error).lower() and "case_updated_at" not in str(error).lower():
                    raise
                self.case_workflow_available = False
                if await self.get_evaluation(evaluation_id) is None:
                    return None
                case = EvaluationCase(evaluation_id=evaluation_id, status=update.status, assigned_to=update.assigned_to, updated_at=datetime.now(UTC))
                self.legacy_cases[evaluation_id] = case
                return case

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

    async def save_audit(
        self,
        action: str,
        *,
        actor_ref: str | None = None,
        institution_ref: str | None = None,
        evaluation_id: str | None = None,
        request_id: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        async with self.database.session() as session:
            session.add(AuditRecord(
                action=action,
                actor_ref=actor_ref,
                institution_ref=institution_ref,
                evaluation_id=evaluation_id,
                request_id=request_id,
                occurred_at=datetime.now(UTC),
                details=metadata or {},
            ))
            try:
                await session.commit()
            except ProgrammingError as error:
                await session.rollback()
                # A rolling deployment can receive traffic before migration 0005
                # has completed. Audit writes must not block a risk decision in
                # that narrow window; the entrypoint applies the migration before
                # serving a production process.
                message = str(error).lower()
                if "audit_log" not in message or "undefinedtableerror" not in message:
                    raise
                logger.warning("audit_log table is unavailable; audit record was not persisted")

    async def list_audit(self, evaluation_id: str, *, limit: int = 50) -> list[AuditEntry]:
        async with self.database.session() as session:
            try:
                rows = (
                    await session.execute(
                        select(AuditRecord).where(AuditRecord.evaluation_id == evaluation_id)
                        .order_by(desc(AuditRecord.id)).limit(limit)
                    )
                ).scalars().all()
            except ProgrammingError as error:
                await session.rollback()
                if "audit_log" not in str(error).lower() and "undefinedtableerror" not in str(error).lower():
                    raise
                return []
            return [
                AuditEntry(
                    id=record.id,
                    action=record.action,
                    actor_ref=record.actor_ref,
                    institution_ref=record.institution_ref,
                    evaluation_id=record.evaluation_id,
                    request_id=record.request_id,
                    occurred_at=record.occurred_at,
                    metadata=record.details or {},
                )
                for record in rows
            ]


def _summary(evaluation: RiskEvaluation, customer_ref: str, institution_ref: str | None, case: EvaluationCase | None = None) -> EvaluationSummary:
    return EvaluationSummary(
        evaluation_id=evaluation.evaluation_id,
        customer_ref=customer_ref,
        institution_ref=institution_ref,
        decision=evaluation.decision,
        risk_score=evaluation.risk_score,
        risk_level=evaluation.risk_level,
        recommended_action=evaluation.recommended_action,
        policy_rule=evaluation.policy_rule,
        primary_reason=evaluation.primary_reason,
        model_version=evaluation.model_version,
        created_at=evaluation.created_at,
        mode=evaluation.mode,
        enforced=evaluation.enforced,
        case_status=case.status if case else CaseStatus.NEW,
        assigned_to=case.assigned_to if case else None,
    )
