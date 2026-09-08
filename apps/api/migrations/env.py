from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from nche.config import get_settings
from nche.db.database import normalize_database_url
from nche.db.models import Base

config = context.config
settings = get_settings()
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required for migrations")
    url, _ = normalize_database_url(settings.database_url)
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required for migrations")
    url, connect_args = normalize_database_url(settings.database_url)
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = url
    connectable = async_engine_from_config(configuration, prefix="sqlalchemy.", poolclass=pool.NullPool, connect_args=connect_args)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())