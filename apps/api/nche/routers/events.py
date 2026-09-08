from fastapi import APIRouter

from nche.schemas.events import NcheEvent

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/ingest", response_model=NcheEvent, status_code=202)
def ingest_event(event: NcheEvent) -> NcheEvent:
    return event
