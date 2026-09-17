from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db.database import Database
from .db.repositories import InMemoryRepository, PostgresRepository
from .routers import events, explain, health, risk

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    database = Database(settings)
    await database.connect()
    app.state.database = database
    app.state.repository = PostgresRepository(database) if database.configured else InMemoryRepository()
    try:
        yield
    finally:
        await database.close()


app = FastAPI(
    title="Nche Risk Intelligence API",
    version="0.1.0",
    description="Explainable account-takeover risk intelligence for sensitive financial actions.",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Nche-Mode"],
    expose_headers=["X-Nche-Latency-Ms"],
)
app.include_router(health.router)
app.include_router(events.router)
app.include_router(risk.router)
app.include_router(risk.action_router)
app.include_router(explain.router)
