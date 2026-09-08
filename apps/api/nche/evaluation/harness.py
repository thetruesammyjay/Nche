from nche.engine.risk_fusion import evaluate
from nche.schemas.risk import RiskRequest
from nche.simulator.generator import takeover_sequence


def run() -> dict[str, int | str]:
    result = evaluate(RiskRequest(customer_ref="customer_demo", events=takeover_sequence()))
    return {"engine": "nche-hybrid-mvp", "decision": result.decision.value, "risk_score": result.risk_score}


if __name__ == "__main__":
    print(run())
