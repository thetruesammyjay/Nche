from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from nche.db.database import Database
from nche.db.models import InstitutionPolicyRecord
from nche.schemas.institutions import InstitutionPolicy, InstitutionPolicyUpdate

DEFAULT_POLICY = InstitutionPolicyUpdate()


class InstitutionPolicyDirectory:
    """Persist institution policy bands with a local fallback for development."""

    def __init__(self, database: Database) -> None:
        self.database = database if database.configured else None
        self.memory: dict[str, InstitutionPolicy] = {}

    async def ensure_defaults(self, institution_refs: list[str]) -> None:
        now = datetime.now(UTC)
        if self.database is None:
            for institution_ref in institution_refs:
                self.memory.setdefault(institution_ref, _memory_policy(institution_ref, now))
            return
        try:
            async with self.database.session() as session:
                existing = set((await session.scalars(select(InstitutionPolicyRecord.institution_ref))).all())
                for institution_ref in institution_refs:
                    if institution_ref not in existing:
                        session.add(_to_record(institution_ref, DEFAULT_POLICY, now, None))
                await session.commit()
        except SQLAlchemyError:
            if self.database.settings.is_production:
                raise
            self.database = None
            await self.ensure_defaults(institution_refs)

    async def get(self, institution_ref: str) -> InstitutionPolicy:
        if self.database is None:
            return self.memory.setdefault(institution_ref, _memory_policy(institution_ref, datetime.now(UTC)))
        async with self.database.session() as session:
            record = await session.get(InstitutionPolicyRecord, institution_ref)
            if record is None:
                return _memory_policy(institution_ref, datetime.now(UTC))
            return _from_record(record)

    async def update(self, institution_ref: str, payload: InstitutionPolicyUpdate, updated_by: str | None) -> InstitutionPolicy:
        now = datetime.now(UTC)
        if self.database is None:
            policy = InstitutionPolicy(institution_ref=institution_ref, updated_at=now, updated_by=updated_by, **payload.model_dump())
            self.memory[institution_ref] = policy
            return policy
        async with self.database.session() as session:
            record = await session.get(InstitutionPolicyRecord, institution_ref)
            if record is None:
                record = _to_record(institution_ref, payload, now, updated_by)
                session.add(record)
            else:
                record.challenge_from = payload.challenge_from
                record.review_from = payload.review_from
                record.block_from = payload.block_from
                record.updated_at = now
                record.updated_by = updated_by
            await session.commit()
            return _from_record(record)


def _memory_policy(institution_ref: str, now: datetime) -> InstitutionPolicy:
    return InstitutionPolicy(institution_ref=institution_ref, updated_at=now, **DEFAULT_POLICY.model_dump())


def _to_record(institution_ref: str, payload: InstitutionPolicyUpdate, updated_at: datetime, updated_by: str | None) -> InstitutionPolicyRecord:
    return InstitutionPolicyRecord(
        institution_ref=institution_ref,
        challenge_from=payload.challenge_from,
        review_from=payload.review_from,
        block_from=payload.block_from,
        updated_at=updated_at,
        updated_by=updated_by,
    )


def _from_record(record: InstitutionPolicyRecord) -> InstitutionPolicy:
    return InstitutionPolicy(
        institution_ref=record.institution_ref,
        challenge_from=record.challenge_from,
        review_from=record.review_from,
        block_from=record.block_from,
        updated_at=record.updated_at,
        updated_by=record.updated_by,
    )
