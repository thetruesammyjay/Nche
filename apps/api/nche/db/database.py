from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from nche.config import Settings


def normalize_database_url(database_url: str) -> tuple[str, dict[str, Any]]:
    """Make a Neon DATABASE_URL compatible with SQLAlchemy's asyncpg driver."""
    parts = urlsplit(database_url)
    scheme = parts.scheme
    if scheme in {"postgres", "postgresql"}:
        scheme = "postgresql+asyncpg"
    if scheme != "postgresql+asyncpg":
        raise ValueError("DATABASE_URL must use the PostgreSQL scheme")

    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    normalized = urlunsplit((scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
    connect_args: dict[str, Any] = {}
    if sslmode in {"require", "verify-ca", "verify-full"}:
        connect_args["ssl"] = "require"
    return normalized, connect_args


class Database:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.engine: AsyncEngine | None = None
        self.sessions: async_sessionmaker[AsyncSession] | None = None

    @property
    def configured(self) -> bool:
        return bool(self.settings.database_url)

    async def connect(self) -> None:
        if not self.settings.database_url or self.engine is not None:
            return
        url, connect_args = normalize_database_url(self.settings.database_url)
        self.engine = create_async_engine(
            url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_size=self.settings.db_pool_size,
            max_overflow=self.settings.db_max_overflow,
            pool_recycle=1800,
        )
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)

    async def ping(self) -> bool:
        if self.engine is None:
            return False
        try:
            async with self.engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
            return True
        except SQLAlchemyError:
            return False

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        if self.sessions is None:
            raise RuntimeError("Database is not configured")
        async with self.sessions() as session:
            yield session

    async def close(self) -> None:
        if self.engine is not None:
            await self.engine.dispose()
            self.engine = None
            self.sessions = None