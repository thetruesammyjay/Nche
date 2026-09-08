from collections.abc import Sequence

from nche.schemas.events import NcheEvent


def sequence_signal(events: Sequence[NcheEvent]) -> float:
    names = [event.event_name.value for event in events]
    expected = ["new_device_login", "password_reset", "beneficiary_created", "transfer_initiated"]
    return sum(name in names for name in expected) / len(expected)
