from fastapi import APIRouter, HTTPException, Request, status

from nche.schemas.risk import RiskEvaluation

router = APIRouter(prefix="/explain", tags=["explain"])


@router.get("/{evaluation_id}", response_model=RiskEvaluation)
async def explain(evaluation_id: str, request: Request) -> RiskEvaluation:
    evaluation = await request.app.state.repository.get_evaluation(evaluation_id)
    if evaluation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="evaluation not found")
    return evaluation