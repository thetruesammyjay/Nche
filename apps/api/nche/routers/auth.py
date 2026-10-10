from fastapi import APIRouter, Depends, HTTPException, Request, status

from nche.schemas.auth import Analyst, AnalystCreate, AnalystIdentity, AnalystLoginRequest
from nche.security import require_api_key

router = APIRouter(prefix="/v1/auth", tags=["auth"], dependencies=[Depends(require_api_key)])


@router.post("/login", response_model=AnalystIdentity)
async def login(payload: AnalystLoginRequest, request: Request) -> AnalystIdentity:
    identity = await request.app.state.analyst_directory.authenticate(payload.email, payload.password)
    if identity is None:
        await request.app.state.repository.save_audit(
            "analyst_login_failed",
            actor_ref=payload.email.strip().lower(),
            request_id=request.headers.get("X-Request-ID"),
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Analyst credentials were not recognized.")
    await request.app.state.repository.save_audit(
        "analyst_login_succeeded",
        actor_ref=identity.email,
        request_id=request.headers.get("X-Request-ID"),
        metadata={"role": identity.role.value},
    )
    return identity


@router.get("/analysts", response_model=list[Analyst])
async def list_analysts(request: Request) -> list[Analyst]:
    return await request.app.state.analyst_directory.list()


@router.post("/analysts", response_model=Analyst, status_code=status.HTTP_201_CREATED)
async def create_analyst(payload: AnalystCreate, request: Request) -> Analyst:
    try:
        analyst = await request.app.state.analyst_directory.add(payload)
        await request.app.state.repository.save_audit(
            "analyst_created",
            actor_ref=request.headers.get("X-Actor-Ref"),
            request_id=request.headers.get("X-Request-ID"),
            metadata={"created_email": analyst.email, "role": analyst.role.value},
        )
        return analyst
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
