from collections.abc import Sequence

from nche.schemas.events import EventName, NcheEvent


def rule_score(events: Sequence[NcheEvent]) -> tuple[int, list[str]]:
    names = [event.event_name for event in events]
    score = 0
    reasons: list[str] = []
    if EventName.NEW_DEVICE_LOGIN in names:
        score += 21
        reasons.append("new_device_login")
    if EventName.PASSWORD_RESET in names:
        score += 15
        reasons.append("password_reset")
    if EventName.BENEFICIARY_CREATED in names:
        score += 17
        reasons.append("beneficiary_created")
    if EventName.TRANSFER_INITIATED in names:
        score += 22
        reasons.append("transfer_initiated")
        score += _transfer_amount_score(events)
    if len(reasons) >= 3:
        score += 15
    return min(score, 100), reasons


def _transfer_amount_score(events: Sequence[NcheEvent]) -> int:
    """Add a bounded amount anomaly score when the customer median is known."""

    for event in events:
        if event.event_name != EventName.TRANSFER_INITIATED or event.amount is None:
            continue
        median = event.metadata.get("customer_median_amount")
        if isinstance(median, bool) or not isinstance(median, (int, float)) or median <= 0:
            continue
        ratio = event.amount / float(median)
        return min(35, max(0, int((ratio - 1) * 2 + 0.5)))
    return 0
