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
    if len(reasons) >= 3:
        score += 15
    return min(score, 100), reasons
