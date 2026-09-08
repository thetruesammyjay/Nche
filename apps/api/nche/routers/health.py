from fastapi import APIRouter, HTTPException, Request, status

from nche import __version__
from nche.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness check")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "nche-api", "version": __version__}


@router.get("/health/live", include_in_schema=False)
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready", summary="Readiness check")
async def readiness(request: Request) -> dict[str, str]:
    settings = get_settings()
    database = getattr(request.app.state, "database", None)
    database_ok = bool(database and (not database.configured or await database.ping()))
    if settings.database_required and not database_ok:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="database unavailable")
    return {"status": "ready", "database": "connected" if database_ok and database.configured else "not_configured"}