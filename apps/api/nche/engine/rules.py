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
    """Add bounded amount and available-balance usage signals for a transfer."""

    for event in events:
        if event.event_name != EventName.TRANSFER_INITIATED or event.amount is None:
            continue
        score = 0
        median = event.metadata.get("customer_median_amount")
        if not isinstance(median, bool) and isinstance(median, (int, float)) and median > 0:
            ratio = event.amount / float(median)
            score += min(35, max(0, int((ratio - 1) * 2 + 0.5)))

        balance = event.metadata.get("account_balance")
        if not isinstance(balance, bool) and isinstance(balance, (int, float)) and balance > 0:
            ratio = event.amount / float(balance)
            if ratio >= 1:
                score += 25
            elif ratio >= 0.9:
                score += 18
            elif ratio >= 0.75:
                score += 10
            elif ratio >= 0.5:
                score += 4
        return min(60, score)
    return 0
