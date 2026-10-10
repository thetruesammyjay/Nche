from fastapi import APIRouter, Depends, HTTPException, Request, status

from nche.schemas.institutions import (
    Institution,
    InstitutionCreate,
    InstitutionPolicy,
    InstitutionPolicyUpdate,
)
from nche.security import require_api_key

router = APIRouter(prefix="/v1/institutions", tags=["institutions"], dependencies=[Depends(require_api_key)])


@router.get("", response_model=list[Institution])
async def list_institutions(request: Request) -> list[Institution]:
    return await request.app.state.institution_registry.list()


@router.post("", response_model=Institution, status_code=status.HTTP_201_CREATED)
async def create_institution(payload: InstitutionCreate, request: Request) -> Institution:
    directory = request.app.state.institution_registry
    if await directory.get(payload.institution_ref) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="institution_ref already exists")
    try:
        institution = await directory.add(payload)
        await request.app.state.repository.save_audit(
            "institution_created",
            actor_ref=request.headers.get("X-Actor-Ref"),
            institution_ref=institution.institution_ref,
            request_id=request.headers.get("X-Request-ID"),
            metadata={"name": institution.name, "institution_type": institution.institution_type.value},
        )
        return institution
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.get("/{institution_ref}/policy", response_model=InstitutionPolicy)
async def get_policy(institution_ref: str, request: Request) -> InstitutionPolicy:
    if await request.app.state.institution_registry.get(institution_ref) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="institution not found")
    return await request.app.state.policy_directory.get(institution_ref)


@router.put("/{institution_ref}/policy", response_model=InstitutionPolicy)
async def update_policy(institution_ref: str, payload: InstitutionPolicyUpdate, request: Request) -> InstitutionPolicy:
    if await request.app.state.institution_registry.get(institution_ref) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="institution not found")
    policy = await request.app.state.policy_directory.update(
        institution_ref,
        payload,
        request.headers.get("X-Actor-Ref"),
    )
    await request.app.state.repository.save_audit(
        "institution_policy_updated",
        actor_ref=request.headers.get("X-Actor-Ref"),
        institution_ref=institution_ref,
        request_id=request.headers.get("X-Request-ID"),
        metadata=payload.model_dump(),
    )
    return policy
