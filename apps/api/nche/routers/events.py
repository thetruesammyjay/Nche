from fastapi import APIRouter, Depends, Request

from nche.schemas.events import NcheEvent
from nche.security import require_api_key

router = APIRouter(prefix="/events", tags=["events"], dependencies=[Depends(require_api_key)])


@router.post("/ingest", response_model=NcheEvent, status_code=202)
async def ingest_event(event: NcheEvent, request: Request) -> NcheEvent:
    await request.app.state.repository.save_event(event)
    await request.app.state.repository.save_audit(
        "event_ingested",
        actor_ref=request.headers.get("X-Actor-Ref"),
        request_id=request.headers.get("X-Request-ID"),
        metadata={"event_id": event.event_id, "event_name": event.event_name.value, "customer_ref": event.customer_ref},
    )
    return event
