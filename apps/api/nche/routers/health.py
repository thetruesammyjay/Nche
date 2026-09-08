from fastapi import APIRouter

from nche import __version__

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "nche-api", "version": __version__}
