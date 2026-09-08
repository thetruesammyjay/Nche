from fastapi import APIRouter

from nche.engine.risk_fusion import evaluate
from nche.schemas.risk import RiskEvaluation, RiskRequest

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/evaluate", response_model=RiskEvaluation)
def evaluate_risk(request: RiskRequest) -> RiskEvaluation:
    return evaluate(request)
