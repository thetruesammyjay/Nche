from nche.schemas.risk import Decision, RiskLevel


def classify(score: int) -> tuple[RiskLevel, Decision]:
    if score < 30:
        return RiskLevel.LOW, Decision.ALLOW
    if score < 60:
        return RiskLevel.MEDIUM, Decision.CHALLENGE
    if score < 80:
        return RiskLevel.HIGH, Decision.REVIEW
    return RiskLevel.CRITICAL, Decision.BLOCK
