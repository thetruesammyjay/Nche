import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .analysts import AnalystDirectory
from .config import get_settings
from .db.database import Database
from .db.repositories import InMemoryRepository, PostgresRepository
from .institutions import InstitutionDirectory
from .policies import InstitutionPolicyDirectory
from .routers import auth, evaluation, events, explain, health, institutions, risk

settings = get_settings()
logger = logging.getLogger("nche.api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    database = Database(settings)
    if (settings.database_required or settings.is_production) and not settings.database_url:
        raise RuntimeError("DATABASE_URL must be configured for a production or database-required deployment")
    if settings.is_production and not settings.nche_api_key:
        raise RuntimeError("NCHE_API_KEY must be configured in production")
    if settings.is_production and (not settings.cors_origin_list or settings.cors_origin_list == ["http://localhost:3000"]):
        raise RuntimeError("CORS_ORIGINS must be configured for the production web origin")
    await database.connect()
    app.state.database = database
    app.state.repository = PostgresRepository(database) if database.configured else InMemoryRepository()
    app.state.institution_registry = InstitutionDirectory(database)
    await app.state.institution_registry.ensure_defaults()
    app.state.policy_directory = InstitutionPolicyDirectory(database)
    institutions = await app.state.institution_registry.list()
    await app.state.policy_directory.ensure_defaults([item.institution_ref for item in institutions])
    app.state.analyst_directory = AnalystDirectory(database, settings)
    await app.state.analyst_directory.ensure_seed()
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
app.state.settings = settings


@app.middleware("http")
async def request_context(request, call_next):
    request_id = request.headers.get("X-Request-ID") or f"req_{uuid4().hex[:16]}"
    started = perf_counter()
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if settings.is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    logger.info(
        "request_complete request_id=%s method=%s path=%s status=%s latency_ms=%.3f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        (perf_counter() - started) * 1000,
    )
    return response
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Nche-Mode", "X-Nche-API-Key", "X-Request-ID"],
    expose_headers=["X-Nche-Latency-Ms", "X-Request-ID"],
)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(evaluation.router)
app.include_router(evaluation.list_router)
app.include_router(events.router)
app.include_router(risk.router)
app.include_router(risk.action_router)
app.include_router(institutions.router)
app.include_router(explain.router)
