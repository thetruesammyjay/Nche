from collections.abc import Sequence

from nche.schemas.events import NcheEvent


def extract_features(events: Sequence[NcheEvent]) -> dict[str, float]:
    """Return a small, deterministic feature vector for the MVP engine."""
    names = {event.event_name.value for event in events}
    return {
        "event_count": float(len(events)),
        "has_new_device": float("new_device_login" in names),
        "has_password_reset": float("password_reset" in names),
        "has_new_beneficiary": float("beneficiary_created" in names),
        "has_transfer": float("transfer_initiated" in names),
    }
