from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from nche.config import Settings
from nche.db.database import Database
from nche.db.models import AnalystUserRecord
from nche.schemas.auth import Analyst, AnalystCreate, AnalystIdentity, AnalystRole

_SALT_BYTES = 16
_KEY_BYTES = 32
_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1


def hash_password(password: str) -> str:
    salt = os.urandom(_SALT_BYTES)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_KEY_BYTES,
    )
    encode = lambda value: base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")
    return f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}${encode(salt)}${encode(derived)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, encoded_salt, encoded_key = encoded.split("$", 5)
        if algorithm != "scrypt":
            return False
        decode = lambda value: base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=decode(encoded_salt),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(decode(encoded_key)),
        )
        return hmac.compare_digest(derived, decode(encoded_key))
    except (TypeError, ValueError):
        return False


class AnalystDirectory:
    """Persist analyst identities in PostgreSQL with a memory fallback for local development."""

    def __init__(self, database: Database, settings: Settings) -> None:
        self.database = database if database.configured else None
        self.settings = settings
        self.memory: dict[str, AnalystUserRecord] = {}

    async def ensure_seed(self) -> None:
        email = (self.settings.nche_analyst_email or ("analyst@nche.demo" if not self.settings.is_production else "")).strip().lower()
        password = self.settings.nche_analyst_password or ("demo-analyst" if not self.settings.is_production else "")
        if not email or not password:
            if self.settings.is_production:
                raise RuntimeError("NCHE_ANALYST_EMAIL and NCHE_ANALYST_PASSWORD must be configured in production")
            return

        seed = AnalystUserRecord(
            email=email,
            name="Oluwaseun A.",
            role=AnalystRole.ADMIN.value,
            password_hash=hash_password(password),
            status="active",
            created_at=datetime.now(UTC),
        )
        if self.database is None:
            self.memory.setdefault(email, seed)
            return

        try:
            async with self.database.session() as session:
                existing = await session.get(AnalystUserRecord, email)
                if existing is None:
                    session.add(seed)
                    await session.commit()
        except SQLAlchemyError:
            if self.settings.is_production:
                raise
            self.database = None
            self.memory.setdefault(email, seed)

    async def authenticate(self, email: str, password: str) -> AnalystIdentity | None:
        normalized = email.strip().lower()
        if self.database is None:
            record = self.memory.get(normalized)
        else:
            async with self.database.session() as session:
                record = await session.get(AnalystUserRecord, normalized)
        if record is None or record.status != "active" or not verify_password(password, record.password_hash):
            return None
        return AnalystIdentity(email=record.email, name=record.name, role=AnalystRole(record.role))

    async def list(self) -> list[Analyst]:
        if self.database is None:
            records = self.memory.values()
        else:
            async with self.database.session() as session:
                records = (await session.scalars(select(AnalystUserRecord).order_by(AnalystUserRecord.name))).all()
        return [_from_record(record) for record in records]

    async def add(self, payload: AnalystCreate) -> Analyst:
        email = payload.email.strip().lower()
        record = AnalystUserRecord(
            email=email,
            name=payload.name.strip(),
            role=payload.role.value,
            password_hash=hash_password(payload.password),
            status="active",
            created_at=datetime.now(UTC),
        )
        if self.database is None:
            if email in self.memory:
                raise ValueError("analyst email already exists")
            self.memory[email] = record
            return _from_record(record)

        async with self.database.session() as session:
            session.add(record)
            try:
                await session.commit()
            except IntegrityError as error:
                await session.rollback()
                raise ValueError("analyst email already exists") from error
        return _from_record(record)


def _from_record(record: AnalystUserRecord) -> Analyst:
    return Analyst(
        email=record.email,
        name=record.name,
        role=AnalystRole(record.role),
        status=record.status,
        created_at=record.created_at,
    )
