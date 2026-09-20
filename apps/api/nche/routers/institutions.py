from fastapi import APIRouter, HTTPException, Request, status

from nche.schemas.institutions import Institution, InstitutionCreate

router = APIRouter(prefix="/v1/institutions", tags=["institutions"])


@router.get("", response_model=list[Institution])
async def list_institutions(request: Request) -> list[Institution]:
    return request.app.state.institution_registry.list()


@router.post("", response_model=Institution, status_code=status.HTTP_201_CREATED)
async def create_institution(payload: InstitutionCreate, request: Request) -> Institution:
    registry = request.app.state.institution_registry
    if registry.get(payload.institution_ref) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="institution_ref already exists")
    return registry.add(payload)
