from fastapi import APIRouter, Request

from nche.schemas.events import NcheEvent

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/ingest", response_model=NcheEvent, status_code=202)
async def ingest_event(event: NcheEvent, request: Request) -> NcheEvent:
    await request.app.state.repository.save_event(event)
    return event