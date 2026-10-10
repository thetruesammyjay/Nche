from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status

from nche.engine.risk_fusion import evaluate
from nche.schemas.risk import EvaluationMode, RiskEvaluation, RiskRequest
from nche.security import require_api_key

router = APIRouter(prefix="/risk", tags=["risk"], dependencies=[Depends(require_api_key)])
action_router = APIRouter(tags=["risk"], dependencies=[Depends(require_api_key)])


async def ensure_known_institution(request: Request, institution_ref: str | None) -> None:
    if institution_ref and await request.app.state.institution_registry.get(institution_ref) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="institution not found")


async def write_audit(request: Request, action: str, evaluation: RiskEvaluation, *, replay: bool = False) -> None:
    await request.app.state.repository.save_audit(
        action,
        actor_ref=request.headers.get("X-Actor-Ref"),
        institution_ref=evaluation.institution_ref,
        evaluation_id=evaluation.evaluation_id,
        request_id=request.headers.get("X-Request-ID"),
        metadata={
            "decision": evaluation.decision.value,
            "risk_score": evaluation.risk_score,
            "mode": evaluation.mode.value,
            "replay": replay,
        },
    )


@router.post("/evaluate", response_model=RiskEvaluation)
async def evaluate_risk(request_body: RiskRequest, request: Request) -> RiskEvaluation:
    await ensure_known_institution(request, request_body.institution_ref)
    policy = await request.app.state.policy_directory.get(request_body.institution_ref) if request_body.institution_ref else None
    evaluation = evaluate(request_body, policy=policy).model_copy(update={"institution_ref": request_body.institution_ref})
    await request.app.state.repository.save_evaluation(request_body.customer_ref, request_body.institution_ref, evaluation)
    await write_audit(request, "risk_evaluation", evaluation)
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
    await ensure_known_institution(request, request_body.institution_ref)
    started = perf_counter()
    repository = request.app.state.repository

    if idempotency_key:
        previous = await repository.get_evaluation_by_idempotency_key(idempotency_key)
        if previous is not None:
            replay = previous.model_copy(update={"idempotent_replay": True})
            await write_audit(request, "action_evaluation_replay", replay, replay=True)
            response.headers["X-Nche-Latency-Ms"] = f"{(perf_counter() - started) * 1000:.3f}"
            return replay

    policy = await request.app.state.policy_directory.get(request_body.institution_ref) if request_body.institution_ref else None
    evaluation = evaluate(request_body, policy=policy).model_copy(update={"institution_ref": request_body.institution_ref})
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
    await write_audit(request, "action_evaluation", evaluation)
    if idempotency_key:
        stored = await repository.get_evaluation_by_idempotency_key(idempotency_key)
        if stored is not None and stored.evaluation_id != evaluation.evaluation_id:
            replay = stored.model_copy(update={"idempotent_replay": True})
            await write_audit(request, "action_evaluation_replay", replay, replay=True)
            response.headers["X-Nche-Latency-Ms"] = f"{(perf_counter() - started) * 1000:.3f}"
            return replay
    response.headers["X-Nche-Latency-Ms"] = f"{evaluation.latency_ms:.3f}"
    return evaluation
