from nche.schemas.risk import Decision, RiskLevel


def classify(score: int, *, challenge_from: int = 30, review_from: int = 60, block_from: int = 80) -> tuple[RiskLevel, Decision]:
    if score < challenge_from:
        return RiskLevel.LOW, Decision.ALLOW
    if score < review_from:
        return RiskLevel.MEDIUM, Decision.CHALLENGE
    if score < block_from:
        return RiskLevel.HIGH, Decision.REVIEW
    return RiskLevel.CRITICAL, Decision.BLOCK
