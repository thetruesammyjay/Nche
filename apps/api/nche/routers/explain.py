from fastapi import APIRouter

router = APIRouter(prefix="/explain", tags=["explain"])


@router.get("/{evaluation_id}")
def explain(evaluation_id: str) -> dict[str, str]:
    return {"evaluation_id": evaluation_id, "status": "available", "note": "Use the evaluation response evidence object for the audit trail."}
