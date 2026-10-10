from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from nche.db.database import Database
from nche.db.models import InstitutionRecord
from nche.schemas.institutions import Institution, InstitutionCreate, InstitutionType

DEFAULT_INSTITUTIONS = (
    Institution(
        institution_ref="apex_mfb",
        name="Apex Microfinance Bank",
        institution_type=InstitutionType.MICROFINANCE,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    ),
    Institution(
        institution_ref="kuda",
        name="Kuda Microfinance Bank",
        institution_type=InstitutionType.MICROFINANCE,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    ),
    Institution(
        institution_ref="opay",
        name="OPay",
        institution_type=InstitutionType.WALLET,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    ),
    Institution(
        institution_ref="palmpay",
        name="PalmPay",
        institution_type=InstitutionType.WALLET,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    ),
)


class InstitutionRegistry:
    """Process-local fallback used when a database is not configured."""

    def __init__(self) -> None:
        self._institutions = {item.institution_ref: item for item in DEFAULT_INSTITUTIONS}

    def list(self) -> list[Institution]:
        return sorted(self._institutions.values(), key=lambda item: item.name.lower())

    def add(self, payload: InstitutionCreate) -> Institution:
        institution = Institution(
            institution_ref=payload.institution_ref,
            name=payload.name.strip(),
            institution_type=payload.institution_type,
            created_at=datetime.now(UTC),
        )
        self._institutions[institution.institution_ref] = institution
        return institution

    def get(self, institution_ref: str) -> Institution | None:
        return self._institutions.get(institution_ref)


class InstitutionDirectory:
    """Use PostgreSQL in deployed environments and a process-local registry in development."""

    def __init__(self, database: Database) -> None:
        self.database = database if database.configured else None
        self.memory = InstitutionRegistry()

    async def ensure_defaults(self) -> None:
        if self.database is None:
            return
        try:
            async with self.database.session() as session:
                existing = set((await session.scalars(select(InstitutionRecord.institution_ref))).all())
                for institution in DEFAULT_INSTITUTIONS:
                    if institution.institution_ref in existing:
                        continue
                    session.add(_to_record(institution))
                await session.commit()
        except SQLAlchemyError:
            if self.database.settings.is_production:
                raise
            self.database = None

    async def list(self) -> list[Institution]:
        if self.database is None:
            return self.memory.list()
        async with self.database.session() as session:
            records = (await session.scalars(select(InstitutionRecord).order_by(InstitutionRecord.name))).all()
            return [_from_record(record) for record in records]

    async def get(self, institution_ref: str) -> Institution | None:
        if self.database is None:
            return self.memory.get(institution_ref)
        async with self.database.session() as session:
            record = await session.get(InstitutionRecord, institution_ref)
            return _from_record(record) if record else None

    async def add(self, payload: InstitutionCreate) -> Institution:
        if self.database is None:
            return self.memory.add(payload)
        institution = Institution(
            institution_ref=payload.institution_ref,
            name=payload.name.strip(),
            institution_type=payload.institution_type,
            created_at=datetime.now(UTC),
        )
        async with self.database.session() as session:
            session.add(_to_record(institution))
            try:
                await session.commit()
            except IntegrityError as error:
                await session.rollback()
                raise ValueError("institution_ref already exists") from error
        return institution


def _to_record(institution: Institution) -> InstitutionRecord:
    return InstitutionRecord(
        institution_ref=institution.institution_ref,
        name=institution.name,
        institution_type=institution.institution_type.value,
        status=institution.status,
        created_at=institution.created_at,
    )


def _from_record(record: InstitutionRecord) -> Institution:
    return Institution(
        institution_ref=record.institution_ref,
        name=record.name,
        institution_type=InstitutionType(record.institution_type),
        status=record.status,
        created_at=record.created_at,
    )
