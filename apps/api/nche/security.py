from secrets import compare_digest
from typing import Annotated

from fastapi import Header, HTTPException, Request, status


def require_api_key(
    request: Request,
    api_key: Annotated[str | None, Header(alias="X-Nche-API-Key")] = None,
) -> None:
    """Protect service-to-service routes when an API key is configured."""

    settings = request.app.state.settings
    if not settings.api_auth_required:
        return
    if not api_key or not settings.nche_api_key or not compare_digest(api_key, settings.nche_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Nche API key is required.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
