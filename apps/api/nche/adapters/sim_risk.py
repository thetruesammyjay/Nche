from enum import StrEnum


class SimRiskSource(StrEnum):
    SIMULATED = "SIMULATED"
    NIBSS = "NIBSS SIM SWAP SERVICE"
    UNKNOWN = "UNKNOWN"


def get_sim_risk(_customer_ref: str) -> dict[str, str]:
    return {"source": SimRiskSource.SIMULATED, "status": "unknown"}
