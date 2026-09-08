from datetime import UTC, datetime, timedelta

from nche.schemas.events import EventChannel, EventName, NcheEvent


def takeover_sequence(customer_ref: str = "customer_demo") -> list[NcheEvent]:
    start = datetime.now(UTC)
    events = [
        (EventName.NEW_DEVICE_LOGIN, 0),
        (EventName.PASSWORD_RESET, 53),
        (EventName.BENEFICIARY_CREATED, 71),
        (EventName.TRANSFER_INITIATED, 114),
    ]
    return [NcheEvent(event_id=f"demo_{index}", customer_ref=customer_ref, event_name=name, channel=EventChannel.WEB, occurred_at=start + timedelta(seconds=offset), amount=650000 if name == EventName.TRANSFER_INITIATED else None) for index, (name, offset) in enumerate(events, start=1)]


if __name__ == "__main__":
    for event in takeover_sequence():
        print(event.model_dump_json())
