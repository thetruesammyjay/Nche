from typing import Protocol

from nche.schemas.risk import RiskEvaluation


class EvaluationRepository(Protocol):
    def save(self, evaluation: RiskEvaluation) -> None: ...
    def get(self, evaluation_id: str) -> RiskEvaluation | None: ...
