from nche.schemas.risk import RiskEvaluation


class InMemoryEvaluationRepository:
    def __init__(self) -> None:
        self._items: dict[str, RiskEvaluation] = {}

    def save(self, evaluation: RiskEvaluation) -> None:
        self._items[evaluation.evaluation_id] = evaluation

    def get(self, evaluation_id: str) -> RiskEvaluation | None:
        return self._items.get(evaluation_id)
