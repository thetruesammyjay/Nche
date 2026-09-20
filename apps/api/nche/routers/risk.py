from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request, Response, status

from nche.engine.risk_fusion import evaluate
from nche.schemas.risk import EvaluationMode, RiskEvaluation, RiskRequest

router = APIRouter(prefix="/risk", tags=["risk"])
action_router = APIRouter(tags=["risk"])


def ensure_known_institution(request: Request, institution_ref: str | None) -> None:
    if institution_ref and request.app.state.institution_registry.get(institution_ref) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="institution not found")


@router.post("/evaluate", response_model=RiskEvaluation)
async def evaluate_risk(request_body: RiskRequest, request: Request) -> RiskEvaluation:
    ensure_known_institution(request, request_body.institution_ref)
    evaluation = evaluate(request_body).model_copy(update={"institution_ref": request_body.institution_ref})
    await request.app.state.repository.save_evaluation(request_body.customer_ref, request_body.institution_ref, evaluation)
    return evaluation


@action_router.post("/v1/evaluate_action", response_model=RiskEvaluation)
async def evaluate_action(
    request_body: RiskRequest,
    request: Request,
    response: Response,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key", max_length=160)] = None,
    mode: Annotated[EvaluationMode, Header(alias="X-Nche-Mode")] = EvaluationMode.OBSERVE,
) -> RiskEvaluation:
    """Evaluate a sensitive action before the institution submits it."""
    ensure_known_institution(request, request_body.institution_ref)
    started = perf_counter()
    repository = request.app.state.repository

    if idempotency_key:
        previous = await repository.get_evaluation_by_idempotency_key(idempotency_key)
        if previous is not None:
            replay = previous.model_copy(update={"idempotent_replay": True})
            response.headers["X-Nche-Latency-Ms"] = f"{(perf_counter() - started) * 1000:.3f}"
            return replay

    evaluation = evaluate(request_body).model_copy(update={"institution_ref": request_body.institution_ref})
    evaluation = evaluation.model_copy(
        update={
            "mode": mode,
            "enforced": mode == EvaluationMode.ENFORCE,
            "latency_ms": (perf_counter() - started) * 1000,
        }
    )
    await repository.save_evaluation(
        request_body.customer_ref,
        request_body.institution_ref,
        evaluation,
        idempotency_key=idempotency_key,
    )
    if idempotency_key:
        stored = await repository.get_evaluation_by_idempotency_key(idempotency_key)
        if stored is not None and stored.evaluation_id != evaluation.evaluation_id:
            replay = stored.model_copy(update={"idempotent_replay": True})
            response.headers["X-Nche-Latency-Ms"] = f"{(perf_counter() - started) * 1000:.3f}"
            return replay
    response.headers["X-Nche-Latency-Ms"] = f"{evaluation.latency_ms:.3f}"
    return evaluation
