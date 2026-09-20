from datetime import UTC, datetime

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
    """Small registry for the demo; replace with a repository-backed directory in production."""

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
