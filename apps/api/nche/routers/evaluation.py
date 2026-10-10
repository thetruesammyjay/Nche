from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from nche.evaluation.harness import run_benchmark
from nche.schemas.evaluation import (
    AuditEntry,
    BenchmarkReport,
    CaseStatus,
    CaseUpdate,
    EvaluationCase,
    EvaluationSummary,
)
from nche.schemas.risk import Decision
from nche.security import require_api_key

router = APIRouter(prefix="/v1/evaluation", tags=["evaluation"], dependencies=[Depends(require_api_key)])
list_router = APIRouter(prefix="/v1/evaluations", tags=["evaluation"], dependencies=[Depends(require_api_key)])


@router.post("/benchmark", response_model=BenchmarkReport)
async def benchmark() -> BenchmarkReport:
    return run_benchmark()


@list_router.get("", response_model=list[EvaluationSummary])
async def list_evaluations(
    request: Request,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    institution_ref: Annotated[str | None, Query(max_length=80)] = None,
    decision: Decision | None = None,
) -> list[EvaluationSummary]:
    return await request.app.state.repository.list_evaluations(
        limit=limit,
        institution_ref=institution_ref,
        decision=decision.value if decision else None,
    )


@list_router.get("/{evaluation_id}/case", response_model=EvaluationCase)
async def get_case(evaluation_id: str, request: Request) -> EvaluationCase:
    evaluation = await request.app.state.repository.get_evaluation(evaluation_id)
    if evaluation is None:
        raise HTTPException(status_code=404, detail="evaluation not found")
    case = await request.app.state.repository.get_case(evaluation_id)
    if case is not None:
        return case
    return EvaluationCase(
        evaluation_id=evaluation_id,
        status=CaseStatus.NEW,
        updated_at=evaluation.created_at,
    )


@list_router.put("/{evaluation_id}/case", response_model=EvaluationCase)
async def update_case(evaluation_id: str, payload: CaseUpdate, request: Request) -> EvaluationCase:
    evaluation = await request.app.state.repository.get_evaluation(evaluation_id)
    if evaluation is None:
        raise HTTPException(status_code=404, detail="evaluation not found")
    case = await request.app.state.repository.update_case(evaluation_id, payload)
    if case is None:
        raise HTTPException(status_code=404, detail="evaluation not found")
    await request.app.state.repository.save_audit(
        "case_updated",
        actor_ref=request.headers.get("X-Actor-Ref"),
        institution_ref=evaluation.institution_ref,
        evaluation_id=evaluation_id,
        request_id=request.headers.get("X-Request-ID"),
        metadata=payload.model_dump(mode="json"),
    )
    return case


@list_router.get("/{evaluation_id}/audit", response_model=list[AuditEntry])
async def list_audit(
    evaluation_id: str,
    request: Request,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[AuditEntry]:
    if await request.app.state.repository.get_evaluation(evaluation_id) is None:
        raise HTTPException(status_code=404, detail="evaluation not found")
    return await request.app.state.repository.list_audit(evaluation_id, limit=limit)
