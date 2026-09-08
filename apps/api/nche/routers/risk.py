from fastapi import APIRouter, Request

from nche.engine.risk_fusion import evaluate
from nche.schemas.risk import RiskEvaluation, RiskRequest

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/evaluate", response_model=RiskEvaluation)
async def evaluate_risk(request_body: RiskRequest, request: Request) -> RiskEvaluation:
    evaluation = evaluate(request_body)
    await request.app.state.repository.save_evaluation(request_body.customer_ref, request_body.institution_ref, evaluation)
    return evaluation